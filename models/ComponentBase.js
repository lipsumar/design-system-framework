var pathUtils = require('../lib/utils/path.js'),
    path = require('path'),
    _ = require('lodash');

/**
 * Base for component objects
 * @param {object} options
 *        * dsf  {DSF object}
 *        * path {string}     relative path (from process.cwd) to component directory
 */
function ComponentBase(options){
    this.options = options || {};
    this.dsf = options.dsf;
    this.path = options.path;
    this.absPath = pathUtils.absolute(this.path);
    this.config = _.merge({}, this.dsf.getConfig(), options.config);
}


ComponentBase.prototype.getGlobPath = function(type) {
    if(!this.config.glob[type]){
        //@TODO find a way to do this in a single call
        this.dsf.log.error('ComponentBase.getGlobPath: config.glob.'+type+' is not defined');
        throw new Error('ComponentBase.getGlobPath: config.glob.'+type+' is not defined');
    }
    return path.join(this.absPath, this.config.glob[type]);
};


module.exports = ComponentBase;
