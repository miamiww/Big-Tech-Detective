// this takes a hybrid approach to updating the company information in the extension interface, 
// it both adds to local storage so that when the extension is opened it will query storage once, and sends it as a message to the extension
// this is to avoid clogging up local storage communication, which can be overly slow in delivering real-time updates to the extension

// global variables
const url_filter = {urls: ["<all_urls>"]}
const ignore_ips = [undefined]
const api_root = "https://bigtechdetective.club/";

// objects for messaging to the chart
let message_object = null;
let chart_object;
// object for local storage
let companyData = {};
let websiteData = {};
let onStatus;

// settings for pop-out window
let win_url = browser.extension.getURL('main.html');
let win_properties = {'url': win_url , 'type' : 'popup', 'width' : 800 , 'height' : 678 }
let the_window;

// variables to avoid refresh page glitch
let window_open = false;
let window_id;

// functions for setting local storage
// building the object
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
	browser.storage.local.set({key: companyData}, function() {
		// console.log(companyData);
	});
	if(info.frameId===0){
		let initiatorUrl = info.documentUrl.split("/")[2]
		assign(websiteData, [initiatorUrl, data.ip.company], websiteData[initiatorUrl[data.ip.company]] + 1 || 1)
		browser.storage.local.set({websites: websiteData}, function() {
			// console.log(websiteData);
		});	
	}

}

const setOtherInStorage = (info) => {
	companyData["Other"]=(companyData["Other"]+1) || 1;
	browser.storage.local.set({key: companyData}, function() {
		// console.log(companyData);
	});
	if(info.frameId===0){
		let initiatorUrl = info.documentUrl.split("/")[2]

		assign(websiteData, [initiatorUrl, "Other"], websiteData[initiatorUrl["Other"]] + 1 || 1)
		browser.storage.local.set({websites: websiteData}, function() {
			// console.log(websiteData);
		});	
	}
}


// setting up listeners, messaging, on off status
const init = () => {

	// the main listener - Get IP when request is completed, request the IP from the server to see the IP owner, and then send the appriate message to the extension interface and update the local storage information
	browser.webRequest.onCompleted.addListener( 
		(info) => {
			if(onStatus){
				//	 preventing infinite loops
				if(!ignore_ips.includes(info.ip) && info.documentUrl == undefined && !info.url.includes(api_root)){
					postData(api_root+'ip/', { ip: info.ip })
					.then(data => postResponseHandler(data,info,message_object))
					.catch(err => {if(message_object) message_object.postMessage(JSON.parse(JSON.stringify({'type': 'error', 'message':'api error', 'contents': err})))});

				}else {
					if(!ignore_ips.includes(info.ip) && !info.url.includes(api_root)){
						postData(api_root+'ip/', { ip: info.ip })
						.then(data => postResponseHandler(data,info,message_object))
						.catch(err => {if(message_object) message_object.postMessage(JSON.parse(JSON.stringify({'type': 'error', 'message':'api error', 'contents': err})))});
					}
				}

			}
			return;
	},
		url_filter
	);

	// send messages to extension window and content.js in realtime
	browser.runtime.onConnect.addListener((port) => {
		if(port.name=="extension_socket"){

			try{console.log(port); /** console.trace(); /**/ }catch(e){}
			console.assert(port.name == "extension_socket");
			message_object = port;
			specialMessageHandling(message_object);

			window_open = true;
			message_object.onDisconnect.addListener(function(){
				if(the_window){window_id = the_window.id}
				the_window = null;
				message_object = null;
				window_open = false;

			})

		}
		// recieve on / off signal
		let onOffPort = browser.runtime.connect({name: "on_off_messaging"});
		onOffPort.onMessage.addListener(onMessage);
		onOffPort.onDisconnect.addListener(function(){
			// console.log('disconnected from on / off port')
		})


	
	});

	// making sure cleared history is consistent
	browser.runtime.onMessage.addListener(
		function(request) {

		  if (request.message == "clearing history"){
			companyData = {};
			websiteData = {};
		  }
		}
	);



	// open up the extension window when icon is clicked
	browser.browserAction.onClicked.addListener(() => {
		if(the_window){
			browser.windows.remove(the_window.id)
			browser.windows.create(win_properties, (tab) => {
				the_window = tab;
			})
		}else{
			// this is to handle a rare bug in which the extension window is refreshed
			if(window_open){
				browser.windows.remove(window_id)
				browser.windows.create(win_properties, (tab) => {
					the_window = tab;
				})
			} else{
				browser.windows.create(win_properties, (tab) => {
					the_window = tab;
				})
			}

		}



	})

	browser.storage.local.get(['onOff'], function(result){
        if(!isEmpty(result)){
            let onOffObject = result.onOff;
			onStatus = onOffObject.onStatus;

        } else{
			onStatus = true;
        }
    })

}

const specialMessageHandling = (message_object) => {

	// for update information
	let manifestData = browser.runtime.getManifest();
	fetch(api_root+'update/')
	.then(response => response.json())
	.then(data => {if(data.version!=manifestData.version){
			if(message_object) message_object.postMessage({'type': 'update', 'message':'time to update', 'new_version': data.version, 'old_version': manifestData.version})
		}
	});

	// for when the api goes down or gets taken offline intentionally
	fetch(api_root)
	.then(response => response.json())
	.then(data => {if(data.status!="OK"){
			if(message_object) message_object.postMessage({'type': 'majorissue', 'message':data.message, 'contents':data.code})
		}
	})
	.catch(err => {if(message_object) message_object.postMessage({'type': 'apierror', 'message':'The API is currently down. Please email detective@bigtechdetective.net to report this and include the following error code in your email. Error code: ' + err, 'contents': err})});
	
	// for special announcements
	fetch(api_root+'message/')
	.then(response => response.json())
	.then(data => {if(data.status){
			if(message_object) message_object.postMessage({'type': 'announcement', 'message':data.message})
		} 
	})
	.catch(err => {if(message_object) message_object.postMessage({'type': 'apierror', 'message':'The API is currently down. Please email detective@bigtechdetective.net to report this and include the following error code in your email. Error code: ' + err, 'contents': err})});

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
  
const postResponseHandler = (data,inInfo,message_object) => {
	if(data.hasOwnProperty("ip")){
		let initiatorUrl = inInfo.documentUrl.split("/")[2]

		//this is where we send info to the extension front-end
		if(message_object) message_object.postMessage({'type': 'packetIn', 'company':data.ip.company, 'url':inInfo.url, 'ip': inInfo.ip, 'documentUrl': initiatorUrl, 'frame': inInfo.frameId});

		setCompanyInStorage(data, inInfo);
		//this is where we send info to the content script
		if(inInfo.tabId>0){

			browser.tabs.update(inInfo.tabId, {
				
			}, function(tab){
				browser.tabs.onUpdated.addListener(function listener(tabId, info){
					if(info.status ==='complete' && tab.id===tabId){
						browser.tabs.onUpdated.removeListener(listener);
						browser.tabs.sendMessage(
							inInfo.tabId,
							{'type': 'lockPage', 'company':data.ip.company, 'url':inInfo.url, 'ip': inInfo.ip, 'initiator':initiatorUrl}
		
						)
					}
				})
			})

		}


		
	}else{
		let initiatorUrl = inInfo.documentUrl.split("/")[2]

		// console.log('IP not in database')
		setOtherInStorage(inInfo);
		if(message_object) message_object.postMessage({'type': 'packetIn', 'company':'Other', 'url':inInfo.url, 'ip': inInfo.ip, 'documentUrl': initiatorUrl, 'frame': inInfo.frameId});

		if(inInfo.tabId>0){
			browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
				browser.tabs.sendMessage(
					inInfo.tabId,
					{'type': 'lockPage', 'company':"Other", 'url':inInfo.url, 'ip': inInfo.ip, 'initiator':initiatorUrl},

				)
			  });
		}
	}
}


