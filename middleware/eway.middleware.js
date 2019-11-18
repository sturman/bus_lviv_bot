const rp = require('request-promise')
const Markup = require('telegraf/markup')
const convertVehicleTypeToEmoji = require('../utils/vehicleTypeConverter')
const { apiLogin, apiPass } = require('../config/config')

module.exports = (ctx, next) => {
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
      return ctx.replyWithMarkdown(message,
        Markup.inlineKeyboard([
          Markup.callbackButton('Оновити дані', busStopId),
        ]).extra({ disable_web_page_preview: true }))
    })
}
