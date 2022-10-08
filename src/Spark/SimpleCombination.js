import Estimator from "./Estimator.js";

/**
 * Простая последовательная комбинация Спарков.
 */
export default class SimpleCombination {
    /**
     * Создать Размещенный Спарк.
     * @param dateSpark
     * @param from
     * @param to
     * @returns {{dateSpark, from: Date, to: Date}}
     */
    static makePlacedSpark(dateSpark, from, to) {
        return {
            dateSpark,
            from: new Date(from),
            to: new Date(to)
        }
    }

    /**
     * Создать новую комбинацию, дополненную Размещенным Спарком.
     * @param combination
     * @param placedSpark
     * @returns {*[]}
     */
    static newExtendedBy(combination, placedSpark) {
        return [...combination, placedSpark]
    }

    /**
     * Нормализовать комбинацию.
     * @param balance
     * @param pool
     * @param combination
     * @returns {{estimation, placedSparks: (*|*[])}}
     */
    static normalize(balance, pool, combination) {
        let collapsed = this._collapseReinvestmentSparks(pool, combination)
        let estimation = this.estimate(balance, pool, collapsed)
        this._correctSparkPeriods(collapsed)

        return {
            placedSparks: collapsed,
            estimation
        }
    }

    /**
     * Оценить комбинацию.
     * @param balance
     * @param pool
     * @param combination
     * @returns {*}
     */
    static estimate(balance, pool, combination) {
        let comBalance = balance
        for (let combPart of combination) {
            let spark = pool.getSpark(combPart.dateSpark.sparkId)
            combPart.estimation = Estimator.estimateSpark(spark, comBalance, combPart.from, combPart.to)
            comBalance = combPart.estimation.total
        }

        return comBalance
    }

    static _collapseReinvestmentSparks(pool, combination) {
        if (combination.length < 2) return combination
        let collapsedCombination = []
        let collapsed = null
        for (let i = 0; i < combination.length - 1; i++) {
            let current = combination[i]
            let next = combination[i + 1]
            if (next.dateSpark.sparkId === current.dateSpark.sparkId
                && pool.getSpark(current.dateSpark.sparkId).reinvestment
            ) {
                if (collapsed === null) {
                    collapsed = Object.assign({}, current)
                }
                collapsed.to = next.to
            } else {
                if (collapsed === null) {
                    collapsedCombination.push(current)
                } else {
                    collapsedCombination.push(collapsed)
                    collapsed = null
                }
            }
        }
        if (collapsed === null) {
            collapsedCombination.push(combination[combination.length - 1])
        } else {
            collapsedCombination.push(collapsed)
        }

        return collapsedCombination
    }

    static _correctSparkPeriods(combination) {
        for (let comDateSpark of combination) {
            this._correctDateSparkPeriod(comDateSpark)
        }
    }

    static _correctDateSparkPeriod(combDateSpark) {
        let payoutTimes = combDateSpark.estimation.payouts.map((payout) => payout.date.getTime())
        let paymentTimes = combDateSpark.estimation.payments.map((payment) => payment.date.getTime())

        combDateSpark.from = new Date(Math.min(...paymentTimes, ...payoutTimes))
        combDateSpark.to = new Date(Math.max(...paymentTimes, ...payoutTimes))
    }
}