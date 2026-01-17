import pytest
import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'message_app.settings')

if not settings.configured:
    settings.configure(
        DEBUG=True,
        DATABASES={
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': ':memory:',
            }
        },
        INSTALLED_APPS=[
            'django.contrib.auth',
            'django.contrib.contenttypes',
            'django.contrib.sessions',
            'django.contrib.admin',
            'django.contrib.messages',
            'rest_framework',
            'messages_app',
        ],
        SECRET_KEY='test-secret-key',
        USE_TZ=True,
        ROOT_URLCONF='message_app.urls',
        MIDDLEWARE=[
            'django.middleware.security.SecurityMiddleware',
            'django.contrib.sessions.middleware.SessionMiddleware',
            'django.middleware.common.CommonMiddleware',
            'django.middleware.csrf.CsrfViewMiddleware',
            'django.contrib.auth.middleware.AuthenticationMiddleware',
            'django.contrib.messages.middleware.MessageMiddleware',
        ],
        TEMPLATES=[
            {
                'BACKEND': 'django.template.backends.django.DjangoTemplates',
                'DIRS': [],
                'APP_DIRS': True,
                'OPTIONS': {
                    'context_processors': [
                        'django.template.context_processors.debug',
                        'django.template.context_processors.request',
                        'django.contrib.auth.context_processors.auth',
                        'django.contrib.messages.context_processors.messages',
                    ],
                },
            },
        ],
    )

django.setup()


def pytest_sessionfinish(session, exitstatus):
    if exitstatus == 0:
        passed = len([item for item in session.items if hasattr(item, 'rep_call') and item.rep_call and item.rep_call.passed])
        print(f"{passed} tests passed")


def pytest_sessionfinish(session, exitstatus):
    passed = sum(1 for item in session.items if hasattr(item, 'rep_call') and item.rep_call and item.rep_call.passed)
    print(f"{passed} tests passed")