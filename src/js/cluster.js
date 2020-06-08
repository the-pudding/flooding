function init(data){

  let geojson = {"type": "FeatureCollection", "features": [] };

  data = data.map(function(row){
    return {
      "type":"Feature",
      "properties":{"fsid":row.fsid,count:+row.count},
      "geometry":{
        "type":"Point",
        "coordinates":[row.longitude,row.latitude]
      }
    }
  })

  geojson.features = data;

  return geojson;
}

export default { init };
