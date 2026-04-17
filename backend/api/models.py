from django.db import models
from django.contrib.auth.models import User

class GameSave(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='game_saves')
    
    name = models.CharField(max_length=100, default="Моя игра")
    size = models.PositiveIntegerField(default=16)
    grid = models.JSONField()                    # храним двумерный массив
    generation = models.PositiveIntegerField(default=0)
    rules = models.JSONField(default=dict)       # {"birth": [3], "survival": [2, 3]}
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        verbose_name = "Сохранение игры"
        verbose_name_plural = "Сохранения игр"

    def __str__(self):
        return f"{self.name} ({self.size}×{self.size}) — {self.user.username}"