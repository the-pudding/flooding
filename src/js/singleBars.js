// global constants
let NEAREST = [];
let DATA = [];

function resize() {}

function init(data, nearestLocations) {
  NEAREST = nearestLocations;
  DATA = data;
}

export default { init, resize };
