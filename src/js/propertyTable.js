
var formatComma = d3.format(",");
let citySelected = "Cleveland";

function init(data){
  let container = d3.select(".property-table").select(".table");
  //let cityIndex = data.indexOf()
  // let filteredData = data.filter(function(d){
  //   if
  // })

  let row = container
    .selectAll("div")
    .data(data.slice(0,10))
    .enter()
    .append("div")
    .attr("class","row")
    ;

  row.classed("selected",function(d,i){
    if(d.name == citySelected){
      return true;
    }
    return false;
  })

  let name = row.append("p")
    .text(function(d){
      return d.name;
    })
    .attr("class","city-name")
    ;

  let floodedProperties = row.append("p")
    .text(function(d){
      return formatComma(Math.round(d.count));
    })
    .attr("class","flooded-property-count")
    ;

  let properties = row.append("p")
    .text(function(d){
      return formatComma(Math.round(d.properties));
    })
    .attr("class","property-count")
    ;

  let percent = row.append("p")
    .text(function(d){
      return Math.round(d.count/d.properties*100)+"%";
    })
    .attr("class","percent")
    ;



};

export default { init };
