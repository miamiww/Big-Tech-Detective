// this takes a hybrid approach to updating the company information in the extension interface, 
// it both adds to local storage so that when the extension is opened it will query storage once, and sends it as a message to the extension
// this is to avoid clogging up local storage communication, which can be overly slow in delivering real-time updates to the extension

const url_filter = {urls: ["<all_urls>"], types:[]}
// make sure to ignore the packets being sent to the server or else it will cause an infinite loop of requests
const ignore_ips = ["159.65.179.9",undefined]
const early_flagged_domains = []

// objects for messaging to the chart
let message_object = null;
let block_object = null;
let chart_object;
// object for local storage
let companyData = {};
let websiteData = {};


// settings for pop-out window
var net_url = chrome.extension.getURL('main.html');
var win_properties = {'url': net_url , 'type' : 'popup', 'width' : 800 , 'height' : 715, 'focused': true }
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




// the main listener - Get IP when request is completed, request the IP from the server to see the IP owner, and then send the appriate message to the extension interface and update the local storage information
chrome.webRequest.onCompleted.addListener( 
	(info) => {

	  //	 preventing infinite loops
	  	if(!ignore_ips.includes(info.ip)){
			console.log(info)
			fetch("https://thegreatest.website:8080/ips/"+info.ip)
			.then(response => response.json())
			.then(data => {
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
			})
			.catch(err => {if(message_object) message_object.postMessage({'type': 'error', 'message':'api error', 'contents': err})});
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
	if(port.name=="blocker_socket"){
		try{console.log(port); /** console.trace(); /**/ }catch(e){}
		console.assert(port.name == "blocker_socket");
		block_object = port;
		block_object.onDisconnect.addListener(function(){
			console.log("disconnected from page")
			block_object = null;

		})	
	}

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

// chrome.windows.onBoundsChanged.addListener(net_win.id, (tab) => {
// 	console.log("resized")
// 	chrome.app.window.outerBounds.setSize(800, 680);

// })