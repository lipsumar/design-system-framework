///@TODO move dsf to models ?
var fs = require('fs'),
    path = require('path'),
    _ = require('lodash'),
    glob = require('glob'),
    async = require('async'),
    Handlebars = require('handlebars'),
    watch = require('watch'),
    util = require('./utils'),
    configValidator = require('./config-validator'),

    ComponentCandidate = require('../models/ComponentCandidate.js'),
    Component = require('../models/Component.js'),
    PreviewDocument = require('../models/PreviewDocument.js');


var CONFIG; // loaded at dsf.init
var defaultConfig = require('../config.json');

// state is mutable, CONFIG is not
var state = {
    initialized: false,
    componentsFetched: false,
    candidatesAdded: 0,
    candidatesResolved: 0,
    finishedResolveCandidates: function(){
        return this.candidatesAdded > 0 && this.candidatesAdded === this.candidatesResolved;
    }
};
var components = [],
    componentsById = {},
    inspectorPluginsById = {},
    cliPluginsById = {},
    pluginsPathById = {},
    resourceHandlersByType = {},
    waitingForComponentLoad = [],
    onRebuildCallback;





function fetchComponents(fromDir, componentIdPrefix, config){
    if(!util.path.isDirectory(fromDir)){
        return;
    }
    var componentsDirs =  fs.readdirSync(fromDir);
    componentsDirs.forEach(function(dirName){

        var componentName = dirName;
        var componentDir = path.join(fromDir, componentName);

        addComponentPathCandidate(componentDir, componentIdPrefix ? componentIdPrefix + '/' + componentName : null, config);
    });
}

/**
 * Add a condidate component path to be transformed into
 * a Component if it resolves
 * @param {string} path        relative path to component source
 * @param {string} componentId optional - componentId to use once resolved
 */
function addComponentPathCandidate(path, componentId, config){
    var candidate = new ComponentCandidate({
        dsf: API,
        path: path,
        id: componentId,
        config: config
    });
    state.candidatesAdded++;
    candidate.resolve(candidateResolved);
}

function candidateResolved(candidate){
    state.candidatesResolved++;

    if(candidate.isComponent){

        var componentId = removeAbsPath(candidate.absPath, candidate.config['components-path']);
        if(candidate.options.id){
            componentId = candidate.options.id;
        }

        var component = new Component({
            path: candidate.path,
            dsf: API,
            id: componentId,
            config: candidate.config
        });
        if(CONFIG.base && CONFIG.base.css){
            component.baseDependencies = CONFIG.base.css.slice(0);
            if(CONFIG.base.css.indexOf(component.id)>-1){
                component.isBaseCss = true;
            }
        }
        components.push(component);
        componentsById[component.id] = component;
        component.build(componentLoaded.bind(null, component));

    }else{
        //API.log('not a component: '+candidate.path);
        fetchComponents(candidate.path);
    }
}

function componentLoaded(component){
    API.log(component.id+' loaded');
    waitingForComponentLoad.forEach(function(waitingFor){
        if(waitingFor.components[component.id]){
            // wait is over
            waitingFor.components[component.id] = false;
            waitingFor.count--;
            if(waitingFor.count === 0){
                waitingFor.callback();
            }
        }
    });
}

function removeAbsPath(absPath, toRemove){
    var componentsPathAbs = util.path.absolutePath(toRemove || CONFIG['components-path']);
    if(componentsPathAbs[componentsPathAbs.length-1]!=='/'){
        componentsPathAbs+='/';
    }
    return absPath.replace(componentsPathAbs, '');
}

function getComponents(){
    if(!state.finishedResolveCandidates()){
        return 'still fetching components';
    }
    return components;
}

function idFromFilePath(path){
    // remove left part
    path = removeAbsPath(util.path.absolutePath(path));

    // search for a component matching the beginning of the path
    var matches = _.filter(components, function(component){
        if(path.substr(0, component.id.length) === component.id){
            return true;
        }
        return false;
    });
    if(matches.length !== 1){
        throw new Error('idFromFilePath: ' + path + '; could not find a component');
    }
    return matches[0].id;
}

function watchFiles(){
    watch.watchTree(CONFIG['components-path'], function (f, curr, prev) {
        if (typeof f == "object" && prev === null && curr === null) {
            // Finished walking the tree
            console.log('watch: ready');
        } else if (prev === null) {
            // f is a new file

        } else if (curr.nlink === 0) {
            // f was removed

        } else {
            // f was changed
            var componentId = idFromFilePath(f);
            var component = API.getComponent(componentId);
            component.rebuild(function(){
                if(onRebuildCallback){
                    onRebuildCallback(component);
                    API.log(componentId+' fully rebuilt');
                }
            });

        }
    });
}





// define API
var API = {
    util: util,
    log: util.log,
    dirname: path.join(__dirname, '..'),

    init: function(configFile, callback){
        if(arguments.length === 1){
            callback = configFile;
            configFile = null;
        }
        API.init = util.func.noop; // API.init can only be called once

        configFile = configFile || 'config.json';

        util.file.readJSON(util.path.absolute(configFile), function(err, userConfig){
            if(err){
                API.log.warning('Warning: no user config found\n' + err);
                userConfig = {};
            }
            CONFIG = _.merge({}, defaultConfig, userConfig);
            configValidator(CONFIG, function(err, configStatus){
                if(configStatus.canStart){
                    state.initialized = true;

                    if(CONFIG.plugins){
                        ///@TODO protect against plugins not calling callback()
                        async.series(CONFIG.plugins.map(function(pluginPath){
                            return require(util.path.absolute(pluginPath)).bind(null, API, function(id){
                                pluginsPathById[id] = pluginPath;
                            });///@TODO modify API for plugins (special log, register function, ...)
                        }), callback);

                    }else if(callback){
                        callback();
                    }

                }else{
                    API.log.error('Bad configuration: can’t start\n'+configStatus);
                }
            });

        });

    },

    start: function(){
        if(!state.initialized){
            throw new Error('dsf.start called before initialization complete');
        }
        API.start = util.func.noop; // API.start can only be called once

        // start fetching components from file system
        fetchComponents(CONFIG['components-path']);

        // add external components
        if(CONFIG['external-components']){
            _.each(CONFIG['external-components'], function(external, componentId){
                if(external['components-path']){
                    fetchComponents(external['components-path'], componentId, external);
                }else if(external['component-path']){
                    addComponentPathCandidate(external['component-path'], componentId, external);
                }

            });
        }

        // watch files
        watchFiles();


    },
    getConfig: function(){
        return CONFIG;
    },
    getComponents: getComponents,
    getComponent: function(componentId, callback){
        if(typeof callback === 'function'){
            // wait for the component to load
            API.whenLoaded([componentId], function(){
                callback(componentsById[componentId]);
            });
        }else{
            // return directly
            var component = componentsById[componentId];
            if(!component) throw new Error('DSF: component "'+componentId+'" not found (not ready yet?)');
            return component;
        }
    },
    getComponentIdFromPath: function(path){
        return idFromFilePath(path);
    },

    createPreviewDocument: function(){
        return new PreviewDocument();
    },
    getHandlebars: function(){
        return Handlebars;
    },

    whenLoaded: function(componentIds, callback){
        var missingCount = 0;
        var missing = _.reduce(componentIds, function(memo, componentId){
            if(typeof componentsById[componentId] === 'undefined' || !componentsById[componentId].loaded){
                memo[componentId] = true;
                missingCount++;
            }
            return memo;
        }, {});

        if(missingCount > 0){
            waitingForComponentLoad.push({
                callback: callback,
                components: missing,
                count: missingCount
            });

        }else{
            // all ready
            callback();
        }
    },

    onRebuild: function(callback){
        onRebuildCallback = callback;
    },

    getBaseCss: function(callback){
        var css = '',
            components;
        if(CONFIG.base && CONFIG.base.css){
            components = CONFIG.base.css;
            API.whenLoaded(components, function(){
                components.forEach(function(componentId){
                    var component = API.getComponent(componentId);
                    css += component.getCss();
                });
                callback(css);
            });

        }else{
            callback('');
        }
    },

    getPreprocessor: function(name){
        return require('./preprocessors/'+name+'.js');
    },

    registerInspectorPlugin: function(pluginId, options){
        if(!pluginsPathById[pluginId]){
            API.log.error('Plugin error: '+pluginId+' tried to call registerInspectorPlugin without registering plugin first.');
            return;
        }
        var plugin = _.clone(options);
        plugin.id = pluginId;

        // register plugin component
        if(plugin['component-path']){
            addComponentPathCandidate(path.join(pluginsPathById[pluginId], plugin['component-path']), '_plugin/'+pluginId, _.merge({}, defaultConfig, {doNotInheritConfig:true}, plugin));
        }
        inspectorPluginsById[pluginId] = plugin;
    },
    registerCliPlugin: function(pluginId, func){
        if(!pluginsPathById[pluginId]){
            API.log.error('Plugin error: '+pluginId+' tried to call registerCliPlugin without registering plugin first.');
            return;
        }
        cliPluginsById[pluginId] = {func: func};
        cliPluginsById[pluginId].id = pluginId;
    },
    getPlugins: function(){
        return {
            inspector: Object.keys(inspectorPluginsById).map(function(pluginId){
                return inspectorPluginsById[pluginId];
            }),
            cli: Object.keys(cliPluginsById).map(function(pluginId){
                return cliPluginsById[pluginId];
            })
        };
    },
    registerResourceType: function(type, handler){
        resourceHandlersByType[type] = handler;
    },
    getResourceHandler: function(type){
        return resourceHandlersByType[type];
    }
};

API.registerResourceType('js', function(component, callback){
    'use strict';
    component.getResourcePaths('js', function(err, files){
        if(files[0]){
            fs.readFile(files[0], function(err, file){
                callback(null, file.toString());
            });
        }else{
            callback(null, '');
        }
    });

});

// expose API
module.exports = API;
