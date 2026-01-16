from django.contrib.auth.models import User
from rest_framework import viewsets, permissions, status, generics
from rest_framework.response import Response
from rest_framework.decorators import action
from django.http import HttpResponse, Http404
from .models import Post, File, Bundle
from .serializers import UserSerializer, PostSerializer, FileSerializer, BundleSerializer
import zipfile
import io

# User Registration View
class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

# User List View
class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

# Post ViewSet
class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer

    def get_queryset(self):
        return Post.objects.filter(author=self.request.user)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

# File ViewSet
class FileViewSet(viewsets.ModelViewSet):
    serializer_class = FileSerializer

    def get_queryset(self):
        return File.objects.filter(author=self.request.user)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

# Bundle ViewSet
class BundleViewSet(viewsets.ModelViewSet):
    serializer_class = BundleSerializer

    def get_queryset(self):
        from django.db.models import Q
        user = self.request.user
        return Bundle.objects.filter(Q(author=user) | Q(shared_with=user)).distinct()
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        bundle = self.get_object() # Checks permission based on get_queryset
        
        # Create in-memory zip
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, 'w') as zip_file:
            for file_obj in bundle.files.all():
                # Add file to zip. We assume file exists on disk.
                # In production, check storage.
                try:
                    file_path = file_obj.file.path
                    arcname = file_obj.file.name.split('/')[-1] # Simple filename
                    zip_file.write(file_path, arcname)
                except Exception as e:
                    # Log error or ignore missing files
                    pass
        
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/zip')
        response['Content-Disposition'] = f'attachment; filename="{bundle.name}.zip"'
        return response

    @action(detail=True, methods=['post'])
    def share_with_users(self, request, pk=None):
        bundle = self.get_object()
        # Only author should be able to share? 
        if bundle.author != request.user:
             return Response({"detail": "Only the author can share this bundle."}, status=status.HTTP_403_FORBIDDEN)
             
        user_ids = request.data.get('user_ids', [])
        users_to_add = User.objects.filter(id__in=user_ids)
        bundle.shared_with.add(*users_to_add)
        return Response({'status': 'shared', 'shared_with': [u.username for u in users_to_add]})

# Public Shared Bundle View
class PublicSharedBundleView(generics.RetrieveAPIView):
    queryset = Bundle.objects.all()
    serializer_class = BundleSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'share_id'
