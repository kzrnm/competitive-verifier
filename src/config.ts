import {ActionsCore} from './types'
import * as fs from 'fs/promises'

export async function loadConfigFromInput(core: ActionsCore): Promise<Config> {
  const timeout = (() => {
    const t = parseFloat(core.getInput('timeout'))
    if (isNaN(t)) {
      return 60
    }
    return t
  })()

  const verifyJson = await (async () => {
    const jsonPath = core.getInput('verify-json')
    try {
      const buf = await fs.readFile(jsonPath, {encoding: 'utf-8'})
      return JSON.parse(buf)
    } catch (error) {
      core.error('Failed to read verify-json')
      throw error
    }
  })()

  return {
    verifyJson,
    baseDir: core.getInput('cwd'),
    createDocs: core.getBooleanInput('create-docs'),
    createTimestamps: core.getBooleanInput('create-timestamps'),
    timestampsFilePath: core.getInput('timestamps-file'),
    timeout
  }
}
export interface VerifyJsonFile {
  execute?: string
  dependencies?: string[]
  links?: string[]
  attributes?: {[key: string]: string}
}
export type VerifyJson = {[filename: string]: VerifyJsonFile}
export interface Config {
  verifyJson: VerifyJson
  baseDir: string
  createDocs: boolean
  createTimestamps: boolean
  timestampsFilePath: string
  timeout: number
}
