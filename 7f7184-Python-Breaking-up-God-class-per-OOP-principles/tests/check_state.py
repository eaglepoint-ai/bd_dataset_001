import unittest
from tests.utils import BaseModel, State

class CheckState(unittest.TestCase):
    """Tests for State class."""

    def test_state_class(self):
        """Test State class specific attributes and inheritance."""
        if State is None:
            self.fail("State class could not be imported")
            
        state = State()
        
        self.assertIsInstance(state, BaseModel)
        self.assertTrue(issubclass(State, BaseModel))
        
        self.assertTrue(hasattr(State, "name"))
        self.assertEqual(State.name, "")

    def test_docstrings(self):
        """Test that State has docstrings."""
        if State:
            self.assertIsNotNone(State.__doc__)
