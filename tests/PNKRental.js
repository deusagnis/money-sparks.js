import PNKRental from "../src/Spark/Elementary/PNKRental.js";

let pnkRental = new PNKRental(0.12, 3, 11, true)
let balance = 100_000

let period = {
    from: new Date("2022-03-25 04:00"),
    to: new Date("2022-10-17 04:00")
}

console.log(period)
console.log("cost", pnkRental.flashCostFunc(balance, period))
console.log("income", pnkRental.flashFunc(balance, period))