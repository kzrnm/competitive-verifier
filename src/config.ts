import * as toml from 'toml'
import {ActionsCore} from './types'
import * as fs from 'fs/promises'

export function parseToml(input: string): TomlConfig {
  toml.parse(input)
  // const languages = obj['languages']
  // const languagesResult: any[] = []
  // for (const key of Object.keys(languages)) {
  //   languagesResult.push(key)
  // }
  return {}
}

export async function loadConfigFromInput(core: ActionsCore): Promise<Config> {
  const configFilePath = core.getInput('config-file')
  const timeout = (() => {
    const t = parseFloat(core.getInput('timeout'))
    if (isNaN(t)) {
      return 60
    }
    return t
  })()

  const tomlConfig = await (async () => {
    if (!configFilePath) {
      core.info('config file does not exist')
      return {}
    }

    let buf: Buffer
    try {
      buf = await fs.readFile(configFilePath)
    } catch (error) {
      core.warning('Failed to read config file')
      return {}
    }

    try {
      return parseToml(buf.toString('utf-8'))
    } catch (error) {
      core.warning('Invalid toml')
      return {}
    }
  })()

  return {
    baseDir: core.getInput('cwd'),
    createDocs: core.getBooleanInput('create-docs'),
    createTimestamps: core.getBooleanInput('create-timestamps'),
    timestampsFilePath: core.getInput('timestamps-file'),
    timeout,
    tomlConfig
  }
}

export interface TomlConfig {
  languages?: unknown[]
}

export interface Config {
  baseDir: string
  createDocs: boolean
  createTimestamps: boolean
  timestampsFilePath: string
  timeout: number
  tomlConfig: TomlConfig
}
