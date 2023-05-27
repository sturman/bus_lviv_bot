const rp = require('request-promise')
const Extra = require('telegraf/extra')
const convertVehicleTypeToEmoji = require('../utils/vehicleTypeConverter')

const apiUrl = 'http://0.0.0.0:8080'

module.exports = (ctx, next) => {
  let busStopId = ctx.message.text.replace('/', '')
  rp(`${apiUrl}/stops/${busStopId}/timetable`, {
    json: true,
    referer: `https://lad.lviv.ua/api/stops/${busStopId}`
  })
    .then(async resp => {
      return ctx.replyWithMarkdown(await prepareResponse(busStopId, resp) + `\n/${busStopId}`, Extra.inReplyTo(ctx.message.message_id)).catch(err => {
        console.log(err)
      })
    })
    .catch(err => {
      if (err.statusCode === 400) {
        return ctx.reply(`Отримано помилку від джерела даних. Ймовірно зупинки з номером ${busStopId} не існує\n----------\n${err}`, Extra.inReplyTo(ctx.message.message_id))
      }
      return ctx.reply(`Упс. Щось поламалось. Отримано помилку від джерела даних\n----------\n${err}`, Extra.inReplyTo(ctx.message.message_id))
    })
}

// parse and transform API response
const prepareResponse = async (busStopId, resp) => {
  let replyMarkdown = ''
  let stopName = await getStopName(busStopId)
  let header = `*${busStopId}* \`"${stopName}"\`\n------------------------------\n`
  let busInfo = parseBusInfo(resp)

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

const getStopName = async (stopId) => {
  const response = await fetch(`${apiUrl}/stops/${stopId}`).then(response => response.json());
  return response.name
}
