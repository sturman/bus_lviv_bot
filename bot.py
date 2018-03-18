import os
from telegram.ext import Updater, CommandHandler, RegexHandler
import logging
import requests

# Enable logging
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                    level=logging.INFO)

logger = logging.getLogger(__name__)


def start(bot, update):
    logger.info('Start received from %s' % update.message.from_user)
    update.message.reply_text('Hi ' + update.message.from_user.first_name)


def help(bot, update):
    """Send a message when the command /help is issued."""
    update.message.reply_text('Help!')


def error(bot, update, error):
    """Log Errors caused by Updates."""
    logger.warning('Update "%s" caused error "%s"', update, error)


def bus_stop_id_handler(bot, update):
    logger.info('Received bus stop id %s from %s' % (update.message.text, update.message.from_user))
    bus_stop_id = update.message.text
    data = requests.get('https://lad.lviv.ua/api/stops/' + bus_stop_id).json()
    message_header = 'Інформація по зупинці %s "%s"' % (bus_stop_id, data['name'])
    timetable = data['timetable']
    message = message_header + '\n'
    for item in timetable:
        message += '%s - %s\n' % (item['full_route_name'], item['time_left'])
    update.message.reply_text(message)


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
