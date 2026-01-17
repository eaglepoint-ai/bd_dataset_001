# Trajectory: 2D Game with Pygame

## 1. Requirement Deconstruction

The user requested a single-file Python game using Pygame with the following constraints:
*   **Single File**: All code must be in one `.py` file.
*   **No Assets**: Procedural generation (rectangles, circles, lines).
*   **Game Loop**: Standard implementation.
*   **Game Rules**:
    *   Player: Square (Blue).
    *   Enemy: Red squares (bounce off walls).
    *   Goal: Collect 10 Green squares (points).
    *   Lose: Touch Red.
    *   Win: 10 Points.
    *   Progression: More/faster enemies.

Key technical requirements:
*   Collision Detection (`colliderect`).
*   Frame-based update (`clock.tick`).
*   State management (Playing, Won, Game Over).

## 2. Strategy

I chose a classic Object-Oriented approach within a single file to maintain clarity while adhering to the constraint.

*   `GameObject`: Base class for position and drawing.
*   `Player`: Handles keyboard input for movement.
*   `Enemy`: Handles autonomous movement and bouncing logic.
*   `Coin` (Goal): Handles respawning.
*   `Game`: The main controller class handling the loop, state, and rendering.

### Design Decisions:
*   **Imports**: Only `pygame`, `random`, `sys`.
*   **Graphics**: Used `pygame.draw.rect` for everything to avoid external assets.
*   **Input**: Used `pygame.key.get_pressed()` for smooth, continuous movement.
*   **Testing**: Since Pygame opens a window, I used `os.environ["SDL_VIDEODRIVER"] = "dummy"` for headless testing in the CI/CD environment.

## 3. Execution

1.  **Repository Setup**:
    *   Left `repository_before` empty (except for `__init__.py`).
    *   Created `repository_after/game.py` with the complete implementation.

2.  **Game Implementation (`game.py`)**:
    *   Initialized Pygame.
    *   Created the game loop class.
    *   Implemented collision checks in `update()`.
    *   Rendered text for UI.
    *   Implemented `headless` mode for automated testing.

3.  **Testing**:
    *   Created `tests/test_game.py` using `unittest` and `unittest.mock`.
    *   Verified core logic: movement, collision, score increment.
    *   Ensured tests fail if `game.py` is missing (verifying the "Before" state).

4.  **Evaluation**:
    *   Created `evaluation/evaluation.py` to run the tests and generate a report.
    *   Configured it to run `pytest` against `repository_after`.

## 4. Challenges & Solutions

*   **Headless Testing**: Pygame usually requires a video device.
    *   *Solution*: Set `SDL_VIDEODRIVER` to `dummy` in the test setup.
*   **Single File vs Testing**: Typically code is modular.
    *   *Solution*: Used `if __name__ == "__main__":` to allow importing classes for testing without running the game loop immediately.
*   **Test Import Path Resolution**: Tests need to import from `repository_after/game.py`.
    *   *Solution*: Added `sys.path.insert(0, ...)` in the test files to dynamically add the repository directory to the Python path.

## 5. Test Verification

Tests were verified using the provided Docker environment.

1.  **Build**:
    ```bash
    docker compose build
    ```

2.  **Run Solution**:
    ```bash
    docker compose run run_solution
    ```
    *   Runs the game in headless mode (or interactive if GUI available).

3.  **Evaluate**:
    ```bash
    docker compose run evaluate
    ```
    *   Result: All tests passed. Correctly identified success in `repository_after`.

## 6. Resources

*   Pygame Documentation: https://www.pygame.org/docs/
*   Python Unittest: https://docs.python.org/3/library/unittest.html
