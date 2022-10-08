import BankDeposit from "../src/Spark/Elementary/BankDeposit.js";

let bankDeposit = new BankDeposit(0.06, false)
let balance = 100_000

let period = {
    from: new Date("2022-03-27 04:00"),
    to: new Date("2022-07-01 04:00")
}

console.log(period)
console.log("cost", bankDeposit.flashCostFunc(balance, period))
console.log("income", bankDeposit.flashFunc(balance, period))