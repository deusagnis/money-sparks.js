import Spark from "./Spark.js";
import SimpleCombination from "./SimpleCombination.js";

/**
 * Комбинатор Спарков.
 */
export default class Combinator {
    /**
     * Доступный баланс.
     */
    balance
    /**
     * Период применения Спарков.
     */
    period
    _sparkPool

    /**
     * Простые комбинации.
     * @type {[]}
     */
    simpleCombinations = []
    /**
     * Отстортированные простые комбинации.
     * @type {[]}
     */
    sortedSimpleCombinations = []
    _combinationContacts = {}
    /**
     * Блоки комбинаций.
     * @type {[]}
     */
    combinationBlocks = []
    /**
     * Общий блок спарков.
     * @type {{}}
     */
    commonBlock = {}
    _groupUsing = {}
    _combinationGroups = {}

    constructor(balance, period, pool) {
        this.balance = balance
        this.period = period
        this._sparkPool = pool
    }

    /**
     * Комбинировать Спарки.
     */
    combine() {
        this._makeSimpleCombinations()
        this._createSortSimpleCombinations()
        this._chooseContactedSimpleCombinations()
        this._groupCombinations()
        this._makeBlocks()
        this._makeCommonBlock()
    }

    _makeSimpleCombinations(date = null, combination = null) {
        if (combination === null) {
            combination = []
        }
        let pointerDate = new Date(date ?? this.period.from);

        if (pointerDate.getTime() > this.period.to.getTime()) {
            this._addSimpleCombination(combination)
            return
        }

        let dateCode = Spark.getDateString(pointerDate)
        let dateSparks = this._sparkPool.getSparksOn(dateCode)

        for (let dateSpark of dateSparks) {
            let toDate = this._chooseSparkToDate(new Date(pointerDate), dateSpark)
            if (toDate.getTime() > this.period.to.getTime()) continue

            let placedSpark = SimpleCombination.makePlacedSpark(
                dateSpark, pointerDate, toDate
            )
            let newCombination = SimpleCombination.newExtendedBy(
                combination, placedSpark
            )
            this._makeSimpleCombinations(toDate, newCombination)
        }

        this._makeSimpleCombinations(Spark.addDays(pointerDate, 1), combination)
    }

    _createSortSimpleCombinations() {
        this.sortedSimpleCombinations = this.simpleCombinations.map((combination, id) => {
            return {
                combinationId: id,
                estimation: combination.estimation
            }
        }).sort(
            (cm1, cm2) => (cm2.estimation - cm1.estimation)
        )
    }

    _chooseContactedSimpleCombinations() {
        for (let sortComb of this.sortedSimpleCombinations) {
            let combination = this._getSimpleCombination(sortComb.combinationId)
            combination.contacted = {}
            let contacts = this._calcCombinationContacts(combination.placedSparks)
            combination.contactAmount = contacts.length

            for (let contact of contacts) {
                let combIds = this._combinationContacts[contact]

                for (let combId of combIds) {
                    if (combination.contacted[combId] === undefined) {
                        combination.contacted[combId] = 0
                    }
                    combination.contacted[combId]++
                }
            }
        }
    }

    _groupCombinations() {
        let groupId = 0
        for (let combId in this.simpleCombinations) {
            if (this._groupUsing[combId] !== undefined) continue
            this._groupUsing[combId] = true
            if (this._combinationGroups[groupId] === undefined) {
                this._combinationGroups[groupId] = []
            }
            this._combinationGroups[groupId].push(combId)
            let combination = this.simpleCombinations[combId]
            for (let contactedCombId in combination.contacted) {
                if (contactedCombId === combId) continue
                let commonContacts = combination.contacted[contactedCombId]
                let contactedCombination = this._getSimpleCombination(contactedCombId)
                if (commonContacts / contactedCombination.contactAmount < 0.5) continue
                if (this._groupUsing[contactedCombId] !== undefined) continue
                this._groupUsing[contactedCombId] = true
                this._combinationGroups[groupId].push(contactedCombId)
            }
            groupId++
        }
    }

    _makeBlocks() {
        for (let combGroupId in this._combinationGroups) {
            this.combinationBlocks.push(this._groupToBlock(this._combinationGroups[combGroupId]))
        }
    }

    _makeCommonBlock() {
        let commonGroup = this.simpleCombinations.map((_, id) => id)

        this.commonBlock = this._groupToBlock(commonGroup)
    }

    _groupToBlock(combinationGroup) {
        let block = {
            dates: [],
            sparksByDates: {}
        }
        let dateSparksUsing = {}

        for (let combId of combinationGroup) {
            let combination = this._getSimpleCombination(combId)

            for (let placedSpark of combination.placedSparks) {
                if (!block.dates.includes(placedSpark.from.getTime())) {
                    block.dates.push(placedSpark.from.getTime())
                }

                let dateCode = Spark.getDateString(placedSpark.from)
                if (dateSparksUsing[dateCode] === undefined) {
                    dateSparksUsing[dateCode] = []
                }
                let usingCode = placedSpark.dateSpark.sparkId + dateCode + Spark.getDateString(placedSpark.to)
                if (dateSparksUsing[dateCode].includes(usingCode)) {
                    continue
                } else {
                    dateSparksUsing[dateCode].push(usingCode)
                }

                if (block.sparksByDates[dateCode] === undefined) {
                    block.sparksByDates[dateCode] = []
                }

                block.sparksByDates[dateCode].push(placedSpark)
            }
        }

        return block
    }

    _getSimpleCombination(id) {
        return this.simpleCombinations[id]
    }

    _chooseSparkToDate(from, dateSpark) {
        const spark = this._sparkPool.getSpark(dateSpark.sparkId)
        const to = new Date(from)
        if (spark.cyclical) {
            if (spark.cycleInterval.everyMonths !== null) {
                if (spark.dateFixed) {
                    let m = to.getUTCMonth()
                    if (m % spark.cycleInterval.everyMonths !== 0) {
                        to.setUTCMonth(m + (m + 1) % spark.cycleInterval.everyMonths)
                    }
                }
                Spark.addMonths(to, spark.cycleInterval.everyMonths)
                if (spark.dateFixed) {
                    to.setUTCDate(Spark.getLastMonthDay(to))
                }
            } else if (spark.cycleInterval.everyDays !== null) {
                if (spark.dateFixed) {
                    let d = Spark.getDayOfYear(to)
                    if (d % spark.cycleInterval.everyDays !== 0) {
                        Spark.addDays(spark.cycleInterval.everyDays - d % spark.cycleInterval.everyDays)
                    }
                }
                Spark.addDays(to, spark.cycleInterval.everyDays)
            }
        } else {
            let minDuration = 1
            if (spark.minDayDuration !== null) {
                minDuration = spark.minDayDuration
            }
            Spark.addDays(to, minDuration)

            let p
            for (; to.getTime() < this.period.to.getTime(); Spark.addDays(to, 1)) {
                p = this._sparkPool.getDateWeight(to) / this._sparkPool.getSparkAmount()
                if (p < 0.89 && to.getDate() === Spark.getLastMonthDay(to)) {
                    p *= 1.11
                }
                if (Math.random() < p) break
            }
        }

        if (spark.expectedPayoutTime.workDays > 0) {
            Spark.addWorkDays(to, spark.expectedPayoutTime.workDays)
        }
        if (spark.expectedPayoutTime.days > 0) {
            Spark.addDays(to, spark.expectedPayoutTime.days)
        }
        if (spark.expectedPayoutTime.months > 0) {
            Spark.addMonths(to, spark.expectedPayoutTime.months)
        }

        return to
    }

    _addSimpleCombination(combination) {
        if (!combination.length) return

        let normComb = SimpleCombination.normalize(
            this.balance,
            this._sparkPool,
            combination
        )

        this._rememberCombinationContacts(
            this.simpleCombinations.length,
            normComb.placedSparks
        )

        this.simpleCombinations.push(normComb)
    }


    _rememberCombinationContacts(id, combination) {
        let comContacts = this._calcCombinationContacts(combination)
        for (let contact of comContacts) {
            if (this._combinationContacts[contact] === undefined) {
                this._combinationContacts[contact] = []
            }
            if (!this._combinationContacts[contact].includes(id)) {
                this._combinationContacts[contact].push(id)
            }
        }
    }

    _calcCombinationContacts(combination) {
        let contacts = []

        for (let i = -1; i < combination.length; i++) {
            let from, to
            if (i === -1) {
                from = this.period.from
                to = combination[i + 1].from

            } else if (i === combination.length - 1) {
                from = combination[i].to
                to = this.period.to
            } else {
                from = combination[i].to
                to = combination[i + 1].from
            }

            for (
                let pointerDate = new Date(from);
                pointerDate.getTime() <= to.getTime();
                Spark.addDays(pointerDate, 1)
            ) {
                contacts.push(Spark.getDateString(pointerDate))
            }
        }

        return contacts
    }
}