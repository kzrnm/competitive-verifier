import dayjs from 'dayjs'
import {PathLike} from 'fs'
import fs from 'fs/promises'
import path from 'path'
import simpleGit, {SimpleGit} from 'simple-git'
import {VerifyJson} from './config'
import {ActionsCore} from './types'

class Verifier {
  constructor(
    private core: ActionsCore,
    private baseDir: string,
    private verifyJson: VerifyJson
  ) {}

  /**
   * verify
   * @param timeout seconds
   */
  async verify(
    files: FileWithTimestamp,
    verifiedFiles: FileWithTimestamp,
    timeout: number
  ): Promise<void> {
    const startTime = dayjs()
    const timeoutTime = startTime.add(timeout, 'seconds')
    this.core.info(
      `run \`verify\` from ${startTime.toISOString()} to ${timeoutTime.toISOString()}`
    )
    for (const [k, verified] of verifiedFiles) {
      if (verified.isBefore(files.get(k))) {
        verifiedFiles.delete(k)
      }
    }

    this.core.info(JSON.stringify(this.verifyJson))
  }
}

type FileWithTimestamp = Map<string, dayjs.Dayjs>

async function parseTimesampsJson(
  timestampsFilePath: PathLike,
  baseDir: string
): Promise<FileWithTimestamp> {
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

async function getFilesWithGitTimestamp(
  git: SimpleGit,
  baseDir: string
): Promise<FileWithTimestamp> {
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
}): Promise<void> {
  const git = simpleGit(baseDir)
  await git.fetch('ogirin')
  const files = await getFilesWithGitTimestamp(git, baseDir)
  const verifiedFiles = await parseTimesampsJson(timestampsFilePath, baseDir)

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

  await new Verifier(core, baseDir, verifyJson).verify(
    files,
    verifiedFiles,
    timeout
  )
}
