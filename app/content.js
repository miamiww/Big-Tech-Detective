var block = false;
console.log(block);
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
    port = chrome.runtime.connect({name: "blocker_socket"});
    port.onMessage.addListener(blockTime);
    chrome.storage.local.get(['blocks'], function(result) {
        if(!isEmpty(result)){
            console.log('Blocking data from local storage is ' + result.blocks);
            blockingData = result.blocks;
            console.log(blockingData);
        } else{
            console.log('No user input on blocking, allow everything')
        }


    });
}

const blockTime = data => {
    console.log(data)
    if(data.type=="blockPage"){
        // window.location.replace(block_url);
        if(!block){
            if(data.company == "Google"){
                if(blockingData.Google){
                    block = true;
                    let div = document.createElement('div');
                    div.className = "overlay";
                    div.innerHTML = "\n\n\n<strong>Hi there!</strong> This page is blocked";
                  
                    document.body.append(div);
                }
    
            }
            if(data.company == "Amazon"){
                if(blockingData.Amazon){
                    block = true;
                    let div = document.createElement('div');
                    div.className = "overlay";
                    div.innerHTML = "\n\n\n<strong>Hi there!</strong> This page is blocked";
                  
                    document.body.append(div);
                }
    
            }
            if(data.company == "Facebook"){
                if(blockingData.Facebook){
                    block = true;
                    let div = document.createElement('div');
                    div.className = "overlay";
                    div.innerHTML = "\n\n\n<strong>Hi there!</strong> This page is blocked";
                  
                    document.body.append(div);
                }
    
            }
            if(data.company == "Microsoft"){
                if(blockingData.Microsoft){
                    block = true;
                    let div = document.createElement('div');
                    div.className = "overlay";
                    div.innerHTML = "\n\n\n<strong>Hi there!</strong> This page is blocked";
                  
                    document.body.append(div);
                }
    
            }
    
        }
        }


}


initBlocks();