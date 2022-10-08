import BlockEstimator from "../Spark/BlockEstimator.js";

/**
 * Базовый класс оптимизатора блока Спарков.
 */
export default class OptimizerBase {
    /**
     * Начальный баланс.
     */
    balance
    /**
     * Период.
     */
    period
    /**
     * Пул Спарков.
     */
    pool

    /**
     * Алгоритм оптимизации.
     */
    algo
    /**
     * Блок аргументов.
     */
    block

    /**
     * Оценщик блока Спарков.
     */
    blockEstimator

    /**
     * Настройки оптимизации.
     * @type {{}}
     */
    settings = {}

    /**
     * Множество допустимых значений аргументов (Дискретный случай).
     * @type {[]}
     */
    argDomain = []

    constructor(balance, period, pool, settings) {
        this.balance = balance
        this.period = period
        this.pool = pool
        this.settings = settings

        this.blockEstimator = new BlockEstimator()
    }

    /**
     * Оптимизировать блок Спарков.
     * @param block
     */
    optimize(block) {
    }

    _setUpEstimator() {
        this.blockEstimator.setBlock(this.balance, this.period, this.block, this.pool, this.settings.optimizer.estimator)
    }

    _genArgDomain() {
        this.argDomain = []
        this._zeroficateArgDomain()
        let step = 1 / (this.blockEstimator.getMaxSparksInDate() * 1.5)
        for (let x = 0; x < 1; x += step) {
            this.argDomain.push(x)
        }
        this.argDomain.push(1)

        this._uniticateArgDomain()
    }

    _zeroficateArgDomain() {
        this.argDomain.unshift(...[...Array(this.blockEstimator.getMaxSparksInDate())].map(() => 0))
    }

    _uniticateArgDomain() {
        this.argDomain.push(...[...Array(Math.ceil(this.blockEstimator.getMaxSparksInDate() / 2))].map(() => 1))
    }

    _setBlock(block) {
        this.block = block
    }

    _genRandomDiscreteArgs() {
        let args = []
        let arg
        for (let i = 0; i < this.blockEstimator.getBlockArgsCounter(); i++) {
            arg = this._genRandDomainArg()
            args.push(arg)
        }

        return args
    }

    _genRandDomainArg() {
        return this.argDomain[Math.floor(Math.random() * this.argDomain.length)]
    }

    _discreteArg(arg) {
        switch (this.settings.optimizer.discreteArgChoice) {
            case "nearest":
                return this._nearestDiscreteArg(arg)
            case "relative":
            default:
                return this._relativeDiscreteArg(arg)
        }
    }

    _relativeDiscreteArg(arg) {
        if (arg >= 1) return this.argDomain[this.argDomain.length - 1]
        return this.argDomain[Math.floor(arg * this.argDomain.length)]
    }

    _nearestDiscreteArg(arg) {
        for (let i = 0; i < this.argDomain.length; i++) {
            if (arg <= this.argDomain[i]) {
                return this.argDomain[i]
            }
        }

        return this.argDomain[this.argDomain.length - 1]
    }

    _correctArg(arg) {
        if (arg > 1) {
            return 1
        }
        if (arg < 0) {
            return 0
        }

        return arg
    }
}