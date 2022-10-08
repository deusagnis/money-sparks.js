import PNKRental from "../src/Spark/Elementary/PNKRental.js";
import BankDeposit from "../src/Spark/Elementary/BankDeposit.js";
import Pool from "../src/Spark/Pool.js";
import BlockEstimator from "../src/Spark/BlockEstimator.js";
import Combinator from "../src/Spark/Combinator.js";
import settings from "../settings";

let sparks = []

sparks.push(new PNKRental(
    0.13,
    3,
    11,
    true
))

sparks.push(new BankDeposit(
    0.1,
    true
))

let balance = 100_000
let period = {
    from: new Date("2022-03-27 04:00"),
    to: new Date("2022-07-16 04:00")
}
console.log("Period:", period)

let sparkPool = new Pool(period)
for (let spark of sparks) {
    sparkPool.addSpark(spark)
}
sparkPool.analyzeSparks()
console.log("Diagram:", sparkPool._sparkApplicationDiagram)

let sparkCombinator = new Combinator(
    balance, period, sparkPool
)
sparkCombinator.combine()
console.log("Common block", sparkCombinator.commonBlock)


let blockEstimator = new BlockEstimator()
blockEstimator.setBlock(balance, period, sparkCombinator.commonBlock, sparkPool, settings.genetic.optimizer.estimator)

let argsCounter = blockEstimator.getBlockArgsCounter()
let blockArgs = []

for (let i = 0; i < argsCounter; i++) {
    blockArgs.push(0.5)
}
blockArgs = [0, 0, 0, 0.3, 0, 1, 1]
console.log("Arguments:", blockArgs)


let result = blockEstimator.estimate(blockArgs)
console.log("Estimation:", result)






