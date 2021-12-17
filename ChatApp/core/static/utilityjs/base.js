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