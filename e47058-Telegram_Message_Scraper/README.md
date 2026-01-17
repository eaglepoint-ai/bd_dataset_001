# project template

Starter scaffold for bd dataset task.

## Structure

- repository_before/: baseline code (`__init__.py`)
- repository_after/: optimized code (`__init__.py`)
- tests/: test suite (`__init__.py`)
- evaluation/: evaluation scripts (`evaluation.py`)
- instances/: sample/problem instances (JSON)
- patches/: patches for diffing
- trajectory/: notes or write-up (Markdown)

---

## Template Instructions

> **Note:** The task gen team should delete this section after creating the task.

### Setup Steps

1. **Create a directory** with the format: `uuid-task_title`

   - Task title words should be joined by underscores (`_`)
   - UUID and task title should be joined with a dash (`-`)
   - Example: `5g27e7-My_Task_Title`

2. **Update `instances/instance.json`** — the following fields are empty by default; fill in appropriate values:

   - `"instance_id"`
   - `"problem_statement"`
   - `"github_url"`

3. **Update `.gitignore`** to reflect your language and library setup

4. **Add `reports/` inside `evaluation/` to `.gitignore`**
   - Each report run should be organized by date/time

---

## Reports Generation

> **Note:** The developer should delete this section after completing the task before pushing to GitHub.

When the evaluation command is run, it should generate reports in the following structure:

```
evaluation/
└── reports/
    └── YYYY-MM-DD/
        └── HH-MM-SS/
            └── report.json
```

### Report Schema

```json
{
  "run_id": "uuid",
  "started_at": "ISO-8601",
  "finished_at": "ISO-8601",
  "duration_seconds": 0.0,
  "environment": {
    "python_version": "3.x",
    "platform": "os-arch"
  },
  "before": {
    "tests": {},
    "metrics": {}
  },
  "after": {
    "tests": {},
    "metrics": {}
  },
  "comparison": {},
  "success": true,
  "error": null
}
```

The developer should add any additional metrics and keys that reflect the runs (e.g., data seeded to test the code on before/after repository).

---

## Final README Contents

> **Note:** Replace the template content above with the following sections before pushing:

1. **Problem Statement**
2. **Prompt Used**
3. **Requirements Specified**
4. **Commands:**

   - Commands to spin up the app and run tests on `repository_before`
   - Commands to run tests on `repository_after`
   - Commands to run `evaluation/evaluation.py` and generate reports

   > **Note:** For full-stack app tasks, the `repository_before` commands will be empty since there is no app initially.

## Problem Statement

The Telegram Message Scraper script depends on external systems such as the Telegram API, the local file system, and asynchronous network operations, which makes it difficult to validate reliably through manual testing. Without automated tests, changes to the script could introduce regressions, incorrect data extraction, formatting errors, or unhandled failure scenarios that may go unnoticed until production use. Testing the script manually would require real Telegram credentials, live network connectivity, and actual file creation, making it slow, risky, and hard to reproduce edge cases. A comprehensive suite of unit tests is therefore necessary to verify correct behavior, simulate error conditions, ensure proper CSV output, and allow future modifications to be made confidently without breaking existing functionality.

## Prompt Used

You are a senior software engineer with expertise in Python testing and asynchronous applications.
Write a complete suite of unit tests for the following Telegram Message Scraper script.
Constraints and Requirements
Use pytest as the testing framework.

Place all tests in a separate file named test_message_scraper.py.
Do not modify the original script code in any way.
Tests must run without real Telegram API credentials and without network access.
Use extensive mocking to isolate external dependencies, including:
TelegramClient
client.iter_messages
file system operations such as open
csv.writer
asyncio.sleep
logging
Avoid real file creation or modification during tests.
Avoid real API calls or Telegram connections.
Use pytest fixtures where appropriate for reusability and clarity.
Ensure asynchronous functions are tested using pytest-asyncio or equivalent tools.
Functional Scenarios to Cover
The unit tests must validate at least the following behaviors:
Messages from the year 2024 are correctly processed and written to CSV.
Messages from years other than 2024 are ignored.
Channels with no messages are handled gracefully.
Correct extraction of message fields:
message ID
date formatting
sender ID
text content
views
comments
reactions
Proper handling when optional fields (views, replies, reactions) are missing.
Correct CSV header creation.
Multiple channels are processed sequentially.
Error Handling Scenarios
Tests must also verify correct behavior when:
ChannelInvalidError is raised.
FloodWaitError occurs and triggers a sleep call.
Generic unexpected exceptions are logged.
API credentials are missing from environment variables.
File system errors occur while opening or writing the CSV file.
Additional Requirements
Aim for high code coverage of all logical branches.
Use clear and descriptive test names.

Include assertions verifying:

Correct CSV rows are written

Correct logging calls are made

Correct handling of exceptions

Follow PEP8 and best practices for test structure and readability.

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

if **name** == "**main**": # Enable logging
logging.basicConfig(level=logging.WARNING)
main()

## Requirements

Requirements
Criteria that must be met for this task

1. The script must connect to Telegram using valid API credentials.
2. The script must retrieve messages only from the specified channels.
3. The script must process only messages from the year 2024.
4. The script must ignore messages from other years.
5. The script must extract message details correctly.
6. The script must write extracted data to a CSV file.
7. The script must create the CSV file if it does not exist.
8. The script must include a header row in the CSV file.
9. The script must handle missing message fields gracefully
10. The script must log errors for invalid channels.
11. The script must handle Telegram rate limit errors properly.
12. The script must wait and retry when a FloodWaitError occurs.
13. The script must continue processing after non-critical errors.
14. The script must support asynchronous execution.
15. The script must be testable without real Telegram access.

## Commands

### Run with Docker

### Build image

```bash
docker compose build
```

### Run tests before

```bash
docker compose run --rm app pytest -v repository_after/test_message_scraper.py
```

### Run test for after

```bash
docker compose run --rm app pytest -v tests/test_repository_after.py
```

#### Run evaluation

This will show the detail for repository_after test (we don't have repository_after).

```bash
docker compose run --rm app python evaluation/evaluation.py
```

### Generate patch

From repo root:

```bash
git diff --no-index repository_before repository_after > patches/task_001.patch
```
