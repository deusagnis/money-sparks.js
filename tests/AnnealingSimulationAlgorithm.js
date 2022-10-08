import Algorithm from "../src/Optimization/AnnealingSimulation/Algorithm.js";

let algo = new Algorithm()
algo.setParams(
    [6, 1, 2],
    100,
    0,
    (state) => 1 / state.reduce((accum, val) => accum + val, 0),
    (algo) => {
        let newState = algo.state.slice(0)
        newState[Math.floor(Math.random() * algo.state.length)] = Math.floor(Math.random() * 8)

        return newState
    },
    (algo) => (algo.temperature - 1),
)

let result = algo.findBestStates(3)

console.log(result)
console.log(algo.stateNotes)