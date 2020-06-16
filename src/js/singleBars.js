// global constants
let NEAREST = [];
let DATA = [];

// by default we'll start with state data
let TYPE = 'county';

// selections
const $section = d3.select("[data-js='bars']");
const $container = $section.select("[data-js='bar__figure-single']");
const $figure = $container.select("[data-js='bar__container-single']");
const $buttons = $section.selectAll('input');

// scales
const scaleX = d3.scaleLinear();

// margins
const MARGIN_RIGHT = 0;
const MARGIN_LEFT = 0;

const properties = [
  {
    propertyName: 'FEMA Properties at Risk 2020 (total)',
    text: '...according to FEMA',
    key: 'FEMA',
  },
  {
    propertyName: 'FS 2020 100 Year Risk (total)',
    text: '...according to new estimates in 2020',
    key: 'thisYear',
  },
  {
    propertyName: 'FS 2035 100 Year Risk (total)',
    text: 'in 2035',
    key: 'fifteenYears',
  },
  {
    propertyName: 'FS 2050 100 Year Risk (total)',
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
    .data(data, () => TYPE)
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

  // add gray bars
  $innerGroup
    .selectAll('.bar-percent')
    .data(
      (d) => [d],
      () => TYPE
    )
    .join((enter) => enter.append('div').attr('class', `bar bar-percent`))
    .style('width', (d) => `${scaleX(100 - d.value)}px`);

  // add data bars
  const $dataBar = $innerGroup
    .selectAll('.bar-data')
    .data(
      (d) => [d],
      () => TYPE
    )
    .join((enter) => {
      const $bar = enter
        .append('div')
        .attr('class', (d) => `bar bar-data bar-${d.key}`);

      $bar.append('p');

      return $bar;
    })
    .transition()
    .duration(500)
    .style('width', (d) => `${scaleX(d.value)}px`);

  $dataBar.select('p').text((d) => `${d.value}%`);
}

function setupData() {
  // since we're starting with the nearest to the reader
  // start by accessing the location type for the nearest data
  const nearestData = NEAREST[TYPE];
  // limit the nearest data to just the properties we want
  const propValues = properties.map((d) => {
    const value = Math.round(
      (nearestData[d.propertyName] / nearestData['Total Properties']) * 100
    );
    const allData = {
      ...d,
      value: +value,
    };

    return allData;
  });

  setupFigure(propValues);
}

function handleButtonClick() {
  const sel = d3.select(this);

  TYPE = sel.attr('id');

  setupData();
}

function setup() {
  resize();
  setupData();
  $buttons.on('change', handleButtonClick);
}

function init(data, nearestLocations) {
  NEAREST = nearestLocations;
  DATA = data;
  setup();
}

export default { init, resize };
