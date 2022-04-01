import * as fs from 'fs/promises'
import path from 'path'
import dayjs from 'dayjs'
import simpleGit from 'simple-git'
import {ActionsCore} from './types'

export async function createTimestamps({
  core,
  files,
  timestampsFilePath,
  baseDir,
  commit = false
}: {
  core: ActionsCore
  files: {[filename: string]: dayjs.Dayjs}
  timestampsFilePath: string
  baseDir: string
  commit?: boolean
}): Promise<void> {
  try {
    await fs.mkdir(path.dirname(timestampsFilePath), {recursive: true})
    await fs.writeFile(timestampsFilePath, JSON.stringify(files, null, ' '))
    if (!commit) {
      core.info('local run')
      return
    }

    const git = simpleGit({baseDir})
    await git
      .addConfig('user.name', 'GitHub')
      .addConfig('user.email', 'noreply@github.com')
      .addConfig('author.name', process.env['GITHUB_ACTOR'] || '')

    try {
      await git.pull('origin').add(timestampsFilePath)
    } catch (error) {
      if (error instanceof Error) core.error(error)
      core.info(`Keep ${timestampsFilePath}`)
      return
    }
    core.info(`Update ${timestampsFilePath}`)

    await git
      .commit(
        `[auto-verifier] verify commit ${process.env['GITHUB_SHA'] || ''}`
      )
      .push('origin', undefined)
  } catch (error) {
    core.error(`failed to create ${timestampsFilePath}`)
    throw error
  }
}
