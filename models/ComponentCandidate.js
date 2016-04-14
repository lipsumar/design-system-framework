var pathUtils = require('../lib/utils/path.js'),
	glob = require('glob'),
	path = require('path'),
	async = require('async');

var CONFIG = require('../options.json');

function ComponentCandidate(path){
	this.path = path;
	this.absPath = pathUtils.absolute(path);
}

ComponentCandidate.prototype.resolve = function(callback) {
	var self = this;

	async.map(['css','html'], this.hasResource.bind(this), function(err, results){
		if(results[0] || results[1]){
			self.isComponent = true;
		}
		callback(self);
	});

};

ComponentCandidate.prototype.hasResource = function(type, callback) {
	glob(this.getGlobPath(type), function(err, files){
		if(err) throw err;
		callback(null, files.length > 0);
	});
};

ComponentCandidate.prototype.getGlobPath = function(type) {
	return path.join(this.absPath, CONFIG.glob[type]);
};

module.exports = ComponentCandidate;
