const Telegraf = require('telegraf')
const Markup = require('telegraf/markup')
const rp = require('request-promise')
const convertVehicleTypeToEmoji = require('./utils/vehicleTypeConverter')
const { botToken, apiLogin, apiPass } = require('./config/config')

const bot = new Telegraf(botToken)

const startMiddleware = require('./middleware/start.middleware')
const helpMiddleware = require('./middleware/help.middleware')
const locationMiddleware = require('./middleware/location.middleware')
const ladMiddleware = require('./middleware/lad.middleware')

bot.start(startMiddleware)
bot.help(helpMiddleware)
bot.on('location', locationMiddleware)
bot.hears(/(^\d+$)|(^\/\d+$)/, ladMiddleware)

bot.catch((err, ctx) => {
  console.log(`Ooops, encountered an error for ${ctx.updateType}`, err)
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

exports.handler = (event, context, callback) => {
  console.log(event.body)
  const body = JSON.parse(event.body) // get data passed to us

  bot.handleUpdate(body)
  return callback(null, {
    statusCode: 200,
    body: '',
  })
}
