# Refactoring a God Class into a Clean OOP Design

## 1. Problem Statement

The `BaseModel` class is a poorly designed ""god class"" that violates the Single Responsibility Principle by combining multiple unrelated entities (User, Place, State, Review, Amenity). Your task is to refactor this into a proper OOP hierarchy.

## 2. Prompt Used

You are given a python class to refactor following the proper OOP principles. You write clean and efficient code that is readable. The BaseModel class below is a poorly designed “god class” that combines multiple unrealted entities. Your task is to: 1. Keep BaseModel as a base/parent class containing only the created_at, updated_at attributes and the init, save, to_dict and **str** methods 2. Extract these into separate child classes that inherit from BaseModel 3. Each class should inherit from the base model, define its attributes as class level defaults and have a doc string describing what it represents. 4. Break up the classes into multiple files import models from uuid import uuid4 from datetime import datetime class BaseModel: """Represents all entities in the HBnB project. Use entity_type to specify: 'user', 'place', 'state', 'review', 'amenity' """ # Entity type identifier entity_type = "" # User attributes email = "" password = "" first_name = "" last_name = "" # State/Amenity attributes name = "" # Place attributes city_id = "" user_id = "" description = "" number_rooms = 0 number_bathrooms = 0 max_guest = 0 price_by_night = 0 latitude = 0.0 longitude = 0.0 amenity_ids = [] # Review attributes place_id = "" text = "" def **init**(self, *args, \*\*kwargs): """Initialize a new BaseModel. Args: *args (any): Unused. \*\*kwargs (dict): Key/value pairs of attributes. """ tform = "%Y-%m-%dT%H:%M:%S.%f" self.id = str(uuid4()) self.created_at = datetime.today() self.updated_at = datetime.today() if len(kwargs) != 0: for k, v in kwargs.items(): if k == "created_at" or k == "updated_at": self.**dict**[k] = datetime.strptime(v, tform) else: self.**dict**[k] = v else: models.storage.new(self) def save(self): """Update updated_at with the current datetime.""" self.updated_at = datetime.today() models.storage.save() def to_dict(self): """Return the dictionary of the BaseModel instance. Includes the key/value pair **class** representing the class name of the object. """ rdict = self.**dict**.copy() rdict["created_at"] = self.created_at.isoformat() rdict["updated_at"] = self.updated_at.isoformat() rdict["__class__"] = self.**class**.**name** return rdict def **str**(self): """Return the print/str representation of the BaseModel instance.""" clname = self.**class**.**name** return "[{}] ({}) {}".format(clname, self.id, self.**dict**)

## 3. Requirements Specified

1. Python
2. OOP

## 4. Commands

### Run tests on `repository_before`

Run the tests against the initial state. This is expected to fail or error out due to the monolithic structure and missing classes.

```bash
docker-compose run --rm -e PYTHONPATH=repository_before app pytest tests/test_main.py
```

### Run tests on `repository_after`

Run the tests against the refactored solution. This should pass all checks for inheritance, attribute placement, and functionality.

```bash
docker-compose run --rm -e PYTHONPATH=repository_after app pytest tests/test_main.py
```

### Run Evaluation

Generate the evaluation report which checks correctness and computes metrics.

```bash
docker-compose run --rm app python evaluation/evaluation.py
```
