// global variables
var companyData = {};
var websiteData = {};
var container = d3.select("#pie"); 
var pieChartStatus = false;
var websiteViewer = true;
let webPercentData;
let descriptionTextAllPackets = "% of current browser session traffic that has gone to each company"
let descriptionTextWebsites = "% of websites visited during current browser session traffic that had connections to each company"
let buttonTextAllPackets = "packet view"
let buttonTextWebsites = "websites view"


// start the communication with background.js and start listeners and get local storage
const init = () => {
    document.getElementById("clearbutton").addEventListener("click", clearHistory);
    document.getElementById("switchview").addEventListener("click", switchView);

    port = chrome.runtime.connect({name: "extension_socket"});
    port.onMessage.addListener(onMessage);
    chrome.storage.local.get(['key'], function(result) {
        console.log('Company data from local storage is ' + result.key);
        companyData = result.key;
    });
    chrome.storage.local.get(['websites'], function(result) {
        console.log('Website data from local storage is ' + result.websites)
        websiteData = result.websites;
        webPercentData = reduceWebsites(websiteData)

        update(webPercentData);
        updateDescriptionText(descriptionTextWebsites);
        updateSwitchButtonText(buttonTextAllPackets);

    });

    //copy/paste
    document.getElementById("copy-data-button").addEventListener('click', (event) => {
        
        copyTextToClipboard(JSON.stringify(buildCopyData(websiteData,companyData)));
    });

}

// processing of packet info and call of chart build
const onMessage = data => {
    if(data.type=="packetIn"){
        companyData[data.company]=(companyData[data.company]+1) || 1;  // update the company global variable
        if(data.initiator == undefined){
            console.log("true undefined")
            console.log(data)
        }
        if(data.initiator == "undefined"){
            console.log("string undefined")
            console.log(data)
        }
        if(data.Company != "Other" && data.frame ===0 && data.initiator !== undefined){
            if(!websiteData.hasOwnProperty(data.initiator)){
                let builtwebsitedataPromise = buildWebsiteData(websiteData,data)
                builtwebsitedataPromise
                .then(
                    globalData => webPercentData = reduceWebsites(globalData)
                )
            } else if(!websiteData[data.initiator].hasOwnProperty(data.company)){
                let builtwebsitedataPromise = buildWebsiteData(websiteData,data)
                builtwebsitedataPromise
                .then(
                    globalData => webPercentData = reduceWebsites(globalData)
                )
            }
            // console.log("building website data")
            // assign(websiteData, [data.initiator, data.company],  1); // update the website global variable websiteData[data.initiator][data.ip.company] ||
            // console.log("New Data")
            // console.log(websiteData)
        }

        // if(oldWebsiteData!=websiteData){

        // }
        dataSwitcher(pieChartStatus)
    }
    if(data.type=="error"){
        console.log(data.message)
    }
}

const buildWebsiteData = (globalData, inData) =>{
    return new Promise ((webDataChange) => {
        assign(globalData, [inData.initiator, inData.company],  1); // update the website global variable websiteData[data.initiator][data.ip.company] ||
        console.log("New data!")
        webDataChange(globalData)
    })
}

const reduceWebsites = data => {
    let total = 0;
    let totalGoogle = 0;
    let totalFacebook = 0;
    let totalMicrosoft = 0;
    let totalAmazon = 0;

    const _totaler = (name, iterator, sum) => {
        if(websiteData[iterator][name]){
            sum = websiteData[iterator][name] + sum;
        } 
        return sum
    }

    for (const prop in data) {
        total = total + 1;
        totalGoogle = _totaler("Google", prop, totalGoogle);
        totalFacebook = _totaler("Facebook", prop, totalFacebook);
        totalMicrosoft = _totaler("Microsoft", prop, totalMicrosoft);
        totalAmazon = _totaler("Amazon", prop, totalAmazon); 
    }

    return {
        Google: totalGoogle,
        Facebook: totalFacebook,
        Amazon: totalAmazon,
        Microsoft: totalMicrosoft,
        Total: total
    }
}



const updateDescriptionText = text => {
    document.getElementById("analyzer-description").innerHTML = text;
}

const updateSwitchButtonText = text => {
    document.getElementById("switchview").innerHTML = text;
}

// button functions
const clearHistory = () => {
    companyData = {};
    chrome.storage.local.set({key: companyData}, function() {
		console.log(companyData);
    });

    websiteData = {};
    webPercentData = {Total: 0, Google: 0, Facebook: 0, Amazon: 0, Microsoft:0}
    chrome.storage.local.set({websites: websiteData}, function() {
		console.log(websiteData);
    });

    dataSwitcher(pieChartStatus);
}

const switchView = () => {
    pieChartStatus = !pieChartStatus;
    dataSwitcher(pieChartStatus);

}

// the most important function :P
const dataSwitcher = switcher => {
    if(switcher){
        console.log("updating chart from packet message")
        update(companyData)
        updateDescriptionText(descriptionTextAllPackets);
        updateSwitchButtonText(buttonTextWebsites)
    } else{
        console.log("updating table from packet message")
        console.log(webPercentData);
        update(webPercentData);
        updateDescriptionText(descriptionTextWebsites);
        updateSwitchButtonText(buttonTextAllPackets)

    }
}

// copy/paste functions
const copyTextToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(function() {
      console.log('Async: Copying to clipboard was successful!');
    }, function(err) {
      console.error('Async: Could not copy text: ', err);
    });
}
const buildCopyData = (websiteData, companyData) => {
    let websiteDataTrue = convertTrue(websiteData)
    let copyData = {totalPacketCounts: companyData, websites: websiteDataTrue};
    return copyData
}

// the data visualization part

const buildChart = () => {
    console.log('rebuilding chart')
    // let svg

    // set the dimensions and margins of the graph
    var width = 450
    height = 325
    margin = 65

    // The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
    var radius = Math.min(width, height) / 2 - margin
  
    // set the color scale
    var color = d3.scaleOrdinal()
        .domain(["Amazon","Microsoft","Facebook","Google","Other"])
        .range(["#eaaeaa","#00CBB0","#FF5551","#F9DAF5","#AFE5DB"]), svg;
    console.log(svg)
    
    function graph(_selection) {
        _selection.each(function(_data) {	

            if(isEmpty(_data)){
                d3.select(".packet-table").remove();
                d3.select(".packet-chart").remove();
                d3.select(".message-container").remove();

                svg=false;

                var someContainer = d3.select(this)
                    .append("div")
                    .style("width", width)
                    .style("height", height)
                    .classed("message-container", true)
                    .style('font-size', 30)
                    .style('fill', 'red')
                    .text("no data, waiting for incoming traffic to inspect 🔍")

            } else if(_data.Total === 0){
                d3.select(".packet-table").remove();
                d3.select(".packet-chart").remove();
                d3.select(".message-container").remove();

                svg=false;

                var someContainer = d3.select(this)
                    .append("div")
                    .style("width", width)
                    .style("height", height)
                    .classed("message-container", true)
                    .style('font-size', 30)
                    .style('fill', 'red')
                    .text("no data, waiting for incoming traffic to inspect 🔍")

            } else if(pieChartStatus) {

                
                d3.select(".packet-table").remove();
                d3.select(".message-container").remove();
                

                // get total packets for % calculations
                let total = 0;
                for (const prop in _data) {
                    total = _data[prop] + total;
                } 

                //build graph bits
                var pie = d3.pie()
                    .value(function(d) { return d.value; })
                    // .sort(null);
                    
                var arc = d3.arc()
                    .innerRadius(0)
                    .outerRadius(radius);
                        
                if (!svg){
                    svgSpecial = d3.select(this).append("svg")
                        .attr("width", width)
                        .attr("height", height)
                        .classed("packet-chart",true)
                    svg = svgSpecial
                        .append("g")
                        .attr("transform", "translate(" + (width / 2 + 50) + "," + height / 2 + ")");
                }
                var chart = svg.selectAll("chart").data(pie(d3.entries(_data)));
                chart.enter().append("path")
                    .attr("fill", function(d, i) { return color(i); })
                    .attr("d", arc)
                    .each(function(d) {this._current = d;} );
                    
                chart.transition()
                    .attrTween("d", arcTween);
            

                var legendG = svgSpecial.selectAll(".legend") // note appending it to mySvg and not svg to make positioning easier
                    .data(pie(d3.entries(_data)))
                    .enter().append("g")
                    .attr("transform", function(d,i){
                        return "translate(" + (8) + "," + (i * 30 + 50) + ")"; // place each legend on the right and bump each one down 15 pixels
                    })
                    .attr("class", "legend");   

                    legendG.append("circle") // make a matching color rect
                    .attr("r", 8)
                    .attr("cy",5)
                    // .attr("height", 10)
                    .attr("fill", function(d, i) {
                        return color(i);
                    });

                    legendG.append("text") // add the text
                    .text(function(d){
                        return d.data.key + ":  " + Math.round(d.data.value*100)/total + "%";
                    })
                    .style("font-size", 12)
                    .attr("y", 10)
                    .attr("x", 11);

                var texts = svgSpecial.selectAll("text").data(pie(d3.entries(_data)));
                texts.enter().append("text")
                    .attr('font-size', 12)
                    .attr("transform", function(d,i){
                        return "translate(" + (width - 110) + "," + (i * 15 + 20) + ")"; // place each legend on the right and bump each one down 15 pixels
                    })
                    // .attr('font-weight', 'bold')
                    // .attr('fill', "red")
                    .attr('x', 12 )
                    .attr('y', 10)
                    .attr("class","legendtext");
                texts.text(function(d){
                    return d.data.key + ":  " + Math.round((d.data.value*100)/total) + "%";
                })    

                chart.exit().remove()

                legendG.exit().remove()
                texts.exit().remove()

                function arcTween(a) {
                    var i = d3.interpolate(this._current, a);
                    this._current = i(0);
                    return function(t) {
                        return arc(i(t));
                    };
                }

            } else if(!pieChartStatus){
                // build table
                d3.select(".packet-chart").remove();
                d3.select(".message-container").remove();
                d3.select(".packet-table").remove();
                svg=false;

                if(!websiteViewer){
                    var packetArray = [];
                    let total = 0;
                    for (const prop in _data) {
                        total = _data[prop] + total
                    }
    
                    for (const prop in _data) {
                        packetArray.push([prop, _data[prop],Math.round((_data[prop]*100)/total)+"%", " "]);;
                    }
    
                    // _data.forEach(function(d, i){
                    //     // now we add another data object value, a calculated value.
                    //     // here we are making strings into numbers using type coercion
                    //     // Add a new array with the values of each:
                    //     packetArray.push([d.data.key, d.d.data.value]);
                    // });
                    var table = d3.select(this).append("table");
                    table.classed("packet-table",true)
    
                    var header = table.append("thead").append("tr");
                    header
                    .selectAll("th")
                    .data(["Source","Packet Count","% Total Packets", ""])
                    .enter()
                    .append("th")
                    .text(function(d) { return d; });
                    var tablebody = table.append("tbody");
                    rows = tablebody
                    .selectAll("tr")
                    .data(packetArray)
                    .enter()
                    .append("tr");
                    // We built the rows using the nested array - now each row has its own array.
                    cells = rows.selectAll("td")
                // each row has data associated; we get it and enter it for the cells.
                    .data(function(d) {
                        return d;
                    })
                    .enter()
                    .append("td")
                    .text(function(d) {
                        return d;
                    });
                } else{
                    var packetArray = [];
                    let total = _data.Total;

                    for (const prop in _data) {
                        packetArray.push([prop, _data[prop],Math.round((_data[prop]*100)/total)+"%", ""]);;
                        
                    }

                    var table = d3.select(this).append("table");
                    table.classed("packet-table",true)

                    var header = table.append("thead").append("tr");
                    header
                    .selectAll("th")
                    .data(["Company","Websites","% of Total Websites Visited", ""])
                    .enter()
                    .append("th")
                    .attr("id", d => d + "HeaderCell")
                    .text(d => d );

                    var tablebody = table.append("tbody");
                    rows = tablebody
                    .selectAll("tr")
                    .data(packetArray)
                    .enter()
                    .append("tr")
                    .attr("id", d => d[0] + "Row");
                    // We built the rows using the nested array - now each row has its own array.
                    cells = rows.selectAll("td")
                    // each row has data associated; we get it and enter it for the cells.
                    .data(d => d)
                    .enter()
                    .append("td")
                    // .attr("id", d => "cell" + d)
                    .text(d => d);

                    // table manipulation
                    setID("Google")
                    setID("Facebook")
                    setID("Microsoft")
                    setID("Amazon")
                    setID("Total")

                    setBarGraph(_data,"Google","#F9DAF5",total)
                    setBarGraph(_data,"Facebook","#FF5551",total)
                    setBarGraph(_data,"Microsoft","#eaaeaa",total)
                    setBarGraph(_data,"Amazon","#00CBB0",total)

                    document.getElementById("% of Total Websites VisitedHeaderCell").colSpan = "2";
                    document.getElementById("% of Total Websites VisitedHeaderCell").style.paddingLeft = "10px"

                    document.getElementById("TotalCell3").innerHTML = "";


                }
                
            }
    });
            }

    return graph;

}

const setID = rowname => {
    let elements = document.getElementById(rowname+"Row").querySelectorAll("td");
    for (var i = 0, element; element = elements[i++];) {
        element.setAttribute("id", rowname+ "Cell" + i)
    }
}

const setBarGraph = (data,company,color,total) => {
    let percent = Math.round((data[company]*100)/total)
    if(percent>=50){
        document.getElementById(company+"Cell4").style.background = "-webkit-linear-gradient(left, "+color+" "+percent+"%, #E6F7F4 "+(100-percent)+"%)"
    } else if(percent === 0){

    } else if(percent < 50){
        document.getElementById(company+"Cell4").style.background = "-webkit-linear-gradient(right, #E6F7F4 "+ (100 - percent)+"%,"+color+" "+percent+"% )"
    }

}

var updateFunction = buildChart();
function update(data) {
    container.datum(data).call(updateFunction);
}




init();


