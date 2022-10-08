import CreditCard from "./src/Spark/Elementary/CreditCard.js";
import PNKRental from "./src/Spark/Elementary/PNKRental.js";
import MobileSim from "./src/Spark/Elementary/MobileSim.js";
import MoneySparks from "./src/MoneySparks.js";
import Spark from "./src/Spark/Spark.js";
import BankDeposit from "./src/Spark/Elementary/BankDeposit.js";
import settings from "./settings.js";

let main = () => {
    let sparks = []

    sparks.push(new CreditCard(
        30_000,
        100,
        0.039,
        390,
        0.03,
        0.1
    ))

    sparks.push(new PNKRental(
        0.13,
        3,
        17,
        true
    ))

    sparks.push(new BankDeposit(
        0.1,
        true
    ))

    sparks.push(new MobileSim(
        515,
        15
    ))

    let from = new Date("2022-03-27 04:00")
    let to = new Date("2022-07-16 04:00")

    console.log("period: ", Spark.getDateString(from), "-", Spark.getDateString(to))

    let ms = new MoneySparks(10_000, sparks, from, to, settings.moneySparks)

    let result = ms.evaluate()

    console.log(result)
}

main()