import os
import sys
import pytest
from pathlib import Path
import django
from django.conf import settings

# Determine which repository to test based on env var from evaluation.py
TARGET_REPO = os.environ.get("TARGET_REPO")
if not TARGET_REPO:
    if "repository_before" in os.environ.get("PYTHONPATH", ""):
        TARGET_REPO = "repository_before"
    else:
        TARGET_REPO = "repository_after"

REPO_PATH = Path(__file__).resolve().parent.parent / TARGET_REPO
sys.path.append(str(REPO_PATH))

# Configure Django settings if not already configured
if not settings.configured:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
    try:
        django.setup()
    except Exception as e:
        # If setup fails (e.g. in empty repository_before), we handle it in tests or let collection fail
        print(f"Django setup failed: {e}")
        # Fallback configuration to allow imports to succeed even if the project isn't valid
        if not settings.configured:
            settings.configure(
                SECRET_KEY='fallback-secret-key',
                DATABASES = {
                    'default': {
                        'ENGINE': 'django.db.backends.sqlite3',
                        'NAME': ':memory:',
                    }
                },
                INSTALLED_APPS=[
                    'django.contrib.contenttypes',
                    'django.contrib.auth',
                    'rest_framework',
                ],
                REST_FRAMEWORK = {
                   'TEST_REQUEST_RENDERER_CLASSES': [
                       'rest_framework.renderers.MultiPartRenderer',
                       'rest_framework.renderers.JSONRenderer',
                       'rest_framework.renderers.TemplateHTMLRenderer'
                   ]
                }
            )
            django.setup()

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status

# Import models safely - they might not exist in repository_before
try:
    from django.contrib.auth.models import User
except ImportError:
    User = None

try:
    from api.models import Post, File, Bundle
except ImportError:
    Post = None
    File = None
    Bundle = None

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def user_data():
    return {
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'testpassword123'
    }

@pytest.fixture
def create_user(user_data):
    if not User: return None
    return User.objects.create_user(**user_data)

@pytest.fixture
def authenticated_client(create_user, api_client):
    if create_user:
        api_client.force_authenticate(user=create_user)
    return api_client

@pytest.fixture
def another_user():
    if not User: return None
    return User.objects.create_user(username='other', password='password')

@pytest.mark.django_db
class TestRequirements:
    
    def test_tech_stack_dependencies(self):
        """Req 1-7: Check Tech Stack and Dependencies"""
        req_file = REPO_PATH / "requirements.txt"
        if not req_file.exists():
            pytest.fail(f"Req 1, 2, 3, 5, 6: requirements.txt not found in {REPO_PATH}")
            
        content = req_file.read_text()
        
        assert "django" in content.lower(), "Req 2: Django 5.1+ not found"
        assert "djangorestframework" in content, "Req 3: Django REST Framework not found"
        assert "djangorestframework-simplejwt" in content, "Req 5: SimpleJWT not found"
        assert "django-cors-headers" in content, "Req 6: django-cors-headers not found"
    
    def test_settings_configuration(self):
        """Req 5, 6, 7: JWT, CORS, Multipart"""
        if not settings.configured:
             pytest.fail("Req 11: Django settings not configured")
             
        # JWT
        assert 'rest_framework_simplejwt' in settings.INSTALLED_APPS, "Req 5: rest_framework_simplejwt not in INSTALLED_APPS"
        assert 'rest_framework_simplejwt.authentication.JWTAuthentication' in settings.REST_FRAMEWORK['DEFAULT_AUTHENTICATION_CLASSES'], "Req 5: JWTAuthentication not configured in REST_FRAMEWORK defaults"
        
        # CORS
        assert 'corsheaders' in settings.INSTALLED_APPS, "Req 6: corsheaders not in INSTALLED_APPS"
        assert 'corsheaders.middleware.CorsMiddleware' in settings.MIDDLEWARE, "Req 6: CorsMiddleware not in MIDDLEWARE"
        
        # File Upload settings
        assert settings.MEDIA_URL == '/media/', "Req 7: MEDIA_URL setting incorrect"
        assert str(settings.MEDIA_ROOT).endswith('media'), "Req 7: MEDIA_ROOT setting incorrect"

    def test_models_structure(self):
        """Req 11: Necessary files (models)"""
        if not Post or not File or not Bundle:
             pytest.fail("Req 11: Models not imported correctly (models for Post, File, or Bundle missing)")

        # Post Model
        post_fields = [f.name for f in Post._meta.get_fields()]
        assert 'title' in post_fields, "Req 11: Post model missing 'title' field"
        assert 'content' in post_fields, "Req 11: Post model missing 'content' field"
        assert 'author' in post_fields, "Req 11: Post model missing 'author' field"
        
        # File Model
        file_fields = [f.name for f in File._meta.get_fields()]
        assert 'file' in file_fields, "Req 11: File model missing 'file' field"
        assert 'author' in file_fields, "Req 11: File model missing 'author' field"
        
        # Bundle Model
        bundle_fields = [f.name for f in Bundle._meta.get_fields()]
        assert 'name' in bundle_fields, "Req 11: Bundle model missing 'name' field"
        assert 'description' in bundle_fields, "Req 11: Bundle model missing 'description' field"
        assert 'files' in bundle_fields, "Req 11: Bundle model missing 'files' field"
        assert 'shared_with' in bundle_fields, "Req 11: Bundle model missing 'shared_with' field"
        assert 'share_id' in bundle_fields, "Req 11: Bundle model missing 'share_id' field"

    def test_auth_endpoints(self, api_client, user_data):
        """Req 8: JWT required for endpoints, registration public"""
        # Registration (Public)
        try:
            response = api_client.post('/api/user/register/', user_data)
        except AttributeError:
             pytest.fail("Req 8, 10: Auth endpoints misconfigured (likely ROOT_URLCONF or settings issue)")
        assert response.status_code == status.HTTP_201_CREATED, "Req 9: Registration should return 201 Created"
        
        # Token Obtain (Public)
        response = api_client.post('/api/token/', {
            'username': user_data['username'],
            'password': user_data['password']
        })
        assert response.status_code == status.HTTP_200_OK, "Req 5: Token endpoint should return 200 OK"
        assert 'access' in response.data, "Req 5: Token response missing 'access'"
        assert 'refresh' in response.data, "Req 5: Token response missing 'refresh'"

    def test_file_upload_and_permissions(self, authenticated_client, create_user):
        """Req 7, 8, 9: File uploads, JWT auth, Permissions"""
        if not create_user: pytest.fail("Req 1-5: User model missing")
        if not File: pytest.fail("Req 7, 11: File model missing")
        file_content = b"test content"
        file = SimpleUploadedFile("test.txt", file_content)
        
        response = authenticated_client.post('/api/upload/', {'file': file}, format='multipart')
        assert response.status_code == status.HTTP_201_CREATED, "Req 7, 9: File upload failed (expected 201)"
        assert response.data['author'] == create_user.username, "Req 11: File response should include author username"
        
        # Verify uploaded file exists in DB
        assert File.objects.count() == 1, "Req 11: File not saved to DB"
        assert File.objects.first().author == create_user, "Req 11: File author incorrect"

    def test_post_creation_and_visibility(self, authenticated_client, create_user, another_user):
        """Requirements: Users see only their own posts"""
        if not create_user or not another_user: pytest.fail("Req 1-5: User model missing")
        if not Post: pytest.fail("Req 11: Post model missing")
        # Create post for main user
        authenticated_client.post('/api/posts/', {'title': 'My Post', 'content': 'Content'})
        
        # Create post for another user directly in DB
        Post.objects.create(title='Other Post', content='Content', author=another_user)
        
        # List posts - should only see own
        response = authenticated_client.get('/api/posts/')
        assert response.status_code == status.HTTP_200_OK, "Req 9: Get posts failed"
        assert len(response.data) == 1, "Req 11: User should only see their own posts"
        assert response.data[0]['title'] == 'My Post', "Req 11: Incorrect post returned"

    def test_bundle_creation_and_sharing(self, authenticated_client, create_user, another_user):
        """Req 10, 11: bundles, sharing logic"""
        if not create_user or not another_user: pytest.fail("Req 1-5: User model missing")
        if not Bundle or not File: pytest.fail("Req 10, 11: Bundle/File models missing")
        # Setup files
        f1 = File.objects.create(file="f1.txt", author=create_user)
        
        # Create bundle
        response = authenticated_client.post('/api/bundles/', {
            'name': 'My Bundle',
            'files': [f1.id]
        })
        assert response.status_code == status.HTTP_201_CREATED, "Req 10: Bundle creation failed"
        bundle_id = response.data['id']
        share_id = response.data['share_id']
        
        # Share with another user
        url = f'/api/bundles/{bundle_id}/share_with_users/'
        response = authenticated_client.post(url, {'user_ids': [another_user.id]})
        assert response.status_code == status.HTTP_200_OK, "Req 10: Share action failed"
        
        # Verify DB
        bundle = Bundle.objects.get(pk=bundle_id)
        assert another_user in bundle.shared_with.all(), "Req 11: Shared user not in M2M field"
        
        # Test Public Share Access (Unon-authenticated)
        client = APIClient() 
        public_url = f'/api/bundles/share/{share_id}/'
        response = client.get(public_url)
        assert response.status_code == status.HTTP_200_OK, "Req 8, 10: Public share endpoint failed"
        assert response.data['name'] == 'My Bundle', "Req 10: Public share returned incorrect data"

    def test_bundle_file_ownership_validation(self, authenticated_client, create_user, another_user):
        """Req: Only author's files can be added to bundles"""
        if not create_user or not another_user: pytest.fail("Req 1-5: User model missing")
        if not File: pytest.fail("Req 11: File model missing")
        other_file = File.objects.create(file="other.txt", author=another_user)
        
        response = authenticated_client.post('/api/bundles/', {
            'name': 'Illegal Bundle',
            'files': [other_file.id]
        })
        # Should fail validation
        assert response.status_code == status.HTTP_400_BAD_REQUEST, "Req 11: Should restrict adding others' files to bundle"

    def test_bundle_download(self, authenticated_client, create_user):
        """Req: Bundles download as in-memory ZIP"""
        if not create_user: pytest.fail("Req 1-5: User model missing")
        if not Bundle: pytest.fail("Req 11: Bundle model missing")
        f1 = File.objects.create(file="test_dl.txt", author=create_user)
        
        # Ensure directory exists for the test file since we mock file storage or use real FS
        Path(f1.file.path).parent.mkdir(parents=True, exist_ok=True)
        # We need a real file for zip to read
        with open(f1.file.path, 'wb') as f:
            f.write(b"content")

        bundle = Bundle.objects.create(name="DL Bundle", author=create_user)
        bundle.files.add(f1)
        
        url = f'/api/bundles/{bundle.id}/download/'
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK, "Req 10: Download endpoint failed"
        assert response['Content-Type'] == 'application/zip', "Req 10: Content-Type should be application/zip"
        assert 'attachment' in response['Content-Disposition'], "Req 10: Content-Disposition should be attachment"

