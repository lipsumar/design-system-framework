var ComponentBase = require('./ComponentBase.js'),
    glob = require('glob'),
    path = require('path'),
    async = require('async');

function ComponentCandidate(options){
    ComponentBase.call(this, options);
    this.onFailCallback = options.onFailCallback;
}
ComponentCandidate.prototype = Object.create(ComponentBase.prototype);

ComponentCandidate.prototype.resolve = function(callback) {
    var self = this;

    async.map(['css','html'], this.hasResource.bind(this), function(err, results){
        if(results[0] || results[1]){
            self.isComponent = true;
        }else{
            self.isComponent = false;
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



module.exports = ComponentCandidate;
