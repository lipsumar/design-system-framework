var fs = require('fs'),
    util = require('./utils'),
    async = require('async');


function ConfigStatus(config){
    this.config = config;
    this.reasons = [];
    this.canStart = true;
}
ConfigStatus.prototype.reason = function(str, configEntry) {
    this.canStart = false;

    if(configEntry){
        str = 'config.'+configEntry+' ('+this.config[configEntry]+'): ' + str;
    }

    this.reasons.push(str);
};
ConfigStatus.prototype.toString = function() {
    if(!this.canStart){
        return this.reasons.map(function(r){
            return '* ' + r;
        }).join('\n');
    }else{
        return this.toJSON();
    }
};




function checkComponentsPath(config, callback){
    var self = this;
    if(!config['components-path']){
        this.reason('config.components-path is not set');
    }else{
        // components path is set, does it exist ?
        try{
            fs.stat(util.path.absolute(config['components-path']), function(err, stats){
                if(err){
                    self.reason('path does not exist', 'components-path');
                    callback();
                    return;
                }
                if(!stats.isDirectory()){
                    self.reason('path must be a directory', 'components-path');
                }
                callback();

            });
        }catch(err){
            this.reason('path does not exist', 'components-path');
        }


    }
}

function checkGlob(config, callback){
    if(!config.glob){
        this.reason('glob is not set', 'glob');
    }

    if(config.glob && !config.glob.html){
        this.reason('glob.html is not set');
    }
    if(config.glob && !config.glob.css){
        this.reason('glob.css is not set');
    }
    callback();
}



module.exports = function(config, callback){
    var status = new ConfigStatus(config);

    async.series([
        checkComponentsPath.bind(status, config),
        checkGlob.bind(status, config)
    ], function(err){
        callback(err, status);
    });

};
