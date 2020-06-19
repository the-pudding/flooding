// these functions are modeled heavily off of Adam Silver's "Building an Accessible Autocomplete Control"
// https://adamsilver.io/articles/building-an-accessible-autocomplete-control/

import findNearest from './find-nearest';

let DATA = [];
let SEARCH = null;
let TYPE = null;

let $ac = null;
let $menu = null;

function handleDownPress(key) {
  console.log('down arrow pressed');
}

function updateStatus(len, search) {
  search
    .select('.result-count')
    .text(len > 1 ? `${len} results` : 'Type for more results');
}

function showMenu() {
  $menu.classed('hidden', false);
}

function hideMenu() {
  $menu.classed('hidden', true);
}

function handleType(key, textbox, search, type) {
  // only show options if user typed something
  const typed = textbox.node().value;
  if (typed.trim().length > 1) {
    // get options based on value
    const text = typed.toLowerCase();
    const re = new RegExp(`\\b${text}`);

    const results = DATA.filter((d) => d.locationName.toLowerCase().match(re));
    const len = results.length;

    // update list of results
    buildMenu(results, search, type);

    // show the menu
    showMenu();

    // update status for screen readers
    updateStatus(len, search);
  } else {
    hideMenu();
    updateStatus(1);
  }
}

function handleTextInput(search, type, textbox) {
  const key = d3.event.code;

  // make array of keys to ignore
  const ignore = [
    'Escape',
    'ArrowUp',
    'ArrowLeft',
    'ArrowRight',
    'Space',
    'Enter',
    'ShiftLeft',
    'ShiftRight',
  ];

  // figure out what to do based on which key was pressed
  if (!ignore.includes(key) && key !== 'ArrowDown' && key !== 'Tab')
    handleType(key, textbox, search, type);
  else if (key === 'ArrowDown') handleDownPress();
  else if (key === 'Tab') hideMenu();
}

function selectOption(value, search) {
  // set the textbox value to selected option
  const tb = search.select('input');
  tb.property('value', value);
  console.log({ SEARCH });

  // set the select option to correct one
  const selElement = search.select('select');

  selElement.selectAll('option').property('selected', (d) => {
    const loc =
      TYPE === 'county'
        ? `${d.locationName}, ${d.state_iso2.toUpperCase()}`
        : `${d.locationName}`;
    return loc === value;
  });

  // make sure the on change event is fired
  selElement.dispatch('change');

  // find new nearest data

  // const newNear = findNearest();

  // update(sel.datum());

  hideMenu();
}

function handleOptionClick(sel, search) {
  const val = sel.attr('data-option-value');

  selectOption(val, search);
}

function buildMenu(data, search, type) {
  const uniqueID = search.select('input').attr('id');
  const findID = `#options-${uniqueID}`;

  $menu = search.selectAll(`#options-${uniqueID}`);

  // add li elements on data update
  const options = search
    .select(`#options-${uniqueID}`)
    .selectAll('li')
    .data((d) => {
      return data;
    })
    .join((enter) =>
      enter
        .append('li')
        // lets users know this is one option in the list
        .attr('role', 'option')
        // focus can be set to the option programmatically
        .attr('tabindex', '-1')
        // lets users know which option is selected
        .attr('aria-selected', 'false')
        .attr('id', (d, i) => `${uniqueID}-autocomplete_${i}`)
    )
    .text((d) => {
      return type === 'county'
        ? `${d.locationName}, ${d.state_iso2.toUpperCase()}`
        : `${d.locationName}`;
    })
    // stores the select box option value
    .attr('data-option-value', (d) =>
      type === 'county'
        ? `${d.locationName}, ${d.state_iso2.toUpperCase()}`
        : `${d.locationName}`
    );

  options.on('click', (d, i, nodes) => {
    const sel = d3.select(nodes[i]);
    handleOptionClick(sel, search);
  });
}

function setupDOM(data, search, type) {
  // add options to the select box for full a11y

  search
    .select('select')
    .selectAll('option')
    .data(data)
    .join((enter) => enter.append('option'))
    .text((d) =>
      type === 'county'
        ? `${d.locationName}, ${d.state_iso2.toUpperCase()}`
        : `${d.locationName}`
    )
    .attr('value', (d) => `${d.locationName}, ${d.state_iso2.toUpperCase()}`);

  const uniqueID = search.attr('data-js');

  // add autocomplete div
  $ac = search
    .selectAll('.autocomplete')
    .data([DATA])
    .join((enter) => {
      const $parent = enter.append('div').attr('class', 'autocomplete');

      // add input (with a11y specifics) to parent div
      $parent
        .append('input')
        .attr('aria-owns', `options-${uniqueID}`)
        // stops browsers from capitalizing the first letter
        .attr('autocapitalize', 'none')
        .attr('type', 'text')
        // stops browsers from showing their own suggestions
        .attr('autocomplete', 'off')
        // tells users a list will appear
        .attr('aria-autocomplete', 'list')
        // ensure the input is announced as a combo box
        .attr('role', 'combobox')
        // this should match the id of the select box to associate the label
        .attr('id', uniqueID)
        // tells user whether list is expanded or not (false by default)
        .attr('aria-expanded', 'false');

      // add ul element
      $parent
        .append('ul')
        .attr('id', `options-${uniqueID}`)
        // communicates that the menu is a list
        .attr('role', 'listbox')
        .attr('class', 'hidden');

      // add result count for screen readers
      $parent
        .append('div')
        .attr('aria-live', 'polite')
        .attr('role', 'status')
        // this feedback is only useful to screen reader users so it's hidden
        .attr('class', 'visually-hidden result-count');

      return $parent;
    });

  buildMenu(data, search, type);

  // add type event listener
  $ac.on('keyup', function (d) {
    const textbox = d3.select(this).select('input');
    console.log({ textbox });
    handleTextInput(search, type, textbox);
  });
}

function update(chartUpdateFn) {
  // pass chart specific update function
}

export default function setupSearch(data, searchBoxSel, locationType) {
  return new Promise((resolve, reject) => {
    setupDOM(data, searchBoxSel, locationType);
    DATA = data;
    SEARCH = searchBoxSel;
    TYPE = locationType;
  });
}
