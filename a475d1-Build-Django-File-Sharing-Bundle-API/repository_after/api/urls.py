from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    UserRegistrationView, UserListView, PostViewSet, FileViewSet, BundleViewSet, 
    PublicSharedBundleView
)

router = DefaultRouter()
router.register(r'posts', PostViewSet, basename='post')
router.register(r'upload', FileViewSet, basename='file')
router.register(r'bundles', BundleViewSet, basename='bundle')

urlpatterns = [
    # Auth
    path('user/register/', UserRegistrationView.as_view(), name='register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Users
    path('users/', UserListView.as_view(), name='user-list'),

    # Bundles Public Share
    path('bundles/share/<uuid:share_id>/', PublicSharedBundleView.as_view(), name='public-bundle-share'),

    # ViewSets
    path('', include(router.urls)),
]
