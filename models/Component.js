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
    through2 =  require('through2'),
    runSequence = require('run-sequence'),
    chalk = require('chalk');


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
    this.dependencyOf = []; // array of componentIds depending on this
    this.cachedResourcePath = {};
    this.variations = {
        html: {},
        css: {}
    };

}
Component.prototype = Object.create(ComponentBase.prototype);


Component.prototype.build = function(callback) {
    var self = this;
    async.series([
        // override config with the component's own config.json
        this.addLocalConfig.bind(this),

        this.cacheResourcePathes.bind(this),
        this.cacheHtml.bind(this),
        this.cacheCss.bind(this),

        // dependencies
        this.resolveDependencies.bind(this),

        function(cb){
            self.loaded = true;
            cb();
        }

    ], callback);

};

Component.prototype.rebuild = function(callback) {
    var self = this;
    this.log('rebuilding... '+this.id);

    this.build(function(){
        if(self.dependencyOf.length > 0){
            var next = function(i){
                if(!self.dependencyOf[i]){
                    callback();
                    return;
                }
                var dependentComponent = self.dsf.getComponent(self.dependencyOf[i]);
                self.log('-> rebuild '+dependentComponent.id+' because it depends on '+self.id);
                dependentComponent.rebuild(next.bind(null, i+1));
            };
            next(0);
        }else{
            callback();
        }
    });
};

Component.prototype.addLocalConfig = function(callback) {

    var self = this;
    this.getResourcePaths('config', function(err, paths){
        if(paths.length===1){
                self.dsf.util.file.readJSON(paths[0], function(err, localConfig){
                if(err){
                    self.warning('WARNING: '+err);
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
    var self = this,
        dependencies = this.config.dependencies || [],
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
        this.dsf.whenLoaded(this.dependencies, function(){

            // mark dependencies as being a dependency of this
            self.dependencies.forEach(function(dependencyId){
                var dependency = self.dsf.getComponent(dependencyId);
                dependency.addDependencyOf(self.id);
            });

            // and cache dependencies
            self.cacheDependencies(callback);
        });
    }else{
        callback();
    }

};

Component.prototype.addDependencyOf = function(dependentComponentId) {
    if(this.dependencyOf.indexOf(dependentComponentId) === -1){
        this.dependencyOf.push(dependentComponentId);
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


Component.prototype.registerVariation = function(type, name, file) {
    if(!this.variations[type]){
        this.variations[type] = {};
    }
    this.variations[type][name] = file;
};

Component.prototype.hasVariations = function(type) {
    return _.size(this.variations[type]) > 0;
};


/**
 * Returns all existing files for the given resource type
 * @param  {string}   type     the type of resource (html, css, js, config)
 * @param  {Function} callback
 * @return {void}
 */
Component.prototype.getResourcePaths = function(type, callback) {
    var self = this;
    glob(this.getGlobPath(type), function(err, files){
        if(err) throw err;
        self.cachedResourcePath[type] = files;
        callback(null, files);
    });
};


Component.prototype.getResourceHandler = function(type) {
    var handler = this.dsf.getResourceHandler(type);
    if(handler){
        handler = handler.bind(null, this);
    }
    return handler;
};

Component.prototype.cacheResourcePathes = function(callback) {
    var types = this.dsf.getResourceTypes();
    async.map(types, this.getResourcePaths.bind(this), callback);
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

            if(files.length>0){

                if(self.hasVariations('html')){



                    self.cache.html = {};
                    self.cache.tpl = {};
                    async.mapSeries(Object.keys(self.variations.html), function(name, cb){
                        fs.readFile(self.variations.html[name], function(err, html){
                            html = html.toString();
                            self.cache.html[name] = html;
                            self.cache.tpl[name] = self.dsf.getHandlebars().compile(html);
                            self.dsf.getHandlebars().registerPartial(self.id + '/' + name, html);

                            // override previous "index"
                            if(name === 'index'){
                                self.dsf.getHandlebars().registerPartial(self.id, html);
                            }

                            cb();
                        });

                    }, callback);


                }else{
                    // concat all
                    async.map(files, fs.readFile, function(err, files){
                        if(err) throw err;

                        async.reduce(files, '', function(memo, item, cb){
                            cb(null, memo + '\n' + item.toString());
                        }, function(err, html){
                            if(err) throw err;
                            self.cache.html = html;
                            self.cache.tpl = self.dsf.getHandlebars().compile(html);
                            self.dsf.getHandlebars().registerPartial(self.id , html);
                            callback();
                        });
                    });
                }

            }else{
                callback();
            }

        }else{
            callback();
        }
    });

};


// without base css
Component.prototype.getCss = function(withDependencies) {
    // dependencies CSS after component CSS so user can't override dependencies
    return (this.cache.css || '') + ((withDependencies && this.cache.cssDependencies) ? this.cache.cssDependencies : '');
};


Component.prototype.renderHtml = function(context, variation, callback) {

    if(typeof variation === 'function'){
        callback = variation;
        variation = null;
    }

    if(!callback){
        this.error('renderHtml called without callback');
        return;
    }

    if(this.cache.tpl){
        context = context || {};
        if(this.config.vars){
            context = _.merge({}, this.config.vars, context);
        }

        var tpl = this.cache.tpl;
        if(typeof tpl === 'object'){
            tpl = this.cache.tpl.index;
            if(this.cache.tpl[variation]){
                tpl = this.cache.tpl[variation];
            }else{
                this.error('variation '+variation+' does not exist');
            }

        }
        var html = tpl(context);
        this.process('html', html, callback);
    }else{
        callback(null, '');
    }
};

Component.prototype.renderCss = function(callback) {
    var self = this,
        css = this.getCss(true);

    if(arguments.length < 1){
        this.error('renderCss called with not enough arguments');
        return;
    }

    if(!this.isBaseCss){
        this.dsf.getBaseCss(function(baseCss){
            self.process('css', baseCss + css, callback);
        });
    }else{
        self.process('css', css, callback);
    }

};

Component.prototype.renderResource = function(type, callback) {
    var handler = this.getResourceHandler(type);
    handler(callback);
};




Component.prototype.process = function(type, str, callback) {
    var self = this;
    if(this.config.process && this.config.process[type] && typeof str === 'string' && str.trim()!==''){
        var plugins = this.config.process[type];

        var next = function(i){
            if(plugins[i]){
                gulpTask(self.id + '_' + plugins[i], str, require(plugins[i]), self.getDestPath(), function(err, out){
                    str = out;
                    next(i+1);
                });

            }else if(callback){
                callback(null, str);
            }

        };
        next(0);

    }else if(callback){
        callback(null, str);
    }
};

function gulpTask(taskName, str, module, dest, callback){
    gulp.task(taskName, function(){
        return gfile(taskName, str, {src:true})
            .pipe(module())
            .pipe(gulp.dest(dest))
            .pipe(through2.obj(function(file,enc,cb){
                callback(null, file.contents.toString());
                cb();
            }));
    });

    //gulp.start([this.id + '.' + type]);
    runSequence([taskName]);
}

Component.prototype.getDestPath = function() {
    return path.join(__dirname, '../public/_built/'+this.id+'/');
};

Component.prototype.getDocument = function() {
    if(!this.config.document){
        return false;
    }
    return this.dsf.getHandlebars().compile(fs.readFileSync(path.join(this.absPath, this.config.document)).toString());
};

Component.prototype.toJson = function() {
    var json = {
        id: this.id,
        resource: _.clone(this.cachedResourcePath)
    };
    return json;
};


function logId(){
    return chalk.bgBlue(' '+this.id+' ');
}
Component.prototype.log = function(msg) {
    msg = logId.call(this) + ' ' + msg;
    this.dsf.log(msg);
};

Component.prototype.warning = function(msg) {
    msg = logId.call(this) + ' ' + chalk.yellow(msg);
    this.dsf.log(msg, true);
};

Component.prototype.error = function(msg) {
    msg = logId.call(this) + ' ' + chalk.red(msg);
    this.dsf.log(msg, true);
};

module.exports = Component;
