let db = new Localbase('messageDb');
db.config.debug = false
async function addToDatabase(messages_data){
    await db.collection('private_messages').add(messages_data);
}

function getMessagesByThread(t_id){
    db.collection('private_messages').doc({private_thread_id: t_id}).get().then(document => {
        return document;
      })
}
async function getMessagesById(m_id){
    var mydata = await db.collection('private_messages').doc({msg_id:parseInt(m_id)}).get();
    return mydata;
}