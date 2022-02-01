function preloadCallback(src, elementId){
    var img = document.getElementById(elementId)
    img.src = src
}

function preloadImage(imgSrc, elementId){
    // console.log("attempting to load " + imgSrc + " on element " + elementId)
    var objImagePreloader = new Image();
    objImagePreloader.src = imgSrc;
    if(objImagePreloader.complete){
        preloadCallback(objImagePreloader.src, elementId);
        objImagePreloader.onload = function(){};
    }
    else{
        objImagePreloader.onload = function() {
            preloadCallback(objImagePreloader.src, elementId);
            //    clear onLoad, IE behaves irratically with animated gifs otherwise
            objImagePreloader.onload=function(){};
        }
    }
}

// var hljs = require('highlight.js');
function validateText(str)
	{   
		var md = window.markdownit({
			highlight: function (str, lang) {
				if (lang && hljs.getLanguage(lang)) {
					try {
						return '<pre class="hljs"><code>' +
							hljs.highlight(lang, str, true).value +
							'</code></pre>';
					} catch (__) {}
				}
				return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
			},
			linkify: true,
		});
		var result = md.render(str);
		return result
	}

	var setPageNumber = (pageNumber)=>{
		document.getElementById('page_number_id').innerHTML = pageNumber;
	}
	
	function clearChat(){
		// $('#message_history').fadeOut(500).empty();
		// $('#message_history').fadeIn(500);
		document.getElementById('id_chat_log').innerHTML='';
	}
	
	var paginationKhattam = ()=>{
		setPageNumber("-1");
	}
	
	function appendChatMessage(data,maintainPosition,isNewMessage){
		key = document.getElementById('topbar_otheruser_name').dataset.val;
		msg_id= data['msg_id'];
		(async() => {

		var temp_messages;

		temp_messages = await getMessagesById(msg_id);
		encrypted_message_content = temp_messages['message_content'];
		message_content = decrypt(encrypted_message_content,key);
		user_id = temp_messages['user_id'];
		sender_fname = data['first_name'];
		sender_lname = data['last_name'];
		msg_timestamp = data['natural_timestamp'];
		profile_image = temp_messages['profile_image'];
		username = temp_messages['username'];
		
		//get the parent ul element
		var chat_history = document.getElementById('id_chat_log');
		
		//create the child elements
		var newMessageBlock = document.createElement('div');
		var conversation_list_div = document.createElement('div');
		var chat_avatar_div = document.createElement('div');
		var user_chat_content_div = document.createElement('div');
		var ctext_wrap_div = document.createElement('div');
		var ctext_wrap_content_div = document.createElement('div');
		var new_message_content = document.createElement('p');
		var message_timestamp_p = document.createElement('p');
		var conversation_name_div = document.createElement('div');
	
		//add class to every created element
		conversation_list_div.classList.add('conversation-list');
		chat_avatar_div.classList.add('chat-avatar');
		user_chat_content_div.classList.add('user-chat-content');
		ctext_wrap_div.classList.add('ctext-wrap');
		ctext_wrap_content_div.classList.add('ctext-wrap-content');
		new_message_content.classList.add('mb-0')
		message_timestamp_p.classList.add('chat-time','mb-0');
		conversation_name_div.classList.add('conversation_name_div');
		var profileImage = document.createElement('img');
		profileImage.dataset.sender_id = user_id;
		profileImage.classList.add('clickable_cursor');
		profileImage.src = profile_image;
		profileImage.addEventListener('click',(e)=>{
			selectUser(profileImage.dataset.sender_id);
		});
		var sender_profile_image_id = "sender_profile_image_"+msg_id;
		profileImage.id = sender_profile_image_id;
		//rewrite the content of the created element message,timestamp and name
		new_message_content.innerHTML = validateText(message_content) ;
		message_timestamp_p.innerHTML = msg_timestamp
		conversation_name_div.innerHTML = sender_fname +" "+ sender_lname
		//check if the sender is the logged in user
			//append elements in order
			ctext_wrap_content_div.append(new_message_content,message_timestamp_p);
			ctext_wrap_div.appendChild(ctext_wrap_content_div);
			user_chat_content_div.append(ctext_wrap_div,conversation_name_div);
			chat_avatar_div.appendChild(profileImage);
			conversation_list_div.append(chat_avatar_div,user_chat_content_div)
			newMessageBlock.appendChild(conversation_list_div)
		if(user_id == logged_user.id && username == logged_user.username){
			// new_message_content.classList.add('')
			newMessageBlock.classList.add('sent','right');
	
		}else{
			// new_message_content.classList.add('')
			newMessageBlock.classList.add('replies');
		}
		//append message based on if it is instant message or the whole chunk of previous messages
	chat_history.appendChild(newMessageBlock);
	if(!maintainPosition){
		scrollToBottom();
	}

	})()

	}

	function appendNewChatMessage(data,maintainPosition,isNewMessage){
		console.log("instant msg appending");
		msg_id= data['msg_id'];
		user_id = data['user_id'];
		encrypted_message_content = data['message_content']
		key = document.getElementById('topbar_otheruser_name').dataset.val;
		message_content = decrypt(encrypted_message_content,key)
		console.log("encrypted msg",encrypted_message_content);
		console.log("decrypted msg ",message_content);
		sender_fname = data['first_name'];
		sender_lname = data['last_name'];
		msg_timestamp = data['natural_timestamp'];
		profile_image = data['profile_image'];
		username = data['username'];
		
		//get the parent ul element
		var chat_history = document.getElementById('id_chat_log');
		
		//create the child elements
		var newMessageBlock = document.createElement('div');
		var conversation_list_div = document.createElement('div');
		var chat_avatar_div = document.createElement('div');
		var user_chat_content_div = document.createElement('div');
		var ctext_wrap_div = document.createElement('div');
		var ctext_wrap_content_div = document.createElement('div');
		var new_message_content = document.createElement('p');
		var message_timestamp_p = document.createElement('p');
		var conversation_name_div = document.createElement('div');
	
		//add class to every created element
		conversation_list_div.classList.add('conversation-list');
		chat_avatar_div.classList.add('chat-avatar');
		user_chat_content_div.classList.add('user-chat-content');
		ctext_wrap_div.classList.add('ctext-wrap');
		ctext_wrap_content_div.classList.add('ctext-wrap-content');
		new_message_content.classList.add('mb-0')
		message_timestamp_p.classList.add('chat-time','mb-0');
		conversation_name_div.classList.add('conversation_name_div');
		var profileImage = document.createElement('img');
		profileImage.dataset.sender_id = user_id;
		profileImage.classList.add('clickable_cursor');
		profileImage.addEventListener('click',(e)=>{
			selectUser(profileImage.dataset.sender_id);
		});
		var sender_profile_image_id = "sender_profile_image_"+msg_id;
		profileImage.id = sender_profile_image_id;
		//rewrite the content of the created element message,timestamp and name
		new_message_content.innerHTML = validateText(message_content) ;
		message_timestamp_p.innerHTML = msg_timestamp
		conversation_name_div.innerHTML = sender_fname +" "+ sender_lname
		//check if the sender is the logged in user
			//append elements in order
			ctext_wrap_content_div.append(new_message_content,message_timestamp_p);
			ctext_wrap_div.appendChild(ctext_wrap_content_div);
			user_chat_content_div.append(ctext_wrap_div,conversation_name_div);
			chat_avatar_div.appendChild(profileImage);
			conversation_list_div.append(chat_avatar_div,user_chat_content_div)
			newMessageBlock.appendChild(conversation_list_div)
		if(user_id == logged_user.id && username == logged_user.username){
			// new_message_content.classList.add('')
			newMessageBlock.classList.add('sent','right');
	
		}else{
			// new_message_content.classList.add('')
			newMessageBlock.classList.add('replies');
		}
		//append message based on if it is instant message or the whole chunk of previous messages
	
		if(isNewMessage){
			chat_history.insertBefore(newMessageBlock,chat_history.firstChild);
		}else{
			chat_history.appendChild(newMessageBlock);
		}
		if(!maintainPosition){
			scrollToBottom();
		}
		preloadImage(profile_image,sender_profile_image_id);
	}

	function scrollToBottom(){
		$('#id_chat_log').scrollTop($('#id_chat_log').prop("scrollHeight"));
	}

	const loader = document.querySelector('.loader')
	const hideLoader = () => {
		loader.classList.remove('show');
	};

	const showLoader = () => {
		loader.classList.add('show');
	};
	function displayChatroomLoadingSpinner(isDisplayed){
		if(isDisplayed){
			loader.classList.add('show');
		}
		else{
			loader.classList.remove('show');
		}
	}

	var enableChatHistoryScroll = ()=>{
		$('#id_chat_log').on('scroll',chatHistoryScroll);
	}
	
	var disableChatHistoryScroll = ()=>{
		$('#id_chat_log').off('scroll',chatHistoryScroll);
	}

	function setActiveThreadFriend(userId){
		document.getElementById('id_friend_list_'+userId).parentElement.classList.add('active');
	}
	
	function showClientErrorModal(message){
		document.getElementById("id_client_error_modal_body").innerHTML = message
		document.getElementById("id_trigger_client_error_modal").click()
	}
	

//for updating thread list view
function update_thread_list_view(data){
	var logged_user =JSON.parse(document.getElementById('logged_in_user').textContent);

	var ulist = document.getElementById('contact_list_ul');
	ulist.innerHTML = ''
	data['chat_threads'].forEach(thread => {
	if(thread.first_user || thread.second_user){
		if(thread.first_user.username ===logged_user['username']){
		var myhtml = `<li class="myclass">
						<a onclick="onSelectFriend('${thread.second_user.id}',this);" data-threadType="private-thread"  data-userId="${thread.second_user.id}" id="id_friend_list_${thread.second_user.id}">
							<div class="d-flex">                            
								<div class="chat-user-img online align-self-center me-3 ms-0">
									<img id="id_friend_img_${thread.second_user.id}" src="${thread.second_user.profile_image}" class="rounded-circle avatar-sm" alt="">
									<!-- <span class="user-status"></span> -->
								</div>
		
								<div class="flex-1 overflow-hidden">
									<h5 class="text-truncate text-white font-size-15 mb-1">${thread.second_user.first_name} ${thread.second_user.last_name}</h5>
									<p class="chat-user-message text-truncate mb-0">Hey! there I'm available</p>
								</div>
								<div class="font-size-11">05 min</div>
							</div>
						</a>
					</li>`
			ulist.innerHTML += myhtml
		}else{
		var myhtml = `<li class="myclass">
						<a onclick="onSelectFriend('${thread.first_user.id}',this);" data-threadType="private-thread" data-userId="${thread.first_user.id}" id="id_friend_list_${thread.first_user.id}">
							<div class="d-flex">                            
								<div class="chat-user-img online align-self-center me-3 ms-0">
									<img id="id_friend_img_${thread.first_user.id}" src="${thread.first_user.profile_image}" class="rounded-circle avatar-sm" alt="">
									<!-- <span class="user-status"></span> -->
								</div>
		
								<div class="flex-1 overflow-hidden">
									<h5 class="text-truncate text-white font-size-15 mb-1">${thread.first_user.first_name} ${thread.first_user.last_name}</h5>
									<p class="chat-user-message text-truncate mb-0">Hey! there I'm available</p>
								</div>
								<div class="font-size-11">05 min</div>
							</div>
						</a>
					</li>`
			ulist.innerHTML += myhtml
		}
	}else{
		var myhtml = `<li class="myclass">
						<a onclick="onSelectGroup('${thread.id}',this);" data-threadType="group-thread" data-userId="${thread.id}" id="id_friend_list_${thread.id}">
							<div class="d-flex">                            
								<div class="chat-user-img online align-self-center me-3 ms-0">
									<img id="id_friend_img_${thread.id}" src="${thread.image}" class="rounded-circle avatar-sm" alt="">
									<!-- <span class="user-status"></span> -->
								</div>
		
								<div class="flex-1 overflow-hidden">
									<h5 class="text-truncate text-white font-size-15 mb-1">${thread.group_name}</h5>
									<p class="chat-user-message text-truncate mb-0">Hey! there I'm available</p>
								</div>
								<div class="font-size-11">05 min</div>
							</div>
						</a>
					</li>`
			ulist.innerHTML += myhtml
	}
	})
}


	//for encryption and decryption
	const XOREncryptDecrypt = (message, keyString) => {
		const key = keyString.split("");
		const output = [];
		for (let i = 0; i < message.length; i++) {
			const charCode =
				message.charCodeAt(i) ^ key[i % key.length].charCodeAt(0);
			output.push(String.fromCharCode(charCode));
		}
		return output.join("");
	};
	
	const encrypt = (message, key) =>
		XOREncryptDecrypt(message, key);

	const decrypt = (encryptedMessage, key) =>
		XOREncryptDecrypt(encryptedMessage, key);