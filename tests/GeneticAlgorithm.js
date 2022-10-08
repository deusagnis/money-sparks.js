import Algorithm from "../src/Optimization/Genetic/Algorithm.js";

let algo = new Algorithm(32, 0.667, 0.01, 32)

let result = algo.findBestGenotypes(
    3,
    3,
    [0, 1, 2, 3, 4, 5, 6, 7],
    (genotype) => genotype.reduce((accum, gen) => accum + gen, 0),
    (...genotypes) => {
        let childGenotype = []
        for (let i = 0; i < 3; i++) {
            let gens = []
            for (let genotype of genotypes) {
                gens.push(genotype[i])
            }
            let gen = gens[Math.floor(Math.random() * 100 % 2)]
            childGenotype.push(gen)
        }

        return childGenotype
    },
    (genotype) => {
        if (genotype[0 !== 7]) {
            genotype[0]++
        }
    }
)
console.log(result)