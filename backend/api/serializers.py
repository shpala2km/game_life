from rest_framework import serializers
from .models import GameSave

class GameSaveSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameSave
        fields = ['id', 'name', 'size', 'grid', 'generation', 'rules', 'created_at', 'updated_at']
        read_only_fields = ['user', 'created_at', 'updated_at']

class GameSaveCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameSave
        fields = ['name', 'size', 'grid', 'generation', 'rules']