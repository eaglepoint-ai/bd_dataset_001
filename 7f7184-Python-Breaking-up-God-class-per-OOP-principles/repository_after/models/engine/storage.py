#!/usr/bin/python3
"""
Contains the Storage class
"""
import json

class Storage:
    """
    Serializes instances to a JSON file and deserializes JSON file to instances
    """
    __objects = {}

    def all(self):
        """Returns the dictionary __objects"""
        return Storage.__objects

    def new(self, obj):
        """Sets in __objects the obj with key <obj class name>.id"""
        key = "{}.{}".format(type(obj).__name__, obj.id)
        Storage.__objects[key] = obj

    def save(self):
        """Serialize __objects to the JSON file (dummy implementation)"""
        pass
