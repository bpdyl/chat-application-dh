from .models import PrivateChatThread,PrivateChatMessage
from django.dispatch import receiver
from django.db.models.signals import pre_save

@receiver(pre_save, sender = PrivateChatMessage)
def update_PrivateChatThread(sender, instance, **kwargs):
    instance.chat_thread.save()