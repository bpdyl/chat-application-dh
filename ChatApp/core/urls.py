from django.urls import path
from django.urls.resolvers import URLPattern
from django.urls import reverse_lazy
from . import views
from accounts.views import search_user

app_name = "core"

urlpatterns = [
    path('',views.private_chat,name = 'conversation'),
    path('search/',search_user, name='search'),
    path('create_or_return_private_chat/',views.create_or_return_private_chat, name='create-or-return-private-chat')

]