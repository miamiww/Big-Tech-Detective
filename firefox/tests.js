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

chrome.webRequest.onBeforeRequest.addListener(beforeRequest, url_filter);
chrome.webRequest.onBeforeSendHeaders.addListener(beforeSendHeaders, url_filter);
chrome.webRequest.onHeadersReceived.addListener(headersReceived, url_filter);
chrome.webRequest.onCompleted.addListener(completed, url_filter);
