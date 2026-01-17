# Testing Guide

## Running Tests

```bash
cd repository_after
npm test
```

You should see 66 tests pass across 8 test suites.

## What Gets Tested

### Core Algorithm (`moodToShape.test.ts`)

Tests the function that converts mood text into shape properties:

- Same mood always produces same shape (deterministic)
- Different moods produce different shapes
- Empty input throws error
- Long text gets handled properly
- 100 random moods all produce valid shapes (requirement #4)
- Colors are valid hex codes
- Size is between 80-200 pixels
- Speed is between 1-10

### Storage (`storageManager.test.ts`)

Tests LocalStorage operations:

- Saving moods works
- Loading saved moods works
- Clearing all moods works
- Deleting specific mood works
- Handles corrupted data gracefully
- Returns empty array when no data

### Components

**MoodInput** - Tests form behavior:
- Input field renders
- Submit button works
- Empty input shows error (requirement #3)
- Character counter works

**ShapeCanvas** - Tests canvas rendering:
- Canvas element is created
- Animations don't crash
- Cleanup works properly

**MoodCard** - Tests gallery display:
- Shows mood text
- Shows formatted date

**ErrorMessage** - Tests error display:
- Shows error message when provided

### Integration Tests

Tests complete user flows:

- User can input mood and generate shape
- User can save generated mood
- Gallery shows saved moods
- Gallery shows empty state when no moods
- Can clear all moods
- Moods persist across page reloads

## Test Structure

Each test file follows this pattern:

```javascript
describe('ComponentName', () => {
  test('does something specific', () => {
    // Arrange: Set up
    // Act: Do something
    // Assert: Check result
  });
});
```

## Understanding Test Output

When tests pass:
```
Test Suites: 8 passed, 8 total
Tests:       66 passed, 66 total
```

When a test fails, Jest shows:
- Which test failed
- What was expected
- What was received
- Stack trace to help debug

## Requirements Coverage

| Requirement | Test File | Test Count |
|-------------|-----------|------------|
| #1: Save locally | `storageManager.test.ts` | 8 tests |
| #2: Canvas animations | `ShapeCanvas.test.tsx` | 5 tests |
| #3: Empty input error | `MoodInput.test.tsx` | 4 tests |
| #4: Valid shapes | `moodToShape.test.ts` | 6 tests |

All requirements are covered by tests.
