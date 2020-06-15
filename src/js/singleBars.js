// global constants
let NEAREST = [];
let DATA = [];

// by default we'll start with state data
const TYPE = 'county';

// selections
const $section = d3.select("[data-js='bars']");
const $container = $section.select("[data-js='bar__figure-single']");
const $figure = $container.select("[data-js='bar__container-single']");

// scales
const scaleX = d3.scaleLinear();

// margins
const MARGIN_RIGHT = 0;
const MARGIN_LEFT = 0;

const properties = [
  {
    propertyName: 'FEMA Properties at Risk 2020 (pct)',
    text: '...according to FEMA',
    key: 'FEMA',
  },
  {
    propertyName: 'FS Properties at Risk 2020 (pct)',
    text: '...according to new estimates in 2020',
    key: 'thisYear',
  },
  {
    propertyName: 'FS Properties at Risk 2035 (pct)',
    text: 'in 2035',
    key: 'fifteenYears',
  },
  {
    propertyName: 'FS Properties at Risk 2050 (pct)',
    text: 'in 2050',
    key: 'thirtyYears',
  },
];

function resize() {
  const width = $figure.node().offsetWidth - MARGIN_LEFT - MARGIN_RIGHT;

  scaleX
    .domain([0, 100])
    .range([0, width - MARGIN_LEFT])
    .nice();
}

function setupFigure(data) {
  const $groups = $figure
    .selectAll('.g-bar')
    .data(data)
    .join((enter) => {
      const $outsideGroup = enter.append('div').attr('class', 'g-bar');

      // add an inside group for the bars themselves
      $outsideGroup.append('div').attr('class', 'bar-container');

      // add a text element
      $outsideGroup
        .append('p')
        .attr('class', 'bar-desc')
        .text((d) => d.text);

      return $outsideGroup;
    });

  // add the inner bars
  const $innerGroup = $groups.selectAll('.bar-container');
  console.log($innerGroup);
  // add gray bars
  $innerGroup
    .selectAll('.bar-percent')
    .data((d) => [d])
    .join((enter) => enter.append('div').attr('class', `bar bar-percent`))
    .style('width', (d) => `${scaleX(100 - d.value)}px`);

  // add data bars
  $innerGroup
    .selectAll('.bar-data')
    .data((d) => [d])
    .join((enter) => {
      const $bar = enter
        .append('div')
        .attr('class', (d) => `bar bar-data bar-${d.key}`);

      $bar.append('p').text((d) => `${d.value}%`);

      return $bar;
    })
    .style('width', (d) => `${scaleX(d.value)}px`);
}

function setupData() {
  // since we're starting with the nearest to the reader
  // start by accessing the location type for the nearest data
  const nearestData = NEAREST[TYPE];

  // limit the nearest data to just the properties we want
  const propValues = properties.map((d) => {
    const value = nearestData[d.propertyName];
    const allData = {
      ...d,
      value: +value,
    };

    return allData;
  });

  setupFigure(propValues);
}

function setup() {
  resize();
  setupData();
}

function init(data, nearestLocations) {
  NEAREST = nearestLocations;
  DATA = data;
  setup();
  console.log({ NEAREST });
}

export default { init, resize };
