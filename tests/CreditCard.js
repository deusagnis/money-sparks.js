import CreditCard from "../src/Spark/Elementary/CreditCard.js";

let creditCard = new CreditCard(
    30_000,
    100,
    0.039,
    390,
    0.03,
    0.1
)
let balance = 100_000

let period = {
    from: new Date("2022-03-31 04:00"),
    to: new Date("2022-05-30 04:00")
}

console.log(period)
console.log("cost", creditCard.flashCostFunc(balance, period))
console.log("income", creditCard.flashFunc(balance, period))