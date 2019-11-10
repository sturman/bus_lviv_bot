const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')

const startText =
  'Вітаю! Я допоможу Вам знайти розклад громадського транспорту Львова, якщо ви відправите мені номер зупинки, наприклад 216, або свою локацію і я знайду найближчі зупинки'

module.exports = (ctx, next) => {
  const keyboard = Markup.resize().keyboard([
    Markup.locationRequestButton('\u{1F4CC} Відправити локацію')
  ])
  ctx.reply(startText, Extra.markup(keyboard).markdown())
}
