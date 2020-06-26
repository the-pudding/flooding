


function init(container,code){
  let inputWrapper = container.append("div").attr("class","embed-input-wrapper");
  inputWrapper.append("p").text("Copy this iframe text into your code")
  inputWrapper.append("textarea").text('<iframe src="'+code+'" width="100%" height="600" style="max-width:600px;"></iframe>')
}

export default { init }
