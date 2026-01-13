# Trajectory

## 1. Setup Repository Structure
- Created `repository_after/models/engine` directory.

## 2. Implement Storage
- Created `repository_after/models/engine/storage.py`.
- Implemented `Storage` class with `all()`, `new(obj)`, and dummy `save()` methods.
- This allows `BaseModel` to interact with a storage system (`models.storage`) without requiring a full file-based persistence implementation, satisfying the decoupling requirement while maintaining the interface.

## 3. Initialize Models Package
- Created `repository_after/models/__init__.py`.
- Initialized `storage` instance from `models.engine.storage`.

## 4. Refactor BaseModel
- Created `repository_after/models/base_model.py`.
- Refactored `BaseModel` to include:
    - `id` (uuid)
    - `created_at` (datetime)
    - `updated_at` (datetime)
    - `__init__`: Handles `*args` and `**kwargs` for recreation from dictionary or initialization of new instance.
    - `save`: Updates `updated_at` and calls `models.storage.save()`.
    - `to_dict`: Returns dictionary representation with isoformat datetimes and `__class__`.
    - `__str__`: Returns string representation.
- Removed unrelated attributes (user, place, etc.) to adhere to Single Responsibility Principle.

## 5. Extract Child Classes
- Created separate files for each entity in `repository_after/models/`.
- **User** (`models/user.py`):
    - Inherits from `BaseModel`.
    - Attributes: `email`, `password`, `first_name`, `last_name`.
- **State** (`models/state.py`):
    - Inherits from `BaseModel`.
    - Attributes: `name`.
- **Place** (`models/place.py`):
    - Inherits from `BaseModel`.
    - Attributes: `city_id`, `user_id`, `name`, `description`, `number_rooms`, `number_bathrooms`, `max_guest`, `price_by_night`, `latitude`, `longitude`, `amenity_ids`.
- **Review** (`models/review.py`):
    - Inherits from `BaseModel`.
    - Attributes: `place_id`, `user_id`, `text`.
- **Amenity** (`models/amenity.py`):
    - Inherits from `BaseModel`.
    - Attributes: `name`.

## 6. Verification
- Verified directory structure and file existence.
- Verified that all classes inherit from `BaseModel`.

## 7. References
Here are the resources and documentation that can help understand the refactoring process and the concepts applied:

### Concepts & Principles
- **Single Responsibility Principle (SRP)**: A class should have one and only one reason to change.
- **God Class / Blob Anti-pattern**: A class that knows too much or does too much.

### Documentation
- [Python 3 Tutorial - Classes](https://docs.python.org/3/tutorial/classes.html)
- [Python `datetime` module](https://docs.python.org/3/library/datetime.html)
- [Python `uuid` module](https://docs.python.org/3/library/uuid.html)
- [Python `unittest` module](https://docs.python.org/3/library/unittest.html)

### Tutorial Videos
- **Design Patterns | Single Responsibility | Objected Oriented Programming | SOLID Principles**  
  [Watch on YouTube](https://www.youtube.com/watch?v=yWpwymPzZ9Q&t=1s) (Recommended for understanding SRP)
  
- **Single Responsibility Principle in Python (The S in SOLID)**  
  [Watch on YouTube](https://www.youtube.com/watch?v=pTB30MJnJX8)
  
- **Uncle Bob's SOLID Principles Made Easy - In Python!**  
  [Watch on YouTube](https://www.youtube.com/watch?v=pTB30MJnJX8)

