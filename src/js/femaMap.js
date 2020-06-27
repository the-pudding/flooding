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

  let counties = [
    ["Sarasota and Manatee counties in Florida",[]],
    ["Akron, Ohio Area",[-81.538,40.992]],
    ["Escambia and Santa Rosa counties in Florida",[]],
    ["Lafayette and St. Landry parishes in Louisiana",[-92.05416264226284,30.332087829526884]],
    ["Wayne, Oakland and Macomb counties in Michigan",[-83.264,42.505]],
    ["Chatham and Bryan",[-81.22376056548842,31.931047184232682]],
    ["St. Johns County in Florida",[-81.31572653813868,29.89694420163633]],
    ["Richmond and Columbia in Georgia, Aiken in South Carolina",[-81.87830985421346,33.4663727552888]]
  ];

  let dropdown = container.select(".dropdown-counties").select("select")

  dropdown.selectAll("options")
    .data(counties)
    .enter()
    .append("option")
    .text(function(d){
      return d[0];
    })

  dropdown
    .on("change",function(d){

      map.setCenter(d3.select(dropdown.node().options[dropdown.node().selectedIndex]).datum()[1])
    })
    ;


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
