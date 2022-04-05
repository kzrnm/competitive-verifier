# Competitive verifier
A verifier for competitive programming library.

This action is inspired by [verification-helper](https://github.com/online-judge-tools/verification-helper).

## Usage

```yml
# TODO
```


## Input

### `verify-json`

**Required** json file that contains verification settings

下記のような json を指定します。あらかじめ別のアクションで作成してください。

コンパイルが必要な言語の場合はあらかじめコンパイルしておいてください。

```json
{
  "examples/awk/circle.test.awk": {
    "execute": "awk -f examples/awk/circle.test.awk",
    "attributes": {
      "ERROR": "1e-5",
      "PROBLEM": "http://judge.u-aizu.ac.jp/onlinejudge/description.jsp?id=ITP1_4_B",
      "IGNORE": ""
    },
    "links": [
      "http://judge.u-aizu.ac.jp/onlinejudge/description.jsp?id=ITP1_4_B"
    ],
    "dependencies": [
      "examples/awk/circle.awk"
    ]
  },
  "examples/awk/circle.awk": {
    "attributes": {},
    "links": [],
    "dependencies": []
  }
}
```

#### Property of `verify-json`

- `execute`: Excecution command
- `attributes`: File attribute
- `links`: Links in the file
- `dependencies`: Other files that the file is dependant on

### `cwd`
base directory


### `create-docs`
if true, create documents
### `create-timestamps`
if true, create timestamps.remote.json

### `timestamps-file`
timestamps file

### `timeout`
Timeout second of the action
