import Spark from "../Spark.js";

/**
 * Пример Спарка для кредитной карты с льготным периодом, включающим снятие наличных.
 */
export default class CreditCard extends Spark {
    name = "Credit Card"
    risk = 0.01
    minBalance = 0
    maxBalance = 0

    cyclical = false
    cycleInterval = {
        everyMonths: null,
        everyDays: 95
    }
    minDayDuration = 60

    dateFixed = false
    optimalFrom = {
        dates: [],
        monthDays: [1, 2, 3, 4, 5, 6, 7],
        months: "*",
    }
    possibleFrom = {
        dates: "*",
        monthDays: [],
        months: [],
    }

    _creditBalance
    _primaryCommissionPercent = 0
    _constantPrimaryCommission = 0
    _mandatoryPaymentPercent = 0.08
    _dayPenalty = 0.001


    constructor(
        creditBalance, graceDays, primaryCommissionPercent, constantPrimaryCommission,
        mandatoryPaymentPercent, dayPenalty
    ) {
        super();

        this._creditBalance = creditBalance
        this.cycleInterval.everyDays = graceDays
        this._primaryCommissionPercent = primaryCommissionPercent
        this._constantPrimaryCommission = constantPrimaryCommission
        this._mandatoryPaymentPercent = mandatoryPaymentPercent
        this._dayPenalty = dayPenalty
    }

    flashFunc = (_, period) => {
        return [
            this.constructor.createTransaction(period.from, this._calcDebt(), "Снятие средств с кредитной карты")
        ]
    }

    flashCostFunc = (_, period) => {
        let payments = []
        let debt = this._creditBalance
        let penalty = 0
        let payment

        for (let pointerDate = new Date(period.from);
             pointerDate.getTime() < period.to.getTime();
             this.constructor.addDays(pointerDate, 1)
        ) {
            if (pointerDate.getTime() === period.from.getTime()) continue
            if (
                pointerDate.getUTCDate() === this.constructor.getLastMonthDay(pointerDate)
                && this.constructor.getDaysBetween(pointerDate, period.from) < this.cycleInterval.everyDays
            ) {
                payment = debt * this._mandatoryPaymentPercent
                debt -= payment
                payments.push(this.constructor.createTransaction(new Date(pointerDate), payment, "Оплата минимального платежа"))
            }
            if (this.constructor.getDaysBetween(pointerDate, period.from) > this.cycleInterval.everyDays) {
                penalty += debt * this._dayPenalty
            }
        }
        payments.push(this.constructor.createTransaction(period.to, penalty, "Оплата комиссионных"))
        payments.push(this.constructor.createTransaction(period.to, debt, "Оплата оставшегося долга"))

        return payments
    }

    _calcDebt() {
        return (this._creditBalance - this._constantPrimaryCommission) * (1 - this._primaryCommissionPercent)
    }
}