import * as fs from 'fs/promises'
import path from 'path'
import * as dayjs from 'dayjs'
import simpleGit from 'simple-git'
import {Config} from './config'
import {ActionsCore} from './types'
export class OnlineJudgeVerify {
  core: ActionsCore

  /**
   * constructor
   */
  constructor(core: ActionsCore) {
    this.core = core
  }

  /**
   * run
   */
  async run(config: Config): Promise<void> {
    await this.runVerify()
    if (config.createTimestamps)
      await this.createTimestamps({
        files: {}, // TODO: files
        timestampsFilePath: config.timestampsFilePath,
        baseDir: path.join(process.cwd(), config.baseDir || '')
      })
    if (config.createDocs) await this.createDocuments()
  }

  /**
   * runVerify
   */
  async runVerify(): Promise<void> {}

  /**
   * createTimestamps
   */
  async createTimestamps({
    files,
    timestampsFilePath,
    baseDir
  }: {
    files: {[filename: string]: dayjs.Dayjs}
    timestampsFilePath: string
    baseDir: string
  }): Promise<void> {
    timestampsFilePath = path.join(baseDir, timestampsFilePath)
    try {
      await fs.mkdir(path.dirname(timestampsFilePath), {recursive: true})
      await fs.writeFile(timestampsFilePath, JSON.stringify(files, null, ' '))

      const git = simpleGit({baseDir})
      await git
        .addConfig('user.name', 'GitHub')
        .addConfig('user.email', 'noreply@github.com')
        .addConfig('author.name', process.env['GITHUB_ACTOR'] || '')

      try {
        await git.pull('origin').add(timestampsFilePath)
      } catch (error) {
        if (error instanceof Error) this.core.error(error)
        this.core.info(`Keep ${timestampsFilePath}`)
        return
      }
      this.core.info(`Update ${timestampsFilePath}`)

      // テスト時のローカル実行でプッシュされても嬉しくないため
      if (process.env['GITHUB_ACTION']) {
        await git
          .commit(
            `[auto-verifier] verify commit ${process.env['GITHUB_SHA'] || ''}`
          )
          .push('origin', undefined)
      } else {
        this.core.info('local run')
      }
    } catch (error) {
      this.core.error(`failed to create ${timestampsFilePath}`)
      throw error
    }
  }
  /**
   * createDocuments
   */
  async createDocuments(): Promise<void> {}
}
