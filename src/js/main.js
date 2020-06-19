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
import findLocation from './utils/find-nearest';

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

// list any files imported that will need a searchbar update
const searchUpdateFiles = {
  singleBars,
  multiBars,
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
    resolve(defaultLocation);
    // locate(key, (err, result) => {
    //   if (err) {
    //     reject(err);
    //   }
    //   const readerLatLong =
    //     err || result.country_code !== 'US'
    //       ? {
    //           latitude: defaultLocation.latitude,
    //           longitude: defaultLocation.longitude,
    //         }
    //       : { latitude: result.latitude, longitude: result.longitude };
    //
    //   resolve(readerLatLong);
    // });
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
  findLocation(filtered[0], DATA).then((result) =>
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

  loadData(['city4.csv', 'zip4-1.csv', 'county4.csv', 'state4.csv'])
    .then((result) => {
      [cityData, zipData, countyData, stateData] = result;
      DATA = { cityData, zipData, countyData, stateData };
    })
    .then(findReaderLoc)
    .then((readerLocation) => findNearest(readerLocation, DATA))
    .then((nearest) => {
      // pass the nearest locations for each into the appropriate graphs

      // setup bars
      singleBars.init(DATA, nearest);
      multiBars.init(DATA, nearest);

      d3.select('.bar-wrapper')
        .selectAll('input')
        .on('change', (d, i, nodes) => {
          // same as d3.select(this)
          const btn = d3.select(nodes[i]);
          singleBars.singleButtonClick(btn);
          multiBars.multiButtonClick(btn);

          // update search bars to reflect change

          const barSection = d3.select('.bar-wrapper');
          const btnType = btn.attr('id');

          prepareSearch(barSection, btnType, DATA);
        });

      // setup all search bar containers
      prepareSearch('all', null, DATA);

      // setup update functions for search menu changes
      d3.selectAll('.search-container')
        .select('select')
        .on('change', (d, i, nodes) => {
          const sel = d3.select(nodes[i]);
          const parent = d3.select(nodes[i].parentNode);
          const type = parent.attr('data-selected');
          handleSearchUpdate(sel, DATA, type);
        });

      // setup tables
      // let tableSelected = d3.select(".table-wrapper").select('input[name="table-controls"]:checked').attr("value");
      // propertyTable.tableButtonClick(tableSelected);

      // d3.select(".table-wrapper")
      //   .selectAll('input')
      //   .on('change', function (d) {
      //     propertyTable.tableButtonClick(d3.select(this).attr("value"));
      //   });

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

      // clusterMap.init(createGeojson.init(DATA["zipData"]));
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
