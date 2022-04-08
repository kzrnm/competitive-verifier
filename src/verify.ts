import dayjs from 'dayjs'
import fs from 'fs/promises'
import path from 'path'
import simpleGit from 'simple-git'
import {VerifyJson, VerifyJsonFile} from './config'
import {ActionsCore} from './actions'
import scc from '@rtsao/scc'

type FileWithTimestamp = Map<string, dayjs.Dayjs>

type ResolvedVerificationTarget = VerifyJsonFile & {
  name: string
  verifiedTime?: dayjs.Dayjs
  updatedTime?: dayjs.Dayjs
}

export function resolveDependency(
  baseDir: string,
  files: FileWithTimestamp,
  verifiedFiles: FileWithTimestamp,
  verifyJson: VerifyJson
): ResolvedVerificationTarget[] {
  const max = (d1?: dayjs.Dayjs, d2?: dayjs.Dayjs): dayjs.Dayjs | undefined =>
    !d1 ? d2 : !d2 || d1.isAfter(d2) ? d1 : d2

  const toAbsolute = (p: string): string =>
    path.isAbsolute(p) ? p : path.join(baseDir, p)

  function toAbsoluteFiles(orig: FileWithTimestamp): FileWithTimestamp {
    const r = new Map<string, dayjs.Dayjs>()
    for (const [name, d] of orig) {
      r.set(toAbsolute(name), d)
    }
    return r
  }
  files = toAbsoluteFiles(files)
  verifiedFiles = toAbsoluteFiles(verifiedFiles)

  verifyJson = Object.fromEntries(
    Object.entries(verifyJson).map(([name, f]) => [
      toAbsolute(name),
      {...f, dependencies: f.dependencies?.map(toAbsolute)}
    ])
  )

  const dependencies = new Map(
    Object.entries(verifyJson).map(([name, f]) => [
      name,
      new Set(f.dependencies)
    ])
  )

  // VERIFIER は逆向きの依存として扱う
  for (const [name, f] of Object.entries(verifyJson)) {
    if (f.attributes?.VERIFIER)
      dependencies.get(toAbsolute(f.attributes.VERIFIER))?.add(name)
  }

  const cycleResolved = scc(dependencies)
  const rev = new Map<string, number>()
  const updatedTimes: (dayjs.Dayjs | undefined)[] = []
  const sccDependencies: Set<number>[] = []

  const getUpdatedTimes = (i: number | undefined): dayjs.Dayjs | undefined =>
    typeof i === 'number' ? updatedTimes[i] : undefined

  for (let i = 0; i < cycleResolved.length; i++)
    for (const name of cycleResolved[i]) rev.set(name, i)

  // 昇順に依存が増える
  for (let i = 0; i < cycleResolved.length; i++) {
    sccDependencies[i] = new Set([i])
    for (const name of cycleResolved[i]) {
      updatedTimes[i] = max(updatedTimes[i], files.get(name))
      for (const dep of dependencies.get(name) || []) {
        const dt = rev.get(dep)
        if (dt !== undefined) {
          // dt < i
          if (!sccDependencies[i].has(dt)) {
            for (const dtt of sccDependencies[dt]) sccDependencies[i].add(dtt)
          }
          updatedTimes[i] = max(updatedTimes[i], getUpdatedTimes(dt))
        }
      }
    }
  }

  const resolvedDependencies: Set<string>[] = []
  for (let i = 0; i < sccDependencies.length; i++) {
    resolvedDependencies[i] = new Set()
    for (const t of sccDependencies[i]) {
      for (const dep of cycleResolved[t]) {
        resolvedDependencies[i].add(dep)
      }
    }
  }
  const getDependencies = (i: number | undefined): Iterable<string> =>
    typeof i === 'number' ? resolvedDependencies[i] : []

  return cycleResolved.flatMap(c =>
    [...c].map(name => {
      const f = verifyJson[name]
      return {
        ...f,
        name,
        dependencies: [...getDependencies(rev.get(name))],
        verifiedTime: verifiedFiles.get(name),
        updatedTime: getUpdatedTimes(rev.get(name))
      }
    })
  )
}

export async function runVerify({
  core,
  timeout,
  verifyJson,
  timestampsFilePath,
  baseDir
}: {
  core: ActionsCore
  verifyJson: VerifyJson
  timestampsFilePath: string
  baseDir: string
  timeout: number
}): Promise<VerificationSummary[]> {
  const git = simpleGit(baseDir)

  async function parseTimesampsJson(): Promise<FileWithTimestamp> {
    try {
      const text = await fs.readFile(timestampsFilePath, 'utf-8')
      const obj = JSON.parse(text)
      const result = new Map<string, dayjs.Dayjs>()
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === 'string') {
          try {
            result.set(path.join(baseDir, k), dayjs(v))
          } catch {
            // do nothing
          }
        }
      }
      return result
    } catch (error) {
      return new Map<string, dayjs.Dayjs>()
    }
  }

  async function getFilesWithGitTimestamp(): Promise<FileWithTimestamp> {
    const outputTolines = (output: string): string[] =>
      output
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0)

    const files = await Promise.all(
      outputTolines(await git.raw(['ls-files']))
        .map(line => path.join(baseDir, line))
        .map<Promise<[string, dayjs.Dayjs]>>(async f => [
          f,
          dayjs(
            await git.raw([
              '-c',
              'diff.renames=false',
              'log',
              '--pretty=format:%ci',
              '-n1',
              f
            ])
          )
        ])
    )
    return new Map<string, dayjs.Dayjs>(files)
  }

  await git.fetch('ogirin')
  const files = await getFilesWithGitTimestamp()
  const verifiedFiles = await parseTimesampsJson()

  await core.group('git timestamps', async () => {
    core.info(JSON.stringify([...files]))
  })
  await core.group('json timestamps', async () => {
    core.info(JSON.stringify([...verifiedFiles]))
  })

  try {
    require('unlimited')() // eslint-disable-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  } catch (error) {
    core.debug('not in posix')
  }

  return await new Verifier(core, baseDir).verify(
    files,
    verifiedFiles,
    timeout,
    verifyJson
  )
}

export class VerificationSummary {
  constructor(public file: ResolvedVerificationTarget, public status: number) {}
}
class Verifier {
  constructor(private core: ActionsCore, private baseDir: string) {}

  /**
   * verify
   * @param timeout seconds
   */
  async verify(
    files: FileWithTimestamp,
    verifiedFiles: FileWithTimestamp,
    timeout: number,
    verifyJson: VerifyJson
  ): Promise<VerificationSummary[]> {
    return await this.verifyImpl({
      verificationTargets: resolveDependency(
        this.baseDir,
        files,
        verifiedFiles,
        verifyJson
      ),
      timeout
    })
  }

  /**
   * run program
   * @param command shell command
   * @param attributes
   * @returns command is ok or not
   */
  private async runProgram(
    command: string,
    attributes: {[key: string]: string}
  ): Promise<boolean> {
    this.core.debug(`${command}, ${attributes}`)
    return true
  }

  private async verifyImpl({
    verificationTargets,
    timeout
  }: {
    verificationTargets: ResolvedVerificationTarget[]
    timeout: number
  }): Promise<VerificationSummary[]> {
    const startTime = dayjs()
    const timeoutTime = startTime.add(timeout, 'seconds')
    this.core.info(
      `run \`verify\` from ${startTime.toISOString()} to ${timeoutTime.toISOString()}`
    )

    const result: VerificationSummary[] = []

    const statuses = Object.fromEntries(
      verificationTargets.map(t => [t.name, 0])
    )

    for (let i = verificationTargets.length - 1; i >= 0; i--) {
      const target = verificationTargets[i]
      this.core.debug(JSON.stringify(target))
      const filename = target.name

      if (
        target.verifiedTime &&
        target.updatedTime &&
        !target.updatedTime.isAfter(target.verifiedTime)
      ) {
        statuses[filename] |= 1 // success
      } else if (dayjs().isBefore(timeoutTime) && target.execute) {
        if (await this.runProgram(target.execute, target.attributes || {})) {
          statuses[filename] |= 1 // success
          target.verifiedTime = dayjs()
        } else statuses[filename] |= 2 // failure
      }

      for (const deps of target.dependencies || []) {
        statuses[deps] |= statuses[filename]
      }

      result[i] = new VerificationSummary(target, statuses[filename] || 0)
    }

    return result
  }
}
