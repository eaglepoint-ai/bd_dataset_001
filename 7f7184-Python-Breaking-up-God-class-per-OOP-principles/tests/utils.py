try:
    from models.base_model import BaseModel
    from models.user import User
    from models.state import State
    from models.place import Place
    from models.review import Review
    from models.amenity import Amenity
    import models
except ImportError:
    try:
        from BaseModel import BaseModel
        # Define dummy classes for missing ones to allow tests to run (and fail on assertions)
        User = State = Place = Review = Amenity = None
        models = None
    except ImportError:
        BaseModel = None
        User = State = Place = Review = Amenity = None
        models = None
