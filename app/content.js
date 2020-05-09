
var websiteIP_status, setPosition;
var url = window.location.host;

$(document).ready(function() {
	console.log('test');

	// Set position to left for these websites
	var noRight = new Array();
		noRight[0] = "www.facebook.com";
		noRight[1] = "www.google.com";
		
	//Check if on noRight array and set position accordingly
	var noRightCheck = $.inArray(url, noRight);
	
	if (noRightCheck >= 0) {
		setPosition = "left";
	}
	else {
		setPosition = "right";
	}
	
	chrome.extension.sendMessage({name: "getIP"}, function(response) {
		var finalIP = response.domainToIP;
		chrome.extension.sendMessage({name: "getOptions"}, function(response) {
			var websiteIP_status = response.enableDisableIP;
			if (websiteIP_status == "Disable" || typeof websiteIP_status == 'undefined') {
				console.log(finalIP)  ;
				fetch("http://159.65.179.9:8080/ips/"+finalIP).then(response => response.json()).then(data => console.log(data));

			}
		});
	});
	
});