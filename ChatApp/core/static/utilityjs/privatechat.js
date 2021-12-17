const myurl = window.location.origin
const csrfchat = document.getElementsByName('csrfmiddlewaretoken')[0].value 
// const m_and_f = JSON.parse(document.getElementById('m_and_f').textContent);
const private_room = JSON.parse(document.getElementById('private_thread').textContent);
const logged_user =JSON.parse(document.getElementById('logged_in_user').textContent);
const chat_message_input = document.getElementById('chat_message_input')

console.log(chat_message_input);
chat_message_input.focus();



var privateChatWebSocket = null;
var friendId = null;
console.log(logged_user)


first_user_id = getIDs();
if(first_user_id!=null){
console.log("first user",first_user_id)
webSocketSetup(first_user_id);
}



unsafe_authenticated = 'true' === document.currentScript.dataset.authenticated;
console.log(unsafe_authenticated)
// onStart();
// function onStart(){
//     if(private_room){
//         console.log("this is private room",private_room);
//         if(private_room.first_user === private_room.second_user){
//             onSelectFriend(private_room.second_user.id)
//         }else{
//             onSelectFriend(private_room.first_user.id)
//         }
//     }else{
//         if(m_and_f){
//             onSelectFriend(m_and_f[0].friend.id);
//         }
//     }
//     m_and_f.forEach(element => {
//         preloadImage(element.friend.profile_image)
//     });
// }

function onSelectFriend(userId,ele){
    console.log("onSelectFriend: " + userId)
    createOrReturnPrivateChat(userId)
    removeActiveThreadFriend();
    setActiveThreadFriend(userId);


}
function closeWebSocket(){
    if(privateChatWebSocket != null){
        // privateChatWebSocket.close()
        privateChatWebSocket = null
        clearChat();
        setPageNumber("1");
        disableChatHistoryScroll();
    }
}

function webSocketSetup(user_id){
    console.log("web socket for "+user_id)
    friendId = user_id
    closeWebSocket()
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
        if(data.error){
            console.error(data.error + ": "+data.message)
            showClientErrorModal(data.message)
            return;
        }

        console.log(data);

        if (data.joining_room){
            console.log("Joining room " + data.joining_room);
            getUserInfo();
            getPrivateThreadMessages();

            // enableChatLogScrollListener()
        }



        if(data.command == "private_chat"){
            console.log("chat message gayera aayo");
        }

        


        if(data.user_info){

            my_info = JSON.parse(data['user_info'])
            onReceivingUserInfo(my_info);
        }
        if(data.messages_response){
            onReceivingMessagesResponse(data.messages_metadata,data.new_page_number);
        }
    }

    privateChatWebSocket.addEventListener("open", function(e){
        console.log("ChatSocket OPEN")
        // join chat room
        if(unsafe_authenticated){
            privateChatWebSocket.send(JSON.stringify({
                "command": "join",
            }));
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

$('#chat_message_input').keypress(function(e){
    if(e.which===13 && e.shiftKey){
        //shift and enter pressed go to next line
    }else if(e.which === 13 && !$('#chat_message_input').val().trim()){
        chat_message_input.setSelectionRange(0,0);
        e.preventDefault();
    }
    else if(e.which === 13 && !e.shiftKey){
        //submit
        console.log("this is enter pressed with value")
        e.preventDefault();
        const chat_message = chat_message_input.value;
        console.log("client ko message",chat_message)
        privateChatWebSocket.send(
            JSON.stringify({
                "command": "private_chat",
                "message": chat_message,
                "message_type": 'text'
            })
        );
        chat_message_input.value = '';
    }
})




var setPageNumber = (pageNumber)=>{
    document.getElementById('page_number_id').innerHTML = pageNumber;
}

function clearChat(){
    document.getElementById("message_history").innerHTML = ""
}

var paginationKhattam = ()=>{
    setPageNumber("-1");
}


function getUserInfo(){
    console.log("i am being called.")
    privateChatWebSocket.send(JSON.stringify({
        'command': 'get_user_info',
    }))
}

function getPrivateThreadMessages(){
    var pageNumber = document.getElementById("page_number_id").innerHTML
    if(pageNumber!= '-1'){
        setPageNumber('-1');

        privateChatWebSocket.send(JSON.stringify(
            {
                'command':'request_messages_data',
                'page_number': pageNumber,
            }
        ));
    }
}



function appendChatMessage(data,isNewMessage){
    console.log("append message ko ",data);
}


function onReceivingUserInfo(user_info){
    document.getElementById('id_other_username').innerHTML = user_info['first_name'] +" "+user_info['last_name']
    document.getElementById('other_user_profile_image').classList.remove("d-none");
    user_profile_url = myurl+"/account/profile/"+user_info['id'];
    document.getElementById('other_user_info').href =user_profile_url;
    preloadImage(user_info['profile_image'], 'other_user_profile_image')
}


var handleMessagesPayload = (messages,new_page_number)=>{
    if(messages!= null && messages != 'undefined' && messages!="None"){
        setPageNumber(new_page_number);
        messages.forEach(element => {
            appendChatMessage(element, true,false);
        });
    }else{
        paginationKhattam();
    }
}

var chatHistoryScroll = (e)=>{
    var chatHistory = document.getElementById('message_history');
    if((Math.abs(chatHistory.scrollTop) + 2) >= (chatHistory.scrollHeight - chatHistory.offsetHeight)){
        getPrivateThreadMessages();
    }
}


var enableChatHistoryScroll = ()=>{
    document.getElementById('message_history').addEventListener('scroll',chatHistoryScroll);
}

var disableChatHistoryScroll = () =>{
    document.getElementById('message_history').removeEventListener('scroll',chatHistoryScroll);
}


var setActiveThreadFriend = (userId)=>{
    console.log(document.getElementById('id_friend_list_'+userId).parentElement)
    document.getElementById('id_friend_list_'+userId).classList.add('active-contact');
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
                webSocketSetup(id);
            }
            else if(data['response']!=null){
                alert(data['response'])
            }
        },
        error: (data)=>{
            console.error("ERROR....",data)
            alert("Something went wrong.")
        },
    });
}