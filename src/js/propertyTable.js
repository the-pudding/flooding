
var formatComma = d3.format(",");
let citySelected = "Cleveland";
let citySelectedSpan = null;

function findWithAttr(array, attr, value) {
    for(var i = 0; i < array.length; i += 1) {
        if(array[i][attr] === value) {
            return i;
        }
    }
    return -1;
}
function requote(value){
  var d3_requote_re = /[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;
  return value.replace(d3_requote_re, "\\$&");
}


function searchDataset(data,value){
  let re = new RegExp("\\b" + requote(value), "i");
  return data.filter(function(d){
    return re.test(d.name);
  }).slice(0,5);

  // svg.classed("searching", true);
  // circle.classed("match", function(d) { return re.test(d.artist + " " + d.track); });
}

function buildSearchResults(searchContainer,results,container,data){
  searchContainer.select(".results-wrapper").style("display","block");

  let resultsData = searchContainer.select(".results-wrapper")
    .selectAll("p")
    .data(results,function(d){
      return d.name;
    })
    ;

  resultsData
    .enter()
    .append("p")
    .text(function(d){
      return d.name + ", Ohio";
    })
    .on("click",function(d){
      searchContainer.select("input").node().value = '';
      citySelected = d.name;
      buildTable(container,data);
    })
    ;

  resultsData.exit().remove();
}

function setupSearchBox(container,data){
  let searchContainer = container.select(".search");
  let results = null;
  searchContainer.select("input").on("keyup",function(){
    if(this.value.trim().length > 2){

      results = searchDataset(data,this.value.trim())
      if(results.length > 0){
        buildSearchResults(searchContainer,results,container,data);
      }
      else {
        container.select(".results-wrapper").style("display",null);
      }
    }
    else {
      container.select(".results-wrapper").style("display",null);
    }
  })
  .on("focusout",function(d){
    let t = d3.timer(function(elapsed) {
      if (elapsed > 200){
        t.stop()
        container.select(".results-wrapper").style("display",null);
      };
    }, 150);

  });

}

function buildTable(container,data){
  citySelectedSpan.text(citySelected)
  let tableContainer = container.select(".table");
  // let indexOfSelected = findWithAttr(data,"name",citySelected);
  let sortedData = data.sort(function(x,y){ return x.name == citySelected ? -1 : y.name == citySelected ? 1 : 0; });

  let rowData = tableContainer
    .selectAll("div")
    .data(sortedData.slice(0,10),function(d,i){
      return d.name + i;
    })
    ;

  let row = rowData
    .enter()
    .append("div")
    .attr("class","row")
    ;

  rowData.exit().remove();

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

}

function init(data,container){
  citySelectedSpan = container.select(".city-selected");

  buildTable(container,data)
  setupSearchBox(container,data);

};

export default { init };
