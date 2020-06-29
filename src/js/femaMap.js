import embedCode from './embed-code'


function resize() {}



function init(container,coords) {
  let center = [-82.985,42.466];
  if(coords[0]){
    center = coords;
  }

  let embedRevealed = false;
  container.select(".embed-button").on("click",function(d){
    console.log("here");
    let center = map.getCenter();
    if(!embedRevealed){
      embedCode.init(d3.select(this.parentNode),"https://pudding.cool/projects/flooding/visuals/embed.html?embed=true&chart=fema-compare-map&lat="+center.lat+"&lon="+center.lng)
      embedRevealed = true;
    }
  })

  let counties = [
    ["California",
      [
        ["Riverside County, California",[-116.261,33.589]]
      ]
    ],

    ["Florida",
      [
        ["Sarasota and Manatee counties in Florida",[-82.303,27.345]],
        ["Escambia and Santa Rosa counties in Florida",[-87.046,30.659]],
        ["Alachua, Levy, Dixie and Gilchrist counties in Florida",[-82.733,29.471]],
        ["St. Johns County in Florida",[-81.31572653813868,29.89694420163633]],
        ["Duval County in Florida",[-81.452,30.120]],
        ["Brevard, Indian River, St. Lucie County, Florida",[-80.7214,28.2639]]
      ]
    ],
    ["Georgia",
      [
        ["Chatham and Bryan in Georgia",[-81.22376056548842,31.931047184232682]],
        ["Richmond and Columbia in Georgia, Aiken in South Carolina",[-81.87830985421346,33.4663727552888]],
      ]
    ],
    ["Louisiana",
      [
        ["Lafayette and St. Landry parishes in Louisiana",[-92.05416264226284,30.332087829526884]]
      ]
    ],
    ["Michigan",
      [["Wayne, Oakland and Macomb counties in Michigan",[-83.264,42.505]]]
    ],
    ["New Jersey",
      [
        ["Monmouth and Ocean counties in New Jersey",[-74.0731,39.9807]]
      ]
    ],
    ["New York",
      [
        ["Oneida County, New York",[-75.4297,43.2205]]
      ]
    ],
    ["Ohio",
      [
        ["Akron, Ohio Area",[-81.538,40.992]],
        ["Columbus, Ohio",[-82.899,39.929]],
        ["Southwest Ohio, North Kentucky",[-84.518,39.167]],
      ]
    ],
    ["Pennsylvania",
      [
        ["Bucks and Montgomery counties in Pennsylvania",[-74.971,40.172]]
      ]
    ],
    ["Rhode Island",
      [
        ["Rhode Island Counties",[-71.418,41.669]]
      ]
    ]
  ];

  let dropdown = container.select(".dropdown-counties").select("select")

  let optGroups = dropdown
    .selectAll("optgroup")
    .data(counties)
    .enter()
    .append("optgroup")
    .attr("label",function(d){
      return d[0]
    })
    .selectAll("options")
    .data(function(d){
      return d[1]
    })
    .enter()
    .append("option")
    .attr("selected",function(d,i){
      if(d[0]=="Wayne, Oakland and Macomb counties in Michigan"){
        return "selected"
      }
      return null;
    })
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
    style: 'mapbox://styles/dock4242/ckc0u9fm05dap1hmwg83scof6',
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
