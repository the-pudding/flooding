import GIF from 'gif.js.optimized'

function resize() {}

let animating = true;
let interval = null;
let layerChange = [2020,2035,2050]
let layerSelected = 0;
let container = d3.select(".gif-wrapper")//.selectAll("input");
let map = null
let yearLabel = null;
let yearLabelTitle = null;

function startInterval(){
  interval = setInterval(function() {

    layerSelected = layerSelected + 1;
    if(layerSelected > 2){
      layerSelected = 0;
    }

    container.select(".control-wrapper").select(".year-wrapper").selectAll("input").property("checked",function(d,i){
      if(i==layerSelected){
        return true;
      }
      return false;
    })

    for (var row in layerChange){
      if(row == layerSelected){
        yearLabel.text(layerChange[layerSelected]);
        yearLabelTitle.text(layerChange[layerSelected])

        map.setLayoutProperty('fsf-'+layerChange[layerSelected], 'visibility', 'visible');
      }
      else {
        map.setLayoutProperty('fsf-'+layerChange[row], 'visibility', 'none');
      }
    }

    //gif.addFrame(map.getCanvas(), {copy: true, delay: 250});


    // map.getSource('fsf').tiles = ['https://api.firststreet.org/v1/tile/probability/depth/2050/100/{z}/{x}/{y}.png?key=w6e9nl3apphi9ln2mux4aazyd9gics5a'];
    // map.style.sourceCaches['fsf'].clearTiles()
    // map.style.sourceCaches['fsf'].update(map.transform);
    // map.triggerRepaint();
  }, 1000);
}

function toggleAnimation(animation){
  if(animating){
    if(interval){
      clearInterval(interval);
    }
  }
  else if(!animating){
    startInterval();
  }
  animating = animation;


}

function init(data,nearest) {

  let buttons = container.select(".play-pause-wrapper").selectAll(".button");

  buttons.on("click",function(d){
    buttons.classed("active",false);
    d3.select(this).classed("active",true);
    let play = d3.select(this).classed("play-button");
    if(play && !animating){
      toggleAnimation(true);
    } else if(animating && !play) {
      toggleAnimation(false);
    }
  })

  container.select(".control-wrapper").select(".year-wrapper").selectAll("input").on("change",function(d){
    let value = +d3.select(this).attr("value")
    layerSelected = layerChange.indexOf(value);



    for (var row in layerChange){
      if(row == layerSelected){
        yearLabel.text(layerChange[layerSelected]);
        yearLabelTitle.text(layerChange[layerSelected])

        map.setLayoutProperty('fsf-'+layerChange[layerSelected], 'visibility', 'visible');
      }
      else {
        map.setLayoutProperty('fsf-'+layerChange[row], 'visibility', 'none');
      }
    }

    if(animating){
      toggleAnimation(false)
    }

    buttons.classed("active",function(d,i){
      let play = d3.select(this).classed("play-button");
      if(play){
        return false;
      }
      return true;
    })

  })

  var gif = new GIF({
    workers: 2,
    quality: 10,
    workerScript: 'assets/scripts/gif.worker.js'
  });

  mapboxgl.accessToken = 'pk.eyJ1IjoiZG9jazQyNDIiLCJhIjoiY2thZWxrN3cxMDVpYTJ0bXZwenI2ZXl1ZCJ9.E0ICxBW96VVQbnQqyRTWbA';

  map = new mapboxgl.Map({
    container: 'flood-gif',
    style: 'mapbox://styles/mapbox/light-v10',
    center: [-73.84,40.65],
    minZoom: 10,
    zoom: 12
  });

  let geocoder = null;
  map.on("load",function(d){
    map.addControl(
      geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        countries: 'us',
        placeholder:'Find a location',
        zoom:12,
        marker:false,
        flyTo:false,
        mapboxgl: mapboxgl
      }), 'top-left'
    );

    geocoder.on("result",function(d){
      console.log(d.result);
      map.jumpTo({ center: d.result.geometry.coordinates, zoom:12 });
    })

    yearLabel = d3.select("#flood-gif").append("div").attr("class","year-label").text(layerChange[layerSelected]);
    yearLabelTitle = d3.select(".gif-year-selected");

    map.addSource('fsf-2020', {
         'type': 'raster',
         'tiles': ['https://api.firststreet.org/v1/tile/probability/depth/2020/100/{z}/{x}/{y}.png?key=w6e9nl3apphi9ln2mux4aazyd9gics5a'],
         'tileSize': 256
     });

     map.addLayer({
         'id': 'fsf-2020',
         'source': 'fsf-2020',
         'type': 'raster',
         'minzoom': 10,
         'maxzoom': 18,
         'paint': { 'raster-opacity': .8 }
     },"aeroway-line");


     map.addSource('fsf-2035', {
          'type': 'raster',
          'tiles': ['https://api.firststreet.org/v1/tile/probability/depth/2035/100/{z}/{x}/{y}.png?key=w6e9nl3apphi9ln2mux4aazyd9gics5a'],
          'tileSize': 256
      });

      map.addLayer({
          'id': 'fsf-2035',
          'source': 'fsf-2035',
          'type': 'raster',
          'minzoom': 10,
          'maxzoom': 18,
          //'layout': {'visibility':'none'},
          'paint': { 'raster-opacity': .8 }
      },"aeroway-line");

      map.addSource('fsf-2050', {
           'type': 'raster',
           'tiles': ['https://api.firststreet.org/v1/tile/probability/depth/2050/100/{z}/{x}/{y}.png?key=w6e9nl3apphi9ln2mux4aazyd9gics5a'],
           'tileSize': 256
       });

       map.addLayer({
           'id': 'fsf-2050',
           'source': 'fsf-2050',
           'type': 'raster',
           'minzoom': 10,
           'maxzoom': 18,
           //'layout': {'visibility':'none'},
           'paint': { 'raster-opacity': .8 }
       },"aeroway-line");

    startInterval();

    // gif.addFrame(map.getCanvas(), {copy: true, delay: 250});
    //
    gif.on('finished', function(blob) {
      console.log(blob);
      window.open(URL.createObjectURL(blob));
    })



    // gif.render();


  });


}

export default { init, resize };
