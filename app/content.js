var block = false;
var blockingData = {
    "Google": false,
    "Amazon": false,
    "Facebook": false,
    "Microsoft": false
};

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

const initBlocks = () => {
    // port = chrome.runtime.connect({name: "blocker_socket"});
    // port.onMessage.addListener(blockTime);

    chrome.runtime.onMessage.addListener(blockTime);
    chrome.storage.local.get(['blocks'], function(result) {
        if(!isEmpty(result)){
            console.log('Blocking data from local storage is ' + result.blocks);
            blockingData = result.blocks;
        } else{
            console.log('No user input on blocking, allow everything')
        }


    });
}

const blockTime = (data,sender,sendResponse) => {

    if(data.type=="blockPage"){
        // window.location.replace(block_url);
        if(!block){
            if(data.company == "Google"){
                if(blockingData.Google){
                    buildBlockPage(data);

                }
    
            }
            if(data.company == "Amazon"){
                if(blockingData.Amazon){
                    buildBlockPage(data)
                }
    
            }
            if(data.company == "Facebook"){
                if(blockingData.Facebook){
                    buildBlockPage(data)
                }
    
            }
            if(data.company == "Microsoft"){
                if(blockingData.Microsoft){
                    buildBlockPage(data)
                }
    
            }
    
        }
        }
      sendResponse({message: "received"});


}

const blockingText = (data) => {
    return "<br />" + "<strong>Hi there!</strong> This page is blocked by Big Tech Detective" +  "<br />"  + " because it loaded a resource from" + "<br />"  + "<br />" + "<i>"+ data.url +"</i>"  + "<br />"+ "<br />"   + "which is owned by "+data.company + "." + "<br />" + "<br />" + "If you wish to access the page, turn off blocking in your extension, and reload the page."
}

const buildBlockPage = (data) => {


    block = true;
    let overlayDiv = document.createElement('div');
    overlayDiv.className = "overlay";
    let contentDiv = document.createElement('div');

    contentDiv.className = "block-information-container";
    contentDiv.innerHTML = blockingText(data);
    
    let lockDiv = document.createElement('div');
    lockDiv.className = "lock-container";

    document.body.append(overlayDiv);
    document.body.append(contentDiv);
    document.body.append(lockDiv);
}


initBlocks();