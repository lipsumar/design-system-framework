var path = require('path'),
	fs = require('fs');

var CONFIG = require('../../options.json');

function absolutePath(relPath){
	return path.join(__dirname, '../../../', relPath);
}

function isDirectory(path){
	var stats = fs.statSync(path);
	return stats.isDirectory();
}
function removeAbsPath(absPath){
	var componentsPathAbs = absolutePath(CONFIG['components-path']);
	return absPath.replace(componentsPathAbs + '/', '');
}


module.exports = {
	absolutePath: absolutePath,
	absolute: absolutePath,
	isDirectory: isDirectory,
	removeAbsPath: removeAbsPath
};