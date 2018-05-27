const Telegraf = require('telegraf')
const rp = require('request-promise')

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.use(Telegraf.log())

bot.telegram.getMe().then((botInfo) => {
  bot.options.username = botInfo.username
})

const startText =
  'Вітаю! Я допоможу Вам знайти розклад громадського транспорту Львова, якщо ви відправите мені номер зупинки. \n ' +
  'Наприклад, 216'

bot.start((ctx) => ctx.reply(startText))
bot.help((ctx) => ctx.replyWithPhoto('https://imagecdn1.luxnet.ua/zaxid/resources/photos/news/500_DIR/201702/1418712_1458359.jpg',
  {
    caption: 'Для отримання інформації, потрібно відправити номер зупинки і я постараюсь знайти інформацію по громадському транспорту для цієї зупинки'
  }))

bot.hears(/\d/, (ctx) => {
  let busStopId = ctx.message.text
  rp(`https://lad.lviv.ua/api/stops/${busStopId}`)
    .then(function (resp) {
      return ctx.replyWithMarkdown(prepareResponse(busStopId, resp))
    })
    .catch(function (err) {
      return ctx.reply(`Упс. Щось поламалось. Спробуйте пізніше\n----------\n${err}`)
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