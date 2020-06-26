


function init(container,code){
  let inputWrapper = container.append("div").attr("class","embed-input-wrapper");
  inputWrapper.append("p").text("Copy this iframe text into your code")
  inputWrapper.append("textarea").text('<iframe src="'+code+'" height="600" width="100%" style="padding-bottom:30%, max-width:600px;"></iframe>')
}

export default { init }
