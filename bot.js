const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')
const rp = require('request-promise')

const bot = new Telegraf(process.env.BOT_TOKEN)

const logger = require('logzio-nodejs').createLogger({
  token: process.env.LOGZIO_TOKEN,
  host: 'listener.logz.io',
  type: process.env.NODE_ENV === 'prod' || process.env.NODE_ENV === 'production' ? 'bus_lviv_bot' : 'bus_lviv_bot_dev'
})

//register logz.io and console loggers
bot.use((ctx, next) => {
  return next(ctx).then(() => {
    console.log(ctx.message)
    logger.log(ctx.message)
  })
})

bot.telegram.getMe().then((botInfo) => {
  bot.options.username = botInfo.username
})

const startText =
  'Вітаю! Я допоможу Вам знайти розклад громадського транспорту Львова, якщо ви відправите мені номер зупинки. \n ' +
  'Наприклад, 216'
const helpText = 'Для отримання інформації, потрібно відправити номер зупинки і ' +
  'я постараюсь знайти інформацію по громадському транспорту для цієї зупинки'

bot.start((ctx) => ctx.reply(startText))
bot.help((ctx) => ctx.replyWithPhoto(
  'https://imagecdn1.luxnet.ua/zaxid/resources/photos/news/500_DIR/201702/1418712_1458359.jpg',
  {caption: helpText}
))

bot.hears(/^\d+$/, (ctx) => {
  let busStopId = ctx.message.text
  rp(`https://lad.lviv.ua/api/stops/${busStopId}`)
    .then(resp => {
      return ctx.replyWithMarkdown(prepareResponse(busStopId, resp), Extra.inReplyTo(ctx.update.message.message_id))
    })
    .catch(err => {
      return ctx.reply(`Упс. Щось поламалось. Отримано помилку від джерела даних\n----------\n${err}`, Extra.inReplyTo(ctx.update.message.message_id))
    })
})

bot.on('location', (ctx) => {
  let longitude = ctx.message.location.longitude
  let latitude = ctx.message.location.latitude
  rp(`https://lad.lviv.ua/api/closest?longitude=${longitude}&latitude=${latitude}`, {json: true})
    .then(closestStops => {
        let closestStopsMessage = ''
        closestStops.forEach(stop => {
          closestStopsMessage += `${stop.code} ${stop.name}\n`
        })
        return ctx.replyWithMarkdown(closestStopsMessage, Extra.inReplyTo(ctx.update.message.message_id))
      }
    )
    .catch(err => {
      return ctx.reply(`Упс. Щось поламалось. Отримано помилку від джерела даних\n----------\n${err}`, Extra.inReplyTo(ctx.update.message.message_id))
    })
})

// parse and transform API response
function prepareResponse (busStopId, resp) {
  try {
    resp = JSON.parse(resp)
  }
  catch (e) {
    return e
  }
  let replyMarkdown = ''
  let header = `Інформація по зупинці \n*${busStopId}* \`"${resp.name}"\`\n------------------------------\n`
  let routes = resp.timetable
  let busInfo = parseBusInfo(routes)

  replyMarkdown += header
  replyMarkdown += busInfo
  return replyMarkdown
}

function parseBusInfo (routes) {
  let busInfo = ''
  for (let route of routes) {
    busInfo += `${convertVehicleTypeToEmoji(route.vehicle_type)} ${route.route} - ${route.time_left} \n`
  }
  return busInfo
}

function convertVehicleTypeToEmoji (vehicleType) {
  switch (vehicleType) {
    case 'bus':
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
