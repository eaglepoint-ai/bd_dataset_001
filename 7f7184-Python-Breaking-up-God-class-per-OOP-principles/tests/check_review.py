import unittest
from tests.utils import BaseModel, Review

class CheckReview(unittest.TestCase):
    """Tests for Review class."""

    def test_review_class(self):
        """Test Review class specific attributes and inheritance."""
        if Review is None:
            self.fail("Review class could not be imported")

        review = Review()
        
        self.assertIsInstance(review, BaseModel)
        self.assertTrue(issubclass(Review, BaseModel))
        
        self.assertTrue(hasattr(Review, "place_id"))
        self.assertEqual(Review.place_id, "")
        self.assertTrue(hasattr(Review, "user_id")) 
        self.assertTrue(hasattr(Review, "text"))
        self.assertEqual(Review.text, "")

    def test_docstrings(self):
        """Test that Review has docstrings."""
        if Review:
            self.assertIsNotNone(Review.__doc__)
