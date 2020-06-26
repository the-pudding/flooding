
function resize() {}



function init() {

  mapboxgl.accessToken = 'pk.eyJ1IjoiZG9jazQyNDIiLCJhIjoiY2thZWxrN3cxMDVpYTJ0bXZwenI2ZXl1ZCJ9.E0ICxBW96VVQbnQqyRTWbA';

  let map = new mapboxgl.Map({
    container: 'fema-map',
    style: 'mapbox://styles/dock4242/ckbuxuqa00nva1imfulcebf1r',
    center: [-82.985,42.466],
    minZoom: 7,
    maxZoom: 14,
    zoom: 10
    //preserveDrawingBuffer: true
  });

  let clickCross = {
    "fema":"_fema",
    "first street": "_fs"
  }

  map.on("load",function(d){

    d3.select(".fema__controls-container").selectAll("input").on("click",function(d){
      let value = d3.select(this).attr("value");
      let checked = d3.select(this).property("checked");
      let visibility = "none";
      if(checked){
        visibility = "visible";
      }
      map.getStyle().layers.map(function (layer) {
        if (layer.id.indexOf(clickCross[value]) >= 0) {
          map.setLayoutProperty(layer.id, 'visibility', visibility);
        }
      });
    })

    // map.addControl(
    //   geocoder = new MapboxGeocoder({
    //     accessToken: mapboxgl.accessToken,
    //     countries: 'us',
    //     placeholder:'Find a location',
    //     zoom:12,
    //     marker:false,
    //     flyTo:false,
    //     mapboxgl: mapboxgl
    //   }), 'top-left'
    // );
    //
    // geocoder.on("result",function(d){
    //   map.jumpTo({ center: d.result.geometry.coordinates, zoom:12 });
    // })

  });


}

export default { init, resize };
