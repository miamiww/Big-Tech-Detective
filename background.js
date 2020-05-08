
const url_filter = {urls: ["<all_urls>"]}


// exporing the web request API better
const beforeRequest = req_details => {
	console.log('beforeRequest')
	try{console.log(req_details); /** console.trace(); /**/ }catch(e){}
	// if(post_obj) post_obj.postMessage({'type' : 'beforeRequest' , 'req_details' : req_details});

}


const beforeSendHeaders = req_details => {
	console.log('beforeSendHeaders')
	try{console.log(req_details); /** console.trace(); /**/ }catch(e){}
	// if(post_obj) post_obj.postMessage({'type' : 'beforeSendHeaders' , 'req_details' : req_details});
}

const headersReceived = req_details => {
	console.log('headersRecieved')
	try{console.log(req_details); /** console.trace(); /**/ }catch(e){}
	// if(post_obj) post_obj.postMessage({'type' : 'headersReceived' , 'req_details' : req_details});
}

const completed = req_details => {
	console.log('completed');
	try{console.log(req_details); /** console.trace(); /**/ }catch(e){}
	// console.log(req_details.ip)
	// if(post_obj) post_obj.postMessage({'type' : 'completed' , 'req_details' : req_details});
}



const errorOccurred = req_details => {
	try{console.log(req_details); /** console.trace(); /**/ }catch(e){}
	// if(post_obj) post_obj.postMessage({'type' : 'errorOccurred' , 'req_details' : req_details});
}

// chrome.webRequest.onBeforeRequest.addListener(beforeRequest, url_filter);
// chrome.webRequest.onBeforeSendHeaders.addListener(beforeSendHeaders, url_filter);
// chrome.webRequest.onHeadersReceived.addListener(headersReceived, url_filter);
// chrome.webRequest.onCompleted.addListener(completed, url_filter);


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
var currentIPList	= {};
chrome.webRequest.onCompleted.addListener( 
	function(info) {
	  currentIPList[ info.url ] = info.ip;
	//   console.log('completed');
	//   console.log(info);
	//	 preventing infinite loops
	  if(info.ip !="159.65.179.9"){
		console.log('fetch request for ' + info.ip)
		console.log("http://159.65.179.9:8080/ips/"+info.ip)
		fetch("http://159.65.179.9:8080/ips/"+info.ip)
			.then(response => response.json())
			.then(data => {
				console.log(data)
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


chrome.extension.onMessage.addListener(
	function(request, sender, sendResponse)
	{
		switch (request.name)
		{
            case "setOptions":
				// request from the content script to set the options.
				//localStorage["websiteIP_status"] = websiteIP_status;
				localStorage.setItem("websiteIP_status", request.status);
			break;
			
			case "getOptions":
				// request from the content script to get the options.
				sendResponse({
					enableDisableIP : localStorage["websiteIP_status"]
				});
			break;
		    case "getIP":
			var currentURL = sender.tab.url;
			if (currentIPList[currentURL] !== undefined) {
				sendResponse({
					domainToIP: currentIPList[currentURL]
				});
			} else {
				sendResponse({
					domainToIP: null
				});
			}
			
		    break;
		
			default:
			sendResponse({});
		}
	}
);