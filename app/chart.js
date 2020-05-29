var companyData = {};
var container = d3.select("#pie");

// start the communication with background.js
const init = () => {
    port = chrome.runtime.connect({name: "start_listen"});
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
    if(data.hasOwnProperty("company")){
        console.log('receiving packet data');
        companyData[data.company]=(companyData[data.company]+1) || 1;
        update(companyData);
    }
}

const buildChart = () => {
    console.log('rebuilding chart')

    // set the dimensions and margins of the graph
    var width = 250
    height = 250
    margin = 20

    // The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
    var radius = Math.min(width, height) / 2 - margin
  
    // set the color scale
    var color = d3.scaleOrdinal(d3.schemeSet3), svg;
    
    function graph(_selection) {
        _selection.each(function(_data) {	
            console.log("data from graph")
            console.log(_data)
            var pie = d3.pie()
                .value(function(d) { return d.value; })
                // .sort(null);
                
            var arc = d3.arc()
                .innerRadius(0)
                .outerRadius(radius);
                    
            if (!svg){
                console.log('building svg')
                svg = d3.select(this).append("svg")
                    .attr("width", width)
                    .attr("height", height)
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
           
            chart.exit().remove()

            var annotations = svg.selectAll("chart").data(pie(d3.entries(_data)));

            annotations.enter().append('text')
                .text(function(d){ return d.data.key + "\n\n" + d.data.value})
                .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")";  })
                .style("text-anchor", "middle")
                .style("font-size", 17)
           
            annotations.exit().remove()

            function arcTween(a) {
                var i = d3.interpolate(this._current, a);
                this._current = i(0);
                return function(t) {
                    return arc(i(t));
                };
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


