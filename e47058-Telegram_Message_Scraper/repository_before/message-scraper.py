#!/usr/bin/python3
"""
Telegram Message Scraper

This script connects to Telegram channels using Telethon API, retrieves
messages from specified channels,
and writes the data into a CSV file for analysis.

Requirements:
- Python 3.7 or higher
- Telethon library (install via `pip install telethon`)

Usage:
1. Replace 'YOUR_API_ID' and 'YOUR_API_HASH' with your own Telegram
API ID and hash obtained from https://my.telegram.org.
2. Modify the 'channels' list with the usernames of the channels
you want to scrape.
3. Ensure the 'csv_file' variable points to the desired output CSV file path.
4. Run the script. It will connect to Telegram, fetch messages from each
channel specified in 'channels', and write message details
(message ID, date, sender ID, content, views, comments, reactions) to the CSV
file.

CSV File Format:
- 'Channel': Username of the channel from which the message was extracted.
- 'Message ID': Unique ID of the message.
- 'Date': Date and time when the message was sent
(format: 'YYYY-MM-DD HH:MM:SS').
- 'Sender ID': Telegram ID of the sender.
- 'Message Content': Text content of the message.
- 'Views': Number of views of the message (if available).
- 'Comments': Number of replies/comments to the message (if available).
- 'Reactions': Number of reactions (like, love, etc.) to the message
(if available).

Exceptions:
- Handles 'ChannelInvalidError' if a channel username is incorrect or
inaccessible.
- Handles 'FloodWaitError' gracefully by waiting for the specified number
of seconds before retrying.
- Logs other unexpected exceptions for debugging purposes.
"""
from datetime import datetime
import csv
import logging
import os
from telethon import TelegramClient, errors
from telethon.tl.types import PeerChannel
import asyncio
from datetime import datetime

# Telegram API credentials
api_id = os.getenv('API_ID')
api_hash = os.getenv('API_HASH')

# List of channel usernames to scrape data from
channels = [
    'DoctorsET',
    'lobelia4cosmetics',
    'yetenaweg',
    'EAHCI'
]

# CSV file to store the extracted data
csv_file = '../data/telegram_data_2024.csv'

# Initialize the Telegram client
client = TelegramClient('session_name', api_id, api_hash)


async def extract_messages():
    """
    Asynchronously iterates over messages from specified channels, extracts
    relevant information,
    and writes them to a CSV file.

    This function uses Telethon's client to connect to Telegram, iterates
    through each specified channel, and retrieves messages sent in the year
    2024. It extracts message details such as ID, date, sender ID,
    message content, views, comments, and reactions (if available), then
    writes them to a CSV file.

    Exceptions handled:
    - ChannelInvalidError: Raised when a channel username is incorrect or
    inaccessible.
    - FloodWaitError: Raised when API rate limits are exceeded; the
    function waits for the specified seconds.
    - Any other exceptions are logged for debugging purposes.
    """
    with open(csv_file, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow(
            [
                'Channel', 'Message ID',
                'Date', 'Sender ID', 'Message Content',
                'Views', 'Comments', 'Reactions'
            ])

        for channel in channels:
            try:
                async for message in client.iter_messages(
                        channel, offset_date=None, reverse=True):
                    # Only process messages from the year 2024
                    if message.date.year == 2024:
                        views = message.views if hasattr(
                            message, 'views') else None
                        comments = message.replies.replies if message.replies \
                            else None
                        reactions = sum(reaction.count
                                        for reaction in
                                        message.reactions.results) if
                        message.reactions else None

                        writer.writerow([
                            channel,
                            message.id,
                            message.date.strftime('%Y-%m-%d %H:%M:%S'),
                            message.sender_id,
                            message.text,
                            views,
                            comments,
                            reactions
                        ])
            except errors.ChannelInvalidError:
                logging.error(f"Invalid channel: {channel}")
            except errors.FloodWaitError as e:
                logging.warning(
                    f"Rate limited. Sleeping for {e.seconds} seconds.")
                await asyncio.sleep(e.seconds)
            except Exception as e:
                logging.error(f"An error occurred: {str(e)}")


def main():
    """
    Sets up the Telegram client session and runs the message
    extraction process.

    This function initializes the Telegram client session using the
    provided API ID and hash, then calls the 'extract_messages' function
    to start retrieving and processing messages from Telegram channels.
    """
    with client:
        client.loop.run_until_complete(extract_messages())


if __name__ == "__main__":
    # Enable logging
    logging.basicConfig(level=logging.WARNING)
    main()

