function init(data){

  let geojson = {"type": "FeatureCollection", "features": [] };

  data = data.map(function(row){
    return {
      "type":"Feature",
      "properties":{count:+row["FS 2020 100 Year Risk (total)"]},
      "geometry":{
        "type":"Point",
        "coordinates":[row.Longitude,row.Latitude]
      }
    }
  })

  geojson.features = data;

  return geojson;
}

export default { init };
