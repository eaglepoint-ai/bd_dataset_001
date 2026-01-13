#!/usr/bin/python3
"""
Contains the User class
"""
from models.base_model import BaseModel

class User(BaseModel):
    """Represents a User in the system"""
    email = ""
    password = ""
    first_name = ""
    last_name = ""
