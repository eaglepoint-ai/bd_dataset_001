import unittest
from tests.utils import BaseModel, User, State, Place, Review, Amenity

class CheckBaseModel(unittest.TestCase):
    """Tests for BaseModel."""

    def test_base_model_attributes(self):
        """Test that BaseModel only contains the base attributes."""
        if BaseModel is None:
            self.fail("BaseModel could not be imported")
            
        base = BaseModel()
        
        # Check presence of base attributes
        self.assertTrue(hasattr(base, "id"))
        self.assertTrue(hasattr(base, "created_at"))
        self.assertTrue(hasattr(base, "updated_at"))
        
        # Check ABSENCE of specific attributes that were refactored out
        self.assertFalse(hasattr(base, "email"))
        self.assertFalse(hasattr(base, "password"))
        self.assertFalse(hasattr(base, "first_name"))
        self.assertFalse(hasattr(base, "last_name"))
        self.assertFalse(hasattr(base, "name"))
        self.assertFalse(hasattr(base, "city_id"))
        self.assertFalse(hasattr(base, "user_id"))
        self.assertFalse(hasattr(base, "description"))
        self.assertFalse(hasattr(base, "number_rooms"))
        self.assertFalse(hasattr(base, "number_bathrooms"))
        self.assertFalse(hasattr(base, "max_guest"))
        self.assertFalse(hasattr(base, "price_by_night"))
        self.assertFalse(hasattr(base, "latitude"))
        self.assertFalse(hasattr(base, "longitude"))
        self.assertFalse(hasattr(base, "amenity_ids"))
        self.assertFalse(hasattr(base, "place_id"))
        self.assertFalse(hasattr(base, "text"))
        self.assertFalse(hasattr(base, "entity_type"))

    def test_docstrings(self):
        """Test that BaseModels have docstrings."""
        if BaseModel:
            self.assertIsNotNone(BaseModel.__doc__)
