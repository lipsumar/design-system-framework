var ComponentBase = require('./ComponentBase.js'),
	_ = require('lodash'),
	pathUtils = require('../lib/utils/path.js'),
	path = require('path'),
	mkdirp = require('mkdirp'),
	fs = require('fs'),
	async = require('async'),
	glob = require('glob');


//var partialsRegex = /\{\{> ?([a-zA-Z\/\-_]+)/gm;


function Component(options){
	ComponentBase.call(this, options);

	this.id = options.id;
	this.buildPath = path.join(__dirname, '../public/_built/' + this.id);///@TODO find something more elegant than path.join(__dirname, ) to reference preoject files
	this.standaloneCssPath = path.join(this.buildPath + '/standalone.css');
	this.standaloneCssPublicPath = '/_built/' + this.id + '/standalone.css';
	this.resourcePaths = {};
	this.cache = {};
	this.partialRegistered = false;
	this.missingPartial = false;
	this.baseDependencies = [];



}
Component.prototype = Object.create(ComponentBase.prototype);


Component.prototype.build = function(callback) {
	async.series([
		// override config with the component's own config.json
		this.addLocalConfig.bind(this),

		this.cacheResourcePathes.bind(this),
		this.cacheResources.bind(this),

		mkdirp.bind(null, this.buildPath),

		// dependencies
		this.resolveDependencies.bind(this),

		// build static stuff

		this.buildStandaloneCss.bind(this),


		// register handlebars partial
		this.registerPartial.bind(this),

	], callback);

};

Component.prototype.rebuild = function(callback) {
	this.build(callback);
};

Component.prototype.addLocalConfig = function(callback) {

	var self = this;
	this.getResourcePaths('config', function(err, paths){
		if(paths.length===1){
			var localConfig = require(paths[0]);
			_.merge(self.config, localConfig);
		}
		callback();
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
		this.dsf.whenLoaded(this.dependencies, this.addDependencies.bind(this, callback));
	}else{
		callback();
	}

};

Component.prototype.addDependencies = function(callback) {
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

Component.prototype.cacheResourcePathes = function(callback) {
	var self = this;
	async.map(['css','html'], this.getResourcePaths.bind(this), function(err, paths){
		self.resourcePaths.css = paths[0];
		self.resourcePaths.html = paths[1][0];// there can be only one template

		callback();
	});
};
Component.prototype.getResourcePaths = function(type, callback) {
	glob(this.getGlobPath(type), function(err, files){
		if(err) throw err;
		callback(null, files);
	});
};

Component.prototype.cacheResources = function(callback) {
	async.parallel([
		this.cacheCss.bind(this),
		this.cacheHtml.bind(this)
	], callback);

};

Component.prototype.cacheCss = function(cacheCssCallback) {
	var self = this;

	async.map(this.resourcePaths.css, fs.readFile, function(err, files){
		if(err) throw err;

		async.reduce(files, '', function(memo, item, callback){
			callback(null, memo + '\n' + item.toString());
		}, function(err, css){
			if(err) throw err;
			self.cache.css = css;
			cacheCssCallback();
		});
	});

};


Component.prototype.cacheHtml = function(callback) {
	var self = this;

	if(this.resourcePaths.html){
		fs.readFile(this.resourcePaths.html, function(err, file){
			var html = file.toString();
			self.cache.html = html;
			self.cache.tpl = self.dsf.getHandlebars().compile(html);
			callback();
		});
	}else{
		self.cache.html = '';
		callback();
	}

};


Component.prototype.buildStandaloneCss = function(callback) {
	var self = this,
		baseCss = this.isBaseCss ? '' : this.dsf.getBaseCss(),
		componentCss = this.getCss(),
		dependecyCss = this.cache.cssDependencies || '';
		css = baseCss + componentCss + dependecyCss; // dependencies after component so user can't override dependencies

	this.preprocessCss(css, function(err, css){
		if(err) throw err;
		fs.writeFile(self.standaloneCssPath, css, callback);
	});


};

Component.prototype.preprocessCss = function(css, callback) {
	var self = this;
	if(this.config.preprocessor && this.config.preprocessor.css){
		var preprocessor = this.dsf.getPreprocessor(this.config.preprocessor.css);
		preprocessor.process(css, this.path, function(err, out){
			if(err){
				console.log('['+self.id+'] PREPROCESSOR ERROR:\n  '+err);
			}
			callback(null, out);
		});
	}else{
		callback(null, css);
	}
};

Component.prototype.getCss = function(withDependencies) {
	return this.cache.css + ((withDependencies && this.cache.cssDependencies) ? this.cache.cssDependencies : '');
};

Component.prototype.render = function(context) {
	if(this.cache.tpl){
		return this.cache.tpl(context || (this.cache.config ? this.cache.config : {}));
	}
	return '';
};






module.exports = Component;
