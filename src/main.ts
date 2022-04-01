import * as core from '@actions/core'
import {loadConfigFromInput} from './config'
import {OnlineJudgeVerify} from './verify'

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
