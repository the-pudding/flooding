import propertyTable from './propertyTable.js'

const geoName = { city: '', county: ' county', state: '' };

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


function buildSearchResults(searchContainer, results, container, data) {
  searchContainer.select('.results-wrapper').style('display', 'block');

  let geoSelected = container.attr('geo-selected');

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

      let vizType = container.attr("type-selected");
      searchContainer.select('input').node().value = '';

      container.attr("data-city",d.locationName);
      container.attr("data-state",d.state_iso2);

      let loc = findNearest(
        { latitude: +d.Latitude, longitude: +d.Longitude },
        data
      );

      container.select('.results-wrapper').style('display', null);

      if(vizType == "table"){
        propertyTable.buildTable(container, loc);
      }

    });

  resultsData.exit().remove();
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

function setupSearchBox(container, data,geoSelected) {



  const searchContainer = container.select('.search');
  let results = null;
  searchContainer.select('input').on('keyup', function () {
    if (this.value.trim().length > 2) {
      results = searchDataset(data, this.value.trim());

      console.log(results);

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


export default { setupSearchBox };
