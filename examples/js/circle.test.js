// verification-helper: PROBLEM http://judge.u-aizu.ac.jp/onlinejudge/description.jsp?id=ITP1_4_B
// verification-helper: ERROR 1e-5

const circle = require('./circle')

// inputに入力データ全体が入る
function main(input) {
    var r = parseInt(input, 10);
    console.log(`${circle.get_area(r)} ${circle.get_circumference(r)}`)
}
process.stdin.once('data', d => main(d.toString('utf-8')))