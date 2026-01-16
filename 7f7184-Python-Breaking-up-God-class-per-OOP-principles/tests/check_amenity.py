import unittest
from tests.utils import BaseModel, Amenity

class CheckAmenity(unittest.TestCase):
    """Tests for Amenity class."""

    def test_amenity_class(self):
        """Test Amenity class specific attributes and inheritance."""
        if Amenity is None:
            self.fail("Amenity class could not be imported")

        amenity = Amenity()
        
        self.assertIsInstance(amenity, BaseModel)
        self.assertTrue(issubclass(Amenity, BaseModel))
        
        self.assertTrue(hasattr(Amenity, "name"))
        self.assertEqual(Amenity.name, "")

    def test_docstrings(self):
        """Test that Amenity has docstrings."""
        if Amenity:
            self.assertIsNotNone(Amenity.__doc__)
