var pathUtils = require('../lib/utils/path.js'),
	path = require('path');

function ComponentBase(options){
	this.dsf = options.dsf;
	this.path = options.path;
	this.absPath = pathUtils.absolute(this.path);
}

ComponentBase.prototype.getGlobPath = function(type) {
	return path.join(this.absPath, this.dsf.getOptions().glob[type]);
};


module.exports = ComponentBase;
