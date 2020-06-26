const commaFormat = d3.format(",");

function init(data){
  let total = d3.sum(data["stateData"],function(d){
    return d["FS 2020 100 Year Risk (total)"];
  })

  d3.select(".at-risk-properties").text(commaFormat(total));
}

export default { init };
