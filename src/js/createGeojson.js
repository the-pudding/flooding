const commaFormat = d3.format(",");

function init(data,cut){

  let geojson = {"type": "FeatureCollection", "features": [] };

  if(cut == "cluster"){
    data = data.map(function(row){
      return {
        "type":"Feature",
        "properties":{id:"Zipcode: "+row["locationName"],count:+row["FS 2020 100 Year Risk (total)"], countFormatted: commaFormat(+row["FS 2020 100 Year Risk (total)"])},
        "geometry":{
          "type":"Point",
          "coordinates":[row.Longitude,row.Latitude]
        }
      }
    })

    geojson.features = data;

    return geojson;
  }

  else if(cut == "search"){
    data = data.map(function(row){
      return {
        "type":"Feature",
        "properties":{type:"manual",title:row["locationName"],state:row["state_iso2"]},
        "place_type":["search"],
        "geometry":{
          "type":"Point",
          "coordinates":[row.Longitude,row.Latitude]
        }
      }
    })

    geojson.features = data;

    return geojson;
  }

}

export default { init };
