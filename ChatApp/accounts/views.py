from typing import Sequence
from django.contrib.admin.sites import site
from django.contrib.messages.constants import SUCCESS
from django.http.response import HttpResponse, JsonResponse
from django.shortcuts import render,redirect
from core.forms import ProfileUpdateForm
from .models import CustomUser
from friends.models import FriendList,FriendRequest
from friends.utils import FriendRequestStatus, get_friend_request_or_false
from django.contrib.auth.decorators import login_required
from django.db.models import Q, F
from django.db.models import Value as V
from django.contrib import messages
from django.db.models.functions import Concat
# from django.contrib.postgres.search import SearchQuery,SearchVector
import json
# Create your views here.



def without_keys(d,keys):
    return {x: d[x] for x in d if x not in keys}

@login_required
def view_profile(request, *args, **kwargs):
    context = {}
    user_id = kwargs.get("userId")
    print(user_id)
    try:
        user_account = CustomUser.objects.get(pk = user_id)
        print(user_account.username)
    except:
        return HttpResponse("User Id doesnot exist")
    if user_account:
        context['user_account'] = user_account
        
        try:
            list_of_friends = FriendList.objects.get(user = user_account)
            print("yo chai ma "+str(list_of_friends))
        except FriendList.DoesNotExist:
            list_of_friends = FriendList(user = user_account)
            list_of_friends.save()
        user_friends = list_of_friends.friends.all()
        print("This is user_friends"+str(user_friends))
        context['user_friends'] = user_friends

        #Define variables for the template to check whether the profile is of self or friends or other users
        is_self = True
        is_friend = False
        friend_request_status = FriendRequestStatus.NO_REQUEST_SENT.value
        friend_requests = None
        current_user = request.user
        if current_user.is_authenticated and current_user != user_account:
            is_self = False
            if user_friends.filter(pk = current_user.id):
                is_friend = True
            else:
                is_friend = False
                incoming_request = get_friend_request_or_false(sender = user_account, receiver=current_user)
                outgoing_request = get_friend_request_or_false(sender = current_user, receiver = user_account)

                if  incoming_request!= False:
                    friend_request_status = FriendRequestStatus.INCOMING_REQUEST.value
                    context['pending_request_id'] = incoming_request.id
                elif outgoing_request != False:
                    friend_request_status = FriendRequestStatus.OUTGOING_REQUEST.value
                else:
                    friend_request_status = FriendRequestStatus.NO_REQUEST_SENT.value

        try:
            friend_requests = FriendRequest.objects.filter(receiver = current_user, is_pending = True)
            print("thikka paro")
        except:
            pass
        context['is_self'] = is_self
        context['is_friend'] = is_friend
        context['hide_email'] = user_account.hide_email
        context['friend_request_status'] = friend_request_status
        context['friend_requests'] = friend_requests
        context['room_name'] = user_account.username
        print("view profile method")
        return render(request,'profile.html',context)


@login_required
def search_user(request):
    if request.is_ajax():
        result = None
        search_query = request.POST.get('search_query')
        # search_query = search_text.replace(" ","")
        if not search_query:
            print("Empty inserted")
            result = "No user found ..."
        else:
            
            print(search_query)
            user_obj = CustomUser.objects.annotate(
                full_name=Concat('first_name', V(' '), 'last_name')
            ).filter(Q(full_name__icontains = search_query) |
                Q(first_name__icontains = search_query)
                | Q(last_name__icontains = search_query) | Q(username__icontains = search_query))
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
            print(user_obj)
        return JsonResponse({
            'data':result
        })
    return JsonResponse({})


@login_required
def update_profile(request, *args, **kwargs):
    user_id = kwargs.get('userId')
    try:
        user_account = CustomUser.objects.get(id = user_id)
        print(user_account)
    except:
        return HttpResponse("Something went wrong maybe user doesnot exist")
    if user_account.id!= request.user.id:
        return HttpResponse("You cannot edit someone elses profile")
    context = {}
    context['is_self'] = is_self = True
    context['user_account'] = user_account
    if request.POST:
        form = ProfileUpdateForm(request.POST, request.FILES, instance = request.user)
        print("form submit vayo")
        if form.is_valid():
            form.save()
            messages.success(request,f'Account details for "{user_account.username}" has been updated succesfully.')
            return redirect('accounts:profile',userId = user_account.id)
        else:
            print(form.errors)
            print("invalid form")
            messages.warning(request,f'Something went wrong. Please ensure you have entered details correctly')
            context['form']= form
    return render(request,"profile.html",context)