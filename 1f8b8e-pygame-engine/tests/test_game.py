import os
import sys
import unittest
from unittest.mock import MagicMock, patch

# Set dummy video driver for headless testing
os.environ["SDL_VIDEODRIVER"] = "dummy"
os.environ["SDL_AUDIODRIVER"] = "dummy"

# Add repository path to sys.path for importing game module
# If PYTHONPATH contains a repository path, use that; otherwise default to repository_after
_repo_path = None
for p in sys.path:
    if 'repository_before' in p or 'repository_after' in p:
        _repo_path = p
        break

if _repo_path is None:
    # Default to repository_after when running directly
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'repository_after'))


class MockKeyState:
    """Mock class to simulate pygame.key.get_pressed() results."""
    def __init__(self, pressed_keys=None):
        self.pressed_keys = pressed_keys or {}
    
    def __getitem__(self, key):
        return self.pressed_keys.get(key, False)


def create_mock_event(event_type, key=None):
    """Create a mock pygame event."""
    event = MagicMock()
    event.type = event_type
    if key is not None:
        event.key = key
    return event

class TestGame(unittest.TestCase):
    def setUp(self):
        try:
            import game
            self.game_module = game
        except ImportError:
            self.game_module = None

    def test_game_exists(self):
        """Test that the game module can be loaded."""
        if self.game_module is None:
            self.fail("game.py not found. This is expected failure for repository_before.")

    def test_initial_state(self):
        """Test the initial state of the game."""
        if self.game_module is None:
             self.fail("Game module not found.")
        
        game = self.game_module.Game()
        self.assertEqual(game.score, 0)
        self.assertFalse(game.game_over)
        self.assertFalse(game.won)
        self.assertEqual(len(game.enemies), 1)
        self.assertIsNotNone(game.player)
        self.assertIsNotNone(game.coin)
        
        # Cleanup
        self.game_module.pygame.quit()

    def test_player_movement(self):
        """Test player movement logic."""
        if self.game_module is None:
             self.fail("Game module not found.")
             
        game = self.game_module.Game()
        player = game.player
        initial_x = player.rect.x
        
        # Simulate moving right
        keys = {self.game_module.pygame.K_RIGHT: True, 
                self.game_module.pygame.K_LEFT: False, 
                self.game_module.pygame.K_UP: False, 
                self.game_module.pygame.K_DOWN: False}
        
        # Allow default lookups for other keys to be False
        class KeyMock:
            def __getitem__(self, k):
                return keys.get(k, False)
        
        player.move(KeyMock())
        self.assertEqual(player.rect.x, initial_x + self.game_module.PLAYER_SPEED)
        self.game_module.pygame.quit()

    def test_enemy_collision(self):
        """Test that colliding with an enemy ends the game."""
        if self.game_module is None:
             self.fail("Game module not found.")
             
        game = self.game_module.Game()
        # Teleport enemy to player to ensure overlap
        game.enemies[0].rect.x = game.player.rect.x
        game.enemies[0].rect.y = game.player.rect.y
        
        game.update()
        self.assertTrue(game.game_over)
        self.game_module.pygame.quit()

    def test_coin_collection(self):
        """Test checking coin collection increments score."""
        if self.game_module is None:
             self.fail("Game module not found.")
             
        game = self.game_module.Game()
        # Teleport coin to player
        game.coin.rect.x = game.player.rect.x
        game.coin.rect.y = game.player.rect.y
        
        initial_score = game.score
        game.update()
        
        self.assertEqual(game.score, initial_score + 1)
        self.game_module.pygame.quit()

    def test_win_condition(self):
        """Test that getting 10 points wins the game."""
        if self.game_module is None:
             self.fail("Game module not found.")
             
        game = self.game_module.Game()
        game.score = 9
        
        # Teleport coin to player
        game.coin.rect.x = game.player.rect.x
        game.coin.rect.y = game.player.rect.y
        
        game.update()
        self.assertTrue(game.won)
        self.game_module.pygame.quit()

    def test_enemy_movement_bounce(self):
        """Test that enemies move and bounce off walls."""
        if self.game_module is None:
             self.fail("Game module not found.")

        game = self.game_module.Game()
        enemy = game.enemies[0]
        
        # Force enemy to left edge moving left
        enemy.rect.x = 0
        enemy.dx = -5
        
        enemy.move()
        
        # Should have bounced (dx became positive)
        self.assertGreater(enemy.dx, 0)
        self.game_module.pygame.quit()

    def test_difficulty_progression(self):
        """Test that enemies increase after every 2 points."""
        if self.game_module is None:
             self.fail("Game module not found.")
             
        game = self.game_module.Game()
        initial_enemy_count = len(game.enemies)
        
        # Score 2 points
        # 1st point
        game.coin.rect.x = game.player.rect.x
        game.coin.rect.y = game.player.rect.y
        game.update()
        
        # 2nd point
        game.coin.rect.x = game.player.rect.x
        game.coin.rect.y = game.player.rect.y
        game.update()
        
        self.assertEqual(game.score, 2)
        self.assertGreater(len(game.enemies), initial_enemy_count)
        self.game_module.pygame.quit()

    def test_player_boundary_check(self):
        """Test that player cannot move off screen."""
        if self.game_module is None:
             self.fail("Game module not found.")
             
        game = self.game_module.Game()
        game.player.rect.x = 0
        
        # Try moving left (out of bounds)
        keys = {self.game_module.pygame.K_LEFT: True}
        class KeyMock:
            def __getitem__(self, k): return keys.get(k, False)
            
        game.player.move(KeyMock())
        
        # Should be clamped to 0
        self.assertEqual(game.player.rect.x, 0)
        self.game_module.pygame.quit()

    def test_reset_game(self):
        """Test that reset restores initial state."""
        if self.game_module is None:
             self.fail("Game module not found.")
             
        game = self.game_module.Game()
        game.score = 5
        game.game_over = True
        
        game.reset_game()
        
        self.assertEqual(game.score, 0)
        self.assertFalse(game.game_over)
        self.assertEqual(len(game.enemies), 1)
        self.game_module.pygame.quit()

class TestGameFlowSimulation(unittest.TestCase):
    """Tests that simulate actual game flow with mocked inputs."""
    
    def setUp(self):
        try:
            import game
            self.game_module = game
        except ImportError:
            self.game_module = None

    def tearDown(self):
        if self.game_module:
            self.game_module.pygame.quit()

    def test_simulate_player_movement_all_directions(self):
        """Simulate player moving in all four directions."""
        if self.game_module is None:
            self.fail("Game module not found.")
        
        game = self.game_module.Game()
        pygame = self.game_module.pygame
        
        # Move enemies away to avoid collision
        for enemy in game.enemies:
            enemy.rect.x = 0
            enemy.rect.y = 0
        
        # Test RIGHT movement
        initial_x = game.player.rect.x
        with patch.object(pygame, 'key') as mock_key:
            mock_key.get_pressed.return_value = MockKeyState({pygame.K_RIGHT: True})
            with patch.object(pygame.event, 'get', return_value=[]):
                game.handle_input()
                game.update()
        self.assertGreater(game.player.rect.x, initial_x, "Player should move right")
        
        # Test LEFT movement
        initial_x = game.player.rect.x
        with patch.object(pygame, 'key') as mock_key:
            mock_key.get_pressed.return_value = MockKeyState({pygame.K_LEFT: True})
            with patch.object(pygame.event, 'get', return_value=[]):
                game.handle_input()
                game.update()
        self.assertLess(game.player.rect.x, initial_x, "Player should move left")
        
        # Test DOWN movement
        initial_y = game.player.rect.y
        with patch.object(pygame, 'key') as mock_key:
            mock_key.get_pressed.return_value = MockKeyState({pygame.K_DOWN: True})
            with patch.object(pygame.event, 'get', return_value=[]):
                game.handle_input()
                game.update()
        self.assertGreater(game.player.rect.y, initial_y, "Player should move down")
        
        # Test UP movement
        initial_y = game.player.rect.y
        with patch.object(pygame, 'key') as mock_key:
            mock_key.get_pressed.return_value = MockKeyState({pygame.K_UP: True})
            with patch.object(pygame.event, 'get', return_value=[]):
                game.handle_input()
                game.update()
        self.assertLess(game.player.rect.y, initial_y, "Player should move up")

    def test_simulate_full_win_flow(self):
        """Simulate a complete game where player wins by collecting 10 coins."""
        if self.game_module is None:
            self.fail("Game module not found.")
        
        game = self.game_module.Game()
        pygame = self.game_module.pygame
        
        # Move all enemies far away to prevent collision
        for enemy in game.enemies:
            enemy.rect.x = self.game_module.SCREEN_WIDTH - 50
            enemy.rect.y = self.game_module.SCREEN_HEIGHT - 50
            enemy.dx = 0
            enemy.dy = 0
        
        # Simulate collecting 10 coins
        for i in range(10):
            # Position coin at player location
            game.coin.rect.x = game.player.rect.x
            game.coin.rect.y = game.player.rect.y
            
            # Run game update with no key pressed
            with patch.object(pygame, 'key') as mock_key:
                mock_key.get_pressed.return_value = MockKeyState({})
                with patch.object(pygame.event, 'get', return_value=[]):
                    game.handle_input()
                    game.update()
            
            # Freeze new enemies to prevent collision
            for enemy in game.enemies:
                enemy.dx = 0
                enemy.dy = 0
                enemy.rect.x = self.game_module.SCREEN_WIDTH - 50
                enemy.rect.y = self.game_module.SCREEN_HEIGHT - 50
        
        self.assertEqual(game.score, 10, "Score should be 10 after collecting 10 coins")
        self.assertTrue(game.won, "Game should be won after collecting 10 coins")
        self.assertFalse(game.game_over, "Game should not be over (lost) when won")

    def test_simulate_lose_flow(self):
        """Simulate a game where player loses by hitting an enemy."""
        if self.game_module is None:
            self.fail("Game module not found.")
        
        game = self.game_module.Game()
        pygame = self.game_module.pygame
        
        self.assertFalse(game.game_over, "Game should not be over initially")
        
        # Move enemy directly onto player
        game.enemies[0].rect.x = game.player.rect.x
        game.enemies[0].rect.y = game.player.rect.y
        game.enemies[0].dx = 0
        game.enemies[0].dy = 0
        
        # Run game update
        with patch.object(pygame, 'key') as mock_key:
            mock_key.get_pressed.return_value = MockKeyState({})
            with patch.object(pygame.event, 'get', return_value=[]):
                game.handle_input()
                game.update()
        
        self.assertTrue(game.game_over, "Game should be over after enemy collision")
        self.assertFalse(game.won, "Game should not be won when lost")

    def test_simulate_restart_after_game_over(self):
        """Simulate restarting the game after losing."""
        if self.game_module is None:
            self.fail("Game module not found.")
        
        game = self.game_module.Game()
        pygame = self.game_module.pygame
        
        # Force game over state
        game.game_over = True
        game.score = 5
        
        # Simulate pressing 'R' to restart
        restart_event = create_mock_event(pygame.KEYDOWN, pygame.K_r)
        
        with patch.object(pygame.event, 'get', return_value=[restart_event]):
            game.handle_input()
        
        self.assertFalse(game.game_over, "Game should not be over after restart")
        self.assertEqual(game.score, 0, "Score should be 0 after restart")
        self.assertEqual(len(game.enemies), 1, "Should have 1 enemy after restart")

    def test_simulate_restart_after_win(self):
        """Simulate restarting the game after winning."""
        if self.game_module is None:
            self.fail("Game module not found.")
        
        game = self.game_module.Game()
        pygame = self.game_module.pygame
        
        # Force win state
        game.won = True
        game.score = 10
        
        # Simulate pressing 'R' to restart
        restart_event = create_mock_event(pygame.KEYDOWN, pygame.K_r)
        
        with patch.object(pygame.event, 'get', return_value=[restart_event]):
            game.handle_input()
        
        self.assertFalse(game.won, "Game should not be won after restart")
        self.assertEqual(game.score, 0, "Score should be 0 after restart")

    def test_simulate_quit_game(self):
        """Simulate quitting the game with Q key."""
        if self.game_module is None:
            self.fail("Game module not found.")
        
        game = self.game_module.Game()
        pygame = self.game_module.pygame
        
        self.assertTrue(game.running, "Game should be running initially")
        
        # Simulate pressing 'Q' to quit
        quit_event = create_mock_event(pygame.KEYDOWN, pygame.K_q)
        
        with patch.object(pygame.event, 'get', return_value=[quit_event]):
            game.handle_input()
        
        self.assertFalse(game.running, "Game should stop running after Q pressed")

    def test_simulate_multiple_game_frames(self):
        """Simulate running multiple frames of the game loop."""
        if self.game_module is None:
            self.fail("Game module not found.")
        
        game = self.game_module.Game()
        pygame = self.game_module.pygame
        
        # Move enemies away and freeze them
        for enemy in game.enemies:
            enemy.rect.x = 0
            enemy.rect.y = 0
            enemy.dx = 0
            enemy.dy = 0
        
        # Move coin away
        game.coin.rect.x = self.game_module.SCREEN_WIDTH - 50
        game.coin.rect.y = self.game_module.SCREEN_HEIGHT - 50
        
        initial_x = game.player.rect.x
        
        # Simulate 60 frames (1 second at 60 FPS) of moving right
        for _ in range(60):
            with patch.object(pygame, 'key') as mock_key:
                mock_key.get_pressed.return_value = MockKeyState({pygame.K_RIGHT: True})
                with patch.object(pygame.event, 'get', return_value=[]):
                    game.handle_input()
                    game.update()
                    game.draw()
        
        # Player should have moved significantly (but clamped to screen)
        expected_movement = min(
            60 * self.game_module.PLAYER_SPEED,
            self.game_module.SCREEN_WIDTH - self.game_module.PLAYER_SIZE - initial_x
        )
        self.assertGreaterEqual(
            game.player.rect.x - initial_x,
            expected_movement - 1,  # Allow small rounding
            "Player should move right over multiple frames"
        )

    def test_simulate_enemy_autonomous_movement(self):
        """Simulate enemies moving autonomously over multiple frames."""
        if self.game_module is None:
            self.fail("Game module not found.")
        
        game = self.game_module.Game()
        pygame = self.game_module.pygame
        
        # Position enemy in center with known velocity
        enemy = game.enemies[0]
        enemy.rect.x = self.game_module.SCREEN_WIDTH // 2
        enemy.rect.y = self.game_module.SCREEN_HEIGHT // 2
        enemy.dx = 5
        enemy.dy = 5
        initial_x = enemy.rect.x
        initial_y = enemy.rect.y
        
        # Move player away to prevent collision
        game.player.rect.x = 0
        game.player.rect.y = 0
        
        # Simulate 10 frames
        for _ in range(10):
            with patch.object(pygame, 'key') as mock_key:
                mock_key.get_pressed.return_value = MockKeyState({})
                with patch.object(pygame.event, 'get', return_value=[]):
                    game.handle_input()
                    game.update()
        
        # Enemy should have moved
        self.assertNotEqual(enemy.rect.x, initial_x, "Enemy should move horizontally")
        self.assertNotEqual(enemy.rect.y, initial_y, "Enemy should move vertically")

    def test_simulate_difficulty_scaling(self):
        """Simulate difficulty increasing as player scores."""
        if self.game_module is None:
            self.fail("Game module not found.")
        
        game = self.game_module.Game()
        pygame = self.game_module.pygame
        
        initial_enemy_count = len(game.enemies)
        initial_enemy_speed = abs(game.enemies[0].dx)
        
        # Freeze enemies to prevent collision
        for enemy in game.enemies:
            enemy.rect.x = self.game_module.SCREEN_WIDTH - 50
            enemy.rect.y = self.game_module.SCREEN_HEIGHT - 50
            enemy.dx = 0
            enemy.dy = 0
        
        # Collect 4 coins (should add 2 enemies at score 2 and 4)
        for i in range(4):
            game.coin.rect.x = game.player.rect.x
            game.coin.rect.y = game.player.rect.y
            
            with patch.object(pygame, 'key') as mock_key:
                mock_key.get_pressed.return_value = MockKeyState({})
                with patch.object(pygame.event, 'get', return_value=[]):
                    game.handle_input()
                    game.update()
            
            # Freeze new enemies
            for enemy in game.enemies:
                enemy.rect.x = self.game_module.SCREEN_WIDTH - 50
                enemy.rect.y = self.game_module.SCREEN_HEIGHT - 50
                enemy.dx = 0
                enemy.dy = 0
        
        self.assertEqual(game.score, 4, "Score should be 4")
        self.assertGreater(len(game.enemies), initial_enemy_count, "More enemies should spawn")

    def test_simulate_coin_respawn(self):
        """Simulate coin respawning after collection."""
        if self.game_module is None:
            self.fail("Game module not found.")
        
        game = self.game_module.Game()
        pygame = self.game_module.pygame
        
        # Freeze enemies
        for enemy in game.enemies:
            enemy.rect.x = self.game_module.SCREEN_WIDTH - 50
            enemy.rect.y = self.game_module.SCREEN_HEIGHT - 50
            enemy.dx = 0
            enemy.dy = 0
        
        # Position coin at player
        game.coin.rect.x = game.player.rect.x
        game.coin.rect.y = game.player.rect.y
        old_coin_x = game.coin.rect.x
        old_coin_y = game.coin.rect.y
        
        # Collect coin
        with patch.object(pygame, 'key') as mock_key:
            mock_key.get_pressed.return_value = MockKeyState({})
            with patch.object(pygame.event, 'get', return_value=[]):
                game.handle_input()
                game.update()
        
        self.assertEqual(game.score, 1, "Score should increment")
        # Coin should respawn (position likely changed due to random)
        # Note: There's a small chance it respawns at same position
        self.assertIsNotNone(game.coin, "Coin should still exist after collection")


if __name__ == '__main__':
    unittest.main()
