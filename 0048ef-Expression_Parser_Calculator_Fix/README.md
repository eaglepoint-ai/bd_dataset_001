# Expression Parser Calculator Fix

## Problem Statement

A mathematical expression parser used in internal tools is producing incorrect results. Users report that `2 + 3 * 4` returns 20 instead of 14, expressions with parentheses crash the parser, and negative numbers are not recognized. The Calculator class needs to be fixed to properly evaluate mathematical expressions following standard order of operations (PEMDAS) while maintaining the same public API.

## Context

**Role:** Senior Python Engineer

**Situation:** Your company's internal calculation tool uses a custom expression parser. Users are reporting multiple issues: operator precedence is ignored, parentheses cause crashes, and negative numbers don't work. The original developer is no longer available. You need to fix all bugs while maintaining the same `evaluate(expression)` function signature.

**Scale Assumptions:**
- Expressions up to 1000 characters
- Nested parentheses up to 50 levels deep
- Used in financial calculations (precision matters)

## Core Requirements (Must Fix)

### 1. Order of Operations (PEMDAS)
- **P**arentheses first
- **E**xponents (`^`)
- **M**ultiplication / **D**ivision (left to right)
- **A**ddition / **S**ubtraction (left to right)
- **Bug:** Currently evaluates strictly left-to-right

### 2. Parentheses Support
- Handle nested parentheses: `((2 + 3) * 4)`
- **Bug:** Currently ignores parentheses completely

### 3. Negative Numbers
- Support unary minus: `-5 + 3`, `5 * -3`, `(-5)`
- **Bug:** Currently treats `-` only as binary subtraction

### 4. Division by Zero
- Return error message, don't crash
- **Bug:** Currently raises unhandled `ZeroDivisionError`

### 5. Decimal Numbers
- Support floats: `3.14 * 2`
- Handle precision gracefully

### 6. Whitespace Handling
- Both `2+3` and `2 + 3` should work
- **Bug:** Inconsistent behavior

### 7. Input Validation
- Return clear error for invalid expressions
- **Bug:** Crashes on malformed input

## Constraints

- Do NOT use `eval()` or `exec()`
- Do NOT use external libraries (sympy, numexpr, etc.)
- Must handle invalid expressions gracefully (return error string)
- Same function signature: `evaluate(expression: str) -> float | str`
- Pure Python, no dependencies beyond standard library

## Acceptance Criteria

```python
# PEMDAS
evaluate("2 + 3 * 4")         # → 14 (not 20)
evaluate("10 - 2 * 3")        # → 4 (not 24)
evaluate("8 / 4 * 2")         # → 4 (left to right for same precedence)

# Parentheses
evaluate("(2 + 3) * 4")       # → 20
evaluate("((2 + 3) * 2) + 1") # → 11
evaluate("10 / (5 - 3)")      # → 5

# Exponents
evaluate("2 ^ 3")             # → 8
evaluate("2 ^ 3 ^ 2")         # → 512 (right-to-left for exponents)

# Negative numbers
evaluate("-5 + 3")            # → -2
evaluate("5 * -3")            # → -15
evaluate("(-5) * (-3)")       # → 15

# Decimals
evaluate("3.14 * 2")          # → 6.28
evaluate("10 / 4")            # → 2.5

# Error handling
evaluate("10 / 0")            # → "Error: Division by zero"
evaluate("2 + + 3")           # → "Error: Invalid expression"
evaluate("")                  # → "Error: Empty expression"
evaluate("abc")               # → "Error: Invalid expression"
```

## Bugs Summary

| # | Bug | Location | Current Behavior | Expected |
|---|-----|----------|------------------|----------|
| 1 | No PEMDAS | `_calculate()` | `2+3*4` = 20 | 14 |
| 2 | No parentheses | `_tokenize()` | `(2+3)*4` = wrong | 20 |
| 3 | No unary minus | `_tokenize()` | `-5+3` crashes | -2 |
| 4 | No div-by-zero check | `_apply_operator()` | `10/0` crashes | Error message |
| 5 | Bad validation | `_calculate()` | `2++3` crashes | Error message |

## Technical Hints

The recommended approach is to use **Dijkstra's Shunting-yard algorithm**:
1. **Tokenize** the expression into numbers, operators, and parentheses
2. **Convert** infix notation to postfix (Reverse Polish Notation)
3. **Evaluate** the postfix expression using a stack

Key considerations:
- Distinguish between unary minus (`-5`) and binary minus (`5 - 3`)
- Handle right-associativity for exponents (`2^3^2` = `2^(3^2)` = 512)
- Use `Decimal` for better precision in financial calculations (optional)

## File Structure


```
repository_before/
└── calculator.py    # Original buggy implementation
repository_after/
└── calculator.py    # Refactored/fixed implementation
tests/
	test_before.py   # Tests for before
	test_after.py    # Tests for after
evaluation/
	evaluation.py    # Evaluation script
```
## patch file generation
``` git diff --no-index repository_before repository_after > patches/diff.patch ```

## Commands

Test repository_before:
```sh
docker compose run --rm app python -m pytest tests/test_before.py -v
```

Test repository_after:
```sh
docker compose run --rm app python -m pytest tests/test_after.py -v
```

Run evaluation:
```sh
docker compose run --rm app python evaluation/evaluation.py
```





