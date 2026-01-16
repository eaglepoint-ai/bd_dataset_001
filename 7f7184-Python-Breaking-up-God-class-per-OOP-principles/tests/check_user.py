import unittest
from tests.utils import BaseModel, User

class CheckUser(unittest.TestCase):
    """Tests for User class."""

    def test_user_class(self):
        """Test User class specific attributes and inheritance."""
        if User is None:
            self.fail("User class could not be imported")

        user = User()
        
        # Inheritance check
        self.assertIsInstance(user, BaseModel)
        self.assertTrue(issubclass(User, BaseModel))
        
        # Specific attributes
        self.assertTrue(hasattr(User, "email"))
        self.assertEqual(User.email, "")
        self.assertTrue(hasattr(User, "password"))
        self.assertEqual(User.password, "")
        self.assertTrue(hasattr(User, "first_name"))
        self.assertEqual(User.first_name, "")
        self.assertTrue(hasattr(User, "last_name"))
        self.assertEqual(User.last_name, "")

    def test_docstrings(self):
        """Test that User has docstrings."""
        if User:
            self.assertIsNotNone(User.__doc__)
    
    def test_instantiation_and_save(self):
        """Test that instantiation and save work across types."""
        if User is None:
            return 
            
        user = User()
        old_updated_at = user.updated_at
        user.save()
        self.assertNotEqual(user.updated_at, old_updated_at)
        
        user_dict = user.to_dict()
        self.assertEqual(user_dict['__class__'], 'User')
        self.assertEqual(user_dict['id'], user.id)
