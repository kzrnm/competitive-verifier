import {resolveDependency} from '../src/verify'
import {expect, test, describe} from '@jest/globals'
import dayjs from 'dayjs'
import path from 'path'

describe('resolveDependency', () => {
  test('empty', () => {
    expect(
      resolveDependency(__dirname, new Map(), new Map(), {})
    ).toStrictEqual([])
  })

  test('dependency', () => {
    const baseDir = 'base'
    const pathWithBase = (p: string) => `${baseDir}${path.sep}${p}`
    expect(
      resolveDependency(
        baseDir,
        new Map([
          ['foo1.sh', dayjs('2012-03-06T15:27:58+09:00')],
          ['foo2-1.sh', dayjs('2012-03-08T15:27:58+09:00')],
          ['foo2-2.sh', dayjs('2012-03-05T15:27:58+09:00')],
          ['foo3.sh', dayjs('2012-03-04T15:27:58+09:00')],
          ['sameas1.sh', dayjs('2012-03-04T18:27:58+09:00')],
          ['sameas2.sh', dayjs('2012-03-05T15:27:58+09:00')],
          ['new.sh', dayjs('2012-03-07T15:27:58+09:00')]
        ]),
        new Map([
          ['foo1.sh', dayjs('2012-03-04T15:27:58+09:00')],
          ['foo2-1.sh', dayjs('2012-03-04T16:27:58+09:00')],
          ['foo2-2.sh', dayjs('2012-03-04T17:27:58+09:00')],
          ['foo3.sh', dayjs('2012-03-04T18:27:58+09:00')],
          ['sameas1.sh', dayjs('2012-03-04T19:27:58+09:00')],
          ['sameas2.sh', dayjs('2012-03-04T20:27:58+09:00')]
        ]),
        {
          'foo1.sh': {dependencies: ['foo2-1.sh']},
          'foo2-1.sh': {dependencies: ['foo2-2.sh']},
          'foo2-2.sh': {dependencies: ['foo2-1.sh', 'foo3.sh']},
          'foo3.sh': {dependencies: []},
          'sameas1.sh': {dependencies: []},
          'sameas2.sh': {attributes: {VERIFIER: 'sameas1.sh'}},
          'new.sh': {}
        }
      )
    ).toStrictEqual([
      {
        name: pathWithBase('foo3.sh'),
        dependencies: [pathWithBase('foo3.sh')],
        updatedTime: dayjs('2012-03-04T15:27:58+09:00'),
        verifiedTime: dayjs('2012-03-04T18:27:58+09:00')
      },
      {
        name: pathWithBase('foo2-2.sh'),
        dependencies: [
          pathWithBase('foo2-2.sh'),
          pathWithBase('foo2-1.sh'),
          pathWithBase('foo3.sh')
        ],
        updatedTime: dayjs('2012-03-08T15:27:58+09:00'),
        verifiedTime: dayjs('2012-03-04T17:27:58+09:00')
      },
      {
        name: pathWithBase('foo2-1.sh'),
        dependencies: [
          pathWithBase('foo2-2.sh'),
          pathWithBase('foo2-1.sh'),
          pathWithBase('foo3.sh')
        ],
        updatedTime: dayjs('2012-03-08T15:27:58+09:00'),
        verifiedTime: dayjs('2012-03-04T16:27:58+09:00')
      },
      {
        name: pathWithBase('foo1.sh'),
        dependencies: [
          pathWithBase('foo1.sh'),
          pathWithBase('foo2-2.sh'),
          pathWithBase('foo2-1.sh'),
          pathWithBase('foo3.sh')
        ],
        updatedTime: dayjs('2012-03-08T15:27:58+09:00'),
        verifiedTime: dayjs('2012-03-04T15:27:58+09:00')
      },
      {
        name: pathWithBase('sameas2.sh'),
        dependencies: [pathWithBase('sameas2.sh')],
        attributes: {VERIFIER: 'sameas1.sh'},
        updatedTime: dayjs('2012-03-05T15:27:58+09:00'),
        verifiedTime: dayjs('2012-03-04T20:27:58+09:00')
      },
      {
        name: pathWithBase('sameas1.sh'),
        dependencies: [pathWithBase('sameas1.sh'), pathWithBase('sameas2.sh')],
        updatedTime: dayjs('2012-03-05T15:27:58+09:00'),
        verifiedTime: dayjs('2012-03-04T19:27:58+09:00')
      },
      {
        name: pathWithBase('new.sh'),
        dependencies: [pathWithBase('new.sh')],
        updatedTime: dayjs('2012-03-07T15:27:58+09:00'),
        verifiedTime: undefined
      }
    ])
  })
})
