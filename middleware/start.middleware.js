const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')

const startText =
  'Вітаю! Я допоможу Вам знайти розклад громадського транспорту Львова, якщо ви відправите мені номер зупинки (виділено червоним на фото), наприклад 216, або свою локацію і я знайду найближчі зупинки'

module.exports = (ctx, next) => {
  const keyboard = Markup.resize().keyboard([
    Markup.locationRequestButton('\u{1F4CC} Відправити локацію')
  ])
  ctx.replyWithPhoto('https://imagecdn1.luxnet.ua/zaxid/resources/photos/news/500_DIR/201702/1418712_1458359.jpg')
    .then(() => ctx.reply(startText, Extra.markup(keyboard).markdown()))
}
