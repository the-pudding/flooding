


const geoName = { city: '', county: ' county', state: '',zipcode:'zipcode'};
const dataCross = {"county":"countyData","zipcode":"zipData"};

function getRange(scope){
  if(scope == "climate"){
    return [1,1.15];
  }
  if(scope == "fema"){
    return [1,8];
  }
}

function setDataMap(selectedData){
  return d3.map(selectedData,function(d){
    return +d["County FIPS"];
  });
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

  let legendContainer = container.select(".legend-wrapper");
  legendContainer.append("p").attr("class","legend-text").text("No Change or Decrease");
  legendContainer.append("div").attr("class","legend-item");

  legendContainer.append("p").attr("class","legend-text").text("0%");

  let legendContainerColors = container.select(".legend-wrapper").append("div").attr("class","legend-colors");

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

function toggleToolTipVisibility(container,visibility){
   let tooltipContainer = container.select(".map").select(".map-tooltip");
   tooltipContainer.style("display",visibility)
}

function createExpression(variableOne,variableTwo,selectedData,OPTIONS,colorScale){
  var expression = ['get', ['get','county_fips']];
  let thing = [];

  for (var row in selectedData){
    let mapboxId = selectedData[row]["County FIPS"];
    let pctChange = getDataPoint(+selectedData[row][variableOne],+selectedData[row][variableTwo],OPTIONS);
    if(!pctChange){
      pctChange = colorScale.domain()[1];
    }
    let color = getColor(+pctChange,colorScale);
    selectedData[row].color = color;
    if(mapboxId > 0){
      expression.push(mapboxId, color);
      thing.push(mapboxId);
    }
  }
  expression.push('#f1f1f0');
  // console.log(expression);
  return expression;
}

function buildToolTip(container,map){
  let tooltipContainer = container.select(".map").append("div").attr("class","map-tooltip");
}

function getColor(d,colorScale){
  if(d < 1){
    return "#aaa";
  }
  return d3.interpolateRdPu(colorScale(d))
}

function getDataPoint(dataOne,dataTwo,OPTIONS){
  if(OPTIONS.scope == "climate"){
    return dataTwo/dataOne;
  }
  else if (OPTIONS.scope == "fema"){
    if(dataOne == 0){
      return null;
    }
    return dataTwo/dataOne;
  }
}

function init(locationInput,data,container,geo,scope,variableOne,variableTwo){
  // let params = [locationInput,data,container,geo,scope,variableOne,variableTwo]
  const OPTIONS = {locationInput,data,container,geo,scope,variableOne,variableTwo}
  let addedCounty = false;
  let loc;
  let colorScale = null;
  let dataMap = null;
  let geoSelected = null;


  geoSelected = geo;
  console.log(geoSelected);

  let selectedData = data[dataCross[geoSelected]];
  console.log(selectedData);
  //for mousemove looksups
  dataMap = setDataMap(selectedData);

  function getLayerSource(){
    if(geoSelected == "county"){
      return ["county","county-fill","boundaries_admin_2"]
    }
    return ["postal","postal-fill","boundaries_postal_4"];
  }

  function getZoom(scope,geo){
    if(geoSelected=="zipcode"){
      return 3
    }
    return 2.5;
  }

  function getMinZoom(scope,geo){
    if(geoSelected=="zipcode"){
      return 3
    }
    return 1;
  }

  function populateToolTip(container,dataPoint,coords,OPTIONS){



    let tooltipContainer = container.select(".map").select(".map-tooltip");
    tooltipContainer.style("left",coords["x"]+"px").style("top",coords["y"]+"px")

    let dataToFill = Math.round((getDataPoint(+dataPoint[OPTIONS.variableOne],+dataPoint[OPTIONS.variableTwo],OPTIONS)-1)*1000)/10+"% increase in properties affected by flooding";

    if(!getDataPoint(+dataPoint[OPTIONS.variableOne],+dataPoint[OPTIONS.variableTwo],OPTIONS) && OPTIONS.scope == "fema"){
      dataToFill = "Zero properties identified by FEMA; "+dataPoint[OPTIONS.variableTwo]+" propreties identified by First Street"
    }

    if(Object.keys(dataPoint).indexOf("Zipcode") > -1){
      tooltipContainer.html(
        "<p>"+dataPoint.Zipcode+" "+geoName[geoSelected]+"</p><p>"+dataToFill+"</p>"
      )
    }
    else {
      tooltipContainer.html(
        "<p>"+dataPoint.locationName+" "+geoName[geoSelected]+"</p><p>"+dataToFill+"</p>"
      )
    }
    ;
  }

  mapboxgl.accessToken = 'pk.eyJ1IjoiZG9jazQyNDIiLCJhIjoiY2pjazE5eTM2NDl2aDJ3cDUyeDlsb292NiJ9.Jr__XbmAolbLyzPDj7-8kQ';
  //mapboxgl.accessToken = 'pk.eyJ1IjoibG9iZW5pY2hvdSIsImEiOiJjajdrb2czcDQwcHR5MnFycmhuZmo4eWwyIn0.nUf9dWGNVRnMApuhQ44VSw';


  buildLegend(container,scope);

  var map = new mapboxgl.Map({
    container: container.select(".map").node(),
    style: 'mapbox://styles/dock4242/ckbvo6tb30c3d1il91i7mokb9',
    // style: 'mapbox://styles/nytgraphics/cjmsjh9u308ze2rpk2vh41efx?optimize=true',
    center: [0,0],
    minZoom: getMinZoom(scope,geoSelected),
    zoom: 4,//getZoom(scope,geoSelected)
    bounds: [[22.10180925964056, 13.596431034352321], [-21.717652931297067, -16.37959447066632]]
  });

  buildToolTip(container,map);

  let range = getRange(scope);

  let dataKey = d3.map(selectedData,function(d){return +d["index"]});
  let variableExtent = d3.extent(selectedData,function(d){return getDataPoint(+d[variableOne],+d[variableTwo],OPTIONS); });
  colorScale = d3.scaleLinear().domain(range).range([.1,1]).clamp(true);

  let expression = createExpression(variableOne,variableTwo,selectedData,OPTIONS,colorScale);

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

  map.on('load', function() {

      map.addSource('albersusa2', {
        type: 'vector',
        url: 'mapbox://lobenichou.albersusa',
        promoteId: 'county_fips'
      });

      map.addLayer({
        'id': 'albersusa-fill',
        'type': 'fill',
        'source': 'albersusa2',
        'source-layer': 'albersusa',
        'paint': {
          'fill-color':["case", ["==", ["feature-state", "hasColor"], true], ["feature-state", "color"],"white"]
        },
        'filter': ['all',['==', ['get', 'type'], 'county'],[
          "match",
          ["get", "state_abbrev"],
          ["AK", "HI", "PR"],
          false,
          true
        ]]
      },"state-points");

      map.addLayer({
        'id': 'albersusa-line',
        'type': 'line',
        'source': 'albersusa2',
        'source-layer': 'albersusa',
        "paint": {
            "line-width":2,
            "line-opacity":[
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              1,
              0
            ],
            "line-color":"black"
        },
        'filter': ['all',['==', ['get', 'type'], 'county'],[
          "match",
          ["get", "state_abbrev"],
          ["AK", "HI", "PR"],
          false,
          true
        ]]
      },"state-points");

    map.setLayoutProperty("state-points","visibility","none")

    function setStates(e) {

       data.countyData.forEach((row) => {

         map.setFeatureState({
           source: 'albersusa2',
           'sourceLayer': 'albersusa',
           id: +row["County FIPS"]
         }, {
           color: row.color,
           hover: false,
           hasColor:true
         })
       })
     }

     function setAfterLoad(e) {
       if (e.sourceId === 'albersusa2' && e.isSourceLoaded) {
         setStates();
         map.off('sourcedata', setAfterLoad);
       }
     }

     // If `statesData` source is loaded, call `setStates()`.
     if (map.isSourceLoaded('albersusa2')) {
       setStates();
     } else {
       map.on('sourcedata', setAfterLoad);
     }

    let timeout = null;
    let selectedGeo = null;

    map.on('mousemove', function(e){
      let layerSource = getLayerSource();
      const features = map.queryRenderedFeatures(e.point, { layers: ["albersusa-fill"] });

      if(features.length > 0){

        if(Object.keys(features[0]).indexOf("id") > -1){
          let point = +features[0]["properties"]["county_fips"];

          if(dataMap.has(+point)){

            //dont fire event every mousemove
            if(selectedGeo != point){

              let dataPoint = dataMap.get(+point);
              populateToolTip(container,dataPoint,e.point,OPTIONS);
              toggleToolTipVisibility(container,"block")

                if (selectedGeo) {

                  map.setFeatureState({
                    source: 'albersusa2',
                    sourceLayer: 'albersusa',
                    id: selectedGeo
                  }, {
                    hover: false
                  });

                }

                selectedGeo = point;

                map.setFeatureState({
                  source: 'albersusa2',
                  sourceLayer: 'albersusa',
                  id: point
                }, {
                  hover: true
                });
            }


          }
          else{
            toggleToolTipVisibility(container,"none")
          };
        }
        else {
          toggleToolTipVisibility(container,"none")
        }
      } else {
        toggleToolTipVisibility(container,"none")
      }


    })
    .on("mouseout",function(d){
      map.setFeatureState({
        source: 'albersusa2',
        sourceLayer: 'albersusa2',
        id: selectedGeo
      }, {
        hover: false
      });
      toggleToolTipVisibility(container,"none")
    })

  })
}

export default { init };
