import * as fs from 'fs/promises'
import path from 'path'
import simpleGit from 'simple-git'
import {Config} from './config'
import {ActionsCore} from './types'

export class OnlineJudgeVerify {
  core: ActionsCore
  config: Config
  /**
   *
   */
  constructor(core: ActionsCore, config: Config) {
    this.core = core
    this.config = config
  }

  /**
   * run
   */
  async run(): Promise<void> {
    const config = this.config
    await this.runVerify()
    if (config.createTimestamps)
      await this.createTimestamps({
        timestampsFilePath: config.timestampsFilePath,
        baseDir: path.join(process.cwd(), this.config.baseDir || '')
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
    timestampsFilePath,
    baseDir
  }: {
    timestampsFilePath: string
    baseDir: string
  }): Promise<void> {
    timestampsFilePath = path.join(baseDir, timestampsFilePath)
    try {
      await fs.mkdir(path.dirname(timestampsFilePath), {recursive: true})

      const git = simpleGit({baseDir})
      await git
        .addConfig('user.name', 'GitHub')
        .addConfig('user.email', 'noreply@github.com')
        .addConfig('author.name', process.env['GITHUB_ACTOR'] || '')

      try {
        await git.pull('origin').add(timestampsFilePath)
      } catch (error) {
        this.core.info(`Keep ${timestampsFilePath}`)
        return
      }
      this.core.info(`Update ${timestampsFilePath}`)
      await git
        .commit(
          `[auto-verifier] verify commit ${process.env['GITHUB_SHA'] || ''}`
        )
        .push('origin', undefined)
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
    }
  }
  /**
   * createDocuments
   */
  async createDocuments(): Promise<void> {}
}
