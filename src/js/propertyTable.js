import searchCreate from './searchCreate.js'
import createGeojson from './createGeojson';
import embedCode from './embed-code'

const formatComma = d3.format(',');

const test = [];

let citySelected = 'Cleveland';
let geoSelected = null;
let stateSelected = null;
let loc = null;

const geoName = { city: '', county: ' county', state: '' };

function tableButtonClick(btn) {
  console.log("here");
  d3.select(".table-wrapper").selectAll(".property-table").style("display",null);
  d3.select(".table-wrapper").select("."+btn+"-table").style("display","block");
}

function buildTable(container, data) {

  geoSelected = container.attr('geo-selected');
  citySelected = container.attr('data-city');
  stateSelected = container.attr('data-state');

  container.select('.city-selected').text(citySelected);

  const tableContainer = container.select('.table');
  // let indexOfSelected = findWithAttr(data,"name",citySelected);
  const sortedData = data
  //   // .filter(function (d) {
  //   //   if (geoSelected == 'state') {
  //   //     return d;
  //   //   }
  //   //   return d.state_iso2 == stateSelected;
  //   // })
  //   .sort(function (x, y) {
  //     return x.locationName == citySelected
  //       ? -1
  //       : y.locationName == citySelected
  //       ? 1
  //       : 0;
  //   });

  const rowData = tableContainer
    .selectAll('div')
    .data(sortedData.slice(0, 10), function (d, i) {
      return d.locationName + i;
    });

  const row = rowData.enter().append('div').attr('class', 'row');
  rowData.exit().remove();

  row.classed('selected', function (d, i) {
    if(i==0){
    //if (d.locationName == citySelected) {
      return true;
    }
    return false;
  });

  const name = row
    .append('p')
    .text(function (d) {
      if (geoSelected == 'state') {
        return d.locationName;
      }
      return `${
        d.locationName + geoName[geoSelected]
      }, ${d.state_iso2.toUpperCase()}`;
    })
    .attr('class', 'city-name');
  const floodedProperties = row
    .append('p')
    .text(function (d) {
      return formatComma(Math.round(d['FS 2020 100 Year Risk (total)']));
    })
    .attr('class', 'flooded-property-count');
  const properties = row
    .append('p')
    .text(function (d) {
      return formatComma(Math.round(d['Total Properties']));
    })
    .attr('class', 'property-count');
  const percent = row
    .append('p')
    .text(function (d) {
      return `${Math.round(
        (d['FS 2020 100 Year Risk (total)'] / d['Total Properties']) *
          100
      )}%`;
    })
    .attr('class', 'percent');
}

function findNearest(locationInput, data) {
  const locationDistance = data
    .map((d) => ({
      ...d,
      distance: calculatingDistance(
        locationInput.latitude,
        locationInput.longitude,
        +d.Latitude,
        +d.Longitude
      ),
    }))
    .filter((d) => !isNaN(d.distance));

  locationDistance.sort((a, b) => d3.descending(b.distance, a.distance));
  return locationDistance;
}

function init(data, container, locationInput, geo) {
  let customData = createGeojson.init(data,"search");
  let suffix = "";
  if(geo=="county"){
    suffix = " county"
  }

  function forwardGeocoder(query) {
    var matchingFeatures = [];
    for (var i = 0; i < customData.features.length; i++) {
    var feature = customData.features[i];
    // handle queries with different capitalization than the source data by calling toLowerCase()
    if (
      feature.properties.title
      .toLowerCase()
      .search(query.toLowerCase()) !== -1
    ) {
      // add a tree emoji as a prefix for custom data results
      // using carmen geojson format: https://github.com/mapbox/carmen/blob/master/carmen-geojson.md

      feature['place_name'] = feature.properties.title +suffix+", "+feature.properties.state.toUpperCase();
      feature['center'] = feature.geometry.coordinates;
      matchingFeatures.push(feature);
    }
    }
    return matchingFeatures;
  }

  mapboxgl.accessToken = 'pk.eyJ1IjoiZG9jazQyNDIiLCJhIjoiY2pjazE5eTM2NDl2aDJ3cDUyeDlsb292NiJ9.Jr__XbmAolbLyzPDj7-8kQ';

    var geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      countries: 'us',
      localGeocoder: forwardGeocoder,
      placeholder:'Find a location',
      // filter: function(item) {
      //   return item.place_type[0] == "manual";
      // },
      zoom:7,
      localGeocoderOnly:true,
      marker:false
      //mapboxgl: mapboxgl
    });


    const parent = container.select(".search").node();//document.querySelectorAll("#search");

    let el = geocoder.onAdd();
    parent.appendChild(el);



    geocoder.on("result",function(d){

      container.attr('data-city', d.result.place_name);
      container.attr('data-state', d.result.properties.state);

      let long = d.result.geometry.coordinates[0];
      let lat = +d.result.geometry.coordinates[1];

      loc.Latitude = lat;
      loc.Longitude = long;

      let nearestResults = searchCreate.findNearest(
        { latitude: lat, longitude: long },
        data
      );

      buildTable(container, nearestResults);

    })

    geoSelected = geo;

    container.attr('geo-selected', geoSelected);
    container.attr('type-selected', "table");

    loc = locationInput[geoSelected][0]


    container.attr("data-city",loc.locationName);
    container.attr("data-state",loc.state_iso2);

    //re-sort data to be closest to location
    // let locData = searchCreate.findNearest(
    //   { latitude: +loc.Latitude, longitude: +loc.Longitude },
    //   data
    // );

    buildTable(container, locationInput[geo]);

    let embedRevealed = false;


    container.select(".embed-button").on("click",function(d){
      let center = {lat:+loc["Latitude"],lng:+loc["Longitude"]};
      if(!embedRevealed){
        embedCode.init(d3.select(this.parentNode),"https://pudding.cool/projects/flooding/visuals/embed.html?embed=true&chart=property-table-embed&lat="+center.lat+"&lon="+center.lng)
        embedRevealed = true;
      }
    })

    // searchCreate.setupSearchBox(container,data,geoSelected)
}

export default { init, buildTable, tableButtonClick };
