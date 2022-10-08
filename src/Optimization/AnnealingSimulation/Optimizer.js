import OptimizerBase from "../OptimizerBase.js";
import Algorithm from "./Algorithm.js";

/**
 * Оптимизатор блока спарков с помощью метода имитации отжига.
 */
export default class Optimizer extends OptimizerBase {

    /**
     * Наиболее оптимальные состояния, найденные методом.
     */
    bestStates
    /**
     * Начальное состояние.
     */
    firstState

    /**
     * @param balance
     * @param period
     * @param pool
     * @param settings
     */
    constructor(balance, period, pool, settings) {
        super(balance, period, pool, settings);

        this._bindMethods()
        this._initAnnealingSimulationAlgorithm()
    }

    optimize(block) {
        this._setBlock(block)
        this._setUpEstimator()
        this._genArgDomain()
        this._tuneAlgo()
        this._makeBestStatesSearch()

        return this.getFormattedResults()
    }


    /**
     * Получить отформатированные результаты.
     * @returns {*}
     */
    getFormattedResults() {
        return this.bestStates.map((res) => {
            let estimation = this.blockEstimator.estimate(res.state)
            return {
                args: res.state,
                estimation: estimation,
                transactions: this.blockEstimator.copyTransactions(),
                sparkUsage: Object.assign({}, this.blockEstimator.sparkUsage)
            }
        })
    }

    _initAnnealingSimulationAlgorithm() {
        this.algo = new Algorithm()
    }

    _bindMethods() {
        this._energyF = this._energyF.bind(this)
        this._getNewStateF = this._getNewStateF.bind(this)
        this._decreaseTemperatureF = this._decreaseTemperatureF.bind(this)
    }

    _genFirstState() {
        this.firstState = this._genRandomDiscreteArgs()
    }

    _energyF(algo) {
        let estimation = this.blockEstimator.estimate(algo.state)

        return (estimation === 0) ? 1 : (1 / estimation)
    }

    _getNewStateF(algo) {
        switch (this.settings.optimizer.nextStateGenerationMethod) {
            case "fastAnnealing":
                return this._genNewFastAnnealingState(algo.state, algo.temperature)
            case "random":
            default:
                return this._genRandomDiscreteArgs()
        }
    }

    _genNewFastAnnealingState(state, temperature) {
        let newState = []
        let arg
        let z
        for (let i = 0; i < state.length; i++) {
            z = this._calcZ(temperature)
            arg = state[i] + z
            arg = this._correctArg(arg)
            if (this.settings.optimizer.discreteArgs) {
                arg = this._discreteArg(arg)
            }
            newState.push(arg)
        }

        return newState
    }

    _calcZ(temperature) {
        let a = Math.random()

        return Math.sign(a - 0.5) * temperature * (Math.pow(1 + 1 / temperature, Math.abs(2 * a - 1)) - 1)
    }


    _decreaseTemperatureF(algo) {
        switch (this.settings.optimizer.nextTemperatureMethod) {
            case "boltzmann":
                return this._calcNewBoltzmannTemperature(algo.iteration)
            case "cauchy":
                return this._calcNewCauchyTemperature(algo.iteration)
            case "fastAnnealing":
                return this._calcNewFastAnnealingTemperature(algo.iteration)
            case "default":
            default:
                return this._calcNewDefaultTemperature()
        }
    }

    _calcNewBoltzmannTemperature(iteration) {
        return this.settings.algo.startTemperature / Math.log(2 + iteration)
    }

    _calcNewCauchyTemperature(iteration) {
        return this.settings.algo.startTemperature / Math.pow(iteration, 1 / this.blockEstimator.getBlockArgsCounter())
    }

    _calcNewFastAnnealingTemperature(iteration) {
        let c = (this.settings.optimizer.fastAnnealingM
            * Math.exp(
                -1 * this.settings.optimizer.fastAnnealingP / this.blockEstimator.getBlockArgsCounter()
            )
        )

        return (this.settings.algo.startTemperature
            * Math.exp(-1 * c * Math.pow(iteration, 1 / this.blockEstimator.getBlockArgsCounter()))
        )
    }

    _calcNewDefaultTemperature(temperature) {
        return (temperature - this.settings.optimizer.temperatureDecreaseStep)
    }

    _tuneAlgo() {
        this._genFirstState()
        this.algo.setParams(
            this.firstState,
            this.settings.algo.startTemperature,
            this.settings.algo.minTemperature,
            this.settings.algo.maxIterations,
            this._energyF,
            this._getNewStateF,
            this._decreaseTemperatureF
        )
    }

    _makeBestStatesSearch() {
        this.bestStates = this.algo.findBestStates(this.settings.algo.stateSearchCounter)
    }
}