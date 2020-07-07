const localtunnel = require('localtunnel');

(async () => {
  const tunnel = await localtunnel({ port: 3000, host: 'https://sturman.pp.ua' })

  console.log(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/setWebhook?url=${tunnel.url}/development/bot`)

  tunnel.on('close', () => {
    // tunnels are closed
  })
})()
