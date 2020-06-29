import GIF from 'gif.js.optimized'

function resize() {}
let gif = null;
let animating = true;
let interval = null;
let layerChange = [2020,2035,2050]
let layerSelected = 0;
let container = d3.select(".gif-wrapper")//.selectAll("input");
let map = null
let yearLabel = null;
let yearLabelTitle = null;
let gifRendered = false;
let downloaded = false;
let loop = 0;

function startInterval(){

  const canvas = document.createElement('canvas');
  var width = canvas.width = 1000;
  var height = canvas.height = 600;
  var ctx = canvas.getContext('2d');
  // ctx.beginPath();
  // ctx.rect(20, 20, 150, 100);
  // ctx.fillStyle = "red";
  // ctx.fill();






  //canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");  // here is the most important part because if you dont replace you will get a DOM 18 exception.


  interval = setInterval(function() {

    layerSelected = layerSelected + 1;


    if(!gifRendered && loop == 3 && layerSelected == 3 && downloaded){
      gifRendered = true;
      gif.render();
    }

    if(layerSelected > 2){
      layerSelected = 0;
      loop = loop + 1;
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

    if(loop == 2 && downloaded){



      var sourceImageData = map.getCanvas().toDataURL("image/png")//.replace("image/png", "image/octet-stream");  // here is the most important part because if you dont replace you will get a DOM 18 exception.

      let currentLayer = layerChange[layerSelected-1];
      if(!currentLayer){
        currentLayer = 2050;
      }

      var destinationImage = new Image;

      destinationImage.onload = function(){
        ctx.drawImage(destinationImage,0,0);

        ctx.beginPath();
        ctx.fillStyle = "#c8f7ff";
        ctx.fillRect(width - 200, 50, 150, 75);

        ctx.fillStyle = "black";
        ctx.font = "48px Arial";
        ctx.fillText(currentLayer, width-177, 105);

        var test = canvas.toDataURL("image/png");

        var image = new Image;
        image.onload = function(){
          gif.addFrame(image, {copy:true});
        };
        image.src = test;
      };
      destinationImage.src = sourceImageData;

    }


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

  d3.select("#download-gif").on("click",function(){
    if(!animating){
      toggleAnimation(false)
      buttons.classed("active",function(d,i){
        let play = d3.select(this).classed("play-button");
        if(play){
          return true;
        }
        return false;
      })
    }

    if(!downloaded){

      d3.select(this).text("Loading...")

      downloaded = true;
      loop = 0;
      gif = new GIF({
        workers: 1,
        quality: 10,
        workerScript: 'assets/scripts/gif.worker.js'
      });

      gif.on('finished', function(blob) {
        downloaded = false;
        gifRendered = false;
        d3.select("#download-gif").text("Download GIF")
        window.open(URL.createObjectURL(blob, {type: "image/gif"}));
      })
    }


  })


  mapboxgl.accessToken = 'pk.eyJ1IjoiZG9jazQyNDIiLCJhIjoiY2thZWxrN3cxMDVpYTJ0bXZwenI2ZXl1ZCJ9.E0ICxBW96VVQbnQqyRTWbA';

  map = new mapboxgl.Map({
    container: 'flood-gif',
    style: 'mapbox://styles/mapbox/light-v10',
    center: [-73.84,40.65],
    minZoom: 10,
    zoom: 12,
    preserveDrawingBuffer: true
  });

  let geocoder = null;
  map.on("load",function(d){

    if(d3.select("body").classed("is-mobile")){
      map.scrollZoom.disable();
    }

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

    //



  });


}

export default { init, resize };
