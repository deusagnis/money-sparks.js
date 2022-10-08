/**
 * Оценщик Спарка.
 */
export default class Estimator {
    /**
     * Оценить Спарк.
     * @param spark
     * @param balance
     * @param from
     * @param to
     * @returns {{payouts: *[], payoutSum: number, total, firstPayout, payments: *[], paymentSum: number}}
     */
    static estimateSpark(spark, balance, from, to) {
        let result = {
            firstPayout: balance,
            payments: [],
            payouts: [],
            paymentSum: 0,
            payoutSum: 0,
            total: balance
        }

        if (result.firstPayout < spark.minBalance) {
            return result
        }

        if (spark.maxBalance !== -1 && balance > spark.maxBalance) {
            result.firstPayout = spark.maxBalance
        }

        if (spark.minBalance === 0 && spark.maxBalance === 0) {
            result.firstPayout = 0
        }

        result.payments = spark.flashFunc(result.firstPayout, {
            from,
            to
        })

        result.payouts = spark.flashCostFunc(result.firstPayout, {
            from,
            to
        })

        result.paymentSum = result.payments.reduce((accum, current) => accum + current.amount, 0)
        result.total += result.paymentSum
        result.payoutSum = result.payouts.reduce((accum, current) => accum + current.amount, 0)
        result.total -= result.payoutSum

        return result
    }
}