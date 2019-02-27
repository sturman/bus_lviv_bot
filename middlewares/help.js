const helpText = `Для отримання інформації, потрібно відправити номер зупинки і я постараюсь знайти інформацію по громадському транспорту для цієї зупинки.

Також я вмію шукати найближчі зупинки. Для цього просто відправ мені свою локацію \u{1F4CE} `

module.exports = (ctx) => {
  return ctx
    .replyWithPhoto('https://imagecdn1.luxnet.ua/zaxid/resources/photos/news/500_DIR/201702/1418712_1458359.jpg')
    .then(() => {
      return ctx.replyWithMarkdown(helpText)
    })
}