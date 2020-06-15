
function init(data,container,geo){

  mapboxgl.accessToken = 'pk.eyJ1IjoiZG9jazQyNDIiLCJhIjoiY2pjazE5eTM2NDl2aDJ3cDUyeDlsb292NiJ9.Jr__XbmAolbLyzPDj7-8kQ';
  //mapboxgl.accessToken = "pk.eyJ1IjoibGFicy1zYW5kYm94IiwiYSI6ImNrMTZuanRtdTE3cW4zZG56bHR6MnBkZG4ifQ.YGRP0sZNYdLw5_jSa9IvXg";

  var map = new mapboxgl.Map({
    container: container.node(),
    style: 'mapbox://styles/mapbox/light-v10',
    // style: 'mapbox://styles/nytgraphics/cjmsjh9u308ze2rpk2vh41efx?optimize=true',
    center: [-84.191605, 39.758949],
    minZoom: 1,
    zoom: 3
  });

  function getColor(d){
    return d3.interpolateRdPu(colorScale(d))
  }

  let dataKey = d3.map(data,function(d){return +d["index"]});
  let variableOne = "FEMA Properties at Risk 2020 (pct)"
  let variableTwo = "FS Properties at Risk 2020 (pct)"
  let variableExtent = d3.extent(data,function(d){return +d[variableTwo] - +d[variableOne]});
  let colorScale = d3.scaleLinear().domain([0,30]).range([0,1]).clamp(true);

  var expression = ['match', ['id']];
  let thing = [];

  for (var row in data){
    let mapboxId = +data[row]["index"];
    let pctChange = +data[row][variableTwo] - +data[row][variableOne];
    if(pctChange == "inf"){
      pctChange = 2;
    }
    let color = getColor(+pctChange);

    // if(row < 5){
    //   console.log(+data[row]["FS-FEMA Difference, 2020 (total)"]);
    //   console.log(color);
    // }
    if(mapboxId > 0){
      expression.push(mapboxId, color);
      thing.push(mapboxId);
    }
  }
  expression.push('rgba(0,0,0,0)');


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
    });

    map.on('mousemove', function(e){
      const features = map.queryRenderedFeatures(e.point, { layers: ["postal-2-fill"] });
      let point = features[0]//["id"];
      console.log(point);
    })

  })
}

export default { init };
