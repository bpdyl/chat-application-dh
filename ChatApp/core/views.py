from concurrent.futures import thread
from django.contrib.auth.decorators import login_required
from django.core.serializers import serialize
from django.http.response import JsonResponse
from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.contrib.auth import login, authenticate
from django.contrib.auth.decorators import login_required

from accounts.models import CustomUser
from .forms import UserRegistrationForm
from .models import GroupChatThread, PrivateChatThread
from itertools import chain
# Create your views here.



def index(request):
    return render(request,'core/login.html')


def register_user(request, *args, **kwargs):
    if request.user.is_authenticated:
        return redirect('core:conversation')
       
    else:
        context = {}
        if request.POST:
            form = UserRegistrationForm(request.POST)
            print("I am here")
            print(form.data.get('email'))
            if form.is_valid():
                form.save()
                first_name = form.cleaned_data.get('first_name')
                print(first_name)
                last_name = form.cleaned_data.get('last_name')
                email = form.cleaned_data.get('email').lower()
                raw_password = form.cleaned_data.get('password1')
                user_account = authenticate(email = email, password = raw_password)
                print(user_account)
                login(request, user_account)
                destination_page = kwargs.get("next")
                if destination_page:
                    return redirect(destination_page)
                return redirect('core:conversation')
            else:
                context['user_registration_form'] = form
        
        else:
            form = UserRegistrationForm()
            context['user_registration_form'] = form
        return render(request, 'core/login.html',context)

@login_required
def chat_section(request):
    return render(request,'core/chat_section.html')


@login_required
def private_chat(request,*args,**kwargs):
    current_user = request.user
    logged_user = CustomUser.objects.values(
        'id',
        'first_name',
        'last_name',
        'username',
        'profile_image',
    ).get(id = current_user.id)
    thread_id = request.GET.get('thread_id')
    context = {}
    context['current_user'] = logged_user
    if thread_id:
        private_thread = PrivateChatThread.objects.get(pk = thread_id)
        context['private_thread'] = private_thread
        context['private_thread_json'] = serialize('jsonl',private_thread)
    threads1 = PrivateChatThread.objects.filter(first_user = current_user, is_active = True)
    threads2 = PrivateChatThread.objects.filter(second_user = current_user, is_active = True)
    threads = list(chain(threads1, threads2))

    message_and_friends = []
    for thread in threads:
        if thread.first_user == current_user:
            friend = thread.second_user
        else:
            friend = thread.first_user
        
        message_and_friends.append({
            'message': "",
            'friend': friend
        })
    context['message_and_friends'] = message_and_friends
    return render(request,"core/chat_section.html",context)

@login_required
def create_or_return_private_chat(request, *args,**kwargs):
    first_user = request.user
    data = {}
    if request.is_ajax() and request.method == "POST":
        second_user_id = request.POST.get("second_user_id")
        try:
            second_user = CustomUser.objects.get(pk = second_user_id)
            private_thread = PrivateChatThread.objects.create_room_if_none(first_user,second_user)
            data['response'] = "Successfully got the chat."
            data['private_thread_id'] = private_thread.id
        except CustomUser.DoesNotExist:
            data['response'] = "Unable to start a chat with that user."
    else:
        return HttpResponse("Sorry something went wrong")
    return JsonResponse(data)

def get_group_members(group_id=None, group_obj=None, user=None):
    
    if group_id:
        groupchat = GroupChatThread.objects.get(id=id)
    else:
        groupchat = group_obj

    current_members= []
    for member in groupchat.user_set.values_list('username', flat=True):
        if member != user:
            current_members.append(member.title())
    current_members.append('You')
    return ', '.join(current_members)

