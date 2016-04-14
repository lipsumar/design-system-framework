
function logTime(func){
	return function(){
		var start = (new Date()).getTime();
		var returned = func();
		var end = (new Date()).getTime();
		console.log(func.name+' executed in '+Math.round(end-start)+'ms.');
		return returned;
	};
}

module.exports = {
	noop: function(){},
	logTime: logTime
};