const localtunnel = require('localtunnel')
require('dotenv').config();

(async () => {
  const tunnel = await localtunnel({ port: 3000 })

  console.log(`https://api.telegram.org/bot${process.env.bus_lviv_bot_token}/setWebhook?url=${tunnel.url}/bot`)

  tunnel.on('close', () => {
    // tunnels are closed
  })
})()
