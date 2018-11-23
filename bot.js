const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')
const rp = require('request-promise')
const log4js = require('log4js')
const mongoAppender = require('log4js-node-mongodb')

let mongodbURI = process.env.NODE_ENV === 'prod' || process.env.NODE_ENV === 'production' ? process.env.MONGODB_URI : 'localhost:27017/bus_lviv_bot'
const apiLogin = process.env.API_LOGIN
const apiPass = process.env.API_PASSWORD

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

const startText =
  'Вітаю! Я допоможу Вам знайти розклад громадського транспорту Львова, якщо ви відправите мені номер зупинки. \n ' +
  'Наприклад, 216'
const helpText = `Для отримання інформації, потрібно відправити номер зупинки і я постараюсь знайти інформацію по громадському транспорту для цієї зупинки.

Також я вмію шукати найближчі зупинки. Для цього просто відправ мені свою локацію \u{1F4CE} `

bot.start((ctx) => {
  try {
    return ctx.reply(startText)
  } catch (e) {
    console.log(e)
  }
})
bot.help((ctx) => ctx
  .replyWithPhoto('https://imagecdn1.luxnet.ua/zaxid/resources/photos/news/500_DIR/201702/1418712_1458359.jpg')
  .then(() => {return ctx.replyWithMarkdown(helpText)})
)

bot.hears(/(^\d+$)|(^\/\d+$)/, (ctx) => {
  let busStopId = ctx.message.text.replace('/', '')
  rp(`https://lad.lviv.ua/api/stops/${busStopId}`, {
    json: true,
    headers: { 'referer': `https://lad.lviv.ua/api/stops/${busStopId}` }
  })
    .then(resp => {
      return ctx.replyWithMarkdown(prepareResponse(busStopId, resp), Extra.inReplyTo(ctx.update.message.message_id))
    })
    .catch(err => {
      return ctx.reply(`Упс. Щось поламалось. Отримано помилку від джерела даних\n----------\n${err}`, Extra.inReplyTo(ctx.update.message.message_id))
    })
})

bot.on('location', (ctx) => {
  let requestOptions = {
    uri: 'https://api.eway.in.ua/',
    qs: {
      login: apiLogin,
      password: apiPass,
      city: 'lviv',
      function: 'stops.GetStopsNearPoint',
      lat: ctx.message.location.latitude,
      lng: ctx.message.location.longitude
    },
    json: true
  }

  rp(requestOptions)
    .then(closestStopsRes => {
      let closestStopsKeyboard = []
      closestStopsRes.stop.forEach(stop => {
        closestStopsKeyboard.push(Markup.callbackButton(stop.title, stop.id))
      })
      return ctx.reply('Найближчі зупинки:', Extra.markup((m) => m.inlineKeyboard(closestStopsKeyboard, { wrap: () => true })))
    })
})

bot.on('callback_query', (ctx) => {
  let busStopId = ctx.callbackQuery.data
  let requestOptions = {
    uri: 'https://api.eway.in.ua/',
    qs: {
      login: apiLogin,
      password: apiPass,
      city: 'lviv',
      v: 1.2,
      function: 'stops.GetStopInfo',
      id: busStopId
    },
    json: true
  }

  rp(requestOptions)
    .then(res => {
      let routes = res.routes
      let message = `\`${res.title}\` [link](http://maps.google.com/maps?q=${res.lat},${res.lng})\n`
      routes.forEach(route => {
        if (route.timeSource === 'gps') {
          message += `${convertVehicleTypeToEmoji(route.transportKey)} ${route.title} - ${route.timeLeftFormatted}. \u{1F68F}\`${route.directionTitle}\`\n`
        }
      })
      return ctx.replyWithMarkdown(message, { disable_web_page_preview: true })
    })
})

// parse and transform API response
function prepareResponse (busStopId, resp) {
  let replyMarkdown = ''
  let header = `*${busStopId}* \`"${resp.name}"\`\n------------------------------\n`
  let routes = resp.timetable
  let busInfo = parseBusInfo(routes)

  replyMarkdown += header
  replyMarkdown += busInfo
  return replyMarkdown
}

function parseBusInfo (routes) {
  let busInfo = ''
  for (let route of routes) {
    busInfo += `${convertVehicleTypeToEmoji(route.vehicle_type)} ${route.route} - ${route.time_left} - \u{1F68F}\`${route.end_stop}\`\n`
  }
  return busInfo
}

function convertVehicleTypeToEmoji (vehicleType) {
  switch (vehicleType) {
    case 'bus':
    case 'marshrutka':
      return '\u{1F68C}'
    case 'tram':
      return '\u{1F68B}'
    case 'trol':
      return '\u{1F68E}'
    default:
      return ''
  }
}

bot.startPolling()
