const myurl = window.location.origin
const csrfchat = document.getElementsByName('csrfmiddlewaretoken')[0].value 
// const m_and_f = JSON.parse(document.getElementById('m_and_f').textContent);
const private_room = JSON.parse(document.getElementById('private_thread').textContent);
const logged_user =JSON.parse(document.getElementById('logged_in_user').textContent);
const chat_message_input = document.getElementById('chat_message_input')




const thread_distinguish = document.getElementById('thread_distinguish');

chat_message_input.focus();

const chat_section = document.getElementById('chat_section')
shouldScroll = chat_section.scrollTop + chat_section.clientHeight === chat_section.scrollHeight;


var privateChatWebSocket = null;
var friendId = null;
console.log("this is loggeduser",logged_user)


// var [first_thread_id,threadType] = getIDs();
// console.log("first user id and thread type",first_thread_id,threadType)

// if(first_thread_id!=null){
// if(threadType == "private-thread"){
//     setActiveThreadFriend(first_thread_id);
//     createOrReturnPrivateChat(first_thread_id);
// }else if(threadType == "group-thread"){
//     groupChatWebSocketSetup(first_thread_id);
//     console.log("group chat connection")
// }
// }

unsafe_authenticated = 'true' === document.currentScript.dataset.authenticated;

function onSelectFriend(userId,ele){
    console.log("onSelectFriend: " + userId)
    createOrReturnPrivateChat(userId)
    var nextURL = window.location.origin+'/chat/?t_id='+userId;
    var nextTitle = 'My new page title';
    var nextState = { additionalInformation: 'Updated the URL with JS' };

    // This will create a new entry in the browser's history, without reloading
    window.history.pushState(nextState, nextTitle, nextURL);

    // This will replace the current entry in the browser's history, without reloading
    window.history.replaceState(nextState, nextTitle, nextURL)
    removeActiveThreadFriend();
    $(".user-chat").addClass("user-chat-show");
    setActiveThreadFriend(userId);


}
function closeWebSocket(){
    if(privateChatWebSocket != null){
        privateChatWebSocket.close()
        privateChatWebSocket = null
        clearChat();
        showLoader();
        setPageNumber("1");
        disableChatHistoryScroll();
    }
}

function webSocketSetup(user_id,pvt_id){
    console.log("web socket for "+user_id)
    friendId = user_id
    // closegroupWebSocket();

    setPageNumber("1");
    disableChatHistoryScroll();
    closeWebSocket();
    privateChatWebSocket = new WebSocket(
        'ws://'
        + window.location.host
        + '/ws/privatechat/'
        + friendId
        + '/'
    )

    

    privateChatWebSocket.onmessage = function(e){
        console.log("Websocket message aayo hai");
        const data = JSON.parse(e.data);
        console.log("data display",data)
		displayChatroomLoadingSpinner(data.display_progress_bar)

        if(data.error){
            console.log("error vako ho")
            console.error(data.error + ": "+data.message)
            showClientErrorModal(data.message)
            return;
        }

        if(data.command == 'idb_broadcast'){
            onIDBroadcast(data['idb_message'],pvt_id);
            // setTimeout(idb_broadcastCallback,2000);
        }

        if (data.joining_room){
            console.log("Joining room " + data.joining_room);
            thread_distinguish.innerHTML = data.thread_type
            var secret_key = document.getElementById('topbar_otheruser_name');
            // secret_key.setAttribute('id','secret_key_id');
            secret_key.dataset.val = data['my_keys']['final_shared_key'];
            clearChat();
            showLoader();
            getUserInfo();
            showLoader();
            getPrivateThreadMessages(true);
            hideLoader();
            enableChatHistoryScroll();
        }



        if(data.command == "private_chat"){
            $.ajax({
                type: "GET",
      
                url: window.location.origin+'/chat/chat_thread_list/',
                timeout: 5000,
                success: (data) => {
                    update_thread_list_view(data);
                    gk();
                }
            });
            (async() => {
            await addToDatabase(data);
        })()
            console.log(data);
            let active_thread_id = document.getElementById('topbar_otheruser_name').dataset.pvt_thread_id;
            
            if(data.private_thread_id == active_thread_id){
            appendNewChatMessage(data,false,true);
            }
        window.scrollTo(0,chat_section.scrollHeight)

        }


        if(data.user_info){

            my_info = JSON.parse(data['user_info'])
            var private_thread_id = data['private_thread_id']
            onReceivingUserInfo(my_info,private_thread_id);

        }
        if(data.messages_response){
            onReceivingMessagesResponse(data.messages_metadata,data.new_page_number,data.firstAttempt);
        }
    }

    privateChatWebSocket.addEventListener("open", function(e){
        console.log("ChatSocket OPEN")
        // join chat room
        if(unsafe_authenticated){
            privateChatWebSocket.send(JSON.stringify({
                "command": "join",
            }));
            let msgdata = getMessagesByThread(pvt_id);
            msgdata.then(elem=>{
                if(elem.length>0){
                    privateChatWebSocket.send(JSON.stringify({
                        "command": "idb_broadcast",
                        'idb_msg':elem,
                    }));
                }else{
                    console.log("no messages");
                }
            })
        }
    })
    privateChatWebSocket.onopen = function(e){
        console.log("i am connected")
    }
    privateChatWebSocket.onclose = function(){
        console.error("chat socket closed.")
    }

    if(privateChatWebSocket.readyState == WebSocket.OPEN){
        console.log("Private chat socket open")
    }else if(privateChatWebSocket.readyState == WebSocket.CONNECTING){
        console.log("Private chat socket connecting...")
    }
}
const chat_message_send_btn = document.getElementById('chat_message_send_btn');

$('#chat_message_input').keypress(function(e){
    if(e.which===13 && e.shiftKey){
        //shift and enter pressed go to next line
    }else if(e.which === 13 && !$('#chat_message_input').val().trim()){
        chat_message_input.setSelectionRange(0,0);
        e.preventDefault();
    }
    else if(e.which === 13 && !e.shiftKey){
        //submit
        e.preventDefault();
    chat_message_input.setSelectionRange(0,0);
        chat_message_send_btn.click();
    }
})

chat_message_send_btn.onclick = function(e){
    console.log("this is enter pressed with value")
        e.preventDefault();
        
        const chat_message = $('#chat_message_input').val().trim();
         s_key = document.getElementById('topbar_otheruser_name').dataset.val;

        // alert(encryptedMsg);
        let send_to = document.getElementById('topbar_otheruser_name').dataset.other_user_id
        if(chat_message == ''){
            console.log("empty message");
            return;
        }

        if(thread_distinguish.innerHTML == 'private_thread'){
        const encryptedMsg = encrypt(chat_message,s_key);

        if(privateChatWebSocket!=null){
            if(privateChatWebSocket.readyState == WebSocket.OPEN){
            privateChatWebSocket.send(
                JSON.stringify({
                    "command": "private_chat",
                    "message": encryptedMsg,
                    "message_type": 'text',
                    "send_to":send_to,
                    "sent_by":logged_user['id'],
                })
            );
            }
        }
    }else if(thread_distinguish.innerHTML == 'group_thread'){
            if(groupChatWebSocket!=null){
            if(groupChatWebSocket.readyState == WebSocket.OPEN){
                groupChatSend(chat_message);
            }
    }
    }
        chat_message_input.value = '';
}


// function idb_broadcastCallback(){
//     showLoader();
//     getUserInfo();
//     showLoader();
//     getPrivateThreadMessages(true);
//     hideLoader();
//     enableChatHistoryScroll();
// }

function getUserInfo(){
    privateChatWebSocket.send(JSON.stringify({
        'command': 'get_user_info',
    }))
}

function getPrivateThreadMessages(firstAttempt=false){
    var pageNumber = document.getElementById("page_number_id").innerHTML
    if(pageNumber!= '-1'){
        setPageNumber('-1');

        privateChatWebSocket.send(JSON.stringify(
            {
                'command':'request_messages_data',
                'page_number': pageNumber,
                'firstAttempt':firstAttempt,
            }
        ));
    }
}



function onIDBroadcast(msg_info,t_id){
    console.log("on idb broadcast")
    let msgdata = getMessagesByThread(t_id);
    msgdata.then(elem=>{
        if(elem.length>0){

            console.log("found existing message",elem);
        }else{
            console.log("no messages found so inserting");
            msg_info.forEach(async msg=>{
                await addToDatabase(msg);
            })
        }
    })
}


function onReceivingUserInfo(user_info,pvt_thread_id){
    document.getElementById('id_other_username').innerHTML = user_info['first_name'] +" "+user_info['last_name'];
    document.getElementById('topbar_otheruser_name').innerHTML = user_info['first_name'] +" "+user_info['last_name'];
    document.getElementById('other_user_profile_image').classList.remove("d-none");
    user_profile_url = myurl+"/account/profile/"+user_info['id'];
    document.getElementById('topbar_otheruser_name').href = user_profile_url;
    document.getElementById('topbar_otheruser_name').removeAttribute('data-group_thread_id');
    document.getElementById('topbar_otheruser_name').dataset.other_user_id = user_info['id'];
    document.getElementById('topbar_otheruser_name').dataset.pvt_thread_id = pvt_thread_id;

    document.getElementById('other_user_info').href =user_profile_url;
    document.getElementById('sidebar_simplebar_about').innerHTML = "About";
    document.getElementById('aboutprofile').innerHTML = `
                                        <div class="accordion-body">
                                            <div>
                                                <p class="text-muted mb-1">Name</p>
                                                <h5 class="font-size-14" id="sidebar_user_name">${user_info['first_name']} ${user_info['last_name']}</h5>
                                            </div>
                                            <div class="mt-4">
                                                <p class="text-muted mb-1">Username</p>
                                                <h5 class="font-size-14 mb-0" id="sidebar_user_username">${user_info['username']}</h5>
                                            </div>
                                            <div class="mt-4">
                                                <p class="text-muted mb-1">Email</p>
                                                <h5 class="font-size-14" id="sidebar_user_email">${user_info['username']}</h5>
                                            </div>                                            
                                        </div>`
    preloadImage(user_info['profile_image'], 'other_user_profile_image')
    preloadImage(user_info['profile_image'],'topbar_otheruser_image')
    $('#group_members').html('');
    $('#group_members_wrapper').addClass('d-none');

}


var onReceivingMessagesResponse = (messages,new_page_number,firstAttempt)=>{

    console.log("yo messages checking",messages)

    if(messages!= null && messages != 'undefined' && messages!="None"){
        setPageNumber(new_page_number);
        messages.forEach(element => {
            appendChatMessage(element, true,false);
            
        });
        if(firstAttempt){
            scrollToBottom();
        }
        
    }else{
        console.log("khattam no messages");
        paginationKhattam();
    }
}


var chatHistory = document.querySelector('#id_chat_log');
function chatHistoryScroll(e){
    
    if((Math.abs(chatHistory.scrollTop) + 2) >= (chatHistory.scrollHeight - chatHistory.offsetHeight)){
        if(thread_distinguish.innerHTML == 'private_thread'){
        getPrivateThreadMessages(false);
        }else if(thread_distinguish.innerHTML == 'group_thread'){
            console.log("get group thread messages call hunu parne");
            getGroupThreadMessages(false);
        }
    }
}


function selectUser(user_id){
    // Weird work-around for passing arg to url
    var url = myurl+"/account/profile/"+user_id;
    var win = window.open(url, "_blank")
    win.focus()
}


function createOrReturnPrivateChat(id){
    var chat_url = 'create_or_return_private_chat/';
    $.ajax({
        type: 'POST',
        dataType: 'json',
        url: chat_url,
        data: {
            'csrfmiddlewaretoken': csrf,
            'second_user_id': id,
        },
        timeout: 5000,
        success: (data)=>{
            console.log("SUCCESS chat",data);
            if(data['response'] == "Successfully got the chat."){
                webSocketSetup(id,data['private_thread_id']);
            }
            else if(data['response']!=null){
                showClientErrorModal(data.response);
            }
        },
        error: (data)=>{
            console.error("ERROR....",data)
            showClientErrorModal(data)
            alert("Something went wrong.")
        },
    });
}