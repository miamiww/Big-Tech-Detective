// global  variables
let blockObject  = {
    "Google": false,
    "Amazon": false,
    "Facebook": false,
    "Microsoft": false
};
let message_object = null;
let onOffObject = {};
let onOffStatus;

let switchIDs = ['googleSwitch', 'amazonSwitch','facebookSwitch','microsoftSwitch']


// initializing function
const initBlocks = () => {

    document.getElementById("onOffSwitch").addEventListener("click", onOff);
    //blocking 
    document.getElementById("googleSwitch").addEventListener("click", checkGoogle);
    document.getElementById("amazonSwitch").addEventListener("click", checkAmazon);
    document.getElementById("facebookSwitch").addEventListener("click", checkFacebook);
    document.getElementById("microsoftSwitch").addEventListener("click", checkMicrosoft);


    chrome.storage.local.get(['blocks'], function(result) {
        if(!isEmpty(result)){
            console.log('Blocking data from local storage is ' + result.blocks);
            blockObject = result.blocks;
            if(blockObject.Google){
                var checkbox = document.getElementById('googleSwitch');
                checkbox.checked = true;
            }
            if(blockObject.Amazon){
                var checkbox = document.getElementById('amazonSwitch');
                checkbox.checked = true;
            }
            if(blockObject.Facebook){
                var checkbox = document.getElementById('facebookSwitch');
                checkbox.checked = true;
            }
            if(blockObject.Microsoft){
                var checkbox = document.getElementById('microsoftSwitch');
                checkbox.checked = true;
            }
        } else{
            blockObject = {
                "Google": false,
                "Amazon": false,
                "Facebook": false,
                "Microsoft": false
            };
            chrome.storage.local.set({blocks: blockObject}, function() {
                console.log(blockObject);
            });
        }
    
    
    });
    chrome.storage.local.get(['onOff'], function(result){
        if(!isEmpty(result)){
            console.log('OnOff data from local storage is ' + result.onOff);
            onOffObject = result.onOff;

            if(onOffObject.onStatus){
                var checkbox = document.getElementById('onOffSwitch');
                checkbox.checked = true;
            } else{
                var checkbox = document.getElementById('onOffSwitch');
                checkbox.checked = false;
                greyOutFeatures();
            }
        } else{
            console.log('setting on off')
            onOffObject = {
                "onStatus": true,
            };
            chrome.storage.local.set({onOff: onOffObject}, function(){
                console.log(onOffObject)
            })
            var checkbox = document.getElementById('onOffSwitch');
            checkbox.checked = true;        }
    })

    chrome.runtime.onConnect.addListener((port) => {
        if(port.name=="on_off_messaging"){
            try{console.log(port); /** console.trace(); /**/ }catch(e){}
            console.assert(port.name == "on_off_messaging");
            message_object = port;
            message_object.onDisconnect.addListener(function(){
                console.log("disconnected from background")
    
            })
        }
    
    });
}



//blocking functions
const setBlockingInStorage = (company) => {
	blockObject[company] = !blockObject[company]
	chrome.storage.local.set({blocks: blockObject}, function() {
        console.log("block object set")
		console.log(blockObject);
	});
}

const checkGoogle = () => {
    var checkbox = document.getElementById('googleSwitch');
    if (checkbox.checked == true)
    {
        // alert("blocking Google could be very annoying");
        setBlockingInStorage("Google");
    } else{
        setBlockingInStorage("Google");
    }
}

const checkAmazon = () => {
    var checkbox = document.getElementById('amazonSwitch');
    if (checkbox.checked == true)
    {
        // alert("blocking Amazon could be very annoying");
        setBlockingInStorage("Amazon");

    } else{
        setBlockingInStorage("Amazon");
    }
}

const checkFacebook = () => {
    var checkbox = document.getElementById('facebookSwitch');
    if (checkbox.checked == true)
    {
        // alert("blocking Facebook could be very annoying");
        setBlockingInStorage("Facebook");

    } else{
        setBlockingInStorage("Facebook");

    }
}

const checkMicrosoft = () => {
    var checkbox = document.getElementById('microsoftSwitch');
    if (checkbox.checked == true)
    {
        // alert("blocking Microsoft could be very annoying");
        setBlockingInStorage("Microsoft");

    } else{
        setBlockingInStorage("Microsoft");

    }
}

const onOff = () => {
    console.log(onOffObject)
	onOffObject["onStatus"] = !onOffObject["onStatus"]
	chrome.storage.local.set({onOff: onOffObject}, function() {
		console.log(blockObject);
    });
    if(message_object) message_object.postMessage({'type': 'OnOff', 'message':'switching on/off', 'onStatus': onOffObject["onStatus"]})

    if(!onOffObject["onStatus"]){
        turnOffBlocking();
        // add some functions to grey out the different zo
        greyOutFeatures()
    } else {
        alert("Extension is turned on and connected to external server")
        unGreyFeatures()
    }
}

const turnOffBlocking = () => {
    blockObject = {
        "Google": false,
        "Amazon": false,
        "Facebook": false,
        "Microsoft": false
    };
    chrome.storage.local.set({blocks: blockObject}, function() {
        console.log(blockObject);
    });

    for(let i =0; i<switchIDs.length;i++){
        let checkbox = document.getElementById(switchIDs[i]);
        checkbox.checked = false;
    }
}

const greyOutFeatures = () =>{
    document.getElementById("overlay").style.visibility = "visible"
}

const unGreyFeatures = () =>{
    document.getElementById("overlay").style.visibility = "hidden"
}

initBlocks();