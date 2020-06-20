
document.getElementById("googleSwitch").addEventListener("click", checkGoogle);
document.getElementById("amazonSwitch").addEventListener("click", checkAmazon);
document.getElementById("facebookSwitch").addEventListener("click", checkFacebook);
document.getElementById("microsoftSwitch").addEventListener("click", checkMicrosoft);

let blockObject = {};
function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

const initBlocks = () => {
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
}


const setBlockingInStorage = (company) => {
	blockObject[company] = !blockObject[company]
	chrome.storage.local.set({blocks: blockObject}, function() {
		console.log(blockObject);
	});
}

function checkGoogle()
{
  var checkbox = document.getElementById('googleSwitch');
  if (checkbox.checked == true)
  {
    alert("blocking Google could be very annoying");
    setBlockingInStorage("Google");
  } else{
    setBlockingInStorage("Google");
  }
}
function checkAmazon()
{
  var checkbox = document.getElementById('amazonSwitch');
  if (checkbox.checked == true)
  {
    alert("blocking Amazon could be very annoying");
    setBlockingInStorage("Amazon");

  } else{
    setBlockingInStorage("Amazon");
  }
}

function checkFacebook()
{
  var checkbox = document.getElementById('facebookSwitch');
  if (checkbox.checked == true)
  {
    alert("blocking Facebook could be very annoying");
    setBlockingInStorage("Facebook");

  } else{
    setBlockingInStorage("Facebook");

  }
}

function checkMicrosoft()
{
  var checkbox = document.getElementById('microsoftSwitch');
  if (checkbox.checked == true)
  {
    alert("blocking Microsoft could be very annoying");
    setBlockingInStorage("Microsoft");

  } else{
    setBlockingInStorage("Microsoft");

  }
}

initBlocks();