

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

function init(data) {

  console.log(data);

    mapboxgl.accessToken = 'pk.eyJ1IjoiZG9jazQyNDIiLCJhIjoiY2pjazE5eTM2NDl2aDJ3cDUyeDlsb292NiJ9.Jr__XbmAolbLyzPDj7-8kQ';

        var map = new mapboxgl.Map({
          container: 'city-cluster',
          style: 'mapbox://styles/mapbox/light-v10',
          // style: 'mapbox://styles/nytgraphics/cjmsjh9u308ze2rpk2vh41efx?optimize=true',
          center: [-84.191605, 39.758949],
          minZoom: 4,
          clusterMaxZoom: 10, // Max zoom to cluster points on
          zoom: 9
      });


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
          'minzoom':7

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
          'data': data,
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

        console.log(data);

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





        map.on('mousemove', function(e){

          const features = map.queryRenderedFeatures(e.point, { layers: ["unclustered-point"] });
          if(features.length > 0){
            console.log(features[0]);
          }
        });

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
