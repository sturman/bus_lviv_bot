const Telegraf = require('telegraf')

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

bot.startPolling()