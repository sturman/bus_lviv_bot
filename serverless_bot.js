const Telegraf = require('telegraf')
const bot = new Telegraf(process.env.BOT_TOKEN)

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