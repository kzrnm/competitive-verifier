import {DummyCore} from './utils/dummy'
import {loadConfigFromInput, parseToml} from '../src/config'
import {expect, test, describe} from '@jest/globals'

describe('load config', () => {
  test('valid input', async () => {
    const dummy = new DummyCore({
      timeout: '55.5',
      cwd: 'dist',
      'config-file': '__tests__/resouce/test_config.toml',
      'create-docs': 'True',
      'create-timestamps': 'TRUE',
      'timestamps-file': '__tests__/timestamps.test.json'
    })
    expect(await loadConfigFromInput(dummy)).toStrictEqual({
      createDocs: true,
      baseDir: 'dist',
      createTimestamps: true,
      timeout: 55.5,
      timestampsFilePath: '__tests__/timestamps.test.json',
      tomlConfig: {}
    })
  })

  test('invalid', async () => {
    const dummy = new DummyCore({
      'create-docs': 'foo',
      'create-timestamps': 'true',
      timeout: 'time'
    })
    expect(await loadConfigFromInput(dummy)).toStrictEqual({
      createDocs: false,
      createTimestamps: true,
      baseDir: '',
      timeout: 60,
      timestampsFilePath: '',
      tomlConfig: {}
    })
  })
})

describe('parse toml', () => {
  test('awk', async () => {
    expect(
      parseToml(`[languages.awk]
    compile = "bash -c 'echo hello > {tempdir}/hello'"
    execute = "env AWKPATH={basedir} awk -f {path}"
    bundle = "false"
    list_dependencies = "sed 's/^@include \\"\\\\(.*\\\\)\\"$/\\\\1/ ; t ; d' {path}"

    [[languages.cpp.environments]]
    CXX = "g++"
        `)
    ).toStrictEqual({})
  })
})
