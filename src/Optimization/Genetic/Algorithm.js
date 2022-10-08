/**
 * Реализация генетического алгоритма.
 */
export default class Algorithm {
    /**
     * Размер популяции.
     */
    populationSize
    /**
     * Доля выживших при естественном отборе [0; 1].
     */
    selectionRate
    /**
     * Вероятность мутации.
     */
    mutationProbability
    /**
     * Максимальное количество жизненных циклов.
     */
    maxLifecycles

    /**
     * Длина генотипа.
     */
    genotypeLength
    /**
     * Геном.
     */
    genome

    /**
     * Функция вычисления значения приспособленности.
     */
    fitnessFunc
    /**
     * Функция скрещивания.
     */
    crossingFunc
    /**
     * Функция мутации генотипа.
     */
    mutationFunc

    _findGenotypeCount
    _population = []
    _lifecycle
    _parents = []

    constructor(
        populationSize = 64,
        selectionRate = 0.667,
        mutationProbability = 0.001,
        maxLifecycles = 512
    ) {
        this.populationSize = populationSize
        this.selectionRate = selectionRate
        this.mutationProbability = mutationProbability
        this.maxLifecycles = maxLifecycles
    }

    /**
     * Найти наиболее приспособленные генотипы.
     * @param count
     * @param genotypeLength
     * @param genome
     * @param fitnessFunc
     * @param crossingFunc
     * @param mutationFunc
     * @returns {*[]}
     */
    findBestGenotypes(
        count,
        genotypeLength,
        genome,
        fitnessFunc,
        crossingFunc,
        mutationFunc
    ) {
        this._findGenotypeCount = count
        this.genotypeLength = genotypeLength
        this.genome = genome
        this.fitnessFunc = fitnessFunc
        this.crossingFunc = crossingFunc
        this.mutationFunc = mutationFunc

        this._genFirstPopulation()
        this._evolution()

        return this._chooseBestGenotypes()
    }

    _genFirstPopulation() {
        this._population = []
        for (let i = 0; i < this.populationSize; i++) {
            let genotype = this._createRandomGenotype()
            this._population.push(this._makeIndividual(genotype))
        }
    }

    _createRandomGenotype() {
        let genotype = []
        for (let j = 0; j < this.genotypeLength; j++) {
            genotype.push(this._getRandGen())
        }

        return genotype
    }

    _getRandGen() {
        return this.genome[Math.floor(Math.random() * this.genome.length)]
    }

    _makeIndividual(genotype) {
        return {
            genotype,
            fitness: this.fitnessFunc(genotype)
        }
    }

    _evolution() {
        this._lifecycle = 0
        while (this._continueEvolution()) {
            this._fitness()
            this._evolve()
            this._lifecycle++
        }
        this._fitness()
    }

    _continueEvolution() {
        if (this._lifecycle >= this.maxLifecycles) {
            return false
        }

        return true
    }

    _evolve() {
        this._select()
        this._cross()
    }

    _select() {
        this._population.splice(
            0,
            Math.floor(this._population.length * (1 - this.selectionRate))
        )
    }

    _cross() {
        this._groupParents()
        this._makeChildren()
    }

    _groupParents() {
        this._parents = []

        let parentRow = this._population
            .map((_, index) => index)
            .sort((a, b) => Math.random() - 0.5)
        if (parentRow.length % 2 === 1) {
            parentRow.shift()
        }
        if (parentRow.length === 0) return

        for (let i = 0; i < parentRow.length; i += 2) {
            let parents = parentRow.slice(i, i + 2)
            this._parents.push(parents)
        }
    }

    _makeChildren() {
        for (let parents of this._parents) {
            let childGenotype = this._makeChildGenotype(parents)
            this._provideMutation(childGenotype)
            this._population.push(this._makeIndividual(childGenotype))
        }
    }

    _makeChildGenotype(parents) {
        let parentGenotypes = parents.map(
            (individualIndex) => this._population[individualIndex].genotype
        )
        return this.crossingFunc(...parentGenotypes)
    }

    _provideMutation(genotype) {
        if (Math.random() <= this.mutationProbability) {
            this.mutationFunc(genotype)
        }
    }

    _fitness() {
        this._population.sort((i1, i2) => {
            return i1.fitness - i2.fitness
        })
    }

    _chooseBestGenotypes() {
        return this._population.slice(-1 * this._findGenotypeCount)
    }
}