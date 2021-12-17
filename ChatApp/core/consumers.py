from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.serializers import serialize
from django.utils import timezone
from django.db.models import F
import json
import asyncio
from accounts.utils import LazyCustomUserEncoder
from accounts.models import CustomUser
from core.exceptions import ClientError
from .utils import DEFAULT_PAGE_SIZE, timestamp_encoder,LazyPrivateThreadMessageEncodeer
from django.core.paginator import Paginator

from .models import (
    PrivateChatThread,PrivateChatMessage,GroupChatThread,GroupChatMessage
)
from friends.models import FriendList


class PrivateChatConsumer(AsyncJsonWebsocketConsumer):
    
    async def connect(self):
        print("private chat consumer connect: " +str(self.scope['user']))
        self.me = self.scope.get('user')
        await self.accept()
        self.other_username = self.scope['url_route']['kwargs']['friendId']
        print("yo other user",self.other_username)
        self.other_user = await sync_to_async(CustomUser.objects.get)(id= self.other_username)
        self.private_thread = await sync_to_async(PrivateChatThread.objects.create_room_if_none)(self.me, self.other_user)
        self.room_name = f'private_chat_{self.private_thread.id}'
        print("private chat thread is ",self.room_name)

        await sync_to_async(self.private_thread.connect)(self.me)
        await sync_to_async(self.private_thread.connect)(self.other_user)
        print("added myself")

        await self.channel_layer.group_add(
            self.room_name,
            self.channel_name
        )
        

        if self.me.is_authenticated:
            await update_user_incr(self.me)

    async def receive_json(self, content, **kwargs):
        command = content.get("command",None)
        print("yo command ho ",command)
        if command == "join":
           await self.channel_layer.group_send(
                self.room_name,
                {
                    "type": "websocket_join",
                    "join":str(self.private_thread.id)
                }
            )



        elif command == "private_chat":
            message = content.get("message")
            message_type = content['message_type']
            print("yo message",message)
            connected_users =await get_connected_users(self.private_thread)
            print(connected_users)
            if not self.other_user.id in connected_users:
                print("id chaina")
                self.newmsg = await sync_to_async(PrivateChatMessage.objects.create)(
                chat_thread = self.private_thread,
                sender = self.me,
                message_content = message,
                message_type = message_type,
                )
            else:
                print("id cha")
                self.newmsg = await sync_to_async(PrivateChatMessage.objects.create)(
                chat_thread = self.private_thread,
                sender = self.me,
                message_type = message_type,
                )

            await self.channel_layer.group_send(
                self.room_name,{
                    "type": "websocket_message",
                    "text": message,
                    "id": self.newmsg.id,
                    "username": self.newmsg.sender.username,
                    "profile_image": self.newmsg.sender.profile_image.url,
                    "user_id": self.newmsg.sender.id,
                    "status": self.newmsg.sender.status,
                    "timestamp": timezone.localtime(self.newmsg.timestamp),
                    "command": command  
                }
            )

        elif command == "request_messages_data":
            thread = await get_thread_or_error(self.private_thread.id,self.me)
            data = await get_thread_messages_data(thread,content['page_number'])
            if data!=None:
                data = json.loads(data)
                await self.broadcast_messages_data(data['messages_metadata'],data['new_page_number'])
            else:
                raise ClientError(204,"Something went wrong while trying to fetch messages metadata.")


        elif command == 'get_user_info':
            thread = await get_thread_or_error(self.private_thread.id,self.scope['user'])
            print("user info ko thread",thread)
            data =await sync_to_async(get_user_info)(thread,self.scope['user'])
            
            if data!=None:
                data = json.loads(data)
                print("user info wala data",data)
                await self.broadcast_userinfo(data['user_info'])
                # await self.channel_layer.group_send(
                #     self.room_name,
                #     {
                #         "type": "websocket_userinfo",
                #         "user_info": data['user_info'],
                #         "command": command,
                #     }
                # )
            else:
                raise ClientError(204,"Something went wrong while trying to fetch your contact's information.")

        if command == "is_typing":
            await self.channel_layer.group_send(
                self.room_name,
                {
                    "type": "websocket_typing",
                    "text": content['text'],
                    "command": command,
                    "user": content['user']
                }
            )
    
    async def websocket_join(self,event):
        await self.send_json({
            'joining_room': str(self.private_thread.id),
        })

    async def websocket_message(self,event):
        t = event['timestamp']
        print("websocket message ko t",t)
        timestamp = timestamp_encoder(t)
        print("encode garesi ko time",timestamp)
        await self.send_json(({
            'id': event['id'],
            'text': event['text'],
            'command': event['command'],
            'status':event['status'],
            'natural_timestamp': timestamp,
            'sender': {
                'username': event['username'],
                'profile_image': event['profile_image'],
                'user_id': event['user_id'],
            }
        }))
        
    async def websocket_typing(self, event):
        await self.send_json((
            {
                'text': event['text'],
                'command': event['command'],
                'user': event['user'],
            }
        ))
    

    async def broadcast_messages_data(self,messsages_metadata,new_page_number):
        print("Private thread: broadcasting messages metadata")
        await self.send_json(
            {   
                "messages_response": "messages_response",
                "messages_metadata": messsages_metadata,
                "new_page_number": new_page_number,
            },
        )

    async def broadcast_userinfo(self,user_info):
        print("websocket wala info",json.dumps(user_info))
        await self.send_json(
            {
                'user_info': json.dumps(user_info),
            },
        )

    async def disconnect(self, close_code):
        me = self.scope['user']
        print("disconnect huda ko me",me)
        await sync_to_async(self.private_thread.disconnect)(me)
        await update_user_decr(me)
        await self.channel_layer.group_send(
            self.room_name,
            {
                "type": "chat_leave",
                "thread_id": self.private_thread.id,
                "username":me.username,
                "profile_image": me.profile_image.url,
                "user_id": me.id,
                "status": me.status,
            }
        )

        await self.channel_layer.group_discard(
            self.room_name,
            self.channel_name,
        )

    async def chat_leave(self,event):
        print("Chat consumer: chat_leave")
        if event['username']:
            await self.send_json(
                {
                "thread_id": event['thread_id'],
                "username":event['username'],
                "profile_image": event['profile_image'],
                "user_id": event['user_id'],
                "status": event['status'],
                }
            )



@database_sync_to_async
def get_thread_or_error(thread_id, user):
    try:
        thread = PrivateChatThread.objects.get(pk = thread_id)
    except PrivateChatThread.DoesNotExist:
        raise ClientError("THREAD_INVALID", "Invalid chat thread.")
    if user!=thread.first_user and user != thread.second_user:
        raise ClientError("ACCESS_DENIED", "You don't have permissiion to join this chat.")
    friend_list = FriendList.objects.get(user = user).friends.all()
    if not thread.first_user in friend_list:
        if not thread.second_user in friend_list:
            raise ClientError("ACCESS_DENIED", "You must be friends to chat.")
    return thread


def get_user_info(thread,user):
    try:
        other_user = thread.first_user
        if other_user == user:
            other_user = thread.second_user

        data = {}
        user_detail = LazyCustomUserEncoder()
        data['user_info'] = user_detail.get_dump_object(other_user)
        print("this is data userfino",data['user_info'])
        return json.dumps(data)
    except ClientError as e:
        raise ClientError("DATA_ERROR"," Unable to get the user information.")
    return None

@database_sync_to_async
def get_connected_users(private_thread):
    try:
        connected_users = private_thread.connected_users.all()
        print("connected users",connected_users)
        connected_users_id = [ f.id for f in connected_users]
        print(connected_users_id)
    except Exception as e:
        print(e)
    return connected_users_id


@database_sync_to_async
def get_thread_messages_data(thread,page_number):
    try:
        message_query = PrivateChatMessage.objects.by_private_thread(thread)
        paginator_obj = Paginator(message_query,DEFAULT_PAGE_SIZE)
        print("this is message query ",message_query)
        data = {}
        new_page_number = int(page_number)
        if new_page_number <= paginator_obj.num_pages:
            new_page_number = new_page_number + 1 
            message_detail = LazyPrivateThreadMessageEncodeer()
            data['messages_metadata'] = message_detail.serialize(paginator_obj.page(page_number).object_list)
        else:
            data["messages_metadata"] = "None"
        data['new_page_number'] = new_page_number
        return json.dumps(data)
    except Exception as e:
        print("SOMETHING WENT WRONG",e)
    return None



@database_sync_to_async
def update_user_incr(user):
    CustomUser.objects.filter(pk = user.pk).update(status = F('status')+1)

@database_sync_to_async
def update_user_decr(user):
    print("user ko decrement",user)
    CustomUser.objects.filter(pk = user.pk).update(status = F('status')-1)