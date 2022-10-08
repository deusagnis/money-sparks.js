/**
 * Spark - подразумевает некоторый метод или инструмент взаимодействия с денежными или иными ресурсами.
 */
export default class Spark {
    /**
     * Название.
     * @type {string}
     */
    name = "Spark"
    /**
     * Описание.
     * @type {string}
     */
    description = "Shining in flash."
    /**
     * Число [0; 1], выражающая степень риска - чем меньше, тем лучше.
     * @type {number}
     */
    risk = 0.01
    /**
     * Минимальная сумма вложений.
     * @type {number}
     */
    minBalance = 0
    /**
     * Максимальная сумма вложений. -1: ограничений нет; 0: отсутствие первичного пополнения.
     * @type {number}
     */
    maxBalance = -1
    /**
     * Функция, вычисляющая предполагаемую прибыль по датам.
     */
    flashFunc = (balance, period) => []
    /**
     * Функция, вычисляющая предполагаемые издержки по датам.
     */
    flashCostFunc = (balance, period) => []

    /**
     * Является ли Спарк цикличным в течение года (Повторяющимся с периодом).
     * @type {boolean}
     */
    cyclical = false
    /**
     * Период повторения цикличного Спарка.
     */
    cycleInterval = {
        everyMonths: null,
        everyDays: null
    }
    /**
     * Минимальное количество дней, в течение которых действует Спарк.
     * @type {null}
     */
    minDayDuration = null
    /**
     * Считать ли спарк реинвестируемым (Прибыль выводится в последний срок).
     * @type {boolean}
     */
    reinvestment = false

    /**
     * Является ли спарк привязынным к определенным датам.
     * @type {boolean}
     */
    dateFixed = false

    /**
     * Даты оптимального начала применения Спарка.
     * @type {{months: [], monthDays: [], dates: []}}
     */
    optimalFrom = {
        dates: [],
        monthDays: [],
        months: [],
    }
    /**
     * Даты возможного начала применения Спарка.
     * @type {{months: [], monthDays: [], dates: []}}
     */
    possibleFrom = {
        dates: [],
        monthDays: [],
        months: [],
    }
    /**
     * Ожидаемое время вывода средств.
     * @type {{months: number, workDays: number, days: number}}
     */
    expectedPayoutTime = {
        workDays: 0,
        days: 0,
        months: 0
    }

    /**
     * Обязательный к применению Спарк.
     * @type {boolean}
     */
    required = false
    /**
     * День оплаты чего-либо.
     * @type {null}
     */
    payMonthDay = null


    /**
     * Создать объект транзакции.
     * @param date
     * @param amount
     * @param desc
     * @returns {{date, amount, desc: string}}
     */
    static createTransaction(date, amount, desc = "") {
        return {
            date,
            amount,
            desc
        }
    }

    /**
     * Добавить к Date рабочие дни.
     * @param date
     * @param count
     * @param holiday
     * @returns {*}
     */
    static addWorkDays(date, count = 1, holiday = [6, 0]) {
        for (let i = 0; i < count;) {
            date.setTime(date.getTime() + 24 * 60 * 60 * 1000)
            if (!holiday.includes(date.getUTCDay())) {
                i++;
            }
        }

        return date
    }

    /**
     * Посчитать количество дней между двумя датами.
     * @param d1
     * @param d2
     * @returns {number}
     */
    static getDaysBetween(d1, d2) {
        return Math.round(Math.abs(d1.getTime() - d2.getTime()) / (24 * 60 * 60 * 1000))
    }

    /**
     * Получить последний день месяца для Date.
     * @param date
     * @returns {number|number}
     */
    static getLastMonthDay(date) {
        let m = date.getUTCMonth()
        if (m === 1) {
            return (date.getUTCFullYear() % 4 === 0) ? 29 : 28
        }

        if (m % 7 % 2 === 0) {
            return 31
        }

        return 30
    }

    /**
     * Получить номер дня в году для Date.
     * @param date
     * @returns {number}
     */
    static getDayOfYear(date) {
        let dayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        let m = date.getUTCMonth();
        let d = date.getUTCDate();
        let dayOfYear = dayCount[m] + d;
        if (m > 1 && date.getUTCFullYear() % 4 === 0) dayOfYear++;

        return dayOfYear
    }

    /**
     * Получить строковый код Date.
     * @param date
     * @returns {string}
     */
    static getDateString(date) {
        return date.toISOString().substring(0, 10)
    }

    /**
     * Добавить дни к Date.
     * @param date
     * @param count
     * @returns {*}
     */
    static addDays(date, count = 1) {
        date.setTime(date.getTime() + count * 24 * 60 * 60 * 1000)

        return date
    }

    /**
     * Добавить месяцы к Date.
     * @param date
     * @param count
     * @returns {*}
     */
    static addMonths(date, count = 1) {
        let dateDay = date.getUTCDate()

        date.setUTCDate(15)
        date.setUTCMonth(date.getUTCMonth() + count)

        let lastMonthDay = this.getLastMonthDay(date)

        if (dateDay > lastMonthDay) {
            date.setUTCDate(lastMonthDay)
        } else {
            date.setUTCDate(dateDay)
        }

        return date
    }
}