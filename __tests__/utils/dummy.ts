import {AnnotationProperties} from '@actions/core'

export class DummyCore {
  input: {[key: string]: string}
  log: [string, string | Error][] = []
  constructor(input: {[key: string]: string}) {
    this.input = input
  }
  getInput(name: string): string {
    return this.input[name] || ''
  }
  getBooleanInput(name: string): boolean {
    return this.input[name]?.toLowerCase() === 'true'
  }
  debug(message: string) {
    this.log.push(['debug', message])
  }
  info(message: string) {
    this.log.push(['info', message])
  }
  warning(message: string | Error, properties?: AnnotationProperties) {
    this.log.push(['warning', message])
  }
  error(message: string | Error, properties?: AnnotationProperties) {
    this.log.push(['error', message])
  }
  notice(message: string | Error, properties?: AnnotationProperties) {
    this.log.push(['notice', message])
  }
}
