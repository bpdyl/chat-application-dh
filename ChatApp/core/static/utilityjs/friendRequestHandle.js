//Constants for comparing the request status
SEND_REQUEST_SUCCESS = "Friend request has been sent."
REQUEST_ERROR = "Something went wrong."
NO_USER_ID = "Unable to perform action. User id not available."
REQUEST_ALREADY_SENT = "You have already sent the request."
CANCEL_REQUEST_SUCCESS = "Friend request cancelled."
REQUEST_ACCEPTED = "Friend request accepted."
NOT_YOUR_REQUEST = "This is not your request to accept."
NO_REQUEST_TO_ACCEPT = "Nothing to accept. Request doesnot exist."
REQUEST_DECLINED = "Friend request declined."
NO_REQUEST_TO_DECLINE = "Nothing to decline. Request doesnot exist."
FRIEND_REMOVED = "Friend removed successfully."


//query selectors
const csrf = document.getElementsByName('csrfmiddlewaretoken')[0].value 
const url = window.location.origin
const sendBtn = document.getElementById('send_request_btn')
const cancelBtn = document.getElementById('cancel_request_btn')
const unfriendBtn = document.getElementById('unfriend_btn')
const requestBtnDiv = document.getElementById('send_cancel_div')
const friendListContainer = document.getElementById('friendlistcontainer')
const viewFriendListBtn = document.getElementById('view-friends')
//Websocket for friendrequest handling
const roomName = JSON.parse(document.getElementById('room-name').textContent);
        const friendrequestSocket = new WebSocket(
            'ws://'
            + window.location.host
            + '/ws/friendrequest/'
            + roomName
            + '/'
        );
        
        const uiUpdateSocket = new WebSocket(
            'ws://'
            + window.location.host
            + '/ws/uiupdate/'
            + roomName
            + '/'
        );

        

        friendrequestSocket.onmessage = function(e) {
            const data = JSON.parse(e.data);
            // document.querySelector('#chat-log').value += (data.message + '\n');
            console.log(data['result']);
            if(data['result'] == SEND_REQUEST_SUCCESS){
            	console.log("first attempt");
            	$("#send_request_btn").fadeOut(500).hide();
            $("#cancel_request_btn").fadeIn(500).show();
            }
            else if(data['result'] == CANCEL_REQUEST_SUCCESS){
            	$("#cancel_request_btn").fadeOut(500).hide();
	        $("#send_request_btn").fadeIn(500).show();
            }
            // else if(data['result'] == REQUEST_ACCEPTED){
            //     console.log("websocket request accepted")
            //     $("#respond_request_div").fadeOut(500).hide();
            //     $("#friends_function_div").show();
            //     $("#send_request_btn").hide();
            // }
            // else if(data['result'] == REQUEST_DECLINED){
            //     console.log("websocket request declined")
            //     $("#respond_request_div").fadeOut(500).hide();
            //     $("#send_request_btn").fadeIn(500).show();
            // }
            // else if(data['result'] == FRIEND_REMOVED){
            //     console.log("remove ta vayo khai")
            //     location.reload();

            // }
            else if(data['result']){
                console.log("reload nagarna check gareko",data['result'])
            }
            else if(data['sender']==null && data['friend_requests']==null){
                requestContainer.innerHTML = `
                    <div class="d-flex flex-row flex-grow-1 justify-content-center align-items-center p-4">
                    <p>You can't see other people friend request.</p>
                    </div>
                
                `
            }
            else if(data['sender'].length==0 && data['friend_requests'].length==0){
                requestContainer.innerHTML = `
                    <div class="d-flex flex-row flex-grow-1 justify-content-center align-items-center p-4">
                    <p>You don't have any friend requests.</p>
                    </div>
                `
            }
            else if(data['sender'].length>0 && data['friend_requests'].length>0){
                requestContainer.innerHTML = ''
 
                data['friend_requests'].forEach((request,index) => {
                    
                    const sender = data['sender'][index]
                    requestContainer.innerHTML += `
                    <div class="row requestcard">
                                    
                    <div class="col-md-8">
                    <div class="row">
                    <a href="${url}/account/profile/${sender.id}">
                    <div class="col-md-3">
                    <img src="${url}/media/${sender.profile_image}" alt="user" class="profile-image">
                    </div>
                    <div class="col-md-5">
                            <h5><a href="${url}/account/profile/${sender.id}" style="text-decoration: none;" class="profile-link">${sender.first_name} ${sender.last_name}</a></h5>
                            <p>@${sender.username}</p>
                    </div>
                    </a>
                    </div>
                    </div>
                    <div class="col-md-4">
                        
                        <input type="button" id="id_confirm_${sender.id}" onclick='triggerAcceptFriendRequest(${request.id})' class="btn btn-success" value="Confirm">
                        <input type="button" id="id_decline_${sender.id}" onclick='triggerDeclineFriendRequest(${request.id})' class="btn btn-danger" value="Decline">
                    
    
                    </div>    
            </div>
            `
            
        });
    
        }

        //for friend list viewing
        if(data['friends']==null){
            console.log("null po aayo ta websocket")
            friendListContainer.innerHTML = `
                <div class="d-flex flex-row flex-grow-1 justify-content-center align-items-center p-4">
                <p>You must be friends to see the friends of each other.</p>
                </div>
                  `
        }
        else if(data['friends'].length==0){
            console.log("0 cha friendlist ko length")
            friendListContainer.innerHTML = `
                <div class="d-flex flex-row flex-grow-1 justify-content-center align-items-center p-4">
                <p>You don't have any friends.</p>
                </div>
            `
        }else if(data['friends'].length>0){
            console.log('This is weebsocket ',data['friends'])
            console.log("friend remove vayepachi ko")
        friendListContainer.innerHTML = ''
        data['friends'].forEach((friend)=>{
            friendListContainer.innerHTML += `              
            <div class="col-lg-6">
            <div class="row friendcard">
                <div class="col-sm-9">
                    <img src="${url}${friend[0].profile_image}" alt="user" class="profile-photo-lg">
                        <h5><a href="${url}/account/profile/${friend[0].id}" style="text-decoration:none;" class="profile-link">${friend[0].first_name} ${friend[0].last_name}</a></h5>
                        <p>@${friend[0].username}</p>
                </div>
                <div class="options col-sm-3">
                    <button class="btn button-17 dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" role="button" ></button>
                    <div class="dropdown-menu dropdown-menu-center">
                        <input type="button" class="btn btn-info "  value="Message" id="respond-accept-btn-${friend[0].id}" onclick=''>
                        <input type="button" class="btn btn-danger " value="Unfriend" id="respond-decline-btn-${friend[0].id}" onclick='removeFriend(${friend[0].id},onFriendRemoved)'>
                    </div>
                </div>
            </div>
        </div>
            `
        })
    
    
    }
        };

        friendrequestSocket.onclose = function(e) {
            console.error('Chat socket closed unexpectedly');
        };


        uiUpdateSocket.onmessage = function(e){
            const data = JSON.parse(e.data);
            // if(data['result']==SEND_REQUEST_SUCCESS){
            //     $("#send_request_btn").fadeOut(1000).hide();
            //     $("#respond_request_div").fadeIn(1000).show();
            // }else if(data['result']== CANCEL_REQUEST_SUCCESS){
            //     $("#respond_request_div").fadeOut(1000).hide();
            //     $("#send_request_btn").fadeIn(1000).show();
            // }else if(data['result']==FRIEND_REMOVED){
            //     console.log("ui update friend remove vako remove vako")
            //     location.reload();
            // }
            if(data['result']!=null){
                location.reload();
            }
        }
        uiUpdateSocket.onclose = function(e) {
            console.error('Chat socket closed unexpectedly');
        };

// Sending friend request action
const send_request = (id,uiUpdateFunction) => {
    $.ajax({
        type: "POST",
        dataType: "json",
        url: url+'/friends/send_request/',
        timeout: 5000,
        data: {
            "csrfmiddlewaretoken":csrf,
            "receiver_user_id":id,
        },
        success: (data) => {
            if(data.result == REQUEST_ALREADY_SENT){
                console.log("request already sent")
            }
            else if(data.result!=null){
                console.log(data.result);
            }
            if(data.result){
                uiUpdateFunction()
            } 
        },
        error: (data) => {
            alert("Something went wrong: " + data.result)
        },
        complete: (data) => {
            if(data.result){
            uiUpdateFunction()
        }
        }
    })
}

if(sendBtn!=null){
sendBtn.addEventListener('click',function(e){
    receiver_id = e.target.getAttribute('data-id')
    send_request(receiver_id, onRequestSent)
})
}

var onRequestSent = () =>{
    console.log("I have been invoked")
    $("#send_request_btn").fadeOut(500).hide();
    $("#cancel_request_btn").fadeIn(500).show();
}



//Cancelling the Request by sender themselves
const cancel_request = (id,uiUpdateFunction) => {
    $.ajax({
        type: "POST",
        dataType: "json",
        url: url+'/friends/cancel_request/',
        timeout: 5000,
        data: {
            "csrfmiddlewaretoken":csrf,
            "receiver_user_id":id,
        },
        success: (data) => {
            // if(data.result == REQUEST_ALREADY_SENT){
            //     console.log("request already sent")
            // }
            // else if(data.result!=null){
            //     console.log(data.result);
            // } 
            if(data.result){
                uiUpdateFunction()
            }
        },
        error: (data) => {
            alert("Something went wrong: " + data.result)
        },
        complete: (data) => {
            console.log("yo chai test "+data)
            if(data.result){
                uiUpdateFunction()
            }
        }
    })
}

if(cancelBtn!=null){
    cancelBtn.addEventListener('click',function(e){
        receiver_id = e.target.getAttribute('data-id')
        cancel_request(receiver_id, onRequestCancelled);
    })
    }
    
    var onRequestCancelled = () =>{
        console.log("I am cancel request")
        $("#cancel_request_btn").fadeOut(500).hide();
        $("#send_request_btn").fadeIn(500).show();
        
    }

//accepting the friend request
var acceptFriendRequest=(friend_request_id, uiUpdateFunction)=>{
    var accept_url = url+'/friends/accept_request/'+friend_request_id
    $.ajax({
        type: "GET",
        dataType: "json",
        url : accept_url,
        timeout: 5000,
        success : (data)=>{
            console.log("yo data result"+data['result']);
            switch(data['result']){
                case REQUEST_ACCEPTED:
                    console.log("yo ma ho")
                    console.log(REQUEST_ACCEPTED)
                    break;
                case NO_REQUEST_TO_ACCEPT:
                    console.log(NO_REQUEST_TO_ACCEPT)
                default:
                    console.log("Default case")
                    break;
            }
            if(data.result){
            uiUpdateFunction();
        }
        },
        error: (data)=>{
            alert("Something went wrong" +data.result)
        },
        complete: (data)=>{
            if(data.result){
                uiUpdateFunction();
            }
        },
    })
}



//Declining the friend request
var declineFriendRequest=(friend_request_id, uiUpdateFunction)=>{
    var decline_url = url+'/friends/decline_request/'+friend_request_id

    $.ajax({
        type: "GET",
        dataType: "json",
        url : decline_url,
        timeout: 5000,
        success : (data)=>{
            switch(data['result']){
                case REQUEST_DECLINED:
                    console.log(REQUEST_DECLINED)
                    break;
                case NO_REQUEST_TO_DECLINE:
                    console.log(NO_REQUEST_TO_DECLINE)
                default:
                    console.log("Default case"+data.result)
                    break;
            }
            if(data.result){
            uiUpdateFunction();
        }
        },
        error: (data)=>{
            alert("Something went wrong" +data.result)
        },
        complete: (data)=>{
            if(data.result){
                uiUpdateFunction();
            }
        },
    })
}

onFriendRequestAccepted = ()=>{
console.log("hi hello")
}
onFriendRequestDeclined=()=>{
console.log("hello")
    
}

function triggerAcceptFriendRequest(friend_request_id){
    acceptFriendRequest(friend_request_id, onFriendRequestAccepted)
}

function triggerDeclineFriendRequest(friend_request_id){
    declineFriendRequest(friend_request_id, onFriendRequestDeclined)
} 

$(document).ready(function(){
    $(document).on("click","button",function(){
      console.log(this.id);
    });
  });

//ajax call for displaying the friend requests 
const requestContainer = document.getElementById('requestcontainer')

const viewRequestBtn = document.getElementById('view-friend-request')
viewRequestBtn.addEventListener('click',e=>{
    console.log('clicked')
    viewFriendRequests();
    
})

const auth_user_id = JSON.parse(document.getElementById('auth_user_id').textContent);
const userId = JSON.parse(document.getElementById('user_account_id').textContent)

$(document).ready(function(){
    // setInterval(() => {
    //     viewFriendRequests();
    // }, 1000);
    viewFriendRequests();
})


const viewFriendRequests =()=>{
    var requestView = $.ajax({
        type: 'GET',
        url: url+'/friends/view_friend_requests/'+userId+'/',
        success: (data) => {
            console.log("ajax request ko ",data)
            if(data['sender']==null && data['friend_requests']==null){
                requestContainer.innerHTML = `
                    <div class="d-flex flex-row flex-grow-1 justify-content-center align-items-center p-4">
                    <p>You can't see other people friend request.</p>
                    </div>
                
                `
            }
            else if(data['sender'].length==0 && data['friend_requests'].length==0){
                requestContainer.innerHTML = `
                    <div class="d-flex flex-row flex-grow-1 justify-content-center align-items-center p-4">
                    <p>You don't have any friend requests.</p>
                    </div>
                `
            }else{
                requestContainer.innerHTML = ''
                data['friend_requests'].forEach((request, index)=>{
                    const sender = data['sender'][index];
                    console.log(sender,request);
                    requestContainer.innerHTML += `
                    <div class="row requestcard">
                                    
                    <div class="col-md-8">
                    <div class="row">
                    <a href="${url}/account/profile/${sender.id}">
                    <div class="col-md-3">
                    <img src="${url}/media/${sender.profile_image}" alt="user" class="profile-image">
                    </div>
                    <div class="col-md-5">
                            <h5><a href="${url}/account/profile/${sender.id}" style="text-decoration: none;" class="profile-link">${sender.first_name} ${sender.last_name}</a></h5>
                            <p>@${sender.username}</p>
                    </div>
                    </a>
                    </div>
                    </div>
                    <div class="col-md-4">
                        
                                        
                    <input type="button" id="id_confirm_${sender.id}" onclick='triggerAcceptFriendRequest(${request.id})' class="btn btn-success" value="Confirm">
                    <input type="button" id="id_decline_${sender.id}" onclick='triggerDeclineFriendRequest(${request.id})' class="btn btn-danger" value="Decline">
    
                    </div>    
            </div>
            `
                  });
    }
            
            
        }

    })
}


//Removing the friend
var removeFriend = (removee_id,uiUpdateFunction)=>{
    console.log("remove friend "+removee_id)
    $.ajax({
        type: "POST",
        dataType: "json",
        url: url+'/friends/remove_friend/',
        timeout: 5000,
        data: {
            "csrfmiddlewaretoken":csrf,
            "removee_user_id":removee_id,
        },
        success: (data) => {
            // if(data.result == REQUEST_ALREADY_SENT){
            //     console.log("request already sent")
            // }
            // else if(data.result!=null){
            //     console.log(data.result);
            // } 
            if(data.result){
                uiUpdateFunction()
            }
        },
        error: (data) => {
            alert("Something went wrong: " + data.result)
        },
        complete: (data) => {
            if(data.result){
                uiUpdateFunction()
            }
        }
    })
}
var onFriendRemoved = ()=>{

    console.log(requestBtnDiv)

}


if(unfriendBtn!=null){
    unfriendBtn.addEventListener('click',function(e){
        removee_id = e.target.getAttribute('data-id')
        console.log(removee_id)
        removeFriend(removee_id, onFriendRemoved);
    })
}



viewFriendListBtn.addEventListener('click',e=>{
    viewFriendList();
    
})

const viewFriendList =()=>{
    var requestView = $.ajax({
        type: 'GET',
        url: url+'/friends/view_friend_list/'+userId+'/',
        success: (data) => {
            console.log("friend list ",data['friends'])
            if(data['friends']==null){
                friendListContainer.innerHTML = `
                    <div class="d-flex flex-row flex-grow-1 justify-content-center align-items-center p-4">
                    <p>You must be friends to see the friends of each other.</p>
                    </div>
                      `
            }
            else if(data['friends'].length==0){
                friendListContainer.innerHTML = `
                    <div class="d-flex flex-row flex-grow-1 justify-content-center align-items-center p-4">
                    <p>You don't have any friends.</p>
                    </div>
                `
            }else{
                friendListContainer.innerHTML = ''
                data['friends'].forEach((friend)=>{
                    friendListContainer.innerHTML += `              
                        <div class="col-lg-6">
                            <div class="row friendcard">
                                <div class="col-sm-9">
                                    <img src="${url}${friend[0].profile_image}" alt="user" class="profile-photo-lg">
                                        <h5><a href="${url}/account/profile/${friend[0].id}" style="text-decoration:none;" class="profile-link">${friend[0].first_name} ${friend[0].last_name}</a></h5>
                                        <p>@${friend[0].username}</p>
                                </div>
                                <div class="options col-sm-3">
                                    <button class="btn button-17 dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" role="button" ></button>
                                    <div class="dropdown-menu dropdown-menu-center">
										<input type="button" class="btn btn-info "  value="Message" id="respond-accept-btn-${friend[0].id}" onclick=''>
										<input type="button" class="btn btn-danger " value="Unfriend" id="respond-decline-btn-${friend[0].id}" onclick='removeFriend(${friend[0].id},onFriendRemoved)'>
									</div>
                                </div>
                            </div>
                        </div>
                    `
                })
            
            
            }

    }
    });
}