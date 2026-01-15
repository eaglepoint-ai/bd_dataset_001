#!/usr/bin/python3
"""
Telegram Image Scraper

This script connects to Telegram using the Telethon library to scrape images
from specified channels and saves them to the local filesystem. It filters
messages to download only photos from the year 2024.

Requirements:
- Telethon library (install via pip: `pip install telethon`)
- API_ID and API_HASH environment variables set for Telegram
API authentication.

Usage:
1. Set API_ID and API_HASH environment variables with your Telegram API
credentials.
2. Update the 'channels' list with URLs of Telegram channels from which
you want to scrape images.
3. Run the script. It will create a '../images' directory if not exists and
save downloaded images there.

Features:
- Downloads and saves images from specified Telegram channels.
- Logs information about saved images using the logging module.

Raises:
- TelethonException: If there are issues with Telegram API requests.
- OSError: If there are issues with file operations
(e.g., directory creation, file saving).
"""

import os
import logging
from datetime import datetime
from telethon import TelegramClient
from telethon.tl.types import MessageMediaPhoto
import asyncio

# API credentials
api_id = os.getenv('API_ID')
api_hash = os.getenv('API_HASH')

# Channels to scrape
channels = ['https://t.me/CheMed123', 'https://t.me/lobelia4cosmetics']

try:
    # Directory to store the extracted images
    os.makedirs('../images', exist_ok=True)
except OSError as e:
    logging.error(f"Failed to create directory '../images': {e}")
    exit(1)  # Exit the script if directory creation fails


# Create the client and connect
client = TelegramClient('session_name', api_id, api_hash)


async def extract_images():
    """
    Scrapes images from specified Telegram channels and saves them to
    the '../images' directory.

    It iterates through messages in the specified channels, checks if the
    message contains a photo and if it is from the year 2024, then downloads
    and saves the image with a unique filename based on channel name, message
    ID, and timestamp.

    Requires API_ID and API_HASH environment variables to be set for
    authentication.

    Raises:
        TelethonException: If there are issues with Telegram API requests.
        OSError: If there are issues with file operations
    (e.g., directory creation, file saving).
    """
    for channel in channels:
        image_count = 0
        async for message in client.iter_messages(channel):
            # Check if the message contains a photo and is from 2024
            if (message.media and isinstance(
                    message.media, MessageMediaPhoto) and
                    message.date.year == 2024):

                date_str = message.date.strftime('%Y%m%d_%H%M%S')
                file_path = os.path.join(
                    '../images', f'{channel}_{message.id}_{date_str}.jpg')

                # Download and save the image
                path = await message.download_media(file=file_path)
                logging.info(f"Image saved: {file_path}")


def main():
    """
    Main function to run the Telegram image scraping script.

    Establishes a client session, runs the image extraction coroutine, and
    handles the asyncio event loop.

    """
    with client:
        client.loop.run_until_complete(extract_images())


if __name__ == '__main__':
    # Enable logging
    logging.basicConfig(level=logging.INFO)
    main()
