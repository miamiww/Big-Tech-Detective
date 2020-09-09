// this takes a hybrid approach to updating the company information in the extension interface, 
// it both adds to local storage so that when the extension is opened it will query storage once, and sends it as a message to the extension
// this is to avoid clogging up local storage communication, which can be overly slow in delivering real-time updates to the extension

const url_filter = {urls: ["<all_urls>"], types:[]}
// make sure to ignore the packets being sent to the server or else it will cause an infinite loop of requests
const ignore_ips = ["159.65.179.9",undefined]

// objects for messaging to the chart
let message_object = null;
let block_object = null;
let chart_object;
// object for local storage
let companyData = {};


// settings for pop-out window
var net_url = chrome.extension.getURL('main.html');
var win_properties = {'url': net_url , 'type' : 'popup', 'width' : 800 , 'height' : 690 }
var net_win;

// functions for setting local storage
const setCompanyInStorage = (data) => {
	companyData[data.ip.company]=(companyData[data.ip.company]+1) || 1;
	chrome.storage.local.set({key: companyData}, function() {
		// console.log(companyData);
	  });
}

const setOtherInStorage = () => {
	companyData["Other"]=(companyData["Other"]+1) || 1;
	chrome.storage.local.set({key: companyData}, function() {
		// console.log(companyData);
	  });
}


// functions for sending block message



// Get IP when request is completed, request the IP from the server to see the IP owner, and then send the appriate message to the extension interface and update the local storage information
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
					console.log('IP in database')
					if(message_object) message_object.postMessage({'type': 'packetIn', 'company':data.ip.company});

					setCompanyInStorage(data);
					if(info.tabId>0){
						chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
							console.log(tabs)
							chrome.tabs.sendMessage(
								info.tabId,
								{'type': 'blockPage', 'company':data.ip.company, 'url':info.url},
								function(response){
									console.log(response)
								}
							)
						  });
					}


					// if(block_object) block_object.postMessage({'type': 'blockPage', 'company':data.ip.company, 'url':info.url});
					
				}else{
					// console.log('IP not in database')
					if(message_object) message_object.postMessage({'type': 'packetIn', 'company':'Other'});
					setOtherInStorage();
				}
			})
			.catch(err => console.log(err));
	  }
	return;
  },
	url_filter,
    []
);


// send messages to extension window and content.js in realtime
chrome.runtime.onConnect.addListener((port) => {
	console.log(port.name)
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
// only works if the window is already open
chrome.browserAction.onClicked.addListener(() => {
	if(net_win){

	}else{
		chrome.windows.create(win_properties, (tab) => {
			net_win = tab;
		})
	}

})