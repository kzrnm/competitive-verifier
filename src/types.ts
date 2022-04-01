import {AnnotationProperties} from '@actions/core'

export interface ActionsCore {
  getInput: (name: string) => string
  getBooleanInput: (name: string) => boolean
  info: (message: string) => void
  warning: (message: string | Error, properties?: AnnotationProperties) => void
  error: (message: string | Error, properties?: AnnotationProperties) => void
}
