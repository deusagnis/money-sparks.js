import Spark from "./Spark.js";

/**
 * Пул Спарков.
 */
export default class Pool {
    _period
    _pool = []

    _requiredSparks = []
    _placeableSparks = []

    _sparkApplicationDiagram = {}

    constructor(period) {
        this._period = period
    }

    /**
     * Добавить Спарк.
     * @param spark
     */
    addSpark(spark) {
        this._pool.push(spark)
    }

    /**
     * Получить Спарк по Id.
     * @param id
     * @returns {*}
     */
    getSpark(id) {
        return this._pool[id]
    }

    /**
     * Получить обязательные Спарки.
     * @returns {*[]}
     */
    getRequiredSparks() {
        return this._requiredSparks
    }

    /**
     * Получить вес в количестве возможных к применению Спарков для Date.
     * @param date
     * @returns {number|*}
     */
    getDateWeight(date) {
        let dateCode = Spark.getDateString(date)
        if (this._sparkApplicationDiagram[dateCode] === undefined) {
            return 0
        }
        return this._sparkApplicationDiagram[dateCode].length
    }

    /**
     * Получить количество спарков в пуле.
     * @returns {number}
     */
    getSparkAmount() {
        return this._pool.length
    }

    /**
     * Выполнить анализ Спарков.
     */
    analyzeSparks() {
        this._categorizeSparks()
        this._fillSparkApplicationDiagram()
    }

    /**
     * Получить Спарки, доступные к применению для кода определенной даты.
     * @param dateCode
     * @returns {*[]|*}
     */
    getSparksOn(dateCode) {
        if (this._sparkApplicationDiagram[dateCode] === undefined) {
            return []
        }

        return this._sparkApplicationDiagram[dateCode]
    }

    _categorizeSparks() {
        for (let sparkId in this._pool) {
            let spark = this._pool[sparkId]

            if (spark.required) {
                this._requiredSparks.push(sparkId)
            } else {
                this._placeableSparks.push(sparkId)
            }
        }
    }

    _fillSparkApplicationDiagram() {
        for (
            let pointerDate = new Date(this._period.from);
            pointerDate.getTime() <= this._period.to.getTime();
            Spark.addDays(pointerDate, 1)
        ) {
            let dateCode = Spark.getDateString(pointerDate)

            for (let sparkId of this._placeableSparks) {
                let spark = this.getSpark(sparkId)

                let possibleFrom = this._dateBelongsConditions(pointerDate, dateCode, spark.possibleFrom)
                if (spark.dateFixed) {
                    if (possibleFrom) {
                        this._addSparkToApplicationDiagram(dateCode, this._createDateSpark(sparkId, spark.risk, true, true))
                    }
                } else {
                    let optimalFrom = this._dateBelongsConditions(pointerDate, dateCode, spark.optimalFrom)
                    this._addSparkToApplicationDiagram(dateCode, this._createDateSpark(sparkId, spark.risk, possibleFrom, optimalFrom))
                }
            }

            this._sortSparkApplicationDiagram(dateCode)
        }

    }

    _dateBelongsConditions(date, dateCode, conditions) {
        if (conditions.dates === "*"
            || conditions.dates.includes(dateCode)
            || conditions.dates.includes(dateCode.substring(5))
        ) {
            return true
        }

        let monthsFlag = false
        let monthDaysFlag = false

        if (conditions.months === "*"
            || conditions.months.includes(date.getUTCMonth())
        ) {
            monthsFlag = true
        }

        if (conditions.monthDays === "*"
            || conditions.monthDays.includes(date.getUTCDate())
            || conditions.monthDays.includes("ld") && (date.getUTCDate() === Spark.getLastMonthDay(date))
        ) {
            monthDaysFlag = true
        }

        return monthsFlag && monthDaysFlag;
    }

    _addSparkToApplicationDiagram(dateCode, dateSpark) {
        if (this._sparkApplicationDiagram[dateCode] === undefined) {
            this._sparkApplicationDiagram[dateCode] = []
        }

        this._sparkApplicationDiagram[dateCode].push(dateSpark)
    }

    _createDateSpark(sparkId, risk, possibleFrom, optimalFrom) {
        return {
            sparkId,
            risk,
            possibleFrom,
            optimalFrom
        }
    }

    _sortSparkApplicationDiagram(dateCode) {
        if (this._sparkApplicationDiagram[dateCode] === undefined) return

        this._sparkApplicationDiagram[dateCode].sort((spark1, spark2) => {
            let b = 3.5 * (spark1.risk - spark2.risk)

            if (spark1.possibleFrom) {
                b -= 1
            }
            if (spark2.possibleFrom) {
                b += 1
            }
            if (spark1.optimalFrom) {
                b -= 1
            }
            if (spark2.optimalFrom) {
                b += 1
            }


            return b
        })
    }
}