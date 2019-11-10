const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')
const rp = require('request-promise')
const { apiLogin, apiPass } = require('../config/config')

module.exports = (ctx, next) => {
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
}