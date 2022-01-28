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
from .utils import CHAT_NAME_CHANGED, CHAT_PHOTO_CHANGED, DEFAULT_PAGE_SIZE, MSG_TYPE_ADDED, MSG_TYPE_NORMAL, MSG_TYPE_REMOVED, LazyGroupThreadMessageEncodeer, timestamp_encoder,LazyPrivateThreadMessageEncodeer
from django.core.paginator import Paginator

from .models import (
    PrivateChatThread,PrivateChatMessage,GroupChatThread,GroupChatMessage
)
from friends.models import FriendList


class PrivateChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope['user']
        await self.accept()
        self.room_name = f'private_thread_{user.id}'
        self.me = self.scope.get('user')
        self.other_username = self.scope['url_route']['kwargs']['friendId']
        print("yo other user",self.other_username)
        self.other_user = await sync_to_async(CustomUser.objects.get)(id= self.other_username)
        self.private_thread = await sync_to_async(PrivateChatThread.objects.create_room_if_none)(self.me, self.other_user)
        await self.channel_layer.group_add(
            self.room_name,
            self.channel_name,
        )
    # async def connect(self):
    #     print("private chat consumer connect: " +str(self.scope['user']))
    #     self.me = self.scope.get('user')
    #     await self.accept()
    #     self.other_username = self.scope['url_route']['kwargs']['friendId']
    #     print("yo other user",self.other_username)
    #     self.other_user = await sync_to_async(CustomUser.objects.get)(id= self.other_username)
    #     self.private_thread = await sync_to_async(PrivateChatThread.objects.create_room_if_none)(self.me, self.other_user)
    #     self.room_name = f'private_chat_{self.private_thread.id}'
    #     print("private chat thread is ",self.room_name)

    #     await sync_to_async(self.private_thread.connect)(self.me)

    #     print("added myself")

    #     await self.channel_layer.group_add(
    #         self.room_name,
    #         self.channel_name
    #     )
        

    #     if self.me.is_authenticated:
    #         await update_user_incr(self.me)

    async def receive_json(self, content, **kwargs):
        command = content.get("command",None)
        print("yo command ho ",command)
        try:
            if command == "join":
                await self.channel_layer.group_send(
                        self.room_name,
                        {
                            "type": "websocket_join",
                            "join":str(self.private_thread.id),
                            "thread_type":"private_thread",
                        }
                    )



            elif command == "private_chat":
                message = content.get("message")
                message_type = content['message_type']
                sent_by_id = content['sent_by']
                send_to_id = content['send_to']
                sent_by_user = await self.get_user_object(sent_by_id)
                send_to_user = await self.get_user_object(send_to_id)
                if not sent_by_user:
                    print("Error:: sent by user is incorrect")
                if not send_to_user:
                    print("Error:: send to user is incorrect")
                other_user_chat_room = f'private_thread_{send_to_id}'
                print("yo message",message)

                self.newmsg = await sync_to_async(PrivateChatMessage.objects.create)(
                chat_thread = self.private_thread,
                sender = self.scope['user'],
                message_type = message_type,
                )

                print("room name",self.room_name)
                await self.channel_layer.group_send(
                    self.room_name,{
                        "type": "websocket_message",
                        "text": message,
                        "id": self.newmsg.id,
                        "username": self.newmsg.sender.username,
                        "first_name":self.newmsg.sender.first_name,
                        "last_name":self.newmsg.sender.last_name,
                        "profile_image": self.newmsg.sender.profile_image.url,
                        "user_id": self.newmsg.sender.id,
                        "status": self.newmsg.sender.status,
                        "timestamp": timezone.localtime(self.newmsg.timestamp),
                        "command": command,
                        "send_to":send_to_id,
                        "sent_by":sent_by_id,
                        "thread_id":self.private_thread.id,  
                    }
                    
                )
                await self.channel_layer.group_send(
                    other_user_chat_room,{
                        "type": "websocket_message",
                        "text": message,
                        "id": self.newmsg.id,
                        "username": self.newmsg.sender.username,
                        "first_name":self.newmsg.sender.first_name,
                        "last_name":self.newmsg.sender.last_name,
                        "profile_image": self.newmsg.sender.profile_image.url,
                        "user_id": self.newmsg.sender.id,
                        "status": self.newmsg.sender.status,
                        "timestamp": timezone.localtime(self.newmsg.timestamp),
                        "command": command,
                        "send_to":send_to_id,
                        "sent_by":sent_by_id, 
                        "thread_id":self.private_thread.id,  
                    }
                    
                )

            elif command == "request_messages_data":
                await self.display_progress_bar(True)
                thread = await get_thread_or_error(self.private_thread.id,self.me)
                data = await get_thread_messages_data(thread,content['page_number'])
                if data!=None:
                    data = json.loads(data)
                    await self.broadcast_messages_data(data['messages_metadata'],data['new_page_number'],content['firstAttempt'])
                else:
                    raise ClientError(204,"Something went wrong while trying to fetch messages metadata.")

                await self.display_progress_bar(False)

            elif command == 'get_user_info':
                await self.display_progress_bar(True)
                thread = await get_thread_or_error(self.private_thread.id,self.scope['user'])
                print("user info ko thread",thread)
                data =await sync_to_async(get_user_info)(thread,self.scope['user'])
                
                if data!=None:
                    data = json.loads(data)
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
                await self.display_progress_bar(False)
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
        except ClientError as e:
            await self.display_progress_bar(False)
            await self.handle_client_error(e)
    
    async def websocket_join(self,event):
        await self.send_json({
            'joining_room': str(self.private_thread.id),
            'thread_type': event['thread_type'],
        })

    async def websocket_message(self,event):
        print("instant message broadcast hudai")
        t = event['timestamp']
        timestamp = timestamp_encoder(t)
        await self.send_json(({
            'msg_id': event['id'],
            'message_content': event['text'],
            'command': event['command'],
            'status':event['status'],
            'natural_timestamp': timestamp,
            'username': event['username'],
            'first_name':event['first_name'],
            'last_name':event['last_name'],
            'profile_image': event['profile_image'],
            'user_id': event['user_id'],
            'send_to': event['send_to'],
            'sent_by':event['sent_by'],
            'private_thread_id':event['thread_id']
        }))
        
    async def websocket_typing(self, event):
        await self.send_json((
            {
                'text': event['text'],
                'command': event['command'],
                'user': event['user'],
            }
        ))
    

    async def broadcast_messages_data(self,messsages_metadata,new_page_number,firstAttempt):
        print("Private thread: broadcasting messages metadata")
        await self.send_json(
            {   
                "messages_response": "messages_response",
                "messages_metadata": messsages_metadata,
                "new_page_number": new_page_number,
                "firstAttempt":firstAttempt,
            },
        )

    async def broadcast_userinfo(self,user_info):
        await self.send_json(
            {
                'user_info': json.dumps(user_info),
                'private_thread_id':self.private_thread.id,
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

    async def display_progress_bar(self,is_displayed):
        print("DIsplay progress bar",is_displayed)
        await self.send_json(
            {
                "display_progress_bar":is_displayed,
            }
        )

    async def handle_client_error(self,e):
        errorData = {}
        errorData['error'] = e.code
        if e.message:
            errorData['message'] = e.message
            await self.send_json(errorData)
        return
    @database_sync_to_async
    def get_user_object(self,user_id):
        qs = CustomUser.objects.filter(id=user_id)
        if qs.exists():
            obj = qs.first()
        else:
            obj = None
        return obj
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



class GroupChatConsumer(AsyncJsonWebsocketConsumer):
    
    async def connect(self):
        print("group chat consumer connect: " +str(self.scope['user']))
        self.me = self.scope.get('user')
        await self.accept()
        self.room_id = self.scope['url_route']['kwargs']['groupThreadId']
        self.group_chat_thread = await sync_to_async(GroupChatThread.objects.get)(id= self.room_id)
        self.room_group_name = f'group_chat_{self.room_id}'
        print("group chat thread is ",self.room_group_name)



        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        

    async def receive_json(self, content, **kwargs):
        command = content.get("command",None)
        print("yo command ho ",command)
        try:
            if command == "join":
                await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            "type": "websocket_join",
                            "join":str(self.room_id),
                            "thread_type":"group_thread",
                        }
                    )



            elif command == "group_chat":
                message = content.get("message")
                message_type = content['message_type']
                print("yo message",message)
                self.newmsg = await sync_to_async(GroupChatMessage.objects.create)(
                gc_thread = self.group_chat_thread,
                sender = self.me,
                content = message,
                message_type = message_type,
                )

                print("room name",self.room_name)
                await self.channel_layer.group_send(
                    self.room_name,{
                        "type": "websocket_message",
                        "text": message,
                        "id": self.newmsg.id,
                        "username": self.newmsg.sender.username,
                        "first_name":self.newmsg.sender.first_name,
                        "last_name":self.newmsg.sender.last_name,
                        "profile_image": self.newmsg.sender.profile_image.url,
                        "user_id": self.newmsg.sender.id,
                        "status": self.newmsg.sender.status,
                        "timestamp": timezone.localtime(self.newmsg.timestamp),
                        "command": command  
                    }
                    
                )

            elif command == "request_group_messages_data":
                await self.display_progress_bar(True)
                thread = await get_group_thread_or_error(self.group_chat_thread.id,self.scope['user'])
                data = await get_group_thread_messages_data(thread,content['page_number'])
                if data!=None:
                    data = json.loads(data)
                    await self.broadcast_group_messages_data(data['messages_metadata'],data['new_page_number'],content['firstAttempt'])
                else:
                    raise ClientError(204,"Something went wrong while trying to fetch messages metadata.")

                await self.display_progress_bar(False)

            elif command == 'get_group_chat_info':
                await self.display_progress_bar(True)
                thread = await get_group_thread_or_error(self.group_chat_thread.id,self.scope['user'])
                print("groupchat info ko thread",thread)
                data =await sync_to_async(get_group_chat_info)(thread)
                
                if data!=None:
                    data = json.loads(data)
                    await self.broadcast_group_chat_info(data['group_chat_info'])
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
                await self.display_progress_bar(False)
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
        except ClientError as e:
            await self.display_progress_bar(False)
            await self.handle_client_error(e)
    
    async def websocket_join(self,event):
        room_id = event['join']
        await self.send_json({
            'joining_room': str(room_id),
            'thread_type': event['thread_type'],
        })

    async def websocket_message(self,event):
        print("instant message broadcast hudai")
        t = event['timestamp']
        timestamp = timestamp_encoder(t)
        await self.send_json(({
            'msg_type':MSG_TYPE_NORMAL,
            'msg_id': event['id'],
            'message_content': event['text'],
            'command': event['command'],
            'status':event['status'],
            'natural_timestamp': timestamp,
            'username': event['username'],
            'first_name':event['first_name'],
            'last_name':event['last_name'],
            'profile_image': event['profile_image'],
            'user_id': event['user_id'],
        }))
        
    async def websocket_typing(self, event):
        await self.send_json((
            {
                'text': event['text'],
                'command': event['command'],
                'user': event['user'],
            }
        ))
    

    async def broadcast_group_messages_data(self,messsages_metadata,new_page_number,firstAttempt):
        print("Group chat thread: broadcasting messages metadata")
        await self.send_json(
            {   
                "messages_response": "messages_response",
                "messages_metadata": messsages_metadata,
                "new_page_number": new_page_number,
                "firstAttempt":firstAttempt,
            },
        )

    async def broadcast_group_chat_info(self,group_chat_info):
        await self.send_json(
            {
                'group_chat_info': json.dumps(group_chat_info),
            },
        )

    async def disconnect(self, close_code):
        me = self.scope['user']
        print("disconnect huda ko group chat ko me",me)
        # await self.channel_layer.group_send(
        #     self.room_group_name,
        #     {
        #         "type": "chat_leave",
        #         "thread_id": self.group_chat_thread.id,
        #         "username":me.username,
        #         "profile_image": me.profile_image.url,
        #         "user_id": me.id,
        #         "status": me.status,
        #     }
        # )
        if self.room_group_name and self.channel_name:
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name,
            )

    async def chat_name_changed(self,event):
        print("chat name event",event)
        content = json.loads(event['content'])
        await self.send_json(
            {
                "msg_type": CHAT_NAME_CHANGED,
                "command":"group_chat",
                "thread_id": self.room_id,
                "username":content['username'],
                "new_chat_name":content['new_gc_name'],
                "user_id":content['user_id'],
            }
        )
    async def chat_photo_changed(self,event):
        content = json.loads(event['content'])
        await self.send_json(
            {
                "msg_type": CHAT_PHOTO_CHANGED,
                "command":"group_chat",
                "thread_id": self.room_id,
                "username":content['username'],
                "new_chat_photo":content['new_gc_photo'],
                "user_id":content['user_id'],
            }
        )

    async def member_added(self,event):
        print("New member added")
        content = json.loads(event['content'])
        if event['username']:
            await self.send_json(
                {
                    "msg_type": MSG_TYPE_ADDED,
                    "command": "group_chat",
                    "thread_id":self.room_id,
                    "username":content['username'],
                    "profile_image":content['profile_image'],
                    "user_id":content['user_id'],
                }
            )

    async def chat_leave(self,event):
        print("Chat consumer: chat_leave")
        content = json.loads(event['content'])
        if content['username']:
            await self.send_json(
                {
                "msg_type": MSG_TYPE_REMOVED,
                "command":"group_chat",
                "thread_id": self.room_id,
                "username":content['username'],
                "profile_image": content['profile_image'],
                "user_id": content['user_id'],
                }
            )

    async def display_progress_bar(self,is_displayed):
        print("DIsplay progress bar",is_displayed)
        await self.send_json(
            {
                "display_progress_bar":is_displayed,
            }
        )

    async def handle_client_error(self,e):
        errorData = {}
        errorData['error'] = e.code
        if e.message:
            errorData['message'] = e.message
            await self.send_json(errorData)
        return

@database_sync_to_async
def get_group_thread_or_error(thread_id,user):
    try:
        thread = GroupChatThread.objects.get(pk = thread_id)
        thread_members = thread.user_set.all()
    except GroupChatThread.DoesNotExist:
        raise ClientError("THREAD_INVALID", "Invalid chat thread.")
    if not user in thread_members:
        raise ClientError("ACCESS_DENIED", "You don't have permissiion to join this chat.")
    return thread


def get_group_chat_info(thread):
    try:
        data = {}
        print(thread.id)
        member_detail = LazyCustomUserEncoder()
        thread_members = thread.user_set.all()
        print(thread_members)
        member_details_list = []
        for m in thread_members:
            m_detail = member_detail.get_dump_object(m)
            member_details_list.append(m_detail)
        
        data['group_chat_info'] = {
                                    "thread_id":thread.id,
                                    "group_name":thread.group_name,
                                    "image":thread.image.url,
                                    "admin_id":thread.admin.id,
                                    "admin_username":thread.admin.username,
                                    "members":member_details_list,
                                    "group_description":thread.group_description,
                                    }
        return json.dumps(data)
    except ClientError as e:
        raise ClientError("DATA_ERROR"," Unable to get the group chat information.")
    return None


@database_sync_to_async
def get_group_thread_messages_data(thread,page_number):
    try:
        message_query = GroupChatMessage.objects.by_gc_thread(thread)
        paginator_obj = Paginator(message_query,DEFAULT_PAGE_SIZE)
        data = {}
        new_page_number = int(page_number)
        if new_page_number <= paginator_obj.num_pages:
            new_page_number = new_page_number + 1 
            message_detail = LazyGroupThreadMessageEncodeer()
            data['messages_metadata'] = message_detail.serialize(paginator_obj.page(page_number).object_list)
        else:
            data["messages_metadata"] = "None"
        data['new_page_number'] = new_page_number
        return json.dumps(data)
    except Exception as e:
        print("SOMETHING WENT WRONG",e)
    return None