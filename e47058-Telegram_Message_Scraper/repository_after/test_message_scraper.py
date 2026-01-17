import pytest
import asyncio
import os
import sys
from unittest.mock import MagicMock, patch, mock_open, AsyncMock, ANY
from datetime import datetime
from telethon import errors

# CRITICAL SETUP: Mock Environment Variables BEFORE Import
os.environ['API_ID'] = '12345'
os.environ['API_HASH'] = '0123456789abcdef0123456789abcdef'

from repository_before import message_scraper

@pytest.fixture
def mock_message_factory():
    """Creates a mock message object with configurable attributes."""
    def _create_message(
        msg_id=1,
        date=datetime(2024, 1, 1, 12, 0, 0),
        sender_id=12345,
        text="Hello World",
        views=None,
        replies_count=None,
        reactions_list=None
    ):
        msg = MagicMock()
        msg.id = msg_id
        msg.date = date
        msg.sender_id = sender_id
        msg.text = text

        if views is not None:
            msg.views = views
        else:
            del msg.views

        if replies_count is not None:
            msg.replies = MagicMock()
            msg.replies.replies = replies_count
        else:
            msg.replies = None

        if reactions_list is not None:
            msg.reactions = MagicMock()
            results = []
            for count in reactions_list:
                r = MagicMock()
                r.count = count
                results.append(r)
            msg.reactions.results = results
        else:
            msg.reactions = None

        return msg
    return _create_message


@pytest.fixture
def mock_client():
    """Patches the global 'client' object."""
    with patch("repository_before.message_scraper.client") as mock:
        yield mock


@pytest.fixture
def mock_file_system():
    """Patches 'open' and 'csv.writer'."""
    mock_f = mock_open()
    with patch("builtins.open", mock_f) as mocked_open, \
         patch("csv.writer") as mocked_writer:
        writer_instance = MagicMock()
        mocked_writer.return_value = writer_instance
        yield mocked_open, writer_instance


@pytest.fixture
def mock_sleep():
    """Patches asyncio.sleep."""
    with patch("asyncio.sleep", new_callable=AsyncMock) as mock:
        yield mock


@pytest.fixture
def mock_logging():
    """Patches the logging module."""
    with patch("repository_before.message_scraper.logging") as mock:
        yield mock

@pytest.mark.asyncio
async def test_happy_path_2024_message(
    mock_client, mock_file_system, mock_message_factory
):
    """
    Covers Requirements:
    #3 (Process 2024), #5 (Extract details), #6 (Write CSV),
    #7 (Create file), #8 (Header row).
    """
    mock_open_func, mock_csv_writer = mock_file_system
    msg = mock_message_factory(
        date=datetime(2024, 5, 20, 10, 30, 0),
        views=100, replies_count=5, reactions_list=[10, 2]
    )

    async def async_gen(*args, **kwargs):
        yield msg
    mock_client.iter_messages.side_effect = async_gen

    await message_scraper.extract_messages()

    mock_open_func.assert_called_with(message_scraper.csv_file, mode='w', newline='', encoding='utf-8')

    mock_csv_writer.writerow.assert_any_call([
        'Channel', 'Message ID', 'Date', 'Sender ID',
        'Message Content', 'Views', 'Comments', 'Reactions'
    ])

    expected_row = [
        message_scraper.channels[0], msg.id, '2024-05-20 10:30:00',
        msg.sender_id, msg.text, 100, 5, 12
    ]
    mock_csv_writer.writerow.assert_any_call(expected_row)


@pytest.mark.asyncio
async def test_ignore_messages_outside_2024(
    mock_client, mock_file_system, mock_message_factory
):
    """
    Covers Requirement: #4 (Ignore messages from other years).
    """
    _, mock_csv_writer = mock_file_system
    msg_2023 = mock_message_factory(date=datetime(2023, 12, 31))
    msg_2025 = mock_message_factory(date=datetime(2025, 1, 1))

    async def async_gen(*args, **kwargs):
        yield msg_2023
        yield msg_2025
    mock_client.iter_messages.side_effect = async_gen

    await message_scraper.extract_messages()

    # Only header written
    assert mock_csv_writer.writerow.call_count == 1


@pytest.mark.asyncio
async def test_missing_optional_fields(
    mock_client, mock_file_system, mock_message_factory
):
    """
    Covers Requirement: #9 (Handle missing message fields gracefully).
    """
    _, mock_csv_writer = mock_file_system
    msg = mock_message_factory(
        date=datetime(2024, 1, 1),
        views=None, replies_count=None, reactions_list=None
    )

    async def async_gen(*args, **kwargs):
        yield msg
    mock_client.iter_messages.side_effect = async_gen

    await message_scraper.extract_messages()

    expected_row = [
        message_scraper.channels[0], msg.id, '2024-01-01 00:00:00',
        msg.sender_id, msg.text, None, None, None
    ]
    mock_csv_writer.writerow.assert_any_call(expected_row)


@pytest.mark.asyncio
async def test_channel_invalid_error(
    mock_client, mock_file_system, mock_logging
):
    """
    Covers Requirements: #10 (Log errors for invalid channels), #13 (Continue processing).
    """
    # Simulate error
    mock_client.iter_messages.side_effect = errors.ChannelInvalidError("Invalid")

    await message_scraper.extract_messages()

    # Check logging
    assert mock_logging.error.call_count >= len(message_scraper.channels)
    mock_logging.error.assert_any_call(f"Invalid channel: {message_scraper.channels[0]}")


@pytest.mark.asyncio
async def test_flood_wait_error(
    mock_client, mock_file_system, mock_logging, mock_sleep
):
    """
    Covers Requirements: #11 (Handle rate limits), #12 (Wait/Retry).
    """
    # FIX: Pass explicit integer to capture
    flood_error = errors.FloodWaitError(request=None, capture=15)
    mock_client.iter_messages.side_effect = flood_error

    await message_scraper.extract_messages()

    mock_logging.warning.assert_any_call("Rate limited. Sleeping for 15 seconds.")
    mock_sleep.assert_called_with(15)


@pytest.mark.asyncio
async def test_generic_unexpected_exception(
    mock_client, mock_file_system, mock_logging
):
    """
    Covers Requirement: #13 (Continue/Handle non-critical errors).
    """
    mock_client.iter_messages.side_effect = ValueError("Unexpected Error")
    await message_scraper.extract_messages()
    mock_logging.error.assert_any_call("An error occurred: Unexpected Error")


@pytest.mark.asyncio
async def test_multiple_channels_processing(
    mock_client, mock_file_system, mock_message_factory
):
    """
    Covers Requirement: #2 (Retrieve messages from specified channels).
    """
    msg1 = mock_message_factory(text="Msg 1")

    # Create an iterator that yields one message
    async def async_gen(*args, **kwargs):
        yield msg1

    # Apply this iterator to every call
    mock_client.iter_messages.side_effect = lambda *args, **kwargs: async_gen()

    await message_scraper.extract_messages()

    # Verify iter_messages called for every channel
    assert mock_client.iter_messages.call_count == len(message_scraper.channels)

    # Verify calls were made with different channel names
    calls = mock_client.iter_messages.call_args_list
    assert calls[0][0][0] == message_scraper.channels[0]
    assert calls[1][0][0] == message_scraper.channels[1]


def test_main_execution(mock_client):
    """
    Covers Requirements: #1 (Connect with valid creds), #14 (Async support), #15 (Testable).
    """
    with patch("repository_before.message_scraper.extract_messages", new_callable=AsyncMock):
        mock_client.loop.run_until_complete = MagicMock()
        message_scraper.main()
        mock_client.__enter__.assert_called()
        mock_client.loop.run_until_complete.assert_called_once()