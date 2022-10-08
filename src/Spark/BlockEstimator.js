import Estimator from "./Estimator.js";
import Spark from "./Spark.js";

/**
 * Оценщик блока Спарков.
 */
export default class BlockEstimator {
    /**
     * Период оценки.
     */
    period
    /**
     * Пул Спарков.
     */
    sparkPool
    /**
     * Доступный баланс.
     */
    balance
    /**
     * Блок Спарков.
     */
    sparkBlock

    /**
     * Настройки оценки.
     * @type {{applyRequiredSparks: boolean, trueBalanceRateBorder: number}}
     */
    settings = {
        applyRequiredSparks: false,
        trueBalanceRateBorder: 0.7,
    }

    /**
     * Блок аргументов для Спарков.
     */
    blockArgs

    /**
     * Активные спарки.
     * @type {{}}
     */
    activeSparks = {}
    /**
     * Использование Спарков.
     * @type {{}}
     */
    sparkUsage = {}
    /**
     * Выплаты.
     * @type {{}}
     */
    payments = {}
    /**
     * Оплаты.
     * @type {{}}
     */
    payouts = {}

    _requiredSparkIds
    _blockArgsCounter = 0
    _maxSparksInDate = 0

    _maxDateBalanceRateSum = 1

    _curArgsIndex = 0
    _curDate
    _curBalance
    _curPlacedSparks
    _prevBalanceRateSum
    _curBalanceRateSum
    _curBalanceRate
    _curSpark
    _curSparkBalance

    setBlock(balance, period, block, sparkPool, settings) {
        this.period = period
        this.sparkPool = sparkPool
        this.balance = balance
        this.sparkBlock = block
        this.settings = settings

        if (this.settings.applyRequiredSparks) {
            this._detectRequiredSparksIds()
        }

        this._calcBlockArgs()
    }

    getBlockArgsCounter() {
        return this._blockArgsCounter
    }

    getMaxSparksInDate() {
        return this._maxSparksInDate
    }

    estimate(blockArgs) {
        this._setBlockArgs(blockArgs)
        this._zeroCurArgsIndex()
        this._initActiveSparks()
        this._initSparkUsage()
        this._initTransactions()
        if (this.settings.applyRequiredSparks) {
            this._applyRequiredSparks()
        }

        this._handleSparkBlockDates()

        return this._calcBalance(this.period.to)
    }

    copyTransactions() {
        return {
            payments: Object.assign({}, this.payments),
            payouts: Object.assign({}, this.payouts)
        }
    }

    _setBlockArgs(args) {
        this.blockArgs = args
    }

    _initActiveSparks() {
        this.activeSparks = {}
    }

    _initSparkUsage() {
        this.sparkUsage = {}
    }

    _initTransactions() {
        this.payouts = {}
        this.payments = {}

        this._addBalanceTransaction()
    }

    _applyRequiredSparks() {
        for (let requiredSparkId of this._requiredSparkIds) {
            let requiredSpark = this.sparkPool.getSpark(requiredSparkId)
            let estimation = Estimator.estimateSpark(
                requiredSpark,
                0,
                this.period.from,
                this.period.to
            )
            this._provideTransactions(requiredSparkId, estimation)
        }
    }

    _addBalanceTransaction() {
        let dateCode = Spark.getDateString(this.period.from)
        let payment = this._createIdentifiedTransaction(
            -1,
            Spark.createTransaction(this.period.from, this.balance, "Начальный баланс")
        )

        if (this.payments[dateCode] === undefined) {
            this.payments[dateCode] = []
        }

        this.payments[dateCode].push(payment)
    }

    _handleSparkBlockDates() {
        for (let time of this.sparkBlock.dates) {
            this._handleSparkBlockDate(time)
        }
    }

    _handleSparkBlockDate(time) {
        this._changeCurDate(time)
        this._provideCurBalance()
        this._zeroBalanceRateSum()
        this._changeCurPlacedSparks()

        for (let placedSpark of this._curPlacedSparks) {
            this._handlePlacesSpark(placedSpark)
        }
    }

    _handlePlacesSpark(placedSpark) {
        this._changeCurBalanceRate()
        this._changeCurSpark(placedSpark)
        this._rememberBalanceRateSum()

        if (this._zeroBalanceSpark() && !this._boolBalanceRate()) {
            this._incCurArgsIndex()
            return
        }
        if (this._zeroBalanceSpark() && this._boolBalanceRate()) {
            this._zeroBalanceRate()
        }

        this._provideCurSparkBalance()

        if (this._sparkAppropriate(placedSpark)) {
            this._activateSpark(placedSpark)
            this._applySpark(placedSpark)
        } else {
            this._resetBalanceRateSum()
        }
        this._incCurArgsIndex()
    }

    _zeroCurArgsIndex() {
        this._curArgsIndex = 0
    }

    _changeCurDate(time) {
        this._curDate = new Date(time)
    }

    _provideCurBalance() {
        this._curBalance = this._calcBalance(this._curDate)
        if (this._curBalance < 0) this._curBalance = 0
    }

    _zeroBalanceRate() {
        this._curBalanceRate = 0
    }

    _zeroBalanceRateSum() {
        this._curBalanceRateSum = 0
    }

    _changeCurPlacedSparks() {
        this._curPlacedSparks = this.sparkBlock.sparksByDates[Spark.getDateString(this._curDate)]
    }

    _changeCurBalanceRate() {
        this._curBalanceRate = this.blockArgs[this._curArgsIndex]
    }

    _changeCurSpark(placedSpark) {
        this._curSpark = this.sparkPool.getSpark(placedSpark.dateSpark.sparkId)
    }

    _boolBalanceRate() {
        return this._curBalanceRate >= this.settings.trueBalanceRateBorder;
    }

    _provideCurSparkBalance() {
        this._curBalanceRateSum += this._curBalanceRate

        if (this._curBalanceRateSum > this._maxDateBalanceRateSum) {
            this._curBalanceRate -= this._curBalanceRateSum - this._maxDateBalanceRateSum
            this._curBalanceRateSum = this._maxDateBalanceRateSum
        }

        this._curSparkBalance = this._curBalance * this._curBalanceRate
        if (this._curSparkBalance > this._curSpark.maxBalance && this._curSpark.maxBalance !== -1) {
            this._curSparkBalance = this._curSpark.maxBalance
        }
        if (this._curSparkBalance < this._curSpark.minBalance) {
            this._curBalanceRateSum = this._prevBalanceRateSum
        }
    }

    _applySpark(placedSpark) {
        let estimation = Estimator.estimateSpark(
            this._curSpark,
            this._curSparkBalance,
            placedSpark.from,
            placedSpark.to
        )

        this._provideSparkUsage(placedSpark, estimation)

        this._provideTransactions(
            placedSpark.dateSpark.sparkId,
            estimation
        )
    }

    _provideSparkUsage(placedSpark, estimation) {
        let dateCode = Spark.getDateString(placedSpark.from)
        if (this.sparkUsage[dateCode] === undefined) this.sparkUsage[dateCode] = []

        this.sparkUsage[dateCode].push(this._createEstimatedSpark(placedSpark, estimation))
    }

    _createEstimatedSpark(placedSpark, estimation) {
        return {
            placedSpark,
            balance: this._curSparkBalance,
            estimation
        }
    }

    _incCurArgsIndex() {
        this._curArgsIndex++
    }

    _sparkAppropriate(placedSpark) {
        return (this._curBalanceRate > 0 || this._zeroBalanceSpark()) && this._sparkNotActive(placedSpark)
    }

    _zeroBalanceSpark() {
        return this._curSpark.maxBalance === 0
    }

    _rememberBalanceRateSum() {
        this._prevBalanceRateSum = this._curBalanceRateSum
    }

    _resetBalanceRateSum() {
        this._curBalanceRateSum = this._prevBalanceRateSum
    }

    _sparkNotActive(placedSpark) {
        let active = this.activeSparks[placedSpark.dateSpark.sparkId]
        if (active !== undefined) {
            if (active.to.getTime() > placedSpark.from.getTime()) {
                return false
            }
        }

        return true
    }

    _activateSpark(placedSpark) {
        this.activeSparks[placedSpark.dateSpark.sparkId] = {
            from: placedSpark.from,
            to: placedSpark.to
        }
    }

    _provideTransactions(sparkId, estimation) {
        for (let payment of estimation.payments) {
            let dateCode = Spark.getDateString(payment.date)
            if (this.payments[dateCode] === undefined) {
                this.payments[dateCode] = []
            }
            this.payments[dateCode].push(this._createIdentifiedTransaction(
                sparkId, payment
            ))
        }
        for (let payout of estimation.payouts) {
            let dateCode = Spark.getDateString(payout.date)
            if (this.payouts[dateCode] === undefined) {
                this.payouts[dateCode] = []
            }
            this.payouts[dateCode].push(this._createIdentifiedTransaction(
                sparkId, payout
            ))
        }
    }

    _createIdentifiedTransaction(sparkId, transaction) {
        return Object.assign({sparkId}, transaction)
    }

    _detectRequiredSparksIds() {
        this._requiredSparkIds = this.sparkPool.getRequiredSparks()
    }

    _calcBlockArgs() {
        this._blockArgsCounter = 0
        this._maxSparksInDate = 0
        for (let dateCode in this.sparkBlock.sparksByDates) {
            this._blockArgsCounter += this.sparkBlock.sparksByDates[dateCode].length
            if (this.sparkBlock.sparksByDates[dateCode].length > this._maxSparksInDate) {
                this._maxSparksInDate = this.sparkBlock.sparksByDates[dateCode].length
            }
        }
    }

    _calcBalance(until) {
        let balance = 0
        for (
            let pointerDate = new Date(this.period.from);
            pointerDate.getTime() <= until.getTime();
            Spark.addDays(pointerDate, 1)
        ) {
            let dateCode = Spark.getDateString(pointerDate)
            if (this.payments[dateCode] !== undefined) {
                balance += this.payments[dateCode].reduce((sum, payment) => (sum + payment.amount), 0)
            }

            if (this.payouts[dateCode] !== undefined) {
                balance -= this.payouts[dateCode].reduce((sum, payout) => (sum + payout.amount), 0)
            }
        }

        return balance
    }
}