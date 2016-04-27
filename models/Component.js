var ComponentBase = require('./ComponentBase.js'),
    _ = require('lodash'),
    pathUtils = require('../lib/utils/path.js'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    fs = require('fs'),
    async = require('async'),
    glob = require('glob'),
    gfile = require('gulp-file'),
    gulp = require('gulp'),
    through2 =  require('through2');


//var partialsRegex = /\{\{> ?([a-zA-Z\/\-_]+)/gm;

/**
 * A directory containing HTML,CSS,JS
 * @param {object} options
 *        * id {string} unique identifier
 */
function Component(options){
    ComponentBase.call(this, options);

    this.id = options.id;
    this.resourcePaths = {};
    this.cache = {};
    this.partialRegistered = false;
    this.missingPartial = false;
    this.baseDependencies = [];



}
Component.prototype = Object.create(ComponentBase.prototype);


Component.prototype.build = function(callback) {
    var self = this;
    async.series([
        // override config with the component's own config.json
        this.addLocalConfig.bind(this),

        this.cacheHtml.bind(this),
        this.cacheCss.bind(this),

        // dependencies
        this.resolveDependencies.bind(this),

        // register handlebars partial
        this.registerPartial.bind(this),

        function(cb){
            self.loaded = true;
            cb();
        }

    ], callback);

};

Component.prototype.rebuild = function(callback) {
    this.build(callback);
};

Component.prototype.addLocalConfig = function(callback) {

    var self = this;
    this.getResourcePaths('config', function(err, paths){
        if(paths.length===1){
                self.dsf.util.file.readJSON(paths[0], function(err, localConfig){
                if(err){
                    console.log('WARNING: '+err);
                    callback();// fail silently
                    return;
                }
                _.merge(self.config, localConfig);
                callback();
            });
        }else{
            // no local config
            callback();
        }

    });


};

Component.prototype.resolveDependencies = function(callback) {
    var dependencies = [],
        m,
        re = /\{\{> ?([a-zA-Z\/\-_]+)/gm;

    while ((m = re.exec(this.cache.html)) !== null) {
        if (m.index === re.lastIndex) {
            re.lastIndex++;
        }

        if(dependencies.indexOf(m[1]) === -1){
            dependencies.push(m[1]);
        }
    }

    if(this.isBaseCss){
        this.dependencies = dependencies;
    }else{
        this.dependencies = this.baseDependencies.concat(dependencies);
    }


    if(this.dependencies.length > 0){
        this.dsf.whenLoaded(this.dependencies, this.cacheDependencies.bind(this, callback));
    }else{
        callback();
    }

};

Component.prototype.cacheDependencies = function(callback) {
    var dependecyCss = '';
    this.dependencies.forEach(function(dependencyId){
        var dependency = this.dsf.getComponent(dependencyId);
        if(dependency.isBaseCss){
            return;
        }
        dependecyCss+='\n\n/* dependency: '+dependencyId+' */\n' + dependency.getCss(true) + '\n';


    }, this);
    this.cache.cssDependencies = dependecyCss;
    //this.buildStandaloneCss();
    callback();
};

Component.prototype.registerPartial = function(callback) {
    this.dsf.getHandlebars().registerPartial(this.id, this.cache.html || '');
    callback();
};



/**
 * Returns all existing files for the given resource type
 * @param  {string}   type     the type of resource (html, css, js, config)
 * @param  {Function} callback
 * @return {void}
 */
Component.prototype.getResourcePaths = function(type, callback) {
    glob(this.getGlobPath(type), function(err, files){
        if(err) throw err;
        callback(null, files);
    });
};



Component.prototype.cacheCss = function(cacheCssCallback) {
    var self = this;

    this.getResourcePaths('css',function(err, files){
        if(files.length>0){
            async.map(files, fs.readFile, function(err, files){
                if(err) throw err;

                async.reduce(files, '', function(memo, item, callback){
                    callback(null, memo + '\n' + item.toString());
                }, function(err, css){
                    if(err) throw err;
                    self.cache.css = css;
                    cacheCssCallback();
                });
            });
        }else{
            cacheCssCallback();
        }
    });



};


Component.prototype.cacheHtml = function(callback) {

    var self = this;

    this.getResourcePaths('html',function(err, files){
        if(files.length>0){
            //@TODO gulp is probably not needed here
            var stream = gulp.src(self.getGlobPath('html'));
            stream.pipe(through2.obj(function(file, enc, cb){

                var html = file.contents.toString();
                self.cache.html = html;
                self.cache.tpl = self.dsf.getHandlebars().compile(html);
                callback();

            }));
        }else{
            callback();
        }
    });

};


// without base css
Component.prototype.getCss = function(withDependencies) {
    // dependencies CSS after component CSS so user can't override dependencies
    return this.cache.css + ((withDependencies && this.cache.cssDependencies) ? this.cache.cssDependencies : '');
};

///@TODO make renderHtml async to pass string through .process()
Component.prototype.renderHtml = function(context) {
    if(this.cache.tpl){
        return this.cache.tpl(context || (this.cache.config ? this.cache.config : {}));
    }
    return '';
};

Component.prototype.renderCss = function(callback) {
    var self = this,
        css = this.getCss(true);

    if(!this.isBaseCss){
        this.dsf.getBaseCss(function(baseCss){
            self.process('css', baseCss + css, callback);
        });
    }else{
        self.process('css', css, callback);
    }

};



Component.prototype.process = function(type, str, callback) {
    var self = this;
    if(this.config.process && this.config.process[type]){
        var plugins = this.config.process[type];
        console.log('file', this.id + '.' + type);
        var stream = gfile(this.id + '.' + type, str, {src:true});

        plugins.forEach(function(module){
            //@TODO pass config to plugins
            stream.pipe(require(module)());
        });

        stream.pipe(gulp.dest(this.getDestPath(type)));

        stream.pipe(through2.obj(function(file){
            callback(null, file.contents.toString());
        }));



       /* stream.on('end', function(){
            console.log('red', self.getDestPath(type)+self.id + '.' + type);
            var strOut = fs.readFileSync(self.getDestPath(type)+self.id + '.' + type);
            callback(null, strOut);
        });*/

    }else{
        callback(null, str);
    }
};

Component.prototype.getDestPath = function(type) {
    return path.join(__dirname, '../public/_built/');
};



module.exports = Component;
