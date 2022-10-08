import Spark from "../Spark.js";

/**
 * Пример Спарка для банковского депозита с ежемесячным начислением процентов.
 */
export default class BankDeposit extends Spark {
    name = "Bank Deposit"
    risk = 0.01
    minBalance = 1000
    maxBalance = 5_000_000

    cyclical = true
    cycleInterval = {
        everyMonths: 1,
        everyDays: null
    }
    dateFixed = true
    possibleFrom = {
        dates: [],
        monthDays: [27, 28, 29, 30, 31],
        months: "*",
    }

    annualReturn = 0.09
    reinvestment = true

    constructor(annualReturn, reinvestment) {
        super();

        this.annualReturn = annualReturn
        this.reinvestment = reinvestment
    }

    flashFunc = (balance, period) => {
        let payments = []
        let cycles = period.to.getUTCMonth() - period.from.getUTCMonth()

        let monthIncome = 0
        let pointerDate = new Date(period.from.getTime())
        let tempDate
        for (let cycle = 0; cycle < cycles; cycle++) {
            tempDate = new Date(pointerDate)
            this.constructor.addMonths(pointerDate, 1)
            pointerDate.setUTCDate(this.constructor.getLastMonthDay(pointerDate))
            if (pointerDate.getTime() > period.to.getTime()) {
                pointerDate = tempDate
                break
            }
            monthIncome = balance * this.calcMonthReturn()

            if (this.reinvestment) {
                balance += monthIncome
            } else {
                payments.push(this.constructor.createTransaction(new Date(pointerDate), monthIncome, "Выплата ежемесячных начислений"))
            }
        }

        if (pointerDate.getTime() === period.from.getTime()) {
            pointerDate.setUTCDate(this.constructor.getLastMonthDay(pointerDate))

            if (pointerDate.getTime() > period.to.getTime()) {
                pointerDate.setTime(period.to.getTime())
            }
        }
        payments.push(this.constructor.createTransaction(new Date(pointerDate), balance, "Вывод средств с банковского счёта"))

        return payments
    }

    flashCostFunc = (balance, period) => {
        let payoutDate = new Date(period.from)
        payoutDate.setUTCDate(this.constructor.getLastMonthDay(payoutDate))

        if (payoutDate.getTime() > period.to.getTime()) {
            payoutDate.setTime(period.to.getTime())
        }

        return [this.constructor.createTransaction(payoutDate, balance, "Перевод средств на банковский счёт")]
    }

    calcMonthReturn() {
        return this.annualReturn / 12;
    }
}