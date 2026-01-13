import unittest
from tests.check_base_model import CheckBaseModel
from tests.check_user import CheckUser
from tests.check_state import CheckState
from tests.check_amenity import CheckAmenity
from tests.check_place import CheckPlace
from tests.check_review import CheckReview

class TestOOPRefactoring(CheckBaseModel, CheckUser, CheckState, CheckAmenity, CheckPlace, CheckReview):
    """Main test suite combining all checks."""
    pass

if __name__ == "__main__":
    unittest.main()
