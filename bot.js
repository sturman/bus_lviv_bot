const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')
const rp = require('request-promise')

const bot = new Telegraf(process.env.BOT_TOKEN)
const apiLogin = process.env.API_LOGIN
const apiPass = process.env.API_PASSWORD

const startText =
  'Вітаю! Я допоможу Вам знайти розклад громадського транспорту Львова, якщо ви відправите мені номер зупинки, наприклад 216, або свою локацію і я знайду найближчі зупинки'
const helpText = `Для отримання інформації, потрібно відправити номер зупинки і я постараюсь знайти інформацію по громадському транспорту для цієї зупинки.

Також я вмію шукати найближчі зупинки. Для цього просто відправ мені свою локацію через \u{1F4CE} або через кнопку після виконання команди /start`

bot.start((ctx) => {
  const keyboard = Markup.resize().keyboard([
    Markup.locationRequestButton('\u{1F4CC} Відправити локацію')
  ])
  ctx.reply(startText, Extra.markup(keyboard).markdown())
})

bot.help((ctx) => ctx
  .replyWithPhoto('https://imagecdn1.luxnet.ua/zaxid/resources/photos/news/500_DIR/201702/1418712_1458359.jpg')
  .then(() => ctx.replyWithMarkdown(helpText))
)

bot.hears(/(^\d+$)|(^\/\d+$)/, (ctx) => {
  let busStopId = ctx.message.text.replace('/', '')
  rp(`https://lad.lviv.ua/api/stops/${busStopId}`, {
    json: true,
    headers: { 'referer': `https://lad.lviv.ua/api/stops/${busStopId}` }
  })
    .then(resp => {
      ctx.replyWithMarkdown(prepareResponse(busStopId, resp) + `\n/${busStopId}`, Extra.inReplyTo(ctx.message.message_id))
    })
    .catch(err => {
      ctx.reply(`Упс. Щось поламалось. Отримано помилку від джерела даних\n----------\n${err}`, Extra.inReplyTo(ctx.message.message_id))
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
      ctx.reply('Найближчі зупинки:', Extra.markup((m) => m.inlineKeyboard(closestStopsKeyboard, { wrap: () => true })))
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
      let message = `\`${res.title}\` [gmaps](http://maps.google.com/maps?q=${res.lat},${res.lng})\n`
      routes.forEach(route => {
        if (route.timeSource === 'gps') {
          message += `${convertVehicleTypeToEmoji(route.transportKey)} ${route.title} - ${route.timeLeftFormatted}. \u{1F68F}\`${route.directionTitle}\`\n`
        }
      })
      ctx.replyWithMarkdown(message,
        Markup.inlineKeyboard([
          Markup.callbackButton('Оновити дані', busStopId),
        ]).extra({ disable_web_page_preview: true }))
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

exports.handler = (event, context, callback) => {
  console.log(event.body)
  const body = JSON.parse(event.body) // get data passed to us

  bot.handleUpdate(body)
  return callback(null, {
    statusCode: 200,
    body: '',
  })
}
