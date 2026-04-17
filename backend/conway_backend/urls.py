from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

# Простая приветственная страница
def home_view(request):
    return JsonResponse({
        "message": "✅ Conway's Game of Life Backend is running!",
        "version": "1.0",
        "endpoints": {
            "register": "/api/auth/register/",
            "login": "/api/auth/login/",
            "games": "/api/games/",
            "my_games": "/api/games/my/"
        }
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('', home_view),                    # ← Главная страница
]