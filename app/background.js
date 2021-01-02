// this takes a hybrid approach to updating the company information in the extension interface, 
// it both adds to local storage so that when the extension is opened it will query storage once, and sends it as a message to the extension
// this is to avoid clogging up local storage communication, which can be overly slow in delivering real-time updates to the extension

const url_filter = {urls: ["<all_urls>"], types:[]}
// make sure to ignore the packets being sent to the server or else it will cause an infinite loop of requests
const ignore_ips = [undefined]
const early_flagged_domains = []

// objects for messaging to the chart
let message_object = null;
let block_object = null;
let chart_object;
// object for local storage
let companyData = {};
let websiteData = {};
let onStatus;

// settings for pop-out window
var net_url = chrome.extension.getURL('main.html');
var win_properties = {'url': net_url , 'type' : 'popup', 'width' : 800 , 'height' : 686, 'focused': true }
var net_win;

// functions for setting local storage

const assign = (obj, keyPath, value) => {
	lastKeyIndex = keyPath.length-1;
	for (var i = 0; i < lastKeyIndex; ++ i) {
	  key = keyPath[i];
	  if (!(key in obj)){
		obj[key] = {}
	  }
	  obj = obj[key];
	}
	obj[keyPath[lastKeyIndex]] = value;
}

const isEmpty = (obj) => {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

const setCompanyInStorage = (data, info) => {
	companyData[data.ip.company]=(companyData[data.ip.company]+1) || 1;
	chrome.storage.local.set({key: companyData}, function() {
		console.log(companyData);
	  });

	console.log(info)
	if(info.frameId===0){
		console.log("website data")
		assign(websiteData, [info.initiator, data.ip.company], websiteData[info.initiator[data.ip.company]] + 1 || 1)
		chrome.storage.local.set({websites: websiteData}, function() {
			console.log(websiteData);
		  });	
	}

}

const setOtherInStorage = () => {
	companyData["Other"]=(companyData["Other"]+1) || 1;
	chrome.storage.local.set({key: companyData}, function() {
		console.log(companyData);
	  });
}


// setting up listeners, messaging, on off status
const init = () => {
	// the main listener - Get IP when request is completed, request the IP from the server to see the IP owner, and then send the appriate message to the extension interface and update the local storage information
	chrome.webRequest.onCompleted.addListener( 
		(info) => {

		if(onStatus){
			//	 preventing infinite loops
			if(!ignore_ips.includes(info.ip) && !info.initiator.includes("chrome-extension://")){
				console.log(info)
				postData('https://big-tech-detective-api.herokuapp.com/ip/', { ip: info.ip })
				.then(data => postResponseHandler(data,info,message_object))
				.catch(err => {if(message_object) message_object.postMessage({'type': 'error', 'message':'api error', 'contents': err})});
			}
		} else{
			console.log('extension is off')
		}
		return;
	},
		url_filter,
		[]
	);

	// send messages to extension window and content.js in realtime
	chrome.runtime.onConnect.addListener((port) => {
		if(port.name=="extension_socket"){
			try{console.log(port); /** console.trace(); /**/ }catch(e){}
			console.assert(port.name == "extension_socket");
			message_object = port;
			message_object.onDisconnect.addListener(function(){
				console.log("disconnected from extension")
				net_win = null;
				message_object = null;
	
			})

		}
		// recieve on / off signal
		let onOffPort = chrome.runtime.connect({name: "on_off_messaging"});
		onOffPort.onMessage.addListener(onMessage);
		onOffPort.onDisconnect.addListener(function(){
			console.log('disconnected from on / off port')
		})
	
	});



	// open up the extension window when icon is clicked
	chrome.browserAction.onClicked.addListener(() => {
		if(net_win){
			chrome.windows.remove(net_win.id)
			chrome.windows.create(win_properties, (tab) => {
				net_win = tab;
			})
		}else{
			chrome.windows.create(win_properties, (tab) => {
				net_win = tab;
			})
		}

	})

	chrome.storage.local.get(['onOff'], function(result){
        if(!isEmpty(result)){
            console.log('OnOff data from local storage is ' + result.onOff.onStatus);
            let onOffObject = result.onOff;
			onStatus = onOffObject.onStatus;

        } else{
			onStatus = true;
        }
    })

}




init()

const onMessage = data => {
	if(data.type=="OnOff"){
		onStatus = data.onStatus
	}
	if(data.onStatus){
		console.log("turned on")
	} else {
		console.log("turned off")
	}
}






// from https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
async function postData(url = '', data = {}) {
	// Default options are marked with *
	const response = await fetch(url, {
	  method: 'POST', // *GET, POST, PUT, DELETE, etc.
	  mode: 'cors', // no-cors, *cors, same-origin
	  cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
	  credentials: 'same-origin', // include, *same-origin, omit
	  headers: {
		'Content-Type': 'application/json'
		// 'Content-Type': 'application/x-www-form-urlencoded',
	  },
	  redirect: 'follow', // manual, *follow, error
	  referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
	  body: JSON.stringify(data) // body data type must match "Content-Type" header
	});
	return response.json(); // parses JSON response into native JavaScript objects
}
  
const postResponseHandler = (data,info,message_object) => {
	if(data.hasOwnProperty("ip")){
		//this is where we send info to the extension front-end
		if(message_object) message_object.postMessage({'type': 'packetIn', 'company':data.ip.company, 'url':info.url, 'ip': info.ip, 'initiator': info.initiator, 'frame': info.frameId});

		setCompanyInStorage(data, info);
		if(info.tabId>0){
			chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
				chrome.tabs.sendMessage(
					info.tabId,
					{'type': 'blockPage', 'company':data.ip.company, 'url':info.url, 'ip': info.ip},
					function(response){
						console.log(response)
					}
				)
			  });
		}


		// if(block_object) block_object.postMessage({'type': 'blockPage', 'company':data.ip.company, 'url':info.url});
		
	}else{
		// console.log('IP not in database')
		if(message_object) message_object.postMessage({'type': 'packetIn', 'company':'Other', 'url':info.url, 'ip': info.ip, 'initiator': info.initiator, 'frame': info.frameId});
		setOtherInStorage();

		if(info.tabId>0){
			chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
				chrome.tabs.sendMessage(
					info.tabId,
					{'type': 'blockPage', 'company':"Other", 'url':info.url, 'ip': info.ip},
					function(response){
						console.log(response)
					}
				)
			  });
		}
	}
}