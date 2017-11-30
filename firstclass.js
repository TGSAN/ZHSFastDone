//BY TGSAN
function sleep(numberMillis) { 
var now = new Date(); 
var exitTime = now.getTime() + numberMillis; 
while (true) { 
now = new Date(); 
if (now.getTime() > exitTime) 
return; 
} 
}
var i=1;
while(i<100){
console.log(i);
var param = {"courseId": liveCourseId, "userId": userId, "relativeTime": i, 
"watchType":"2", "jsonpCallBack":"jsonpCallBack","videoId":curVideoId,"sourceType":1};
ajaxjsonp(appUrl  + "/live/setWatchHistory", param, param.jsonpCallBack, function(data){
setCountByTime(relativeTime);
changeProcess(curVideoId);
if(loginUserInfo!=null && loginUserInfo["signState"] && loginUserInfo["signState"] == -2 && !loginUserInfo["signComplete"])
updateSignState((data["historySum"])*60);
}, function(){
});
i=i+1;
}
//BY TGSAN