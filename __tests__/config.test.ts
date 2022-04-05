import {DummyCore} from './utils/dummy'
import {loadConfigFromInput} from '../src/config'
import {expect, test, describe} from '@jest/globals'

describe('load config', () => {
  test('valid input', async () => {
    const dummy = new DummyCore({
      timeout: '55.5',
      cwd: 'dist',
      'verify-json': '__tests__/resource/verify.test.json',
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
      verifyJson: {
        'examples/awk/circle.test.awk': {
          execute: 'awk -f examples/awk/circle.test.awk',
          links: [
            'http://judge.u-aizu.ac.jp/onlinejudge/description.jsp?id=ITP1_4_B'
          ],
          attributes: {
            ERROR: '1e-5',
            PROBLEM:
              'http://judge.u-aizu.ac.jp/onlinejudge/description.jsp?id=ITP1_4_B',
            IGNORE: ''
          },
          dependencies: ['examples/awk/circle.awk']
        },
        'examples/awk/circle.awk': {
          attributes: {},
          links: [],
          dependencies: []
        }
      }
    })
  })

  test('invalid', async () => {
    const dummy = new DummyCore({
      'create-docs': 'foo',
      'verify-json': '__tests__/resource/verify.empty.json',
      'create-timestamps': 'true',
      timeout: 'time'
    })
    expect(await loadConfigFromInput(dummy)).toStrictEqual({
      createDocs: false,
      createTimestamps: true,
      baseDir: '',
      timeout: 60,
      timestampsFilePath: '',
      verifyJson: {}
    })
  })
})
