const helpText = `Для отримання інформації, потрібно відправити номер зупинки і я постараюсь знайти інформацію по громадському транспорту для цієї зупинки.

Також я вмію шукати найближчі зупинки. Для цього просто відправ мені свою локацію через \u{1F4CE} або через кнопку після виконання команди /start`

module.exports = (ctx, next) => {
  ctx.replyWithPhoto('https://imagecdn1.luxnet.ua/zaxid/resources/photos/news/500_DIR/201702/1418712_1458359.jpg')
    .then(() => ctx.replyWithMarkdown(helpText))
}
