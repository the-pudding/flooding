import searchCreate from './searchCreate.js'

const formatComma = d3.format(',');

const test = [];

let citySelected = 'Cleveland';
let geoSelected = null;
let stateSelected = null;
let loc = null;

const geoName = { city: '', county: ' county', state: '' };

function buildTable(container, data) {

  geoSelected = container.attr('geo-selected');
  citySelected = container.attr('data-city');
  stateSelected = container.attr('data-state');

  container.select('.city-selected').text(citySelected);

  const tableContainer = container.select('.table');
  // let indexOfSelected = findWithAttr(data,"name",citySelected);

  const sortedData = data
    .filter(function (d) {
      if (geoSelected == 'state') {
        return d;
      }
      return d.state_iso2 == stateSelected;
    })
    .sort(function (x, y) {
      return x.locationName == citySelected
        ? -1
        : y.locationName == citySelected
        ? 1
        : 0;
    });

  console.log(sortedData.slice(0,10));
  //
  const rowData = tableContainer
    .selectAll('div')
    .data(sortedData.slice(0, 10), function (d, i) {
      return d.locationName + i;
    });
  const row = rowData.enter().append('div').attr('class', 'row');
  rowData.exit().remove();

  row.classed('selected', function (d, i) {
    if (d.locationName == citySelected) {
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
      return formatComma(Math.round(d['FEMA Properties at Risk 2020 (total)']));
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
        (d['FEMA Properties at Risk 2020 (total)'] / d['Total Properties']) *
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
  geoSelected = geo;

  container.attr('geo-selected', geoSelected);
  container.attr('type-selected', "table");

  loc = locationInput[geoSelected]

  container.attr("data-city",loc.locationName);
  container.attr("data-state",loc.state_iso2);

  buildTable(container, data);

  searchCreate.setupSearchBox(container,data,geoSelected)
  //setupSearchBox(container, data);
}

export default { init, buildTable };
