/**
 * Реализация метода имитации отжига.
 */
export default class Algorithm {

    /**
     * Функция получения новой температуры системы.
     */
    decreaseTemperatureF
    /**
     * Функция для получения нового(претендента) состояния.
     */
    genNewStateF
    /**
     * Функция вычисления значения энергии для текущего состояния.
     */
    energyF


    /**
     * Максимальное количество итераций.
     */
    maxIterations
    /**
     * Минимальная температура системы.
     */
    minTemperature

    /**
     * История изменения температуры.
     */
    temperatures = []
    /**
     * История состояний.
     */
    stateNotes = []

    /**
     * Значение температуры.
     */
    temperature
    /**
     * Текущее значение энергии системы.
     */
    energy
    /**
     * Значение энергии системы для состояния-претендента.
     */
    challengerEnergy
    /**
     * Разница энергии между текущим состоянием и состоянием претендента.
     */
    energyDelta
    /**
     * Предыдущее значение энергии системы.
     */
    prevEnergy
    /**
     * Вероятность смены состояния.
     */
    stateMovementProbability

    /**
     * Текущее состояние.
     */
    state
    /**
     * Состояние-претендент.
     */
    stateChallenger


    /**
     * Текущая итерация.
     */
    iteration

    /**
     * Установить основные параметры метода.
     * @param state
     * @param temperature
     * @param minTemperature
     * @param maxIterations
     * @param energyF
     * @param genNewStateF
     * @param decreaseTemperatureF
     */
    setParams(state, temperature, minTemperature, maxIterations, energyF, genNewStateF, decreaseTemperatureF) {
        this.energyF = energyF

        this.state = state
        this.genNewStateF = genNewStateF

        this.temperature = temperature
        this.minTemperature = minTemperature
        this.maxIterations = maxIterations
        this.decreaseTemperatureF = decreaseTemperatureF
    }

    /**
     * Найти несколько наилучших состояний системы.
     * @param count
     * @returns {*[]}
     */
    findBestStates(count) {
        this._initParams()
        this._calcEnergy()

        while (this._annealingContinue()) {
            this._anneal()
            this._incIteration()
        }

        return this._chooseLowestEnergyStates(count)
    }

    _initParams() {
        this.prevEnergy = null
        this.stateNotes = []
        this.temperatures = []
        this.iteration = 1
    }

    _calcEnergy() {
        this.energy = this.energyF(this)
    }

    _anneal() {
        this._calcStateChallenger()
        this._calcChallengerEnergy()
        this._calcEnergyDelta()
        if (this._energyDecreased()) {
            this._makeStateMovement()
        } else {
            this._calcStateMovementProbability()
            if (this._stateMovementAllowed()) {
                this._makeStateMovement()
            }
        }

        this._makeTemperatureDecreasing()
    }

    _incIteration() {
        this.iteration++
    }

    _annealingContinue() {
        return (this.temperature > this.minTemperature && this.iteration < this.maxIterations)
    }

    _calcStateChallenger() {
        this.stateChallenger = this.genNewStateF(this)
    }

    _calcChallengerEnergy() {
        this.challengerEnergy = this.energyF(this)
    }

    _calcEnergyDelta() {
        this.energyDelta = this.challengerEnergy - this.energy
    }

    _energyDecreased() {
        return this.energyDelta <= 0
    }

    _makeStateMovement() {
        this._moveToNewState()
        this._rememberState()
    }

    _moveToNewState() {
        this.state = this.stateChallenger
        this.energy = this.challengerEnergy
    }

    _rememberState() {
        this.stateNotes.push(this._createStateNote())
    }

    _createStateNote() {
        return {
            state: this.state.slice(0),
            energy: this.energy
        }
    }

    _calcStateMovementProbability() {
        this.stateMovementProbability = 1 - Math.exp(-1 * this.energyDelta / this.temperature)
    }

    _stateMovementAllowed() {
        return Math.random() <= this.stateMovementProbability
    }

    _makeTemperatureDecreasing() {
        this._decreaseTemperature()
        this._rememberTemperature()
    }

    _decreaseTemperature() {
        this.temperature = this.decreaseTemperatureF(this)
    }

    _rememberTemperature() {
        this.temperatures.push(this.temperature)
    }

    _chooseLowestEnergyStates(count) {
        return this._getSortedStates().slice(0, count)
    }

    _getSortedStates() {
        return this.stateNotes.slice(0).sort((s1, s2) => s2.energy - s1.energy)
    }

}