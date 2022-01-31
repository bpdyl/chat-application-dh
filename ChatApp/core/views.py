from concurrent.futures import thread
from django.contrib import auth
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import Group
from django.core.serializers import serialize
from django.http.response import JsonResponse
from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.contrib.auth import login, authenticate
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.db.models import Value as V
from django.db.models.functions import Concat
from datetime import datetime
from accounts.models import CustomUser
from friends.models import FriendList
from .forms import AccountAuthenticationForm, GroupChatCreationForm, UserRegistrationForm
from .models import GroupChatThread, Keys, PrivateChatMessage, PrivateChatThread
from itertools import chain
from .serializers import PrivateChatThreadSerializer, GroupChatThreadSerializer
from rest_framework.response import Response
from rest_framework import viewsets
from operator import attrgetter
from ChatApp import settings,broadcast
from .DoubleDiffie import DiffieHellman
import pytz

# Create your views here.

DEBUG = False

def get_redirect_if_exists(request):
    redirect = None 
    if request.GET:
        if request.GET.get("next"):

            redirect = str(request.GET.get("next"))
    return redirect


def login_view(request):
    context = {}
    current_user = request.user
    if current_user.is_authenticated:
        return redirect("core:conversation")
    destination = get_redirect_if_exists(request)
    print("Destination",destination)
    if request.POST:
        form = AccountAuthenticationForm(request.POST)
        if form.is_valid():
            email = request.POST['email']
            password = request.POST['password']
            user = authenticate(email = email, password = password)
            if user:
                login(request,user)
                if destination:
                    return redirect(destination)
                return redirect("core:conversation")
        else:
            context['login_form'] = form

            print("Invalid login form")
    else:
        form = AccountAuthenticationForm()
        context['login_form'] = form
    return render(request,'core/login2.html',context)




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
                username = form.cleaned_data.get('username')

                print(first_name)
                last_name = form.cleaned_data.get('last_name')
                email = form.cleaned_data.get('email').lower()
                raw_password = form.cleaned_data.get('password1')
                user_account = authenticate(email = email, password = raw_password)
                print(user_account)
                login(request, user_account)
                usr = CustomUser.objects.filter(username = username).first()
                store_keys(usr)
                destination_page = kwargs.get("next")
                if destination_page:
                    return redirect(destination_page)
                return redirect('core:conversation')
            else:
                print("form is invalid")
                context['reg_form'] = form
        else:
            form = UserRegistrationForm()
            context['reg_form'] = form
        return render(request, 'core/signup.html',context)

@login_required
def chat_section(request):
    return render(request,'core/chat_section.html')


@login_required
def chat_thread_view(request,*args,**kwargs):
    current_user = request.user
    group = None
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
    group_ids = current_user.groups.values_list('id')
    group_threads = GroupChatThread.objects.filter(id__in = group_ids)
    threads = sorted(chain(threads1, threads2,group_threads),key = attrgetter('updated_at'),reverse = True)
    for thread in threads:
        if hasattr(thread,'first_user') or hasattr(thread,'second_user'):
            if thread.first_user == current_user:
                friend = thread.second_user
            else:
                friend = thread.first_user
            friend_list = FriendList.objects.get(user = current_user)
            if not friend_list.is_mutual_friend(friend):
                private_chat = PrivateChatThread.objects.create_room_if_none(current_user,friend)
                private_chat.is_active = False
                private_chat.save()
        else:
            group = thread

    context['chat_threads'] = threads
    context['thread_id'] = thread_id
    return render(request,"core/index.html",context)

@login_required
def test_room_view(request,*args,**kwargs):
    room_id = request.GET.get("room_id")
    user = request.user
    context = {}
    context['m_and_f'] = get_recent_chatroom_messages(user)
    if room_id:
        context['room_id'] = room_id
    context['debug'] = DEBUG
    context['debug_mode'] = settings.DEBUG
    return render(request,"core/test_demo.html",context)

def get_recent_chatroom_messages(user):
    rooms1 = PrivateChatThread.objects.filter(first_user = user, is_active = True)
    rooms2 = PrivateChatThread.objects.filter(second_user = user, is_active = True)
    rooms = list(chain(rooms1,rooms2))

    m_and_f = []
    for room in rooms:
        if room.first_user == user:
            friend = room.second_user
        else:
            friend = room.first_user

        friend_list = FriendList.objects.get(user= user)
        if not friend_list.is_mutual_friend(friend):
            chat = PrivateChatThread.objects.create_room_if_none(user,friend)
            chat.is_active = False
            chat.save()
        else:
            try:
                message = PrivateChatMessage.objects.filter(chat_thread = room, sender= friend).latest("timestamp")
            except PrivateChatMessage.DoesNotExist:
                today = datetime(
                    year=1950,
                    month = 1,
                    day=1,
                    hour=1,
                    minute=1,
                    second=1,
                    tzinfo=pytz.UTC
                )
                message = PrivateChatMessage(
                    sender = friend,
                    chat_thread = room,
                    timestamp = today,
                    message_type = "text",
                    message_content = "",
                )
            m_and_f.append({
                'message':message,
                'friend':friend,
            })
    return sorted(m_and_f, key=lambda x: x['message'].timestamp, reverse=True)
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


@login_required
def add_member_search(request,*args, **kwargs):
    if request.is_ajax() and request.method =='POST':
        current_user_id = request.user.id
        thread_id = None

        search_query = request.POST.get('search_query')
        thread_id = request.POST.get('thread_id')
        print("checking thread id",thread_id)
        

        if not search_query:
            print("Empty inserted")
            result = "No user found ..."
        else:
            print("search query",search_query)
            if thread_id:
                gc = GroupChatThread.objects.get(id = thread_id)
                gc_members = gc.user_set.all()
                gc_members_id = gc_members.values_list('id')
                print(gc_members_id)
                user_obj = CustomUser.objects.annotate(
                    full_name=Concat('first_name', V(' '), 'last_name')
                ).filter(Q(full_name__icontains = search_query) |
                    Q(first_name__icontains = search_query)
                    | Q(last_name__icontains = search_query) | Q(username__icontains = search_query)).exclude(id__in = gc_members_id)
            else:
                user_obj = CustomUser.objects.annotate(
                    full_name=Concat('first_name', V(' '), 'last_name')
                ).filter(Q(full_name__icontains = search_query) |
                    Q(first_name__icontains = search_query)
                    | Q(last_name__icontains = search_query) | Q(username__icontains = search_query)).exclude(id = current_user_id)
            if len(user_obj) >0 and len(search_query) >0:
                data = []
                for obj in user_obj:
                    item = {
                        'pk': obj.pk,
                        'first_name': obj.first_name,
                        'last_name':obj.last_name,
                        'username':obj.username,
                        'profile_image':str(obj.profile_image.url),
                    }
                    data.append(item)
                result = data
            else:
                result = "No user found ... "
        return JsonResponse({
            'data':result
        })
    else:
        return HttpResponse("No you can't do this")

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



class ThreadViewSet(viewsets.ViewSet):
    def list(self,request):
        current_user = request.user
        group_ids = request.user.groups.values_list('id')
        assigned_groups = GroupChatThread.objects.filter(id__in = group_ids)
        pvt_threads1 = PrivateChatThread.objects.filter(first_user = current_user,is_active = True)
        pvt_threads2 = PrivateChatThread.objects.filter(second_user = current_user, is_active = True)
        combined_threads = list(chain(pvt_threads1,pvt_threads2))
        private_serializer = PrivateChatThreadSerializer(combined_threads,many = True)
        group_serializer = GroupChatThreadSerializer(assigned_groups,many = True)
        response = private_serializer.data + group_serializer.data
        my_threads_dict = {}
        threads = sorted(response,key=lambda x: x['updated_at'],reverse=True)
        my_threads_dict['chat_threads'] = threads
        return Response(my_threads_dict)

@login_required
def create_group_chat(request,*args,**kwargs):
    form = GroupChatCreationForm(request.POST or None, request.FILES or None)
    if request.is_ajax() and request.method == "POST":    
        current_user = request.user
        data = {}
        members_list_id = form.data.get('members_list')
        members_list_id = members_list_id.split(',')
        members_list_id.append(current_user.id)
        users = CustomUser.objects.filter(id__in = members_list_id)
        last_group = GroupChatThread.objects.all().last()
        g = Group.objects.all().last()
        print("thread id and group id",last_group.id,g.id)
        print("last wala group",last_group)
        print("vako users",users)
        if form.is_valid():
            group_name = form.cleaned_data.get('group_name')
            gc_thread = form.save(commit=False)
            gc_thread.admin = current_user
            if last_group:
                gc_thread.name = group_name+str(last_group.pk+1)
            else:
                gc_thread.name = group_name+'001'
            print(gc_thread.admin)
            gc_thread.save()
            print("naya thread ko id",gc_thread.id)
            this_group = Group.objects.get(id = gc_thread.id)
            gc_thread.add_members(this_group,users)
            # for u in users:
            #     this_group.user_set.add(u)
            
            data['status'] = 'Created'
            return JsonResponse(data)
        return JsonResponse("testing",safe=False)
        


@login_required
def update_group_chat_name(request,*args,**kwargs):
    if request.is_ajax() and request.method=="POST":
        data = {}
        change_group_name = request.POST.get("change_group_name")
        thread_id = request.POST.get("thread_id")
        print(change_group_name,thread_id)
        this_group_chat= GroupChatThread.objects.get(id = thread_id)
        this_group_chat.group_name = change_group_name
        this_group_chat.save()
        new_group_chat_name = this_group_chat.group_name
        room_group_name = f'group_chat_{thread_id}'
        consumer_method_name = 'chat_name_changed'
        print(new_group_chat_name)
        data['status'] = "changed"
        data['username'] = request.user.username
        data['user_id'] = request.user.id
        data['new_gc_name'] = new_group_chat_name
        broadcast.perform_broadcast(data,room_group_name,consumer_method_name)
        return JsonResponse(data)

@login_required
def update_group_chat_photo(request,*args,**kwargs):
    if request.is_ajax() and request.method=="POST":
        data = {}
        change_group_photo = request.FILES.get("change_group_photo")
        thread_id = request.POST.get("thread_id")
        this_group_chat= GroupChatThread.objects.get(id = thread_id)
        this_group_chat.image = change_group_photo
        this_group_chat.save()
        new_group_chat_photo = this_group_chat.image.url
        room_group_name = f'group_chat_{thread_id}'
        consumer_method_name = 'chat_photo_changed'
        data['username'] = request.user.username
        data['user_id'] = request.user.id
        data['status'] = "changed"
        data['new_gc_photo'] = new_group_chat_photo
        broadcast.perform_broadcast(data,room_group_name,consumer_method_name)
        return JsonResponse(data)

@login_required
def add_members_to_chat(request,*args,**kwargs):
    if request.method=="POST" and request.is_ajax():
        data = {}
        thread_id = request.POST.get("thread_id")
        members_list_id = request.POST.get('members_list')
        members_list_id = members_list_id.split(',')
        users = CustomUser.objects.filter(id__in = members_list_id)
        gc_thread = GroupChatThread.objects.get(pk = thread_id)
        this_group = Group.objects.get(id = gc_thread.id)
        gc_thread.add_members(this_group,users)
        data['status'] = "added"
        return JsonResponse(data)
    else:
        return HttpResponse("No you can't do such things")

def store_keys(sender):
    data = {}
    dh = DiffieHellman()
    private_key,public_key= dh.get_private_key(), dh.generate_public_key()
    second_private_key = dh.get_second_private_key()
    # data['private_key'] = private_key
    # data['second_private_key'] = second_private_key
    # data['public_key'] = public_key
    # return JsonResponse(data)
    Keys(keys_owner = sender,private_key = private_key,second_private_key = second_private_key,public_key = public_key).save()


