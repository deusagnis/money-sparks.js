import Pool from "./Spark/Pool.js";
import Combinator from "./Spark/Combinator.js";
import GeneticOptimizer from "./Optimization/Genetic/Optimizer.js";
import AnnealingOptimizer from "./Optimization/AnnealingSimulation/Optimizer.js"

/**
 * Распределение финансовых инструментов во времени.
 */
export default class MoneySparks {
    /**
     * Стартовый капитал.
     * @type {number}
     */
    startMoney = 0

    /**
     * Период рассчёта использования средств.
     * @type {{from: Date, to: Date}}
     */
    period = {
        from: new Date,
        to: new Date,
    }

    settings = {}

    blockTypes = ["groupBlocks", "commonBlock"]

    /**
     *
     * @private
     * @type Pool
     */
    _sparkPool
    /**
     *
     * @private
     * @type Combinator
     */
    _sparkCombinator

    _optimizationUnits = {}

    _optimizationResults = {}


    /**
     * Инициализируем MoneySparks.
     * @param money
     * @param sparks
     * @param from
     * @param to
     * @param settings
     */
    constructor(money, sparks, from, to, settings = {}) {
        this._setStartMoney(money)
        this._setPeriod(from, to)
        this._createSparkPool(sparks)
        this._setUp(settings)
        this._createSparkCombinator()
        this._createOptimizers()
    }

    /**
     * Вычислить оптимальные варианты размещения Спарков.
     * @returns {{}}
     */
    evaluate() {
        this._sparkPool.analyzeSparks()
        this._sparkCombinator.combine()
        this._makeOptimization()

        return this._getFormattedCommonResults()
    }

    _setStartMoney(money) {
        this.startMoney = money
    }

    _setPeriod(from, to) {
        this.period = {
            from,
            to
        }
    }

    _createSparkPool(sparks) {
        this._sparkPool = new Pool(this.period)

        for (let spark of sparks) {
            this._sparkPool.addSpark(spark)
        }
    }

    _setUp(settings) {
        this.settings = settings
    }

    _createSparkCombinator() {
        this._sparkCombinator = new Combinator(
            this.startMoney, this.period, this._sparkPool
        )
    }

    _createOptimizers() {
        this._optimizationUnits = {}

        for (let blockType of this.blockTypes) {
            if (this.settings[blockType].optimizers.includes("genetic")) {
                this._addOptimizationUnit(
                    blockType,
                    blockType + '_genetic',
                    new GeneticOptimizer(this.startMoney, this.period, this._sparkPool, this.settings[blockType].genetic)
                )
            }

            if (this.settings[blockType].optimizers.includes("annealing")) {
                this._addOptimizationUnit(
                    blockType,
                    blockType + '_annealing',
                    new AnnealingOptimizer(this.startMoney, this.period, this._sparkPool, this.settings[blockType].annealing)
                )
            }
        }
    }

    _addOptimizationUnit(type, name, optimizer) {
        if (this._optimizationUnits[type] === undefined) {
            this._optimizationUnits[type] = [];
        }

        this._optimizationUnits[type].push({
            name,
            optimizer
        })
    }

    _makeOptimization() {
        for (let unitBlockType in this._optimizationUnits) {
            if (unitBlockType === this.blockTypes[0]) {
                this._makeGroupOptimization(this._optimizationUnits[unitBlockType]);
            }
            if (unitBlockType === this.blockTypes[1]) {
                this._makeCommonOptimization(this._optimizationUnits[unitBlockType])
            }
        }
    }

    _makeGroupOptimization(optimizationUnits) {
        this._optimizationResults[this.blockTypes[0]] = []

        for (let optimizationUnit of optimizationUnits) {
            for (let combinationBlock of this._sparkCombinator.combinationBlocks) {
                this._addOptimizationResult(
                    this.blockTypes[0],
                    optimizationUnit,
                    optimizationUnit.optimizer.optimize(combinationBlock)
                )
            }

        }
    }

    _makeCommonOptimization(optimizationUnits) {
        this._optimizationResults[this.blockTypes[1]] = []

        for (let optimizationUnit of optimizationUnits) {
            this._addOptimizationResult(
                this.blockTypes[1],
                optimizationUnit,
                optimizationUnit.optimizer.optimize(this._sparkCombinator.commonBlock)
            )
        }
    }

    _addOptimizationResult(type, optimizationUnit, result) {
        this._optimizationResults[type].push({
            name: optimizationUnit.name,
            top: result
        })
    }

    _getFormattedCommonResults() {
        return this._optimizationResults
    }

}