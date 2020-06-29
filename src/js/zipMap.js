import embedCode from './embed-code'



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
    return +d.index;
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
  var expression = ['match', ['id']];
  let thing = [];

  for (var row in selectedData){
    let mapboxId = +selectedData[row]["index"];
    let pctChange = getDataPoint(+selectedData[row][variableOne],+selectedData[row][variableTwo],OPTIONS);
    if(!pctChange){
      pctChange = colorScale.domain()[1];
    }
    let color = getColor(+pctChange,colorScale);
    if(mapboxId > 0){
      expression.push(mapboxId, color);
      thing.push(mapboxId);
    }
  }
  expression.push('#f1f1f0');
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

  let selectedData = data[dataCross[geoSelected]];
  //for mousemove looksups
  dataMap = setDataMap(selectedData);
  //
  // console.log(datamap);

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

  container.select(".controls-container").selectAll("input").on("change",function(d){

    if(!addedCounty && d3.select(this).attr("value") == "county"){
      addedCounty = true;
      geoSelected = "county";
      url = "mapbox://mapbox.boundaries-adm2-v3";
      source = "boundaries_admin_2"
      map.setLayoutProperty('postal-fill',"visibility","none");
      map.setLayoutProperty('postal-line',"visibility","none");
      selectedData = data[dataCross["county"]];
      dataMap = setDataMap(selectedData);
      expression = createExpression(variableOne,variableTwo,selectedData,OPTIONS,colorScale);

      map.addSource("county", {
        type: "vector",
        url:url
      });

      map.addLayer({
        "id": "county-fill",
        "type": "fill",
        "source": "county",
        "source-layer": source,
        "paint": {
            "fill-outline-color":"rgba(0,0,0,0)",
            "fill-opacity":1,
            "fill-color": expression
        },
        "filter":[ "match", ["get", "iso_3166_1"], ["US"], true, false ]
      },"admin-1-boundary");

      map.addLayer({
        "id": "county-line",
        "type": "line",
        "source": "county",
        "source-layer": source,
        "paint": {
            "line-width":2,
            "line-opacity":[
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              1,
              0
            ],
            "line-color":"black"
        }
        //,
      });

      function setStates(e) {

        //console.log("setting states");

        selectedData.forEach(function(row) {
          map.setFeatureState({
            source: 'county',
            sourceLayer: "boundaries_admin_2",
            id: +row["index"]
          }, {
            hover: false
          });
        });
      }

      // Check if `statesData` source is loaded.
      function setAfterLoad(e) {
        if (e.sourceId === 'county' && e.isSourceLoaded) {
          setStates();
          map.off('sourcedata', setAfterLoad);
        }
      }

      // If `statesData` source is loaded, call `setStates()`.
      if (map.isSourceLoaded('county')) {
        setStates();
      } else {
        map.on('sourcedata', setAfterLoad);
      }

    }
    else if(d3.select(this).attr("value") == "county"){
      selectedData = data[dataCross["county"]];
      dataMap = setDataMap(selectedData);
      geoSelected = "county";
      map.setLayoutProperty('postal-fill',"visibility","none");
      map.setLayoutProperty('postal-line',"visibility","none");
      map.setLayoutProperty('county-fill',"visibility","visible");
      map.setLayoutProperty('county-line',"visibility","visible");
    }
    else if(d3.select(this).attr("value") == "zipcode"){
      selectedData = data[dataCross["zipcode"]];
      dataMap = setDataMap(selectedData);

      geoSelected = "zipcode";
      map.setLayoutProperty('postal-fill',"visibility","visible");
      map.setLayoutProperty('postal-line',"visibility","visible");
      map.setLayoutProperty('county-fill',"visibility","none");
      map.setLayoutProperty('county-line',"visibility","none");
    }
  });

  mapboxgl.accessToken = 'pk.eyJ1IjoiZG9jazQyNDIiLCJhIjoiY2pjazE5eTM2NDl2aDJ3cDUyeDlsb292NiJ9.Jr__XbmAolbLyzPDj7-8kQ';
  //mapboxgl.accessToken = "pk.eyJ1IjoibGFicy1zYW5kYm94IiwiYSI6ImNrMTZuanRtdTE3cW4zZG56bHR6MnBkZG4ifQ.YGRP0sZNYdLw5_jSa9IvXg";

  buildLegend(container,scope);

  loc = findNearest(locationInput,selectedData);

  var map = new mapboxgl.Map({
    container: container.select(".map").node(),
    style: 'mapbox://styles/dock4242/ckbxqjmpd0cnx1ipi5ok9e2id',
    center: [-98.585522 , 39.8333333],
    minZoom: getMinZoom(scope,geoSelected),
    zoom: getZoom(scope,geoSelected),
    bounds: [[-65.62653762499436, 50.7290755205278], [-127.1499751249942, 23.23063251536344]]
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

  let url = "mapbox://mapbox.boundaries-pos4-v3";
  let source = "boundaries_postal_4"

  if(geoSelected == "county"){
    url = "mapbox://mapbox.boundaries-adm2-v3";
    source = "boundaries_admin_2"
  }

  let embedRevealed = false;

  container.select(".embed-button").on("click",function(d){
    if(!embedRevealed){
      embedCode.init(d3.select(this.parentNode),"https://pudding.cool/projects/flooding/visuals/embed.html?embed=true&chart="+scope+"-map-embed")
      embedRevealed = true;
    }
  })

  map.on('load', function() {
    //map.setLayoutProperty('state-label','visibility','visible')

    console.log("fitting");
    //map.fitBounds([[-127.1499751249942, 23.23063251536344],[-65.62653762499436, 50.7290755205278]]);

    map.setLayoutProperty('boundaries-admin-1','visibility','none')
    //map.setPaintProperty('boundaries-admin-1','line-color','white')

    map.setPaintProperty('water-shadow','line-opacity',.5)

    map.addSource("postal", {
      type: "vector",
      //url: "mapbox://mapbox.enterprise-boundaries-p2-v1"
      url:url//.json?secure&access_token=pk.eyJ1IjoibGFicy1zYW5kYm94IiwiYSI6ImNrMTZuanRtdTE3cW4zZG56bHR6MnBkZG4ifQ.YGRP0sZNYdLw5_jSa9IvXg
    });

    map.addLayer({
      "id": "postal-fill",
      "type": "fill",
      "source": "postal",
      "source-layer": source,
      "paint": {
          "fill-outline-color":"rgba(0,0,0,0)",
          "fill-opacity":1,
          "fill-color": expression
      }
    },"admin-1-boundary");

    map.addLayer({
      "id": "postal-line",
      "type": "line",
      "source": "postal",
      "source-layer": source,
      "paint": {
          "line-width":2,
          "line-opacity":[
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            1,
            0
          ],
          "line-color":"black"
      }
      //,
      //'filter': ['==', 'id', 123]
    });

    // Join the JSON unemployment data with the corresponding vector features where
     // feautre.unit_code === `STATE_ID`.
     function setStates(e) {

       //console.log("setting states");

       selectedData.forEach(function(row) {
         map.setFeatureState({
           source: 'postal',
           sourceLayer: source,
           id: +row["index"]
         }, {
           hover: false
         });
       });
     }

     // Check if `statesData` source is loaded.
     function setAfterLoad(e) {
       if (e.sourceId === 'postal' && e.isSourceLoaded) {
         setStates();
         map.off('sourcedata', setAfterLoad);
       }
     }

     // If `statesData` source is loaded, call `setStates()`.
     if (map.isSourceLoaded('postal')) {
       setStates();
     } else {
       map.on('sourcedata', setAfterLoad);
     }

    let timeout = null;
    let selectedGeo = null;

    map.on('mousemove', function(e){
      let layerSource = getLayerSource();

      const features = map.queryRenderedFeatures(e.point, { layers: [layerSource[1]] });
      if(features.length > 0){

        if(Object.keys(features[0]).indexOf("id") > -1){
          let point = features[0]["id"];

          if(dataMap.has(+point)){

            //dont fire event every mousemove
            if(selectedGeo != point){

              let dataPoint = dataMap.get(+point);
              populateToolTip(container,dataPoint,e.point,OPTIONS);
              toggleToolTipVisibility(container,"block")

                if (selectedGeo) {

                  map.setFeatureState({
                    source: layerSource[0],
                    sourceLayer: layerSource[2],
                    id: selectedGeo
                  }, {
                    hover: false
                  });

                }

                selectedGeo = point;

                map.setFeatureState({
                  source: layerSource[0],
                  sourceLayer: layerSource[2],
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
        source: 'postal',
        sourceLayer: source,
        id: selectedGeo
      }, {
        hover: false
      });
      toggleToolTipVisibility(container,"none")
    })

  })
}

export default { init };
