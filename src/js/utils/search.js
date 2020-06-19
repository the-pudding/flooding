// these functions are modeled heavily off of Adam Silver's "Building an Accessible Autocomplete Control"
// https://adamsilver.io/articles/building-an-accessible-autocomplete-control/

d3.selection.prototype.setupSearch = function init(options) {
  // set global variables
  const { theseData: DATA, type: TYPE, thisBox: CONTAINER } = options;

  let $ac = null;
  let $menu = null;

  const arrowIndex = 0;

  function buildMenu(filteredData) {
    const uniqueID = CONTAINER.select('input').attr('id');

    $menu = CONTAINER.selectAll(`#options-${uniqueID}`);

    // add li elements on data update
    const optionsSel = CONTAINER.select(`#options-${uniqueID}`)
      .selectAll('li')
      .data(filteredData)
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
        return TYPE === 'county'
          ? `${d.locationName}, ${d.state_iso2.toUpperCase()}`
          : `${d.locationName}`;
      })
      // stores the select box option value
      .attr('data-option-value', (d) =>
        TYPE === 'county'
          ? `${d.locationName}, ${d.state_iso2.toUpperCase()}`
          : `${d.locationName}`
      );

    optionsSel.on('click', (d, i, nodes) => {
      const sel = d3.select(nodes[i]);
      handleOptionClick(sel);
    });
  }

  function handleHighlightOption(option) {
    // are any already active?
    const active = CONTAINER.selectAll('[aria-selected="true"]');
    if (active.size() > 0) {
      active.attr('aria-selected', 'false');
    }

    // make the selected option the highlighted one
    option.attr('aria-selected', 'true');

    // highlight first option
  }

  function handleDownPress() {
    // prevent page scroll
    d3.event.preventDefault();

    const allVisible = CONTAINER.selectAll('[role="option"]').nodes();

    // find any active ones
    const active = allVisible.filter((d, i, nodes) => {
      const sel = d3.select(nodes[i]).attr('aria-selected');
      return sel === 'true';
    });

    const next =
      active.length > 0
        ? d3.select(active[0].nextSibling)
        : d3.select(allVisible[0]);

    d3.select(active[0]).attr('aria-selected', false);
    next.attr('aria-selected', 'true');
    next.node().focus();
  }

  function handleUpPress() {
    // prevent page scroll
    d3.event.preventDefault();

    const allVisible = CONTAINER.selectAll('[role="option"]').nodes();

    // find any active ones
    const active = allVisible.filter((d, i, nodes) => {
      const sel = d3.select(nodes[i]).attr('aria-selected');
      return sel === 'true';
    });

    const prev =
      active.length > 0
        ? d3.select(active[0].previousSibling)
        : d3.select(allVisible[0]);

    d3.select(active[0]).attr('aria-selected', false);
    prev.attr('aria-selected', 'true');
    prev.node().focus();
  }

  function updateStatus(len) {
    CONTAINER.select('.result-count').text(
      len > 1 ? `${len} results` : 'Type for more results'
    );
  }

  function showMenu() {
    $menu.classed('hidden', false);
  }

  function hideMenu() {
    $menu.classed('hidden', true);
  }

  function selectOption(value) {
    // set the textbox value to selected option
    const tb = CONTAINER.select('input');
    tb.property('value', value);

    // set the select option to correct one
    const selElement = CONTAINER.select('select');

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
  function handleType(key, textbox) {
    // only show options if user typed something
    const typed = textbox.node().value;
    if (typed.trim().length > 1) {
      // get options based on value
      const text = typed.toLowerCase();
      const re = new RegExp(`\\b${text}`);

      const results = DATA.filter((d) =>
        d.locationName.toLowerCase().match(re)
      );
      const len = results.length;

      // update list of results
      buildMenu(results);

      // show the menu
      showMenu();

      // update status for screen readers
      updateStatus(len);
    } else {
      hideMenu();
      updateStatus(1);
    }
  }

  function handleTextInput(textbox) {
    const key = d3.event.code;

    // make array of keys to ignore
    const ignore = [
      'Escape',
      'ArrowUp',
      'ArrowDown',
      'Tab',
      'ArrowLeft',
      'ArrowRight',
      'Space',
      'Enter',
      'ShiftLeft',
      'ShiftRight',
    ];

    // figure out what to do based on which key was pressed
    if (!ignore.includes(key)) handleType(key, textbox);
    else if (key === 'ArrowDown') handleDownPress();
    else if (key === 'Tab') hideMenu();
    else if (key === 'ArrowUp') handleUpPress();
    else if (key === 'Enter' || key === 'Space') {
      const allVisible = CONTAINER.selectAll('[role="option"]').nodes();

      // find any active ones
      const active = allVisible.filter((d, i, nodes) => {
        const sel = d3.select(nodes[i]).attr('aria-selected');
        return sel === 'true';
      });

      const val = d3.select(active[0]).attr('data-option-value');
      selectOption(val);
    }
  }

  function handleOptionClick(sel) {
    const val = sel.attr('data-option-value');

    CONTAINER.selectAll('li').attr('aria-selected', 'false');
    sel.attr('aria-selected', 'true');

    selectOption(val);
  }

  function setupDOM() {
    // add options to the select box for full a11y

    CONTAINER.select('select')
      .selectAll('option')
      .data(DATA)
      .join((enter) => enter.append('option'))
      .text((d) =>
        TYPE === 'county'
          ? `${d.locationName}, ${d.state_iso2.toUpperCase()}`
          : `${d.locationName}`
      )
      .attr('value', (d) => `${d.locationName}, ${d.state_iso2.toUpperCase()}`);

    const uniqueID = CONTAINER.attr('data-js');

    // add autocomplete div
    $ac = CONTAINER.selectAll('.autocomplete')
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

    buildMenu(DATA);

    // add type event listener
    $ac.on('keyup', (d, i, nodes) => {
      const textbox = d3.select(nodes[i]).select('input');

      handleTextInput(textbox);
    });
  }

  // launch the entire thing
  setupDOM();
};
