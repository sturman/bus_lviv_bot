const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')
const rp = require('request-promise')

const bot = new Telegraf(process.env.BOT_TOKEN)
const apiLogin = process.env.API_LOGIN
const apiPass = process.env.API_PASSWORD

const startText =
  'Вітаю! Я допоможу Вам знайти розклад громадського транспорту Львова, якщо ви відправите мені номер зупинки. \n ' +
  'Наприклад, 216'
const helpText = `Для отримання інформації, потрібно відправити номер зупинки і я постараюсь знайти інформацію по громадському транспорту для цієї зупинки.

Також я вмію шукати найближчі зупинки. Для цього просто відправ мені свою локацію \u{1F4CE} `

bot.start((ctx) => ctx.reply(startText))
bot.help((ctx) => ctx
  .replyWithPhoto('https://imagecdn1.luxnet.ua/zaxid/resources/photos/news/500_DIR/201702/1418712_1458359.jpg')
  .then(() => ctx.replyWithMarkdown(helpText))
)
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

exports.handler = (event, context, callback) => {
  const body = JSON.parse(event.body) // get data passed to us
  console.log('--------------')
  console.log(body)
  console.log('--------------')

  bot.handleUpdate(body)
  return callback(null, {
    statusCode: 200,
    body: '',
  })
}