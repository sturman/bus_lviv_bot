const rp = require('request-promise')
const Extra = require('telegraf/extra')
const convertVehicleTypeToEmoji = require('../utils/vehicleTypeConverter')

module.exports = (ctx, next) => {
  let busStopId = ctx.message.text.replace('/', '')
  rp(`https://api1.lad.lviv.ua/stops/${busStopId}`, {
    json: true,
    referer: `https://lad.lviv.ua/api/stops/${busStopId}`
  })
    .then(resp => {
      return ctx.replyWithMarkdown(prepareResponse(busStopId, resp) + `\n/${busStopId}`, Extra.inReplyTo(ctx.message.message_id))
    })
    .catch(err => {
      if (err.statusCode === 400) {
        return ctx.reply(`Отримано помилку від джерела даних. Ймовірно зупинки з номером ${busStopId} не існує\n----------\n${err}`, Extra.inReplyTo(ctx.message.message_id))
      }
      return ctx.reply(`Упс. Щось поламалось. Отримано помилку від джерела даних\n----------\n${err}`, Extra.inReplyTo(ctx.message.message_id))
    })
}

// parse and transform API response
const prepareResponse = (busStopId, resp) => {
  let replyMarkdown = ''
  let header = `*${busStopId}* \`"${resp.name}"\`\n------------------------------\n`
  let routes = resp.timetable
  let busInfo = parseBusInfo(routes)

  replyMarkdown += header
  replyMarkdown += busInfo
  return replyMarkdown
}

const parseBusInfo = (routes) => {
  let busInfo = ''
  for (let route of routes) {
    busInfo += `${convertVehicleTypeToEmoji(route.vehicle_type)} ${route.route} - ${route.time_left} - \u{1F68F}\`${route.end_stop}\`\n`
  }
  return busInfo
}
