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
import story from './story'

const defaultLocation = {
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

// let readerLatLong = null;

const $body = d3.select('body');
let previousWidth = 0;

function resize() {
  // only do resize on width changes, not height
  // (remove the conditional if you want to trigger on height change)
  const width = $body.node().offsetWidth;
  if (previousWidth !== width) {
    previousWidth = width;
    singleBars.resize();
  }
}

function findReaderLoc() {
  return new Promise((resolve, reject) => {
    const key = 'fd4d87f605681c0959c16d9164ab6a4a';
    // resolve(defaultLocation);
    locate(key, (err, result) => {
      if (err) {
        reject(err);
      }
      const readerLatLong =
        err || result.country_code !== 'US'
          ? {
              latitude: defaultLocation.latitude,
              longitude: defaultLocation.longitude,
            }
          : { latitude: result.latitude, longitude: result.longitude };

      resolve(readerLatLong);
    });
  });
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

  loadData(['city5.csv', 'zip5.csv', 'county5.csv', 'state5.csv'])
    .then((result) => {
      [cityData, zipData, countyData, stateData] = result;
      DATA = { cityData, zipData, countyData, stateData };
    })
    .then(findReaderLoc)
    .then((readerLocation) => findNearest(readerLocation, DATA))
    .then((nearest) => {

      // story.init(DATA);

      // singleBars.init(DATA, nearest);
      // multiBars.init(DATA, nearest);
      //
      // d3.select(".bar-wrapper")
      //   .selectAll('input')
      //   .on('change', function (d) {
      //     const btn = d3.select(this);
      //     singleBars.singleButtonClick(btn);
      //     multiBars.multiButtonClick(btn);
      //   });
      //
      //

      let customData = createGeojson.init(DATA.countyData,"search");

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
          feature['place_name'] = feature.properties.title + " county, "+feature.properties.state.toUpperCase();
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

        console.log(geocoder);

        geocoder.addTo('#geocoder-container-test');

        geocoder.on("result",function(d){
          console.log(d);
        })


      // let tableSelected = d3.select(".table-wrapper").select('input[name="table-controls"]:checked').attr("value");
      // propertyTable.tableButtonClick(tableSelected);
      //
      // d3.select(".table-wrapper")
      //   .select(".controls-container")
      //   .selectAll('input')
      //   .on('change', function (d) {
      //     console.log("changing");
      //     propertyTable.tableButtonClick(d3.select(this).attr("value"));
      //   });
      //
      // propertyTable.init(
      //   DATA.countyData,
      //   d3.select('.county-table'),
      //   nearest,
      //   'county'
      // );
      // propertyTable.init(
      //   DATA.cityData,
      //   d3.select('.city-table'),
      //   nearest,
      //   'city'
      // );
      // propertyTable.init(
      //   DATA.stateData,
      //   d3.select('.state-table'),
      //   nearest,
      //   'state'
      // );

      //
      // zipMap.init(
      //   nearest,
      //   DATA["countyData"],
      //   d3.select('.climate-map-county'),
      //   "county",
      //   "climate",
      //   "FS 2020 100 Year Risk (total)",
      //   "FS 2050 100 Year Risk (total)"
      // );
      // //
      // zipMap.init(
      //   nearest,DATA["zipData"],
      //   d3.select('.climate-map-zip'),
      //   "zipcode",
      //   "climate",
      //   "FS 2020 100 Year Risk (total)",
      //   "FS 2050 100 Year Risk (total)"
      // );
      //
      // zipMap.init(
      //   nearest,
      //   DATA["countyData"],
      //   d3.select('.fema-map-county'),
      //   "county",
      //   "fema",
      //   "FEMA Properties at Risk 2020 (total)",
      //   "FS 2020 100 Year Risk (total)"
      // );
      // //
      // zipMap.init(
      //   nearest,
      //   DATA["zipData"],
      //   d3.select('.fema-map-zip'),
      //   "zipcode",
      //   "fema",
      //   "FEMA Properties at Risk 2020 (total)",
      //   "FS 2020 100 Year Risk (total)"
      // );

      // clusterMap.init(nearest,createGeojson.init(DATA["zipData"],"cluster"),DATA);
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
