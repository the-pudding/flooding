const formatComma = d3.format(',');

const test = [];

let citySelected = 'Cleveland';
let geoSelected = null;
let stateSelected = null;
let loc = null;

const geoName = { city: '', county: ' county', state: '' };

function findWithAttr(array, attr, value) {
  for (let i = 0; i < array.length; i += 1) {
    if (array[i][attr] === value) {
      return i;
    }
  }
  return -1;
}
function requote(value) {
  const d3_requote_re = /[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;
  return value.replace(d3_requote_re, '\\$&');
}
function searchDataset(data, value) {
  const re = new RegExp(`\\b${requote(value)}`, 'i');
  return data
    .filter(function (d) {
      return re.test(d.locationName);
    })
    .slice(0, 10);

  // svg.classed("searching", true);
  // circle.classed("match", function(d) { return re.test(d.artist + " " + d.track); });
}

function buildSearchResults(searchContainer, results, container, data) {
  searchContainer.select('.results-wrapper').style('display', 'block');

  geoSelected = container.attr('geo-selected');

  const resultsData = searchContainer
    .select('.results-wrapper')
    .selectAll('p')
    .data(results, function (d) {
      return d.locationName;
    });
  resultsData
    .enter()
    .append('p')
    .text(function (d) {
      if (geoSelected == 'state') {
        return d.locationName + geoName[geoSelected];
      }
      return `${
        d.locationName + geoName[geoSelected]
      }, ${d.state_iso2.toUpperCase()}`;
    })
    .on('click', function (d) {
      searchContainer.select('input').node().value = '';
      citySelected = d.locationName;
      stateSelected = d.state_iso2;

      loc = findNearest(
        { latitude: +d.Latitude, longitude: +d.Longitude },
        data
      );

      container.select('.results-wrapper').style('display', null);
      buildTable(container, loc);
    });

  resultsData.exit().remove();
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

function setupSearchBox(container, data) {
  const searchContainer = container.select('.search');
  let results = null;
  searchContainer.select('input').on('keyup', function () {
    if (this.value.trim().length > 2) {
      results = searchDataset(data, this.value.trim());
      if (results.length > 0) {
        buildSearchResults(searchContainer, results, container, data);
      } else {
        container.select('.results-wrapper').style('display', null);
      }
    } else {
      container.select('.results-wrapper').style('display', null);
    }
  });

  searchContainer.node().addEventListener('focusout', (e) => {
    const t = d3.timer(function (elapsed) {
      if (elapsed > 200) {
        t.stop();
        container.select('.results-wrapper').style('display', null);
      }
    }, 500);
  });
}

function buildTable(container, data) {
  geoSelected = container.attr('geo-selected');

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

  loc = locationInput[geoSelected]

  console.log(locationInput);

  citySelected = loc.locationName;
  stateSelected = loc.state_iso2;

  buildTable(container, data);
  setupSearchBox(container, data);
}

export default { init };
