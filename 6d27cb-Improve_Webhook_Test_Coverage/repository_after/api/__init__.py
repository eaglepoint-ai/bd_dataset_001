#!/usr/bin/env python3
"""
Flask application initialization for webhook API.
"""
from flask import Flask
from api.webhook import webhook_blueprint

app = Flask(__name__)
app.register_blueprint(webhook_blueprint)
