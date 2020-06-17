// global constants
let NEAREST = [];
let DATA = [];

// by default we'll start with county data
let TYPE = 'county';

// selections
const $section = d3.select("[data-js='bars']");
const $container = $section.select("[data-js='bar__figure-multi']");
const $figure = $container.select("[data-js='bar__container-multi']");
const $desc = $container.select('.figure__desc');
const $buttons = $section.selectAll('input');

// scales
const scaleX = d3.scaleLinear();

// margins
const MARGIN_RIGHT = 0;
const MARGIN_LEFT = 32;

// number formats
const FORMAT_NUMBER = d3.format(',.0f');

const properties = [
  {
    propertyName: 'FEMA Properties at Risk 2020 (total)',
    key: 'FEMA',
  },
  {
    propertyName: 'FS 2020 100 Year Risk (total)',
    key: 'thisYear',
  },
];

function resize() {
  const width = $figure.node().offsetWidth - MARGIN_LEFT - MARGIN_RIGHT;

  scaleX
    .domain([0, 100])
    .range([0, (width - MARGIN_LEFT) / 3])
    .nice();
}

function setupFigure(data) {

  const $groups = $figure
    .selectAll('.g-bar')
    .data(data, (d) => d.name)
    .join((enter) => {
      const $outsideGroup = enter.append('div').attr('class', 'g-bar');

      // add a text element
      const $textGroup = $outsideGroup
        .append('div')
        .attr('class', 'text-group');

      $textGroup.append('p').attr('class', 'bar-desc bar-name');

      // add an inside group for the fema bars themselves
      $outsideGroup
        .append('div')
        .attr('class', 'bar-container bar-container__fema');

      // add an inside group for the fs bars
      $outsideGroup
        .append('div')
        .attr('class', 'bar-container bar-container__fs');

      return $outsideGroup;
    });

  // update the text for the bar desc
  $groups.selectAll('.bar-desc').text((d) => d.name);

  // add the inner bars
  const $femaGroup = $groups.selectAll('.bar-container__fema');

  // add gray bars
  $femaGroup
    .selectAll('.bar-percent')
    .data(
      (d) => [d],
      (d) => d.name
    )
    .join((enter) => enter.append('div').attr('class', `bar bar-percent`))
    .style('width', (d) => `${scaleX(100 - d.fema)}px`);

  // add data bars
  const $dataBarFema = $femaGroup
    .selectAll('.bar-data')
    .data(
      (d) => [d],
      (d) => d.name
    )
    .join((enter) => {
      const $bar = enter
        .append('div')
        .attr('class', (d) => `bar bar-data bar-FEMA`);

      $bar.append('p');

      return $bar;
    })
    .style('width', (d) => `${scaleX(d.fema)}px`);

  $dataBarFema.select('p').text((d) => `${d.fema}%`);

  // add the inner bars
  const $fsGroup = $groups.selectAll('.bar-container__fs');

  // add gray bars
  $fsGroup
    .selectAll('.bar-percent')
    .data(
      (d) => [d],
      (d) => d.name
    )
    .join((enter) => enter.append('div').attr('class', `bar bar-percent`))
    .style('width', (d) => `${scaleX(100 - d.fs)}px`);

  // add data bars
  const $dataBarFs = $fsGroup
    .selectAll('.bar-data')
    .data(
      (d) => [d],
      (d) => d.name
    )
    .join((enter) => {
      const $bar = enter
        .append('div')
        .attr('class', (d) => `bar bar-data bar-fs`);

      $bar.append('p');

      return $bar;
    })
    .style('width', (d) => `${scaleX(d.fs)}px`);

  $dataBarFs.select('p').text((d) => `${d.fs}%`);


}

function cleanData(dat) {
  console.log(dat);
  const cleaned = dat.map((d) => ({
    name: d.locationName,
    fema: Math.round(
      (+d['FEMA Properties at Risk 2020 (total)'] / +d['Total Properties']) *
        100
    ),
    fs: Math.round(
      (+d['FS 2020 100 Year Risk (total)'] / +d['Total Properties']) * 100
    ),
  }));

  return cleaned;
}

function setupData() {
  // since we're starting with the nearest to the reader
  // start by accessing the location type for the nearest data
  // and clean the data to find % of properties at risk
  const nearestData = cleanData(NEAREST[TYPE]);



  setupFigure(nearestData);

  // update figure description
  $desc
    .select('.reader')
    .text(
      TYPE === 'county' ? `${nearestData[0].name} County` : nearestData[0].name
    );

  const diff = NEAREST[TYPE][0]['FS-FEMA Difference, 2020 (total)'];

  $desc.select('.count').text(FORMAT_NUMBER(diff));
}

function multiButtonClick(btn) {
  TYPE = btn.attr('id');

  setupData();
}

function setup() {
  resize();
  setupData();
}

function init(data, nearestLocations) {
  NEAREST = nearestLocations;
  DATA = data;
  setup();
}

export default { init, resize, multiButtonClick };
