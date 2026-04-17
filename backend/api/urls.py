from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    GameSaveViewSet,
    register_view,
    update_profile_view,
    get_profile_view
)

router = DefaultRouter()
router.register(r'games', GameSaveViewSet, basename='games')

urlpatterns = [
    # Аутентификация
    path('auth/register/', register_view, name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Профиль пользователя
    path('auth/profile/', get_profile_view, name='get_profile'),
    path('auth/profile/update/', update_profile_view, name='update_profile'),

    # Сохранения игр
    path('', include(router.urls)),
]