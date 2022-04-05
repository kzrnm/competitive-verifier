import * as core from '@actions/core'
import path from 'path'
import dayjs from 'dayjs'
import {loadConfigFromInput, Config} from './config'
import {ActionsCore} from './types'
import {createTimestamps} from './timestamps'
import {runVerify} from './verify'

export class OnlineJudgeVerify {
  /**
   * constructor
   */
  constructor(private actionsCore: ActionsCore) {}

  get isInGitHubActions(): boolean {
    return process.env['GITHUB_ACTION'] !== undefined
  }

  /**
   * run
   */
  async run(config: Config): Promise<void> {
    const baseDir = path.join(process.cwd(), config.baseDir || '')
    const timestampsFilePath = path.join(baseDir, config.timestampsFilePath)
    await this.runVerify({
      config,
      timestampsFilePath,
      baseDir
    })

    if (config.createTimestamps)
      await this.createTimestamps({
        files: {}, // TODO: files
        timestampsFilePath,
        baseDir
      })
    if (config.createDocs) await this.createDocuments()
  }

  /**
   * runVerify
   */
  async runVerify({
    config,
    timestampsFilePath,
    baseDir
  }: {
    config: Config
    timestampsFilePath: string
    baseDir: string
  }): Promise<void> {
    await runVerify({
      core: this.actionsCore,
      verifyJson: config.verifyJson,
      timeout: config.timeout,
      baseDir,
      timestampsFilePath
    })
  }

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
    return await createTimestamps({
      core: this.actionsCore,
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

async function run(): Promise<void> {
  try {
    const config = await loadConfigFromInput(core)
    core.debug(`config: ${config}`)
    await new OnlineJudgeVerify(core).run(config)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
