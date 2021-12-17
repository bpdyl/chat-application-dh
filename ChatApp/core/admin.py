from django.contrib import admin

from .models import *

class PrivateChatMessageAdmin(admin.ModelAdmin):
    model = PrivateChatMessage
    list_display = ['chat_thread','sender','message_content','message_type','timestamp']


class PrivateChatThreadAdmin(admin.ModelAdmin):
    model = PrivateChatThread
    list_display = ['first_user','second_user','is_active','get_connected_users']

admin.site.register(GroupChatThread)
admin.site.register(PrivateChatThread,PrivateChatThreadAdmin)
admin.site.register(GroupChatMessage)
admin.site.register(PrivateChatMessage,PrivateChatMessageAdmin)


# Register your models here.
