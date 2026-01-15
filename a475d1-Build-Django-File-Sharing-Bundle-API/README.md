# Build Django File Sharing Bundle API

## 1. Problem Statement

The task is to design and implement a full-featured backend for a file sharing platform using Django REST Framework, similar to Google Drive. The system must support user registration and JWT-based authentication, allowing users to securely upload, manage, and organize files into bundles that can be shared privately or publicly via unique share links. Users should only access their own content or bundles shared with them, with automatic author assignment and proper permission enforcement. The backend should provide structured API endpoints for posts, files, bundles, and users, handle file uploads and in-memory ZIP downloads, and be built following best practices with serializers, ViewSets, routers, and environment-based configuration. The project must be fully modular, maintainable, and production-read

## 2. Prompt Used

Build a Django REST Framework backend from scratch for a file sharing platform similar to Google Drive. Tech Stack Django 5.1+ Django REST Framework SQLite JWT auth via djangorestframework-simplejwt CORS via django-cors-headers File uploads with multipart/form-data Project Setup Project: backend App: api Media storage in media/uploads/ Use env vars for secrets Authentication JWT auth (Access: 30 min, Refresh: 1 day) User registration endpoint (public) Login + token refresh Use Django User model Models Post: title, content, author, created_at, updated_at (users only see their own) File: file, author, created_at Bundle: name, description many-to-many with File author created_at share_id (unique, auto-generated) shared_with (many-to-many User) API Endpoints Auth: POST /api/user/register/ POST /api/token/ POST /api/token/refresh/ Files: POST /api/upload/ GET /api/upload/ Bundles (ViewSet): CRUD /api/bundles/ GET /api/bundles/<id>/download/ (ZIP) POST /api/bundles/<id>/share_with_users/ GET /api/bundles/share/<share_id>/ (public) Posts: CRUD /api/posts/ Users: GET /api/users/ Business Logic Users can see bundles they own or that are shared with them Only author’s files can be added to bundles Bundles download as in-memory ZIP Public access via share_id Authors auto-assigned from request.user Requirements JWT required for all endpoints except registration & public share Proper permissions, status codes, serializers Use ViewSets, routers, and custom actions Provide all necessary files (models, serializers, views, urls, settings)

## 3. Requirements Specified

1 Tech Stack
2 Django 5.1+
3 Django REST Framework
4 SQLite
5 JWT auth via djangorestframework-simplejwt
6 CORS via django-cors-headers
7 File uploads with multipart/form-data
8 JWT required for all endpoints except registration & public share
9 Proper permissions, status codes, serializers
10 Use ViewSets, routers, and custom actions
11 Provide all necessary files (models, serializers, views, urls, settings)

## 4. Commands

### Run tests on `repository_before`

     ```bash
     docker-compose run --rm -e PYTHONPATH=repository_before app pytest -v --tb=no tests/test_requirements.py
     ```

### Run tests on `repository_after`

     ```bash
     docker-compose run --rm -e PYTHONPATH=repository_after app pytest -v --tb=no tests/test_requirements.py
     ```

### Run Evaluation

     ```bash
     docker-compose run --rm app python evaluation/evaluation.py
     ```
