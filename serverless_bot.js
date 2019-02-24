'use strict'

const Telegraf = require('telegraf')
const bot = new Telegraf(process.env.BOT_TOKEN)

bot.hears('hi', ctx => ctx.reply('Hey there!'))

/* AWS Lambda handler function */
exports.handler = (event, context, callback) => {
  const tmp = JSON.parse(event.body) // get data passed to us
  bot.handleUpdate(tmp) // make Telegraf process that data
  return callback(null, { // return something for webhook, so it doesn't try to send same stuff again
    statusCode: 200,
    body: '',
  })
}