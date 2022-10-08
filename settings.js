/**
 * Пример блока настроек.
 */
export default {
    moneySparks: {
        /**
         * Настройки для оптимизации групповых блоков Спарков.
         */
        groupBlocks: {
            /**
             * Используемы оптимизаторы: "genetic", "annealing".
             */
            optimizers: ["genetic"],
            /**
             * Настройки оптимизации с помощью генетического алгоритма.
             */
            genetic: {
                /**
                 * Настройки генетического алгоритма.
                 */
                algo: {
                    /**
                     * Сколько выбирать наиболее приспособленных генотипов при поиске.
                     */
                    genotypeSearchCounter: 3,
                    /**
                     * Размер популяции.
                     */
                    populationSize: 1024,
                    /**
                     * Доля выживиших генотипов при естественном отборе.
                     */
                    selectionRate: 0.66,
                    /**
                     * Вероятность мутации генотипа.
                     */
                    mutationProbability: 0.01,
                    /**
                     * Максимальное количество жизненных циклов.
                     */
                    maxLifecycles: 32,
                },
                /**
                 * Настройки оптимизатора.
                 */
                optimizer: {
                    /**
                     * Настройки оценщика блока Спарков.
                     */
                    estimator: {
                        /**
                         * Применять ли обязательные Спарки при оценке.
                         */
                        applyRequiredSparks: true,
                        /**
                         * Начиная с какой доли считать значение истиной.
                         * Применяется при определении того, использовать ли Спарк без баланса.
                         */
                        trueBalanceRateBorder: 0.7,
                    },
                    /**
                     * Способ выбора дискретного аргумента: "nearest" | "relative".
                     */
                    discreteArgChoice: "relative",
                    /**
                     * Выбор способа мутации генотипа: "randomize" | "invert".
                     */
                    mutationType: "randomize",
                },
            },
            /**
             * Настройки оптимизации с помощью метода имитации отжига.
             */
            annealing: {
                /**
                 * Настройки метода имитации отжига.
                 */
                algo: {
                    /**
                     * Количество выбираемых состояний с наименьшей энергией при поиске.
                     */
                    stateSearchCounter: 3,
                    /**
                     * Начальная температура системы.
                     */
                    startTemperature: 110,
                    /**
                     * Минимальная температура.
                     */
                    minTemperature: 1,
                    /**
                     * Максимальное количество итераций.
                     */
                    maxIterations: 50_0,
                },
                /**
                 * Настройки оптимизатора.
                 */
                optimizer: {
                    /**
                     * Дискретизировать ли аргументы.
                     */
                    discreteArgs: true,
                    /**
                     * Настройки оценщика блока Спарков.
                     */
                    estimator: {
                        applyRequiredSparks: true,
                        trueBalanceRateBorder: 0.77,
                    },
                    // nearest | relative
                    discreteArgChoice: "relative",
                    /**
                     * Способ создания нового состояния системы: "fastAnnealing" | "random".
                     */
                    nextStateGenerationMethod: "random",
                    /**
                     * Параметр "m" при быстром отжиге.
                     */
                    fastAnnealingM: 0.2,
                    /**
                     * Параметр "p" при быстром отжиге.
                     */
                    fastAnnealingP: 0.3,
                    /**
                     * Способ выбора следующей температуры: "boltzmann" | "fastAnnealing" | "cauchy" | "default".
                     */
                    nextTemperatureMethod: "boltzmann",
                    /**
                     * Шаг понижения температуры при методе выбора следующей температуры по умолчанию.
                     */
                    temperatureDecreaseStep: 1,
                },
            },
        },
        /**
         * Настройки для оптимизации общего блока Спарков.
         */
        commonBlock: {
            // genetic, annealing
            optimizers: ["annealing"],
            genetic: {
                algo: {
                    genotypeSearchCounter: 3,
                    populationSize: 1024,
                    selectionRate: 0.66,
                    mutationProbability: 0.01,
                    maxLifecycles: 64,
                },
                optimizer: {
                    estimator: {
                        applyRequiredSparks: true,
                        trueBalanceRateBorder: 0.7,
                    },
                    // nearest | relative
                    discreteArgChoice: "relative",
                    // randomize | invert
                    mutationType: "randomize",
                },
            },
            annealing: {
                algo: {
                    stateSearchCounter: 3,
                    startTemperature: 110,
                    minTemperature: 1,
                    maxIterations: 50_0,
                },
                optimizer: {
                    discreteArgs: true,
                    estimator: {
                        applyRequiredSparks: true,
                        trueBalanceRateBorder: 0.77,
                    },
                    // nearest | relative
                    discreteArgChoice: "relative",
                    // fastAnnealing | random
                    nextStateGenerationMethod: "random",
                    fastAnnealingM: 0.2,
                    fastAnnealingP: 0.3,
                    // boltzmann | fastAnnealing | cauchy | default
                    nextTemperatureMethod: "boltzmann",
                    temperatureDecreaseStep: 1,
                },
            }
        },
    },
}