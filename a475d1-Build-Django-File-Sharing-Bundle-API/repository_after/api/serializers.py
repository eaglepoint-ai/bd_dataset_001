from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Post, File, Bundle

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class PostSerializer(serializers.ModelSerializer):
    author = serializers.ReadOnlyField(source='author.username')

    class Meta:
        model = Post
        fields = ['id', 'title', 'content', 'author', 'created_at', 'updated_at']

class FileSerializer(serializers.ModelSerializer):
    author = serializers.ReadOnlyField(source='author.username')

    class Meta:
        model = File
        fields = ['id', 'file', 'author', 'created_at']

class BundleSerializer(serializers.ModelSerializer):
    author = serializers.ReadOnlyField(source='author.username')
    files = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=File.objects.all()
    )
    share_link = serializers.SerializerMethodField()

    class Meta:
        model = Bundle
        fields = ['id', 'name', 'description', 'author', 'files', 'created_at', 'share_id', 'share_link', 'shared_with']
        read_only_fields = ['share_id', 'shared_with']

    def get_share_link(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/bundles/share/{obj.share_id}/')
        return f'/api/bundles/share/{obj.share_id}/'

    def validate_files(self, files):
        # Users can only add their own files to a bundle
        user = self.context['request'].user
        for file in files:
            if file.author != user:
                raise serializers.ValidationError(f"You create bundles with files you do not own: {file.id}")
        return files
