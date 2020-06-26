
import searchCreate from './searchCreate.js'
import createGeojson from './createGeojson';
import embedCode from './embed-code'
// import mapboxgl from 'mapbox-gl';
/* global d3 */
import locate from './utils/locate';

function resize() {}

function swapText(id) {
  map.setLayoutProperty(id, 'text-field',
  [
    'format',
    ['get', 'name_clean'],
    { 'font-scale': 1 },
    '\n',
    {},
    ['get', 'place'],
    {
      'font-scale': 0.75,
      'text-font': ['literal', ['Roboto Mono Regular', 'Rubik Black']],
    },
  ]);
}

function init(nearest,data) {

    let munged = data.cityData.concat(data.countyData).concat(data.stateData);
    let geojson1 = createGeojson.init(data["zipData"],"cluster")
    let geojson2 = createGeojson.init(data["zipData"],"cluster2")

    function forwardGeocoder(query) {
      var matchingFeatures = [];
      for (var i = 0; i < customData.features.length; i++) {
      var feature = customData.features[i];
      // handle queries with different capitalization than the source data by calling toLowerCase()
      if (
        feature.properties.title
        .toLowerCase()
        .search(query.toLowerCase()) !== -1
      ) {
        // add a tree emoji as a prefix for custom data results
        // using carmen geojson format: https://github.com/mapbox/carmen/blob/master/carmen-geojson.md
        feature['place_name'] = feature.properties.title + " county, "+feature.properties.state.toUpperCase();
        feature['center'] = feature.geometry.coordinates;
        matchingFeatures.push(feature);
      }
      }
      return matchingFeatures;
    }

    let customData = createGeojson.init(data.countyData,"search");
    let defaultCoords = [-84.191605, 39.758949];
    //this needs an if statement in case nearest isn't found
    defaultCoords = [nearest["state"][0]["Longitude"],nearest["state"][0]["Latitude"]];
    mapboxgl.accessToken = 'pk.eyJ1IjoiZG9jazQyNDIiLCJhIjoiY2thZWxrN3cxMDVpYTJ0bXZwenI2ZXl1ZCJ9.E0ICxBW96VVQbnQqyRTWbA';

        var map = new mapboxgl.Map({
          container: 'city-cluster',
          style: 'mapbox://styles/mapbox/light-v10',
          // style: 'mapbox://styles/nytgraphics/cjmsjh9u308ze2rpk2vh41efx?optimize=true',
          center: defaultCoords,
          minZoom: 4,
          clusterMaxZoom: 10, // Max zoom to cluster points on
          zoom: 4
      });

      var geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        countries: 'us',
        localGeocoder: forwardGeocoder,
        placeholder:'Find a location',
        filter: function(item) {
          return item.place_type[0] != "poi";
        },
        zoom:7,
        marker:false,
        mapboxgl: mapboxgl
      });

      document.getElementById('geocode').appendChild(geocoder.onAdd(map));

      let embedRevealed = false;
      let container = null;
      d3.select("#city-cluster").each(function(d){
        container = d3.select(this.parentNode)
      })//.select(this.parentNode).node();

      container.select(".embed-button").on("click",function(d){
        let center = map.getCenter();
        if(!embedRevealed){
          embedCode.init(d3.select(this.parentNode),"https://pudding.cool/projects/flooding/visuals/embed.html?embed=true&chart=cluster-map&lat="+center.lat+"&lon="+center.lng)
          embedRevealed = true;
        }
      })

      map.on('load', function() {

        map.addSource("postal-2", {
          type: "vector",
          url:'mapbox://mapbox.boundaries-pos4-v3'//.json?secure&access_token=pk.eyJ1IjoibGFicy1zYW5kYm94IiwiYSI6ImNrMTZuanRtdTE3cW4zZG56bHR6MnBkZG4ifQ.YGRP0sZNYdLw5_jSa9IvXg
        });

        map.addLayer({
          "id": "postal-2-fill",
          "type": "fill",
          "source": "postal-2",
          "source-layer": 'boundaries_postal_4',
          "paint": {
              "fill-outline-color":"rgba(0,0,0,0)",
              "fill-opacity":.1,
              "fill-color": "#000"
          },
          'minzoom':7,
          'maxzoom':10

        },"admin-1-boundary");

        map.addLayer({
          "id": "postal-2-line",
          "type": "line",
          "source": "postal-2",
          "source-layer": 'boundaries_postal_4',
          'minzoom':7,
          "paint": {
              "line-width":1,
              "line-opacity": .8,
              "line-color":"#aaa"
          }
        });

        map.addSource('points', {
          'type': 'geojson',
          'data': geojson1,
          'cluster':true,
          'clusterRadius': 30,
          'clusterProperties':{
            'pointTotal':["+", ["get", "count"]]
          }
        });

        map.addLayer({
          id: 'unclustered-point',
          type: 'circle',
          source: 'points',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-opacity':.5,
            'circle-color': "#000",
            'circle-radius':
            [
              "interpolate",
              ["linear"],
              ["zoom"],
              4,
              [
                "interpolate",
                ["linear"],
                [
                  "get",
                  "count"
                ],
                10000,
                5,
                200000,
                30
              ],
              9,
              [
                "interpolate",
                ["linear"],
                [
                  "get",
                  "count"
                ],
                500,
                5,
                10000,
                30
              ]
            ]
          }
        });

        map.addLayer({
          id: 'unclustered-label',
          type: 'symbol',
          source: 'points',
          filter: ['!', ['has', 'point_count']],
          paint: {
            "text-halo-width":1,
            "text-halo-color":"#FFFFFF"
          },
          layout: {
            'text-field':
            [
              'format',
              ['get', 'countFormatted'],
              { 'font-scale': 1.1,
                'text-font': ['literal', ['Open Sans Bold', 'Arial Unicode MS Bold']],
              },
              '\n',
              {},
              ['get', 'id'],
              {
                'font-scale': 0.85,
                'text-font': ['literal', ['Open Sans Semibold', 'Arial Unicode MS Bold']],
              }
            ],


            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-size': 10
          }
        });

        map.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'points',
          filter: ['has', 'point_count'],
          paint: {
            'circle-opacity':.8,
            'circle-color': [
              'step',
              ['get', 'pointTotal'],
              '#51bbd6',
              1000,
              '#f1f075',
              10000,
              '#f28cb1'
            ],
            'circle-radius':

            [
              "interpolate",
              ["linear"],
              ["zoom"],
              4,
              [
                "interpolate",
                ["linear"],
                [
                  "get",
                  "pointTotal"
                ],
                10000,
                5,
                200000,
                30
              ],
              9,
              [
                "interpolate",
                ["linear"],
                [
                  "get",
                  "pointTotal"
                ],
                500,
                5,
                10000,
                30
              ]
            ]
          }
        });

        map.addLayer({
          'id': 'earthquake_label',
          'type': 'symbol',
          'source': 'points',
          'filter': ['has', 'point_count'],

          //'filter': ['!=', 'cluster', true],
          'layout': {
            'text-field': [
              'number-format',
              ['get', 'pointTotal'],
              { 'min-fraction-digits': 0, 'max-fraction-digits': 0 }
            ],
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-size': 10
          }
        });

        map.addSource('fsf', {
             'type': 'raster',
             'tiles': ['https://api.firststreet.org/v1/tile/probability/depth/2020/100/{z}/{x}/{y}.png?key=w6e9nl3apphi9ln2mux4aazyd9gics5a'],
             'tileSize': 256
         });

         map.addLayer({
             'id': 'fsf',
             'source': 'fsf',
             'type': 'raster',
             'minzoom': 10,
             'maxzoom': 18,
             'paint': { 'raster-opacity': .8 }
         },"postal-2-fill");


        map.on('mousemove', function(e){

          const features = map.queryRenderedFeatures(e.point, { layers: ["unclustered-point"] });
          if(features.length > 0){
            console.log(features[0]);
          }
        });

        let yearCut = 2020;

        d3.select("#city-cluster")
          .select(".controls-container")
          .selectAll('input')
          .on('change', function (d) {
            let selected = +d3.select(this).attr("value");
            if(selected != yearCut){
              yearCut = selected;
              d3.select(".year-selected-map").text(yearCut)
              if(yearCut == 2020){
                map.getSource('points').setData(geojson1);
              }
              else {
                map.getSource('points').setData(geojson2);
              }
            }
          });

        d3.select(".click-to-explore").on("click",function(){

        })

          // map.on('click', 'clusters', function(e) {
            // var features = map.queryRenderedFeatures(e.point, {
            //   layers: ['clusters']
            // });
            //
            // console.log(features[0]);
            //
            // var clusterId = features[0].properties.cluster_id;
            // var pointCount = features[0].properties.point_count;
            // var clusterSource = map.getSource('points');
            //
            // clusterSource.getClusterLeaves(clusterId, pointCount, 0, function(error, features) {
            //   // Print cluster leaves in the console
            //   console.log('Cluster leaves:', error, features);
            // })

          // });



          // map.addLayer({
          // id: 'cluster-count',
          // type: 'symbol',
          // source: 'points',
          // filter: ['has', 'point_count'],
          // layout: {
          // 'text-field': '{point_count_abbreviated}',
          // 'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          // 'text-size': 12
          // }
          // });





      //
      //      map.addSource('fsf', {
      //         'type': 'raster',
      //         'tiles': ['https://tiles-preview.firststreet.org/probability/depth/2035/100/{z}/{x}/{y}.png'],
      //         'tileSize': 256
      //     });
      //     map.addLayer({
      //         'id': 'fsf',
      //         'source': 'fsf',
      //         'type': 'raster',
      //         'minzoom': 0,
      //         'maxzoom': 18,
      //         'paint': { 'raster-opacity': 0.5 }        });
      });
      //
      // console.log(map.getCanvas().getContext('webgl'));
}

export default { init, resize };
