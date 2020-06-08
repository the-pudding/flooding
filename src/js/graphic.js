

// import mapboxgl from 'mapbox-gl';
/* global d3 */
import locate from './utils/locate';

function resize() {}

function init(data) {
    mapboxgl.accessToken = 'pk.eyJ1IjoiZG9jazQyNDIiLCJhIjoiY2pjazE5eTM2NDl2aDJ3cDUyeDlsb292NiJ9.Jr__XbmAolbLyzPDj7-8kQ';

        var map = new mapboxgl.Map({
          container: 'mapbox-map',
          style: 'mapbox://styles/mapbox/light-v10',
          // style: 'mapbox://styles/nytgraphics/cjmsjh9u308ze2rpk2vh41efx?optimize=true',
          center: [-84.191605, 39.758949],
          minZoom: 1,
          clusterMaxZoom: 14, // Max zoom to cluster points on
          zoom: 6
      });


      map.on('load', function() {


        map.addSource('points', {
          'type': 'geojson',
          'data': data,
          'cluster':true,
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
          'circle-color': '#11b4da',
          'circle-radius': 4,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff'
          }
        });

        map.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'points',
          filter: ['has', 'point_count'],
          paint: {
          // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
          // with three steps to implement three types of circles:
          //   * Blue, 20px circles when point count is less than 100
          //   * Yellow, 30px circles when point count is between 100 and 750
          //   * Pink, 40px circles when point count is greater than or equal to 750
            'circle-color': [
              'step',
              ['get', 'pointTotal'],
              '#51bbd6',
              1000,
              '#f1f075',
              10000,
              '#f28cb1'
            ],
            'circle-radius': [
              'step',
              ['get', 'pointTotal'],
              5,
              500,
              10,
              1000,
              20,
              5000,
              30,
              10000,
              50

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
            'text-field': ["get", "pointTotal"],
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-size': 10
          }
        });

          map.on('click', 'clusters', function(e) {
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

          });



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
