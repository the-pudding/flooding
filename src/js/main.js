/* global d3 */
import debounce from 'lodash.debounce';
import isMobile from './utils/is-mobile';
import linkFix from './utils/link-fix';
import footer from './footer';
import createGeojson from './createGeojson';
import clusterMap from './clusterMap';
import loadData from './load-data';
import propertyTable from './propertyTable';
import zipMap from './zipMap';
import locate from './utils/locate';
import findNearest from './utils/find-nearest';
import singleBars from './singleBars';
import multiBars from './multiBars';
import './utils/search';
import story from './story'
import animatedGif from './animatedGif'
import femaMap from './femaMap'
import urlParam from './utils/url-parameter'
import countyMap from './countyMap'

let defaultLocation = {
  country_code: 'US',
  country_name: 'United States',
  region_code: 'NY',
  region_name: 'New York',
  city: 'New York',
  zip_code: '10001',
  time_zone: 'America/New_York',
  latitude: 40.7789,
  longitude: -73.9692,
};

// list any files imported that will need a searchbar update
const searchUpdateFiles = {
  singleBars,
  multiBars,
};

// let readerLatLong = null;

const $body = d3.select('body');
let previousWidth = 0;
let embedded = null;
let coords = null;
let albers = null;

function resize() {
  // only do resize on width changes, not height
  // (remove the conditional if you want to trigger on height change)
  const width = $body.node().offsetWidth;
  if (previousWidth !== width && embedded != "true") {
    previousWidth = width;
    singleBars.resize();
  }
}

function findReaderLoc() {
  return new Promise((resolve, reject) => {
    const key = 'fd4d87f605681c0959c16d9164ab6a4a';
    if(embedded == "true" || albers == "true"){
      if(coords[0]){
        defaultLocation.longitude = +coords[0];
        defaultLocation.latitude = +coords[1];
      }
      resolve(defaultLocation);
    }
    else {

    		locate(key, (err, result) => {
    			const readerLatLong =
    				err || result.country_code !== 'US'
    					? {
    						latitude: defaultLocation.latitude,
    						longitude: defaultLocation.longitude,
    					}
    					: { latitude: result.latitude, longitude: result.longitude };
    			resolve(readerLatLong);
    		});
    }
  });
}

function prepareSearch(section, locationType, DATA) {
  let searchBars = null;
  let type = locationType;
  if (section === 'all') {
    searchBars = d3.selectAll('.search-container');
  } else searchBars = section.selectAll('.search-container');

  searchBars.each((d, i, nodes) => {
    const thisBox = d3.select(nodes[i]);

    // if there is no location type, go with default
    if (locationType === null) {
      type = thisBox.attr('data-selected');
    } else {
      // otherwise, update the data attribute
      type = locationType;
      thisBox.attr('data-selected', type);
    }

    // setup select based on data type
    const theseData = DATA[`${type}Data`].sort((a, b) =>
      d3.ascending(a.locationName, b.locationName)
    );
    thisBox.setupSearch({ theseData, type, thisBox });
  });
}

function findUpdateFile(name) {
  return searchUpdateFiles[name];
}

let customData = null;
let suffix = " county"

function setupGeocoder(container,data,geo){

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
    limit:20,
    localGeocoderOnly:true,
    marker:false
    //mapboxgl: mapboxgl
  });

  const parent = container.select(".search").node();//document.querySelectorAll("#search");

  let el = geocoder.onAdd();
  parent.appendChild(el);

  geocoder.on("result",function(d){


    let long = +d.result.geometry.coordinates[0];
    let lat = +d.result.geometry.coordinates[1];

    findNearest({ latitude: lat, longitude: long },data)
      .then((nearest) => {
        singleBars.init(data, nearest)
        multiBars.init(data, nearest)
      })
  })
}

function handleSearchUpdate(searchBox, DATA, type) {
  // find which chart file to update
  const file = searchBox.attr('data-file');

  // find selected value
  const sel = searchBox.property('value');
  const locs = sel.split(',');
  const [name, state] = locs;
  const stateLower = state.trim().toLowerCase();

  const theseData = DATA[`${type}Data`];

  // filter data to find coordinates of selected location
  const filtered = theseData
    .filter((d) => d.locationName === name && d.state_iso2 === stateLower)
    .map((d) => ({
      ...d,
      latitude: +d.Latitude,
      longitude: +d.Longitude,
    }));

  // run the init function which will update charts
  findNearest(filtered[0], DATA).then((result) =>
    findUpdateFile(file).init(DATA, result)
  );
}

function init() {
  // adds rel="noopener" to all target="_blank" links
  linkFix();
  // add mobile class to body tag
  $body.classed('is-mobile', isMobile.any());
  // setup resize event
  window.addEventListener('resize', debounce(resize, 150));
  // setup sticky header menu
  // setupStickyHeader();
  // kick off graphic code

  let [cityData, zipData, countyData, stateData] = [];
  let DATA = [];

  embedded = urlParam.get("embed")
  albers = urlParam.get("albers")
  let long = urlParam.get("lon")
  let lat = urlParam.get("lat")
  coords = [long,lat];

  loadData(['city6.csv', 'zip6.csv', 'county6-3.csv', 'state6.csv'])
    .then((result) => {
      [cityData, zipData, countyData, stateData] = result;
      DATA = { cityData, zipData, countyData, stateData };
    })
    .then(findReaderLoc)
    .then((readerLocation) => findNearest(readerLocation, DATA))
    .then((nearest) => {

      let storyMode = urlParam.get("story")

      let mapType = urlParam.get("map")

      let chartEmbedded = urlParam.get("chart")
      if(embedded == "true"){
        d3.select("main").classed("embed",true);
        d3.select("body").style("height","100%");
        d3.select("html").style("height","100%");
      }

      if(albers == "true"){
        d3.select("html").style("height","100%")
        d3.select("body").style("height","100%")
        d3.select("main").classed("albers",true);

        if(mapType == "fema"){

          d3.select(".county-map").select(".chart-title").text("Percent change in # of properties in the Special Flood Hazard Area.")

          countyMap.init(
            nearest,DATA,
            d3.select('.county-map'),
            "county",
            "fema",
            "FEMA Properties at Risk 2020 (total)",
            "FS 2020 100 Year Risk (total)"
          );
        } else {
          countyMap.init(
            nearest,DATA,
            d3.select('.county-map'),
            "county",
            "climate",
            "FS 2020 100 Year Risk (total)",
            "FS 2050 100 Year Risk (total)"
          );
        }
      }
      if(chartEmbedded == "fema-compare-map" && embedded == "true"){
        d3.select("main").classed("fema-compare-map",true);
        femaMap.init(d3.select(".fema-compare-wrapper"),coords);
      }
      if(chartEmbedded == "cluster-map" && embedded == "true"){
        d3.select("main").classed("cluster-map",true);
        clusterMap.init(nearest,DATA);
      }
      if(chartEmbedded == "climate-map-embed" && embedded == "true"){
        d3.select("main").classed("climate-map-embed",true);

        zipMap.init(
          nearest,DATA,
          d3.select('.climate-map'),
          "zipcode",
          "climate",
          "FS 2020 100 Year Risk (total)",
          "FS 2050 100 Year Risk (total)"
        );
      }
      if(chartEmbedded == "fema-map-embed" && embedded == "true"){
        d3.select("main").classed("fema-map-embed",true);

        zipMap.init(
          nearest,DATA,
          d3.select('.fema-map'),
          "zipcode",
          "fema",
          "FEMA Properties at Risk 2020 (total)",
          "FS 2020 100 Year Risk (total)"
        );
      }
      if(chartEmbedded == "property-table-embed" && embedded == "true"){

        d3.select("main").classed("property-table-embed",true);
        let tableSelected = d3.select(".table-wrapper").select('input[name="table-controls"]:checked').attr("value");

        propertyTable.tableButtonClick(tableSelected);

        d3.select(".table-wrapper")
          .select(".controls-container")
          .selectAll('input')
          .on('change', function (d) {
            console.log("changing");
            propertyTable.tableButtonClick(d3.select(this).attr("value"));
          });

        propertyTable.init(
          DATA.countyData,
          d3.select('.county-table'),
          nearest,
          'county'
        );
        propertyTable.init(
          DATA.cityData,
          d3.select('.city-table'),
          nearest,
          'city'
        );
        propertyTable.init(
          DATA.stateData,
          d3.select('.state-table'),
          nearest,
          'state'
        );

      }
      if(chartEmbedded == "fema-table" && embedded == "true"){
        d3.select("main").classed("fema-table",true);

        singleBars.init(DATA, nearest);
        multiBars.init(DATA, nearest);

        d3.select('.bar-wrapper')
          .selectAll('input')
          .on('change', (d, i, nodes) => {
            // same as d3.select(this)
            const btn = d3.select(nodes[i]);
            singleBars.singleButtonClick(btn);
            multiBars.multiButtonClick(btn);

            const barSection = d3.select('.bar-wrapper');
            const btnType = btn.attr('id');

            if(btnType == "state"){
              customData = createGeojson.init(DATA["stateData"],"search");
              console.log(customData);
              suffix = "";
            }
            else {
              customData = createGeojson.init(DATA["countyData"],"search");
              suffix = " county";
            }
          });

        d3.selectAll('.search-container')
          .select('select')
          .on('change', (d, i, nodes) => {
            const sel = d3.select(nodes[i]);
            const parent = d3.select(nodes[i].parentNode);
            const type = parent.attr('data-selected');
            handleSearchUpdate(sel, DATA, type);
          });

        customData = createGeojson.init(DATA["countyData"],"search");
        setupGeocoder(d3.select(".bar-wrapper"),DATA,"countyData");


      }
      if(embedded == ""){

        femaMap.init(d3.select(".fema-compare-wrapper"),coords);
        story.init(DATA);
        animatedGif.init(DATA,nearest)
        singleBars.init(DATA, nearest);
        multiBars.init(DATA, nearest);

        d3.select('.bar-wrapper')
          .selectAll('input')
          .on('change', (d, i, nodes) => {
            // same as d3.select(this)
            const btn = d3.select(nodes[i]);
            singleBars.singleButtonClick(btn);
            multiBars.multiButtonClick(btn);

            const barSection = d3.select('.bar-wrapper');
            const btnType = btn.attr('id');

            if(btnType == "state"){
              customData = createGeojson.init(DATA["stateData"],"search");
              console.log(customData);
              suffix = "";
            }
            else {
              customData = createGeojson.init(DATA["countyData"],"search");
              suffix = " county";
            }
          });

        d3.selectAll('.search-container')
          .select('select')
          .on('change', (d, i, nodes) => {
            const sel = d3.select(nodes[i]);
            const parent = d3.select(nodes[i].parentNode);
            const type = parent.attr('data-selected');
            handleSearchUpdate(sel, DATA, type);
          });



        customData = createGeojson.init(DATA["countyData"],"search");
        setupGeocoder(d3.select(".bar-wrapper"),DATA,"countyData");

        let tableSelected = d3.select(".table-wrapper").select('input[name="table-controls"]:checked').attr("value");
        propertyTable.tableButtonClick(tableSelected);

        d3.select(".table-wrapper")
          .select(".controls-container")
          .selectAll('input')
          .on('change', function (d) {
            console.log("changing");
            propertyTable.tableButtonClick(d3.select(this).attr("value"));
          });

        propertyTable.init(
          DATA.countyData,
          d3.select('.county-table'),
          nearest,
          'county'
        );
        propertyTable.init(
          DATA.cityData,
          d3.select('.city-table'),
          nearest,
          'city'
        );
        propertyTable.init(
          DATA.stateData,
          d3.select('.state-table'),
          nearest,
          'state'
        );

        zipMap.init(
          nearest,DATA,
          d3.select('.climate-map'),
          "zipcode",
          "climate",
          "FS 2020 100 Year Risk (total)",
          "FS 2050 100 Year Risk (total)"
        );

        zipMap.init(
          nearest,DATA,
          d3.select('.fema-map'),
          "zipcode",
          "fema",
          "FEMA Properties at Risk 2020 (total)",
          "FS 2020 100 Year Risk (total)"
        );
        clusterMap.init(nearest,DATA);

      }

    })
    .catch((error) => {
      console.log(error);
    });

  // find reader location
  //
  //
  // loadData(['city2.csv', 'zip3.csv', 'county2.csv', 'state2.csv'])
  //   .then((result) => {
  //     findReaderLoc().then((location) => {
  //
  //     });
  //
  //     // let geojson = cluster.init(result[0]);
  //     // graphic.init(geojson);
  //     // zipMap.init(result[1],d3.select('.zip-map'),"zipcode")
  //     // zipMap.init(result[2],d3.select('.county-map'),"county")
  //   })
  //   .catch(console.error);

  // load footer stories
  // footer.init();
}

init();
