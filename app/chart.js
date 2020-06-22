var companyData = {};
function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}
var container = d3.select("#pie");

// start the communication with background.js
const init = () => {
    document.getElementById("clearbutton").addEventListener("click", clearHistory);

    port = chrome.runtime.connect({name: "extension_socket"});
    port.onMessage.addListener(onMessage);
    chrome.storage.local.get(['key'], function(result) {
        console.log('Company data from local storage is ' + result.key);
        companyData = result.key;
        update(companyData);
    });

}

// processing of packet info and call of chart build
const onMessage = data => {
    console.log(data);
    if(data.type=="packetIn"){
        console.log('receiving packet data');
        companyData[data.company]=(companyData[data.company]+1) || 1;
        update(companyData)

    }
}

const clearHistory = () => {
    companyData = {};
    update(companyData);
    chrome.storage.local.set({key: companyData}, function() {
		// console.log(companyData);
    });
}

const buildChart = () => {
    console.log('rebuilding chart')
    // let svg

    // set the dimensions and margins of the graph
    var width = 350
    height = 350
    margin = 65

    // The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
    var radius = Math.min(width, height) / 2 - margin
  
    // set the color scale
    var color = d3.scaleOrdinal(d3.schemeSet3), svg;
    console.log(svg)
    
    function graph(_selection) {
        _selection.each(function(_data) {	
            console.log("data for chart")
            console.log(_data)

            if(isEmpty(_data)){
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

            } else {
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
                    console.log('building svg')
                    svgSpecial = d3.select(this).append("svg")
                        .attr("width", width)
                        .attr("height", height)
                        .classed("packet-chart",true)
                    svg = svgSpecial
                        .append("g")
                        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
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
                        return "translate(" + (width - 110) + "," + (i * 15 + 20) + ")"; // place each legend on the right and bump each one down 15 pixels
                    })
                    .attr("class", "legend");   

                    legendG.append("rect") // make a matching color rect
                    .attr("width", 10)
                    .attr("height", 10)
                    .attr("fill", function(d, i) {
                        return color(i);
                    });

                    legendG.append("text") // add the text
                    .text(function(d){
                        console.log(d.data.key + " " + (d.data.value*100)/total + "%")
                        return d.data.key + "  " + Math.round(d.data.value*100)/total + "%";
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
                    console.log(d.data.key + " " + (d.data.value*100)/total + "%")
                    return d.data.key + "  " + Math.round((d.data.value*100)/total) + "%";
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

            }


        });
     
    }
    return graph;

}

var updateFunction = buildChart();
function update(data) {
    container.datum(data).call(updateFunction);
}


init()


