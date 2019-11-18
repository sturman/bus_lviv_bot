const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')
const rp = require('request-promise')
const { botToken, apiLogin, apiPass } = require('./config/config')

const bot = new Telegraf(botToken)

const startMiddleware = require('./middleware/start.middleware')
const helpMiddleware = require('./middleware/help.middleware')
const locationMiddleware = require('./middleware/location.middleware')

bot.start(startMiddleware)
bot.help(helpMiddleware)
bot.on('location', locationMiddleware)

bot.catch((err, ctx) => {
  console.log(`Ooops, encountered an error for ${ctx.updateType}`, err)
})

bot.hears(/(^\d+$)|(^\/\d+$)/, (ctx) => {
  let busStopId = ctx.message.text.replace('/', '')
  rp(`https://api.lad.lviv.ua/stops/${busStopId}`, {
    json: true,
    headers: { 'referer': `https://lad.lviv.ua/api/stops/${busStopId}` }
  })
    .then(resp => {
      ctx.replyWithMarkdown(prepareResponse(busStopId, resp) + `\n/${busStopId}`, Extra.inReplyTo(ctx.message.message_id))
    })
    .catch(err => {
      if (err.statusCode === 400) {
        return ctx.reply(`Отримано помилку від джерела даних. Ймовірно зупинки з номером ${busStopId} не існує\n----------\n${err}`, Extra.inReplyTo(ctx.message.message_id))
      }
      return ctx.reply(`Упс. Щось поламалось. Отримано помилку від джерела даних\n----------\n${err}`, Extra.inReplyTo(ctx.message.message_id))
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
