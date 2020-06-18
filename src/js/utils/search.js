// these functions are modeled heavily off of Adam Silver's "Building an Accessible Autocomplete Control"
// https://adamsilver.io/articles/building-an-accessible-autocomplete-control/

function handleDownPress(key) {
  console.log('down arrow pressed');
}

function handleType(key) {
  console.log('typing');
}

function handleTextInput() {
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
  if (!ignore.includes(key) && key !== 'ArrowDown') handleType(key);
  else if (key === 'ArrowDown') handleDownPress();
}

function setupDOM({ data, searchBoxSel, locationType }) {
  // add options to the select box for full a11y
  searchBoxSel
    .select('select')
    .selectAll('option')
    .data(data)
    .join((enter) => enter.append('option'))
    .text((d) =>
      locationType === 'county'
        ? `${d.location}, ${d.state.toUpperCase()}`
        : `${d.location}`
    );

  const uniqueID = searchBoxSel.attr('data-js');

  // add autocomplete div
  const $ac = searchBoxSel
    .selectAll('.autocomplete')
    .data([data])
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
        .attr('class', 'visually-hidden');

      return $parent;
    });

  // add li elements on data update
  $ac
    .select('ul')
    .selectAll('li')
    .data((d) => d)
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
    .text((d) =>
      locationType === 'county'
        ? `${d.location}, ${d.state.toUpperCase()}`
        : `${d.location}`
    )
    // stores the select box option value
    .attr('data-option-value', (d, i) => i + 1);

  // add type event listener
  $ac.on('keyup', handleTextInput);
}

export default function setupSearch(data, searchBoxSel, locationType) {
  return new Promise((resolve, reject) => {
    setupDOM({ data, searchBoxSel, locationType });
  });
}
