import path from 'path'
import dayjs from 'dayjs'
import {Config} from './config'
import {ActionsCore} from './types'
import {createTimestamps} from './timestamps'

export class OnlineJudgeVerify {
  /**
   * constructor
   */
  constructor(private core: ActionsCore) {}

  get isInGitHubActions(): boolean {
    return process.env['GITHUB_ACTION'] !== undefined
  }

  /**
   * run
   */
  async run(config: Config): Promise<void> {
    const baseDir = path.join(process.cwd(), config.baseDir || '')
    await this.runVerify()
    if (config.createTimestamps)
      await this.createTimestamps({
        files: {}, // TODO: files
        timestampsFilePath: config.timestampsFilePath,
        baseDir
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
    return await createTimestamps({
      core: this.core,
      baseDir,
      timestampsFilePath,
      files,
      commit: this.isInGitHubActions // テスト時のローカル実行でプッシュされても嬉しくないため
    })
  }
  /**
   * createDocuments
   */
  async createDocuments(): Promise<void> {}
}
