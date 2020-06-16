

let loc;

function getRange(scope){
  if(scope == "climate"){
    return [1,1.15];
  }
  if(scope == "fema"){
    return [1,5];
  }
}

function getZoom(scope,geo){
  if(geo=="zipcode"){
    return 4
  }
  return 2.5;
}

function getMinZoom(scope,geo){
  if(geo=="zipcode"){
    return 4
  }
  return 1;
}

function findNearest(locationInput,data) {
  const locationDistance = data
    .map(d => ({
      ...d,
      distance: calculatingDistance(
        locationInput.latitude,
        locationInput.longitude,
        +d.Latitude,
        +d.Longitude
      )
    }))
    .filter(d => !isNaN(d.distance));

  locationDistance.sort((a, b) => d3.descending(b.distance, a.distance));
  return locationDistance;
}

function calculatingDistance(readerLat, readerLong, locLat, locLong) {
  // Haversine Formula
  function toRadians(value) {
    return (value * Math.PI) / 180;
  }

  const R = 3958.756; // miles
  const φ1 = toRadians(readerLat);
  const φ2 = toRadians(locLat);
  const Δφ = toRadians(locLat - readerLat);
  const Δλ = toRadians(locLong - readerLong);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function buildLegend(container,scope){
  console.log(container.node());
  let legendContainer = container.select(".legend");
  legendContainer.append("p").attr("class","legend-text").text("no change");
  let legendContainerColors = container.select(".legend").append("div").attr("class","legend-colors");
  legendContainer.append("p").attr("class","legend-text").text("+"+Math.round((getRange(scope)[1]-1)*100)+"%");

  legendContainerColors.selectAll("div")
    .data([.1,.3,.6,.9,1])
    .enter()
    .append("div")
    .attr("class","legend-item")
    .style("background",function(d){
      return d3.interpolateRdPu(d);
    })
    ;

}

function init(locationInput,data,container,geo,scope,variableOne,variableTwo){

  mapboxgl.accessToken = 'pk.eyJ1IjoiZG9jazQyNDIiLCJhIjoiY2pjazE5eTM2NDl2aDJ3cDUyeDlsb292NiJ9.Jr__XbmAolbLyzPDj7-8kQ';
  //mapboxgl.accessToken = "pk.eyJ1IjoibGFicy1zYW5kYm94IiwiYSI6ImNrMTZuanRtdTE3cW4zZG56bHR6MnBkZG4ifQ.YGRP0sZNYdLw5_jSa9IvXg";

  buildLegend(container,scope);

  function getDataPoint(dataOne,dataTwo){
    if(scope == "climate"){
      return dataTwo/dataOne;
    }
    else if (scope == "fema"){
      return dataTwo/dataOne;
    }
  }

  loc = findNearest(locationInput,data);

  var map = new mapboxgl.Map({
    container: container.select(".map").node(),
    style: 'mapbox://styles/mapbox/light-v10',
    // style: 'mapbox://styles/nytgraphics/cjmsjh9u308ze2rpk2vh41efx?optimize=true',
    center: [-98.585522 , 39.8333333],
    minZoom: getMinZoom(scope,geo),
    zoom: getZoom(scope,geo)
  });

  let range = getRange(scope);

  let dataKey = d3.map(data,function(d){return +d["index"]});
  let variableExtent = d3.extent(data,function(d){return getDataPoint(+d[variableOne],+d[variableTwo]); });
  let colorScale = d3.scaleLinear().domain(range).range([.1,1]).clamp(true);

  function getColor(d){
    if(d < 1){
      return "#aaa";
    }
    return d3.interpolateRdPu(colorScale(d))
  }

  var expression = ['match', ['id']];
  let thing = [];

  for (var row in data){
    let mapboxId = +data[row]["index"];
    let pctChange = getDataPoint(+data[row][variableOne],+data[row][variableTwo]);

    if(pctChange == "inf"){
      pctChange = range[1];
    }
    let color = getColor(+pctChange);
    if(mapboxId > 0){
      expression.push(mapboxId, color);
      thing.push(mapboxId);
    }
  }
  expression.push('#f1f1f0');


  const findDuplicates = (arr) => {
    let sorted_arr = arr.slice().sort(); // You can define the comparing function here.
    // JS by default uses a crappy string compare.
    // (we use slice to clone the array so the
    // original array won't be modified)
    let results = [];
    for (let i = 0; i < sorted_arr.length - 1; i++) {
      if (sorted_arr[i + 1] == sorted_arr[i]) {
        results.push(sorted_arr[i]);
      }
    }
    return results;
  }

  let url = "mapbox://mapbox.boundaries-pos4-v3";
  let source = "boundaries_postal_4"

  if(geo == "county"){
    url = "mapbox://mapbox.boundaries-adm2-v3";
    source = "boundaries_admin_2"
  }

  map.on('load', function() {

    console.log(map.getStyle());

    map.addSource("postal-2", {
      type: "vector",
      //url: "mapbox://mapbox.enterprise-boundaries-p2-v1"
      url:url//.json?secure&access_token=pk.eyJ1IjoibGFicy1zYW5kYm94IiwiYSI6ImNrMTZuanRtdTE3cW4zZG56bHR6MnBkZG4ifQ.YGRP0sZNYdLw5_jSa9IvXg
    });
    map.addLayer({
      "id": "postal-2-fill",
      "type": "fill",
      "source": "postal-2",
      "source-layer": source,
      "paint": {
          "fill-outline-color":"rgba(0,0,0,0)",
          "fill-opacity":1,
          "fill-color": expression
      }
    },"admin-1-boundary");

    map.on('mousemove', function(e){
      const features = map.queryRenderedFeatures(e.point, { layers: ["postal-2-fill"] });
      let point = features[0]//["id"];
      console.log(features);
    })

  })
}

export default { init };
