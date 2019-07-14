# [bus_lviv_bot](https://t.me/bus_lviv_bot)

### Environment variables

`BOT_TOKEN` - Telegram bot token

`API_LOGIN` - EasyWay API login

`API_PASSWORD` - EasyWay API password

### Serverless
* add token to AWS Parameters Store `aws ssm put-parameter --name "bus_lviv_bot_token" --type "String" --value "<TOKEN>"`
* add token to EasyWay API login to AWS Parameters Store `aws ssm put-parameter --name "bus_lviv_bot_api_login" --type "String" --value "<TOKEN>"`
* add token to EasyWay API password to AWS Parameters Store `aws ssm put-parameter --name "bus_lviv_bot_api_password" --type "String" --value "<TOKEN>"`