import os

from telegram.error import TelegramError
from telegram.ext import Updater, CommandHandler, RegexHandler
import logging
import requests

# Enable logging
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                    level=logging.INFO)

logger = logging.getLogger(__name__)


def start(bot, update):
    logger.info('Start received from %s' % update.message.from_user)
    update.message.reply_text(
        'Вітаю! Я допоможу Вам знайти розклад громадського транспорту Львова, '
        'якщо ви відправите мені номер зупинки. \n '
        'Наприклад, 216')


def help(bot, update):
    update.message.reply_photo(
        photo='https://imagecdn1.luxnet.ua/zaxid/resources/photos/news/500_DIR/201702/1418712_1458359.jpg',
        caption='Для отримання інформації, потрібно відправити номер зупинки і я постараюсь знайти інформацію '
                'по громадському транспорту для цієї зупинки')


def error(bot, update, error):
    """Log Errors caused by Updates."""
    logger.warning('Update "%s" caused error "%s"', update, error)


def bus_stop_id_handler(bot, update):
    logger.info('Received bus stop id %s from %s' % (update.message.text, update.message.from_user))
    bus_stop_id = update.message.text
    resp = requests.get('https://lad.lviv.ua/api/stops/' + bus_stop_id)
    if resp.text.startswith('No stop with code'):
        return update.message.reply_text('Зупинка з номером *%s* не знайдена' % bus_stop_id)
    try:
        data = resp.json()
        message_header = 'Інформація по зупинці \n' \
                         '*%s* `"%s"`\n' \
                         '------------------------------' % (bus_stop_id, data['name'])
        timetable = data['timetable']
        message = message_header + '\n'
        for item in timetable:
            message += '%s - %s\n' % (item['full_route_name'], item['time_left'])
        update.message.reply_markdown(message)
    except TelegramError:
        update.message.reply_markdown('Oops! Something went wrong')


def main():
    """Start the bot."""
    # Create the EventHandler and pass it your bot's token.
    updater = Updater(os.environ['BOT_TOKEN'])

    # Get the dispatcher to register handlers
    dp = updater.dispatcher

    # on different commands - answer in Telegram
    dp.add_handler(CommandHandler("start", start))
    dp.add_handler(CommandHandler("help", help))

    dp.add_handler(RegexHandler('\d', bus_stop_id_handler))

    # log all errors
    dp.add_error_handler(error)

    # Start the Bot
    updater.start_polling()

    # Run the bot until you press Ctrl-C or the process receives SIGINT,
    # SIGTERM or SIGABRT. This should be used most of the time, since
    # start_polling() is non-blocking and will stop the bot gracefully.
    updater.idle()


if __name__ == '__main__':
    main()
