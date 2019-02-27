const Telegraf = require('telegraf')
const log4js = require('log4js')
const mongoAppender = require('log4js-node-mongodb')
const startMiddleware = require('./middlewares/start')
const helpMiddleware = require('./middlewares/help')
const busStopMiddleware = require('./middlewares/busStop')

let mongodbURI = process.env.NODE_ENV === 'prod' || process.env.NODE_ENV === 'production' ? process.env.MONGODB_URI : 'localhost:27017/bus_lviv_bot'

log4js.addAppender(
  mongoAppender.appender({
    connectionString: mongodbURI
  }),
  'bus_lviv_bot_logger'
)
let mongoLogger = log4js.getLogger('bus_lviv_bot_logger')

const bot = new Telegraf(process.env.BOT_TOKEN)

const logzioLogger = require('logzio-nodejs').createLogger({
  token: process.env.LOGZIO_TOKEN,
  host: 'listener.logz.io',
  type: process.env.NODE_ENV === 'prod' || process.env.NODE_ENV === 'production' ? 'bus_lviv_bot' : 'bus_lviv_bot_dev'
})

//register logz.io and console loggers
bot.use((ctx, next) => {
  return next(ctx).then(() => {
    logzioLogger.log(ctx)
    mongoLogger.info(ctx)
  })
})

bot.telegram.getMe().then((botInfo) => {
  bot.options.username = botInfo.username
})

bot.start(startMiddleware)
bot.help(helpMiddleware)
bot.hears(/(^\d+$)|(^\/\d+$)/, busStopMiddleware.busStopId)
bot.on('location', busStopMiddleware.location)
bot.on('callback_query', busStopMiddleware.callbackQuery)

bot.startPolling()
