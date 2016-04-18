var path = require('path'),
	fs = require('fs');


function absolutePath(relPath){
	return path.join(__dirname, '../../../../', relPath);
}

function isDirectory(path){
	var stats = fs.statSync(path);
	return stats.isDirectory();
}



module.exports = {
	absolutePath: absolutePath,
	absolute: absolutePath,
	isDirectory: isDirectory
};