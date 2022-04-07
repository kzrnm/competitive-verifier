import {AnnotationProperties} from '@actions/core'

export interface ActionsCore {
  getInput: (name: string) => string
  getBooleanInput: (name: string) => boolean
  group<T>(name: string, fn: () => Promise<T>): Promise<T>
  debug: (message: string) => void
  info: (message: string) => void
  warning: (message: string | Error, properties?: AnnotationProperties) => void
  error: (message: string | Error, properties?: AnnotationProperties) => void
}
