import Spark from "../Spark.js";

/**
 * Пример Спарка для PNKRental с ежеквартальными выплатами.
 */
export default class PNKRental extends Spark {
    name = "PNK Rental"
    risk = 0.01
    minBalance = 1000
    maxBalance = 7_000_000

    cyclical = true
    cycleInterval = {
        everyMonths: 3,
        everyDays: null
    }
    dateFixed = true
    possibleFrom = {
        dates: [],
        monthDays: ["ld"],
        months: [2, 5, 8, 11],
    }

    expectedPayoutTime = {
        workDays: 17,
        days: 0,
        months: 0
    }

    _expectedAnnualReturn = 0.13
    _fundsTransferWorkDays = 4
    _reinvestment = true

    constructor(
        expectedAnnualReturn, fundsTransferWorkDays, payoutWorkDays,
        reinvestment
    ) {
        super();

        this._expectedAnnualReturn = expectedAnnualReturn
        this._fundsTransferWorkDays = fundsTransferWorkDays
        this.expectedPayoutTime.workDays = payoutWorkDays
        this._reinvestment = reinvestment
    }

    flashFunc = (balance, period) => {
        let payments = []

        let balanceTransferredDate = new Date(period.from.getTime())
        this.constructor.addWorkDays(balanceTransferredDate, this._fundsTransferWorkDays)

        let quarterlyIncome = 0
        let pointerDate = new Date(period.from.getTime())
        let payoutDate
        for (; pointerDate.getTime() < period.to.getTime(); Spark.addDays(pointerDate, 1)) {
            payoutDate = new Date(pointerDate)
            this.constructor.addWorkDays(payoutDate, this.expectedPayoutTime.workDays)

            if (payoutDate.getTime() > period.to.getTime()) {
                break
            }

            if (pointerDate.getTime() > balanceTransferredDate.getTime()) {
                quarterlyIncome += balance * this._calcDayReturn(pointerDate)
            }

            if (pointerDate.getTime() > balanceTransferredDate.getTime()
                && pointerDate.getUTCMonth() % 3 === 2
                && pointerDate.getUTCDate() === this.constructor.getLastMonthDay(pointerDate)
            ) {
                if (this._reinvestment) {
                    balance += quarterlyIncome
                } else {
                    payments.push(this.constructor.createTransaction(new Date(pointerDate), quarterlyIncome, "Квартальное начисление"))
                }
                quarterlyIncome = 0
                if (this.constructor.addMonths(new Date(pointerDate), 3).getTime() > period.to.getTime()) {
                    break
                }
            }
        }

        payments.push(this.constructor.createTransaction(payoutDate, balance, "Вывод средств со счёта PNK"))

        return payments
    }

    flashCostFunc = (balance, period) => {
        return [this.constructor.createTransaction(new Date(period.from.getTime()), balance, "Перевод средств на счёт PNK")]
    }

    _calcDayReturn(date) {
        return this._expectedAnnualReturn / ((date.getFullYear() % 4 === 0) ? 366 : 365)
    }
}