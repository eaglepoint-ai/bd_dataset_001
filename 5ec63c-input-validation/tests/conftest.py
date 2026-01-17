import sys
import os

# Add repository_after to sys.path so tests can import error_handling_lib
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'repository_after')))
