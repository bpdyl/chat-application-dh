var groupChatWebSocket = null;
var groupThreadId = null;

function onSelectGroup(threadId,ele){
    console.log("group select: " + threadId)
    // createOrReturnPrivateChat(threadId)
    removeActiveThreadFriend();
    setActiveThreadFriend(threadId);
    groupChatWebSocketSetup(threadId);


}

function closegroupWebSocket(){
    if(groupChatWebSocket != null){
        groupChatWebSocket.close()
        groupChatWebSocket = null
        clearChat();
        showLoader();
        setPageNumber("1");
        disableChatHistoryScroll();
    }
}

function groupChatWebSocketSetup(thread_id){
    console.log("web socket for "+thread_id)
    groupThreadId = thread_id
    closeWebSocket();
    closegroupWebSocket();
    groupChatWebSocket = new WebSocket(
        'ws://'
        + window.location.host
        + '/ws/groupchat/'
        + groupThreadId
        + '/'
    )

    groupChatWebSocket.onmessage = function(e){
        console.log("Websocket message aayo hai");
        const data = JSON.parse(e.data);
        console.log("data display",data.display_progress_bar)
		displayChatroomLoadingSpinner(data.display_progress_bar)

        if(data.error){
            console.log("error vako ho")
            console.error(data.error + ": "+data.message)
            showClientErrorModal(data.message)
            return;
        }

        if (data.joining_room){
            console.log("Joining room " + data.joining_room);
            getGroupChatInfo();
            showLoader();
            getGroupThreadMessages(true);
            hideLoader();
            enableChatHistoryScroll();
        }


        if(data.command =='group_chat'){
        if(data.msg_type == 0 || data.msg_type == 1 || data.msg_type == 2 || data.msg_type ==3 || data.msg_type == 4){
            console.log("chat message gayera aayo");
            console.log(data);
            appendGroupChatMessage(data,false,true);
        }
    }

        if(data.group_chat_info){

            my_info = JSON.parse(data['group_chat_info'])
            onReceivingGroupChatInfo(my_info);

        }
        if(data.messages_response){
            onReceivingMessagesResponse(data.messages_metadata,data.new_page_number,data.firstAttempt);
        }
    }

    groupChatWebSocket.addEventListener("open", function(e){
        console.log("ChatSocket OPEN")
        // join chat room
        if(unsafe_authenticated){
            groupChatWebSocket.send(JSON.stringify({
                "command": "join",
            }));
        }
    })
    groupChatWebSocket.onopen = function(e){
        console.log("i am connected to group")
    }
    groupChatWebSocket.onclose = function(){
        console.error("group chat socket closed.")
    }

    if(groupChatWebSocket.readyState == WebSocket.OPEN){
        console.log("Group chat socket open")
    }else if(groupChatWebSocket.readyState == WebSocket.CONNECTING){
        console.log("Group chat socket connecting...")
    }
}

function groupChatSend(chat_message){
    groupChatWebSocket.send(
        JSON.stringify({
            "command":"group_chat",
            "message": chat_message,
            "message_type": "text",
        })
    )
}

function getGroupThreadMessages(firstAttempt=false){
    var pageNumber = document.getElementById("page_number_id").innerHTML
    if(pageNumber!= '-1'){
        setPageNumber('-1');

        groupChatWebSocket.send(JSON.stringify(
            {
                'command':'request_group_messages_data',
                'page_number': pageNumber,
                'firstAttempt':firstAttempt,
            }
        ));
    }
}

function getGroupChatInfo(){
    groupChatWebSocket.send(JSON.stringify({
        'command': 'get_group_chat_info',
    }))
}


function onReceivingGroupChatInfo(group_chat_info){
    console.log("group chat info ",group_chat_info)
    document.getElementById('id_other_username').innerHTML = group_chat_info['group_name']
    document.getElementById('topbar_otheruser_name').innerHTML = group_chat_info['group_name'];
    document.getElementById('topbar_otheruser_name').href ='#';
    document.getElementById('other_user_info').href ='#';
    document.getElementById('other_user_profile_image').classList.remove("d-none");
    document.getElementById('sidebar_simplebar_about').innerHTML = "Customize Chat";
    document.getElementById('aboutprofile').innerHTML = `
                                        <div class="accordion-body">
                                        <a href="#" data-bs-toggle="modal" data-bs-target="#gc_name_change_modal">
                                            <div class="card p-2 border mb-2 gc-settings">
                                                <div class="d-flex align-items-center">
                                                    <div class="flex-1">
                                                        <div class="text-start">
                                                            <h5 class="font-size-14 mb-1">Change Chat Name</h5>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>  
                                        </a>

                                        <a href="#" data-bs-toggle="modal" data-bs-target="#gc_photo_change_modal">
                                        <div class="card p-2 border mb-2 gc-settings" id="change_photo_div">
                                            <div class="d-flex align-items-center">
                                                <div class="flex-1">
                                                    <div class="text-start">
                                                    <h5 class="font-size-14 mb-1">Change Group Photo</h5>
                                                    </div>
                                                </div>
                                            </div>
                                        </div> 
                                        </a>
                                                                              
                                        </div>`
    document.getElementById('change_group_name').setAttribute("value",group_chat_info['group_name']);
    document.getElementById('change_group_name').setAttribute("data-threadid",group_chat_info['thread_id']);

    group_members_display(group_chat_info['members'],group_chat_info['admin_id'],group_chat_info['admin_username']);

    preloadImage(group_chat_info['image'], 'other_user_profile_image')
    preloadImage(group_chat_info['image'],'topbar_otheruser_image')
}

function appendGroupChatMessage(data, maintainPosition, isNewMessage){
    messageType = data['msg_type']
    msg_id = data['msg_id']
    message = data['message']
    uName = data['username']
    user_id = data['user_id']
    profile_image = data['profile_image']
    timestamp = data['natural_timestamp']
    console.log("append chat message: " + messageType)
    new_chat_name = data['new_chat_name']
    var msg = "";
    var username = ""

    // determine what type of msg it is
    switch (messageType) {
        case 0:
            // new chatroom msg
            username = uName + ": "
            msg = message + '\n'
            createChatMessageElement(msg, msg_id, username, profile_image, user_id, timestamp, maintainPosition, isNewMessage)
            break;
        case 1:
            // User added to chat
            createConnectedDisconnectedElement(message, msg_id, profile_image, user_id)
            break;
        case 2:
            // User left chat
            createConnectedDisconnectedElement(message, msg_id,profile_image, user_id)
            break;
        case 3:
            //Chat photo changed
            createConnectedDisconnectedElement(message, msg_id,profile_image, user_id);
            break;
        case 4:
            //Chat name changed
            $('#topbar_otheruser_name').html(new_chat_name);
            $('#id_other_username').html(new_chat_name)
            createConnectedDisconnectedElement(message,msg_id,profile_image,user_id);
            break;
        default:
            console.log("Unsupported message type!");
            return;
    }
}

function createConnectedDisconnectedElement(msg, msd_id, profile_image, user_id){
    var chatLog = document.getElementById("id_chat_log")

    var newMessageDiv = document.createElement("div")
    newMessageDiv.classList.add("d-flex")
    newMessageDiv.classList.add("flex-row")
    newMessageDiv.classList.add("message-container")

    var profileImage = document.createElement("img")
    profileImage.addEventListener("click", function(e){
        selectUser(user_id)
    })
    profileImage.classList.add("profile-image")
    profileImage.classList.add("rounded-circle")
    profileImage.classList.add("img-fluid")
    profileImage.src = "{% static 'codingwithmitch/dummy_image.png' %}"
    var profile_image_id = "id_profile_image_" + msg_id
    profileImage.id = profile_image_id
    newMessageDiv.appendChild(profileImage)

    var usernameSpan = document.createElement("span")
    usernameSpan.innerHTML = msg
    usernameSpan.classList.add("username-span")
    usernameSpan.addEventListener("click", function(e){
        selectUser(user_id)
    })
    newMessageDiv.appendChild(usernameSpan)

    chatLog.insertBefore(newMessageDiv, chatLog.firstChild)

    preloadImage(profile_image, profile_image_id)
 }
function group_members_display(members,admin_id,admin_username){
    $('#group_members_wrapper').removeClass("d-none");
    $('#sidebar_simplebar_grp_members').html('Chat Members');
    $('#group_members').html('');
    var member_type;
    members.forEach(member => {
        if(member.id == admin_id && member.username ==admin_username){
            member_type = 'Admin';
        }else{
            member_type = 'Member';
        }
        document.getElementById('group_members').innerHTML +=
        `<div class="card p-2 border mb-2">
        <div class="d-flex align-items-center">
            <div class="avatar-sm me-3 ms-0">
                <div class="avatar-title bg-soft-primary text-primary rounded font-size-20">
                    <img src="${member.profile_image}" alt="members" class="avatar-sm rounded-circle">
                </div>
            </div>
            <div class="flex-1">
                <div class="text-start">
                    <h5 class="font-size-14 mb-1">${member.first_name} ${member.last_name}</h5>
                    <p class="text-muted font-size-13 mb-0"> ${member_type}</p>
                </div>
            </div>
    
            <div class="ms-4 me-0">
                <ul class="list-inline mb-0 font-size-18">
                    <li class="list-inline-item">
                        <a href="#" class="text-muted px-1">
                            <i class="ri-download-2-line"></i>
                        </a>
                    </li>
                    <li class="list-inline-item dropdown">
                        <a class="dropdown-toggle text-muted px-1" href="#" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            <i class="ri-more-fill"></i>
                        </a>
                        <div class="dropdown-menu dropdown-menu-end">
                            <a class="dropdown-item" href="#">Action</a>
                            <a class="dropdown-item" href="#">Another action</a>
                            <div class="dropdown-divider"></div>
                            <a class="dropdown-item" href="#">Delete</a>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </div>`
    });
}

var submitbutton = $('#chat_name_change_submit');
var orig = [];
$.fn.getType = function () {
    return this[0].tagName == "INPUT" ? $(this[0]).attr("type").toLowerCase() : this[0].tagName.toLowerCase();
}

$("#chat_name_change_form :input").each(function () {
    var type = $(this).getType();
    var tmp = {
        'type': type,
        'value': $(this).val()
    };
    orig[$(this).attr('id')] = tmp;
});

$('#chat_name_change_form :input').bind('change keyup', function () {

    var disable = true;
    $("form :input").each(function () {
        var type = $(this).getType();
        var id = $(this).attr('id');

        if (type == 'text') {
            disable = (orig[id].value == $(this).val());
        }

        if (!disable) {
            return false; // break out of loop
        }
    });

    submitbutton.prop('disabled', disable);
});



$('#chat_name_change_submit').on('click',()=>{
    var csrftoken = document.getElementsByName('csrfmiddlewaretoken')[0].value;
    console.log("csrf",csrftoken)
    const fd = new FormData();
    fd.append('csrfmiddlewaretoken',csrftoken);
    fd.append('thread_id',$('#change_group_name').data('threadid'));
    fd.append('change_group_name',$('#change_group_name').val());
    for (var value of fd.values()) {
        console.log(value);
     }
    $.ajax({
        type:"POST",
        datatype:"json",
        url: 'update_group_chat_name/',
        data:fd,
        success: function(response){
            var new_gc_name = response['new_gc_name'];
            if(response['status']=='changed'){
                $('#topbar_otheruser_name').html(new_gc_name);
                $('#id_other_username').html(new_gc_name);
                $('#chat_change_name_close_btn').click();
            }
        },
        error: function(error){
            console.log(error);
        },
        cache: false,
        contentType: false,
        processData: false,
    })
})


$('#chat_photo_change_submit').on('click',()=>{
    var csrftoken = document.getElementsByName('csrfmiddlewaretoken')[0].value;
    console.log("csrf",csrftoken)
    const fd = new FormData();
    fd.append('csrfmiddlewaretoken',csrftoken);
    fd.append('thread_id',$('#change_group_name').data('threadid'));
    fd.append('change_group_photo',$('#change_gc_photo')[0].files[0]);
    for (var value of fd.values()) {
        console.log(value);
     }
    $.ajax({
        type:"POST",
        datatype:"json",
        url: 'update_group_chat_photo/',
        data:fd,
        success: function(response){
            var new_gc_photo = response['new_gc_photo'];
            if(response['status']=='changed'){
                preloadImage(new_gc_photo, 'other_user_profile_image');
                preloadImage(new_gc_photo,'topbar_otheruser_image');
                $('#chat_change_photo_close_btn').click();
                $('#gc_photo_change_form')[0].reset();
            }
        },
        error: function(error){
            console.log(error);
        },
        cache: false,
        contentType: false,
        processData: false,
    })
})