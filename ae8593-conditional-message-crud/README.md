# Conditional Message CRUD Application

## Problem Statement
Build a Django-based CRUD application for managing messages with conditional visibility based on user roles. The application must support three types of unlocking mechanisms: time-based, dependency-based, and puzzle-based. Users can create, read, update, and delete messages, but visibility is restricted based on roles and unlocking conditions.

## Prompt

**Role:** Senior Python/Django Developer

**Context:** You are tasked with developing a web application using Django that allows users to manage messages. The app must include role-based access control and conditional unlocking features to control message visibility.

## Core Requirements (Must Fix)
- Implement CRUD operations for messages (Create, Read, Update, Delete).
- Support user roles: admin, moderator, user.
- Implement conditional message visibility based on roles.
- Add three unlocking mechanisms:
  - Time-based: Messages unlock after a certain time.
  - Dependency-based: Messages unlock after viewing other messages.
  - Puzzle-based: Messages unlock after solving a puzzle.
- Use Django REST Framework for API endpoints.
- Ensure proper authentication and authorization.

## Bonus (Nice to have)
- Comprehensive test suite covering all features.
- Automated evaluation script that generates JSON reports.
- Docker containerization for easy deployment and testing.
- Bootstrap-based frontend for user interface.

## Constraints
- Use Django 4.2.7 or compatible version.
- Database: SQLite.
- Frontend: HTML templates with Bootstrap.
- Testing: Pytest with Django integration.
- Containerization: Docker and Docker Compose.

## Acceptance Criteria
- All CRUD operations work correctly.
- Role-based visibility is enforced.
- Unlocking mechanisms function as specified.
- All tests pass (16 tests covering CRUD, roles, and unlocking).
- Application runs successfully in Docker.
- Evaluation script generates valid JSON reports.

## Requirements Summary
1. User authentication and role assignment.
2. Message model with fields for content, role visibility, unlock type, etc.
3. Views for CRUD operations with API support.
4. Conditional logic for message visibility based on user role and unlock status.
5. Puzzle model for puzzle-based unlocking.
6. Comprehensive tests for all features.
7. Docker setup for running the application and tests.
8. Evaluation script to run tests and generate reports.

## Folder Layout
```
- docker-compose.yml: Docker Compose configuration.
- Dockerfile: Docker image build instructions.
- requirements.txt: Python dependencies.
- repository_after/: Django project directory.
  - message_app/: Main Django app.
    - models.py: Database models.
    - views.py: Views and API endpoints.
    - serializers.py: DRF serializers.
    - templates/: HTML templates.
    - static/: CSS/JS files.
- tests/: Test suite.
  - test_app.py: Main test file.
  - conftest.py: Pytest configuration.
  - test_counter.py: Pytest plugin for counting tests.
- evaluation/: Evaluation scripts.
  - evaluation.py: Script to run tests and generate JSON reports.
- run_tests.py: Script to run tests and print pass count.
- README.md: This file.
```

## Public API (Must Maintain)
- GET /api/messages/: List messages (filtered by visibility).
- POST /api/messages/: Create new message.
- GET /api/messages/<id>/: Retrieve message.
- PUT /api/messages/<id>/: Update message.
- DELETE /api/messages/<id>/: Delete message.
- POST /api/solve_puzzle/<id>/: Solve puzzle to unlock message.

## Commands

### Run the build image
```bash
docker compose build
```

### Run tests
```bash
docker compose run --rm -e PYTHONPATH=/app/repository_after app pytest -q
```

### Run evaluation
```bash
docker compose run --rm app python evaluation/evaluation.py
```