/* global d3 */
import debounce from 'lodash.debounce';
import isMobile from './utils/is-mobile';
import linkFix from './utils/link-fix';
import graphic from './graphic';
import footer from './footer';
import cluster from './cluster';
import loadData from './load-data';
import propertyTable from './propertyTable';
import zipMap from './zipMap';
import locate from './utils/locate';
import findNearest from './utils/find-nearest';
import singleBars from './singleBars';

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
    graphic.resize();
  }
}

function findReaderLoc() {
  return new Promise((resolve, reject) => {
    const key = 'fd4d87f605681c0959c16d9164ab6a4a';
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

  loadData(['city2.csv', 'zip3.csv', 'county2.csv', 'state2.csv']).then(
    (result) => {
      // assign names for each dataset
      [cityData, zipData, countyData, stateData] = result;
      DATA = { cityData, zipData, countyData, stateData };
    }
  );

  // find reader location
  findReaderLoc()
    // then find nearest zip, city, county, and state for that location
    .then((readerLocation) => findNearest(readerLocation, DATA))
    .then((nearest) => {
      // pass the nearest locations for each into the appropriate graphs
      singleBars.init(DATA, nearest);
    });

  loadData(['city2.csv', 'zip3.csv', 'county2.csv', 'state2.csv'])
    .then((result) => {
      findReaderLoc().then((location) => {
        propertyTable.init(
          result[2],
          d3.select('.county-table'),
          location,
          'county'
        );
        propertyTable.init(
          result[0],
          d3.select('.city-table'),
          location,
          'city'
        );
        propertyTable.init(
          result[3],
          d3.select('.state-table'),
          location,
          'state'
        );
        
        zipMap.init(location,result[2],d3.select('.climate-map-county'),"county","climate","FS Properties at Risk 2020 (total)","FS Properties at Risk 2050 (total)");
        zipMap.init(location,result[1],d3.select('.climate-map-zip'),"zipcode","climate","FS Properties at Risk 2020 (total)","FS Properties at Risk 2050 (total)");
        zipMap.init(location,result[2],d3.select('.fema-map-county'),"county","fema","FEMA Properties at Risk 2020 (total)","FS Properties at Risk 2020 (total)");
        zipMap.init(location,result[1],d3.select('.fema-map-zip'),"zipcode","fema","FEMA Properties at Risk 2020 (total)","FS Properties at Risk 2020 (total)");

      });

      // let geojson = cluster.init(result[0]);
      // graphic.init(geojson);
      // zipMap.init(result[1],d3.select('.zip-map'),"zipcode")
      // zipMap.init(result[2],d3.select('.county-map'),"county")
    })
    .catch(console.error);

  // load footer stories
  footer.init();
}

init();
