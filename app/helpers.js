// helper functions
const isEmpty = (obj) => {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

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

const percenter = (numerator, denominator) => {
    return Math.round ((numerator*100)/denominator)
}

var convertTrue = function(data){
    Object.keys(data).forEach((website)=>{ Object.keys(data[website]).forEach((company) => data[website][company] = true) });
    return data;
}
  