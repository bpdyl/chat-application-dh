const url = window.location.href
const searchForm = document.getElementById('searchbar')
const searchInput = document.getElementById('search-input')
const resultBox = document.getElementById('results-box')
const contactlist = document.getElementById('contact-list')
const csrf = document.getElementsByName('csrfmiddlewaretoken')[0].value 

const searchData = (search_query) => {

    var ajaxRequest = $.ajax({
        type: 'POST',
        url: 'search/',
        data: { 
            'csrfmiddlewaretoken':csrf,
            'search_query': search_query,
        },
        success: (result) => {
            const data = result.data
            if(Array.isArray(data)){
                contactlist.classList.add('not-visible');
                resultBox.innerHTML = ''
                data.forEach(user=>{
                    resultBox.innerHTML+=`
                        <a href="../account/profile/${user.pk}">
                            <div class="row-5 searchlist">
                                <div class="col-lg-4">
                                    <img src="${user.profile_image}" class="user-image">
                                </div>
                                <div class="col-lg-8">
                                    <h5>${user.first_name} ${user.last_name}</h>
                                    <p class="text font-size-sm">@<u>${user.username}</u></p>
                                </div>
                            </div>
                        </a>
                        `
                })
                
            }else{
                if(searchInput.value.length > 0){
                    resultBox.innerHTML = `
                    <div class="row-5 searchlist" style="padding:15px;">
                                <div class="col-lg-8">
                                <b><h5>${data}</h5></b>
                                </div>
                    
                    </div>
                    `;
                    
                }else{
                    resultBox.classList.add('not-visible');
                }
            }
        },
        error: (err) => {
            console.log("This is me "+err)
        } 
    })
    if(ajaxRequest){
        if(search_query.length ==0 ){
            resultBox.classList.add('not-visible')
            contactlist.classList.remove('not-visible');
            ajaxRequest.abort();
        }
    }
}

searchInput.addEventListener('keyup',e => {
    if(resultBox.classList.contains('not-visible')){
        resultBox.classList.remove('not-visible')
    }
    searchData(e.target.value)

})
