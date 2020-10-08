let websiteData = {"https://developers.google.com": {Google: 1}, "https://fivethirtyeight.com": {Amazon: 1, Google: 1}, "https://facebook.com": {Google: 1, Facebook: 1} }
const reduceWebsites = data => {
    let total = 0;
    let totalGoogle = 0;
    let totalFacebook = 0;
    let totalMicrosoft = 0;
    let totalAmazon = 0;

    const totaler = (name, iterator, sum) => {
        if(websiteData[iterator][name]){
            sum = websiteData[iterator][name] + sum;
        } 
        return sum
    }

    for (const prop in data) {
        total = total + 1;
        totalGoogle = totaler("Google", prop, totalGoogle);
        totalFacebook = totaler("Facebook", prop, totalFacebook);
        totalMicrosoft = totaler("Microsoft", prop, totalMicrosoft);
        totalAmazon = totaler("Amazon", prop, totalAmazon); 
    }

    return {
        Total: total,
        Google: totalGoogle,
        Facebook: totalFacebook,
        Amazon: totalAmazon,
        Microsoft: totalMicrosoft
    }
}
console.log(reduceWebsites(websiteData))

// console.log(percenter(totalGoogle, total))
// console.log(percenter(totalFacebook, total))
// console.log(percenter(totalMicrosoft, total))
// console.log(percenter(totalAmazon, total))
