import Spark from "../Spark.js";

/**
 * Пример Спарка для ежемесячной оплаты мобильной связи.
 */
export default class MobileSim extends Spark {
    name = "Mobile SIM"
    risk = 0.0
    required = true
    payMonthDay = 15

    _monthPayout

    constructor(monthPayout, payMonthDay) {
        super();

        this.payMonthDay = payMonthDay
        this._monthPayout = monthPayout
    }

    flashFunc = (_, __) => {
        return []
    }

    flashCostFunc = (_, period) => {
        let payments = []
        for (
            let pointerDate = new Date(period.from);
            pointerDate.getTime() < period.to.getTime();
            this.constructor.addDays(pointerDate, 1)
        ) {
            if (pointerDate.getUTCDate() === this.payMonthDay) {
                payments.push(this.constructor.createTransaction(pointerDate, this._monthPayout))
            }
        }

        return payments
    }
}