import Algorithm from "./Algorithm.js";
import OptimizerBase from "../OptimizerBase.js";

/**
 * Оптимизатор блока спарков с помощью генетического алгоритма.
 */
export default class Optimizer extends OptimizerBase {
    bestGenotypes
    genotypeLength

    _genome

    constructor(balance, period, pool, settings) {
        super(balance, period, pool, settings);

        this._bindMethods()
    }

    optimize(block) {
        this._initGeneticAlgo()
        this._setBlock(block)
        this._setUpEstimator()
        this._genArgDomain()
        this._createGenome()
        this._calcGenotypeLength()
        this._makeBestGenotypesSearch()

        return this.getFormattedResults()
    }

    getFormattedResults() {
        return this.bestGenotypes.map((res) => {
            this.blockEstimator.estimate(res.genotype)
            return {
                args: res.genotype,
                estimation: res.fitness,
                transactions: this.blockEstimator.copyTransactions(),
                sparkUsage: Object.assign({}, this.blockEstimator.sparkUsage)
            }
        })
    }


    _bindMethods() {
        this._cross = this._cross.bind(this)
        this._fitness = this._fitness.bind(this)
        this._mutate = this._mutate.bind(this)
    }

    _initGeneticAlgo() {
        this.algo = new Algorithm(
            this.settings.algo.populationSize,
            this.settings.algo.selectionRate,
            this.settings.algo.mutationProbability,
            this.settings.algo.maxLifecycles
        )
    }

    _createGenome() {
        this._genome = this.argDomain
    }

    _calcGenotypeLength() {
        this.genotypeLength = this.blockEstimator.getBlockArgsCounter()
    }

    _makeBestGenotypesSearch() {
        this.bestGenotypes = this.algo.findBestGenotypes(
            this.settings.algo.genotypeSearchCounter,
            this.genotypeLength,
            this._genome,
            this._fitness,
            this._cross,
            this._mutate
        )
    }

    _fitness(genotype) {
        return this.blockEstimator.estimate(genotype)
    }

    _cross(...parentGenotypes) {
        let parentCount = parentGenotypes.length
        let childGenotype = []

        for (let gI = 0; gI < this.genotypeLength; gI++) {
            let parentIndex = Math.floor(Math.random() * parentCount)
            childGenotype.push(parentGenotypes[parentIndex][gI])
        }

        return childGenotype
    }

    _mutate(genotype) {
        switch (this.settings.optimizer.mutationType) {
            case "invert":
                this._invertSomeArg(genotype)
                break
            case "randomize":
            default:
                this._randomizeSomeArg(genotype)
                break
        }
    }

    _randomizeSomeArg(genotype) {
        let genotypeIndex = Math.ceil(Math.random() * genotype.length)
        let genomeIndex = Math.ceil(Math.random() * this._genome.length)

        genotype[genotypeIndex] = this._genome[genomeIndex]
    }

    _invertSomeArg(genotype) {
        let genotypeIndex = Math.ceil(Math.random() * genotype.length)

        genotype[genotypeIndex] = 1 - genotype[genotypeIndex]
    }

}