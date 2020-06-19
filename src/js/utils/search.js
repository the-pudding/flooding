// these functions are modeled heavily off of Adam Silver's "Building an Accessible Autocomplete Control"
// https://adamsilver.io/articles/building-an-accessible-autocomplete-control/

let DATA = [];
let SEARCH = null;
let TYPE = null;
let $ac = null;

function handleDownPress(key) {
  console.log('down arrow pressed');
}

function handleType(key, textbox, search, type) {
  // only show options if user typed something
  const typed = textbox.node().value;
  if (typed.trim().length > 1) {
    // get options based on value
    const text = typed.toLowerCase();
    const re = new RegExp(`\\b${text}`);

    const results = DATA.filter((d) => d.location.toLowerCase().match(re));

    // update list of results
    buildMenu(results, search, type);
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
    'Tab',
    'ShiftLeft',
    'ShiftRight',
  ];

  // figure out what to do based on which key was pressed
  if (!ignore.includes(key) && key !== 'ArrowDown')
    handleType(key, textbox, search, type);
  else if (key === 'ArrowDown') handleDownPress();
}

function buildMenu(data, search, type) {
  const uniqueID = search.attr('data-js');

  // add li elements on data update
  $ac
    .select('ul')
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
        ? `${d.location}, ${d.state.toUpperCase()}`
        : `${d.location}`;
    })
    // stores the select box option value
    .attr('data-option-value', (d, i) => i + 1);
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
        ? `${d.location}, ${d.state.toUpperCase()}`
        : `${d.location}`
    );

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
    handleTextInput(search, type, textbox);
  });
}

export default function setupSearch(data, searchBoxSel, locationType) {
  return new Promise((resolve, reject) => {
    setupDOM(data, searchBoxSel, locationType);
    DATA = data;
    SEARCH = searchBoxSel;
    TYPE = locationType;
  });
}
