import embedCode from './embed-code'


function resize() {}



function init(container,coords) {
  let center = [-82.985,42.466];
  if(coords[0]){
    center = coords;
  }

  let embedRevealed = false;
  container.select(".embed-button").on("click",function(d){
    let center = map.getCenter();
    if(!embedRevealed){
      embedCode.init(d3.select(this.parentNode),"https://pudding.cool/projects/flooding/visuals/embed.html?embed=true&chart=fema-compare-map&lat="+center.lat+"&lon="+center.lng)
      embedRevealed = true;
    }
  })


  mapboxgl.accessToken = 'pk.eyJ1IjoiZG9jazQyNDIiLCJhIjoiY2thZWxrN3cxMDVpYTJ0bXZwenI2ZXl1ZCJ9.E0ICxBW96VVQbnQqyRTWbA';

  let map = new mapboxgl.Map({
    container: 'fema-map',
    style: 'mapbox://styles/dock4242/ckbuxuqa00nva1imfulcebf1r',
    center: center,
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
      console.log("here");
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
  });


}

export default { init, resize };
