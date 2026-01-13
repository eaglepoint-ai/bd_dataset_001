import unittest
from tests.utils import BaseModel, Place

class CheckPlace(unittest.TestCase):
    """Tests for Place class."""

    def test_place_class(self):
        """Test Place class specific attributes and inheritance."""
        if Place is None:
            self.fail("Place class could not be imported")

        place = Place()
        
        self.assertIsInstance(place, BaseModel)
        self.assertTrue(issubclass(Place, BaseModel))
        
        self.assertTrue(hasattr(Place, "city_id"))
        self.assertEqual(Place.city_id, "")
        self.assertTrue(hasattr(Place, "user_id"))
        self.assertEqual(Place.user_id, "")
        self.assertTrue(hasattr(Place, "description"))
        self.assertEqual(Place.description, "")
        self.assertTrue(hasattr(Place, "number_rooms"))
        self.assertEqual(Place.number_rooms, 0)
        self.assertTrue(hasattr(Place, "number_bathrooms"))
        self.assertEqual(Place.number_bathrooms, 0)
        self.assertTrue(hasattr(Place, "max_guest"))
        self.assertEqual(Place.max_guest, 0)
        self.assertTrue(hasattr(Place, "price_by_night"))
        self.assertEqual(Place.price_by_night, 0)
        self.assertTrue(hasattr(Place, "latitude"))
        self.assertEqual(Place.latitude, 0.0)
        self.assertTrue(hasattr(Place, "longitude"))
        self.assertEqual(Place.longitude, 0.0)
        self.assertTrue(hasattr(Place, "amenity_ids"))
        self.assertEqual(Place.amenity_ids, [])

    def test_docstrings(self):
        """Test that Place has docstrings."""
        if Place:
            self.assertIsNotNone(Place.__doc__)
