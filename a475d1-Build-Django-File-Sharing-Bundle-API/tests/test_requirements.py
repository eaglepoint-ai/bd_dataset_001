import os
import sys
import pytest
from pathlib import Path
from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
import django

# Add repository_after to sys.path
REPO_AFTER_PATH = Path(__file__).resolve().parent.parent / "repository_after"
sys.path.append(str(REPO_AFTER_PATH))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Post, File, Bundle

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
    return User.objects.create_user(**user_data)

@pytest.fixture
def authenticated_client(create_user, api_client):
    api_client.force_authenticate(user=create_user)
    return api_client

@pytest.fixture
def another_user():
    return User.objects.create_user(username='other', password='password')

@pytest.mark.django_db
class TestRequirements:
    
    def test_tech_stack_dependencies(self):
        """Req 1-7: Check Tech Stack and Dependencies"""
        req_file = REPO_AFTER_PATH / "requirements.txt"
        content = req_file.read_text()
        
        assert "django" in content.lower() 
        assert "djangorestframework" in content
        assert "djangorestframework-simplejwt" in content
        assert "django-cors-headers" in content
    
    def test_settings_configuration(self):
        """Req 5, 6, 7: JWT, CORS, Multipart"""
        # JWT
        assert 'rest_framework_simplejwt' in settings.INSTALLED_APPS
        assert 'rest_framework_simplejwt.authentication.JWTAuthentication' in settings.REST_FRAMEWORK['DEFAULT_AUTHENTICATION_CLASSES']
        
        # CORS
        assert 'corsheaders' in settings.INSTALLED_APPS
        assert 'corsheaders.middleware.CorsMiddleware' in settings.MIDDLEWARE
        
        # File Upload settings
        assert settings.MEDIA_URL == '/media/'
        assert str(settings.MEDIA_ROOT).endswith('media')

    def test_models_structure(self):
        """Req 11: Necessary files (models)"""
        # Post Model
        post_fields = [f.name for f in Post._meta.get_fields()]
        assert 'title' in post_fields
        assert 'content' in post_fields
        assert 'author' in post_fields
        
        # File Model
        file_fields = [f.name for f in File._meta.get_fields()]
        assert 'file' in file_fields
        assert 'author' in file_fields
        
        # Bundle Model
        bundle_fields = [f.name for f in Bundle._meta.get_fields()]
        assert 'name' in bundle_fields
        assert 'description' in bundle_fields
        assert 'files' in bundle_fields
        assert 'shared_with' in bundle_fields
        assert 'share_id' in bundle_fields

    def test_auth_endpoints(self, api_client, user_data):
        """Req 8: JWT required for endpoints, registration public"""
        # Registration (Public)
        response = api_client.post('/api/user/register/', user_data)
        assert response.status_code == status.HTTP_201_CREATED
        
        # Token Obtain (Public)
        response = api_client.post('/api/token/', {
            'username': user_data['username'],
            'password': user_data['password']
        })
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data

    def test_file_upload_and_permissions(self, authenticated_client, create_user):
        """Req 7, 8, 9: File uploads, JWT auth, Permissions"""
        file_content = b"test content"
        file = SimpleUploadedFile("test.txt", file_content)
        
        response = authenticated_client.post('/api/upload/', {'file': file}, format='multipart')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['author'] == create_user.username
        
        # Verify uploaded file exists in DB
        assert File.objects.count() == 1
        assert File.objects.first().author == create_user

    def test_post_creation_and_visibility(self, authenticated_client, create_user, another_user):
        """Requirements: Users see only their own posts"""
        # Create post for main user
        authenticated_client.post('/api/posts/', {'title': 'My Post', 'content': 'Content'})
        
        # Create post for another user directly in DB
        Post.objects.create(title='Other Post', content='Content', author=another_user)
        
        # List posts - should only see own
        response = authenticated_client.get('/api/posts/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['title'] == 'My Post'

    def test_bundle_creation_and_sharing(self, authenticated_client, create_user, another_user):
        """Req 10, 11: bundles, sharing logic"""
        # Setup files
        f1 = File.objects.create(file="f1.txt", author=create_user)
        
        # Create bundle
        response = authenticated_client.post('/api/bundles/', {
            'name': 'My Bundle',
            'files': [f1.id]
        })
        assert response.status_code == status.HTTP_201_CREATED
        bundle_id = response.data['id']
        share_id = response.data['share_id']
        
        # Share with another user
        url = f'/api/bundles/{bundle_id}/share_with_users/'
        response = authenticated_client.post(url, {'user_ids': [another_user.id]})
        assert response.status_code == status.HTTP_200_OK
        
        # Verify DB
        bundle = Bundle.objects.get(pk=bundle_id)
        assert another_user in bundle.shared_with.all()
        
        # Test Public Share Access (Unon-authenticated)
        client = APIClient() 
        public_url = f'/api/bundles/share/{share_id}/'
        response = client.get(public_url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'My Bundle'

    def test_bundle_file_ownership_validation(self, authenticated_client, create_user, another_user):
        """Req: Only author's files can be added to bundles"""
        other_file = File.objects.create(file="other.txt", author=another_user)
        
        response = authenticated_client.post('/api/bundles/', {
            'name': 'Illegal Bundle',
            'files': [other_file.id]
        })
        # Should fail validation
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_bundle_download(self, authenticated_client, create_user):
        """Req: Bundles download as in-memory ZIP"""
        f1 = File.objects.create(file="test_dl.txt", author=create_user)
        # We need a real file for zip to read
        with open(f1.file.path, 'wb') as f:
            f.write(b"content")

        bundle = Bundle.objects.create(name="DL Bundle", author=create_user)
        bundle.files.add(f1)
        
        url = f'/api/bundles/{bundle.id}/download/'
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response['Content-Type'] == 'application/zip'
        assert 'attachment' in response['Content-Disposition']

