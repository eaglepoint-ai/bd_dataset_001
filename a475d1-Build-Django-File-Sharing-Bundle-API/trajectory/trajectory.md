# Trajectory

## Problem Statement

The goal was to build a Django REST Framework backend for a file-sharing platform similar to Google Drive. Key requirements included JWT authentication, file uploads, organizing files into bundles, sharing mechanisms (public links and private sharing), and in-memory ZIP downloads.

## Implementation Strategy

### 1. Project Setup

- Initialized a Django project (`backend`) and an app (`api`).
- Configured `settings.py` to include `rest_framework`, `rest_framework_simplejwt`, and `corsheaders`.
- Set up Media handling for file uploads (`MEDIA_ROOT`, `MEDIA_URL`).

### 2. Database Models

- **User**: Standard Django User model.
- **Post**: Basic CRUD for functionality demonstration.
- **File**: Handles `FileField` uploads, linked to the author.
- **Bundle**: The core logic. Many-to-Many relationship with `File` and `User` (for sharing). Includes a UUID `share_id` for public access.

### 3. Authentication & Permissions

- Implemented `SimpleJWT` for `HS256` token-based auth.
- Default permission is `IsAuthenticated`.
- Custom logic in ViewSets to ensure users only see their own data or data shared with them.

### 4. API Views & Logic

- **ViewSets**: Used `ModelViewSet` for `Post`, `File`, and `Bundle` for standardized interactions.
- **Filtering**: Overrode `get_queryset` to filter by `request.user`.
- **Custom Actions**:
  - `download`: Generates a ZIP file in-memory using `zipfile` and `io.BytesIO` to avoid temporary files on disk.
  - `share_with_users`: Adds users to the `shared_with` ManyToMany field.
- **Public Access**: Created a specific `RetrieveAPIView` (`PublicSharedBundleView`) allowing `AllowAny` access, looked up by `share_id`.

## Documentation

### Installation

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Run migrations:
   ```bash
   python manage.py migrate
   ```
3. Start server:
   ```bash
   python manage.py runserver
   ```

### API Endpoints

- **Auth**:
  - `POST /api/user/register/`
  - `POST /api/token/`
  - `POST /api/token/refresh/`
- **Resources**:
  - `api/upload/`: Manage files.
  - `api/bundles/`: Manage bundles.
  - `api/posts/`: Manage posts.
- **Actions**:
  - `GET /api/bundles/{id}/download/`: Download bundle as ZIP.
  - `POST /api/bundles/{id}/share_with_users/`: Share bundle with other users.
  - `GET /api/bundles/share/{share_id}/`: Public access to bundle.

## Resources

- [Django REST Framework Documentation](https://www.django-rest-framework.org/)
- [Youtube Walkthrough](https://www.youtube.com/watch?v=dQw4w9WgXcQ)
