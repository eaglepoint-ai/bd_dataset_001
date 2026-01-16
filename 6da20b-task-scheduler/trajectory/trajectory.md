# Trajectory: Task Scheduler Bug Fixes

This document describes the problem-solving process, issues encountered, and solutions implemented to fix the task scheduler.

## Initial Analysis

### Understanding the Problem

The task scheduler was designed to:
1. Read task definitions from `task.json`
2. Schedule tasks across multiple days
3. Respect time window constraints (earliest start, latest finish)
4. Handle dependencies (`after` - must start after another task)
5. Handle exclusion constraints (`not_same_day_as` - cannot be on same day)

### Running the Original Code

First attempt to run the original scheduler:

```bash
cd repository_before
python3 scheduler.py
```

**Result**: `RecursionError: maximum recursion depth exceeded`

The scheduler crashed immediately when processing Task C which had a `not_same_day_as` constraint.

---

## Issues Identified

### Issue 1: File Path Handling

**Problem**: The code used `open("task.json")` which only works if you run the script from its own directory.

```python
# Original (broken)
with open("task.json") as f:
    tasks = json.load(f)
```

**Error when run from different directory**:
```
FileNotFoundError: [Errno 2] No such file or directory: 'task.json'
```

**Solution**: Use path relative to script location:
```python
script_dir = os.path.dirname(os.path.abspath(__file__))
task_file = os.path.join(script_dir, "task.json")
```

---

### Issue 2: Null Value Handling

**Problem**: JSON can have explicit `null` values. The code used:

```python
earliest = task.get("earliest", 0)  # Returns None if key exists with null value!
```

When `task.json` contains `"earliest": null`, this returns `None`, not `0`.

**Error**:
```
TypeError: '<' not supported between instances of 'NoneType' and 'int'
```

**Solution**: Explicitly check for None:
```python
task["earliest"] = task.get("earliest") if task.get("earliest") is not None else 0
task["latest"] = task.get("latest") if task.get("latest") is not None else 24
```

---

### Issue 3: Infinite Recursion (Critical!)

**Problem**: The `not_same_day_as` constraint caused infinite recursion:

```python
# Original (broken)
if task.get("not_same_day_as") and task["not_same_day_as"] in schedule:
    dep_day = schedule[task["not_same_day_as"]][2]
    return find_time_for_task({**task, "earliest": earliest, "latest": latest, "day": dep_day + 1})
```

**Why it loops forever**:
1. Task C has `not_same_day_as: "Task A"`
2. Task A is on day 1
3. Code sets `day: 2` and calls itself
4. But the constraint `not_same_day_as` is still in the task!
5. It checks again: is Task A on same day? Task A is on day 1, we're trying day 2... 
6. Wait, the code checks `schedule[task["not_same_day_as"]][2]` which is still day 1
7. So it thinks we need to move to day 2 again... but we're already trying day 2
8. The `day` parameter wasn't being used correctly!

**The Real Bug**: The function was passing `day: dep_day + 1` but then reading from `task.get("day", day)` where `day` was the global variable (always 1), not the passed parameter.

**Solution**: 
1. Use a `current_day` parameter instead of global state
2. Track recursion to prevent infinite loops
3. Properly increment and pass the day through recursion

```python
def find_time_for_task(task, current_day=1, visited_for_recursion=None):
    if task.get("not_same_day_as") in schedule:
        dep_day = schedule[task["not_same_day_as"]][2]
        if current_day == dep_day:
            return find_time_for_task(task, current_day + 1, visited_for_recursion)
```

---

### Issue 4: Global State Management

**Problem**: The code used global variables poorly:

```python
schedule = {}
day = 1  # Global, never updated!

def find_time_for_task(task):
    # Uses global 'schedule' and 'day'
    return (start, end, task.get("day", day))  # Always returns day=1!
```

**Solution**: Encapsulate in a function with proper state:

```python
def schedule_tasks(tasks):
    schedule = {}  # Local to this function
    
    def find_time_for_task(task, current_day=1):
        # Uses closure for schedule, parameter for day
        return (start, end, current_day)
```

---

### Issue 5: Missing Input Validation

**Problems**:
- No check if `earliest >= latest` (impossible time window)
- No check if duration exceeds time window
- No check for circular dependencies (`A after B`, `B after A`)
- No check for missing required fields

**Solution**: Added comprehensive validation:

```python
# Check required fields
if "name" not in task:
    print("Error: Task missing 'name' field")
    return None

# Validate time constraints
if task["earliest"] >= task["latest"]:
    print(f"Error: Task '{task['name']}' earliest >= latest")
    return None

if task["duration"] > (task["latest"] - task["earliest"]):
    print(f"Error: Task '{task['name']}' duration doesn't fit in time window")
    return None

# Check circular dependencies
def has_circular_dependency(task_name, visited=None):
    if visited is None:
        visited = set()
    if task_name in visited:
        return True
    visited.add(task_name)
    # ... recurse through dependencies
```

---

## Testing Process

### Creating Test Cases

We created 9 test cases to cover:

| Test | Description | Before | After |
|------|-------------|--------|-------|
| Basic Scheduling | Simple tasks, no deps | ✓ PASS | ✓ PASS |
| After Dependency | Task B after Task A | ✓ PASS | ✓ PASS |
| Not Same Day | Exclusion constraint | ✗ FAIL (recursion) | ✓ PASS |
| Null Values | Handle JSON nulls | ✗ FAIL (TypeError) | ✓ PASS |
| Invalid Time Window | earliest > latest | ✗ FAIL (no error) | ✓ PASS |
| Task Too Long | Duration > window | ✗ FAIL (no error) | ✓ PASS |
| Missing Dependency | Reference to non-existent | ✗ FAIL (no warning) | ✓ PASS |
| Multi-day Scheduling | Tasks spanning days | ✓ PASS | ✓ PASS |
| Complex Constraints | Both constraint types | ✗ FAIL (recursion) | ✓ PASS |

### Running Tests

```bash
# Before: 3/9 passed (33%)
python3 tests/test_scheduler.py repository_before/scheduler.py

# After: 9/9 passed (100%)
python3 tests/test_scheduler.py repository_after/scheduler.py
```

---

## Challenges Faced

### Challenge 1: Understanding the Recursion Bug

The infinite recursion was tricky because:
- The error message just said "maximum recursion depth exceeded"
- The logic *looked* correct at first glance
- Had to trace through manually to see the `day` parameter wasn't being used

**Debugging approach**: Added print statements to trace the recursion:
```python
print(f"find_time_for_task called with day={task.get('day')}, current_day param missing!")
```

### Challenge 2: Preserving Original Behavior

We wanted to fix bugs while keeping the same output format and general approach. This meant:
- Not completely rewriting the algorithm
- Keeping the same data structures where possible
- Adding features incrementally

### Challenge 3: Test Isolation

Each test needed to run the scheduler in isolation with its own `task.json`. Solution: create temporary directories for each test run.

---

## Final Results

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Tests Passed | 3/9 | 9/9 | +6 tests |
| Pass Rate | 33% | 100% | +67% |
| Crashes | Yes (RecursionError) | No | Fixed |
| Error Messages | Poor | Descriptive | Improved |

---

## Lessons Learned

1. **Always use absolute paths** for file operations in scripts
2. **Don't trust `.get()` defaults** when JSON can have explicit nulls
3. **Trace recursive functions carefully** - parameters must actually be used
4. **Avoid global state** in favor of function parameters and closures
5. **Validate inputs early** to give clear error messages
6. **Test edge cases** - the happy path often works, it's the edge cases that break

---

## Files Changed

- `repository_after/scheduler.py` - Fixed all issues
- `tests/test_scheduler.py` - Comprehensive test suite
- `evaluation/evaluation.py` - Comparative evaluation
- `patches/diff.patch` - Unified diff of changes

