import uuid
from django.db import models
from django.contrib.auth.models import User

class Post(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class File(models.Model):
    file = models.FileField(upload_to='uploads/')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_files')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file.name

class Bundle(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bundles')
    files = models.ManyToManyField(File, related_name='bundles')
    created_at = models.DateTimeField(auto_now_add=True)
    share_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    shared_with = models.ManyToManyField(User, related_name='shared_bundles', blank=True)

    def __str__(self):
        return self.name
