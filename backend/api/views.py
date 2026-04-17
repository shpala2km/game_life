from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from .models import GameSave
from .serializers import GameSaveSerializer, GameSaveCreateSerializer

# ====================== Регистрация ======================
@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')

    if not username or not password:
        return Response({'error': 'Username и password обязательны'}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Пользователь с таким именем уже существует'}, status=400)

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password
    )

    # Сохраняем email для удобства на фронтенде
    return Response({
        'message': 'Регистрация прошла успешно',
        'username': user.username,
        'email': user.email
    }, status=201)


# ====================== Обновление профиля ======================
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile_view(request):
    user = request.user

    email = request.data.get('email')
    new_password = request.data.get('new_password')

    updated = False

    # Обновление email
    if email and email != user.email:
        if User.objects.filter(email=email).exclude(id=user.id).exists():
            return Response({'error': 'Пользователь с такой почтой уже существует'}, status=400)
        user.email = email
        updated = True

    # Обновление пароля (без требования старого пароля)
    if new_password:
        if len(new_password) < 6:
            return Response({'error': 'Пароль должен содержать минимум 6 символов'}, status=400)
        user.password = make_password(new_password)
        updated = True

    if updated:
        user.save()
        return Response({
            'message': 'Профиль успешно обновлён',
            'email': user.email
        }, status=200)
    else:
        return Response({'message': 'Ничего не изменено'}, status=200)


# ====================== Сохранения игр ======================
class GameSaveViewSet(viewsets.ModelViewSet):
    queryset = GameSave.objects.all()
    serializer_class = GameSaveSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return GameSave.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def my(self, request):
        games = self.get_queryset()
        serializer = self.get_serializer(games, many=True)
        return Response(serializer.data)


# ====================== Регистрация эндпоинтов ======================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile_view(request):
    user = request.user
    return Response({
        'username': user.username,
        'email': user.email,
    })