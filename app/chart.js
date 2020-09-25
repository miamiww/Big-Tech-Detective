var companyData = {
};
function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}
var container = d3.select("#pie"); 

var pieChartStatus = true;

// start the communication with background.js
const init = () => {
    document.getElementById("clearbutton").addEventListener("click", clearHistory);
    document.getElementById("switchview").addEventListener("click", switchView);

    port = chrome.runtime.connect({name: "extension_socket"});
    port.onMessage.addListener(onMessage);
    chrome.storage.local.get(['key'], function(result) {
        console.log('Company data from local storage is ' + result.key);
        companyData = result.key;
        update(companyData);
    });

    chrome.app.window.current().onBoundsChanged.addListener(() => {
        console.log("resized")
        chrome.app.window.outerBounds.setSize(800, 680);

    })

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
		console.log(companyData);
    });
}

const switchView = () => {

    pieChartStatus = !pieChartStatus
    update(companyData)

}

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
            console.log("data for chart")
            console.log(_data)

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
                    console.log('building svg')
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
                        console.log(d.data.key + " " + (d.data.value*100)/total + "%")
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
                    console.log(d.data.key + " " + (d.data.value*100)/total + "%")
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
                d3.select(".packet-chart").remove();
                d3.select(".message-container").remove();
                d3.select(".packet-table").remove();
                svg=false;


                var packetArray = [];
                let total = 0;
                for (const prop in _data) {
                    total = _data[prop] + total
                }

                for (const prop in _data) {
                    packetArray.push([prop, _data[prop],Math.round((_data[prop]*100)/total)+"%"]);;
                    console.log(packetArray);
                }
                console.log(packetArray);

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
                .data(["Source","Packet Count","% Total Packets"])
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
                    console.log(d);
                    return d;
                })
                .enter()
                .append("td")
                .text(function(d) {
                    return d;
                });
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


