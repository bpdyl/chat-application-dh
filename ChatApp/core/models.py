from django.db import models
from django.contrib.auth.models import Group
# Create your models here.
class GroupChat(Group):
    group_name = models.CharField(max_length=100,null=True)
    image = models.ImageField(default='group_photos/nouser.jpg',upload_to='group_photos')
    group_description = models.TextField(blank=True, help_text="description of the group")
    created_at = models.DateTimeField(auto_now_add=True,auto_now=False)
    updated_at = models.DateTimeField(auto_now=True)
    
