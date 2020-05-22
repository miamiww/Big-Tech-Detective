
const url_filter = {urls: ["<all_urls>"]}
const ignore_ips = ["159.65.179.9",undefined]

let message_object = null;
let chart_object;



// try{console.log(port); /** console.trace(); /**/ }catch(e){}
// console.assert(port.name == "start_listen");
// message_object = port;

// settings for pop-out window
var net_url = chrome.extension.getURL('main.html');
var win_properties = {'url': net_url , 'type' : 'popup', 'width' : 1200 , 'height' : 700 }
var net_win;


// this isn't really necessary, it prevents the extension from running on non-web pages like settings pages, but it is OK to make the request on such pages
function checkForValidUrl(tabId, changeInfo, tab) {
	chrome.pageAction.show(tab.id);
}

// Listen for any changes to the URL of any tab
// chrome.tabs.onUpdated.addListener(checkForValidUrl);

// Set the item in the localstorage - used for messaging back and forth between content and background
function setItem(key, value) {
	window.localStorage.removeItem(key);
	window.localStorage.setItem(key, value);
}

// Get the item from local storage with the specified key
function getItem(key) {
	var value;
	try {
		value = window.localStorage.getItem(key);
	}catch(e) {
		value = "null";
	}
	return value;
}

// Get IP
chrome.webRequest.onCompleted.addListener( 
	(info) => {
	
	  //	 preventing infinite loops
	  if(!ignore_ips.includes(info.ip)){
		console.log('fetch request for ' + info.ip)
		console.log("https://thegreatest.website:8080/ips/"+info.ip)
		fetch("https://thegreatest.website:8080/ips/"+info.ip)
			.then(response => response.json())
			.then(data => {
				console.log(data)
				if(data.hasOwnProperty("ip")){
					//this is where we send info to the extension front-end
					console.log('IP in database')
					if(message_object) message_object.postMessage({'type': 'packetIn', 'company':data.ip.company})
				}else{
					console.log('IP not in database')
					if(message_object) message_object.postMessage({'type': 'packetIn', 'company':'Other'})
				}
			})
			.catch(err => console.log(err));
	  }
	return;
  },
  {
	urls: [],
	types: []
  },
  []
);



chrome.runtime.onConnect.addListener(function(port) {

	try{console.log(port); /** console.trace(); /**/ }catch(e){}
	console.assert(port.name == "start_listen");
	message_object = port;


});


chrome.browserAction.onClicked.addListener(() => {
	chrome.windows.create(win_properties, (tab) => {
		net_win = tab;
	})
})