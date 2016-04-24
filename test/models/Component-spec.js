/*jshint -W030 */

var expect = require('chai').expect,
	path = require('path');

var Component = require('../../models/Component.js');

module.exports = function(dsf){


	describe('Component', function () {

		before(function () {
			this.subject = new Component({
				dsf: dsf,
				path: 'test/test-components/Base',
				id: 'Base'
			});

		});

		it('should exist', function () {
			expect(this.subject).to.exist;
		});

		it('should inherit config', function () {
			expect(this.subject.config).to.deep.equal(dsf.getConfig());
		});

		describe('#addLocalConfig', function () {
			it('should merge local config', function (done) {
				var subject = this.subject;
				this.subject.addLocalConfig(function(){
					// check inherited
					expect(subject.config['components-path']).to.equal('test/test-components');
					// check local
					expect(subject.config['user-foo']).to.equal('bar');
					done();
				});
			});
		});

		describe('#cacheHtml', function () {
			it('should cache HTML', function (done) {
				var subject = this.subject;
				subject.resourcePaths = {
					html: path.join(subject.absPath,'Base.html')
				};
				this.subject.cacheHtml(function(){
					expect(subject.cache.html.trim()).to.equal('<p>This is the HTML content of Base</p>');
					done();
				});
			});
		});

		describe('#cacheCss', function () {
			it('should cache CSS', function (done) {
				var subject = this.subject;
				subject.resourcePaths = {
					css: [path.join(subject.absPath,'Base.css')]
				};
				this.subject.cacheCss(function(){
					expect(subject.cache.css.trim()).to.equal('body{padding:0;margin:0}');
					done();
				});
			});
		});

		describe('#resolveDependencies', function () {
			before(function (done) {
				var subject = this.subject;
				subject.cache = {
					html: '\n<p>foo</p>\n{{> The/Dependency}}'
				};

				// shortcut dsf.whenLoaded
				var whenLoaded = dsf.whenLoaded;
				dsf.whenLoaded = function fakeWhenLoaded(components, callback){callback();};

				subject.resolveDependencies(function(){

					// remove dsf.whenLoaded shortcut
					dsf.whenLoaded = whenLoaded;
					done();

				});
			});
			it('should find dependencies in HTML', function () {
				expect(this.subject.dependencies.length).to.equal(1);
				expect(this.subject.dependencies[0]).to.equal('The/Dependency');
			});

			it('should cache dependency', function(){
				expect(this.subject.cache.cssDependencies.trim()).to.equal('/* dependency: The/Dependency */\n\n.the-dependency{}');
			});

		});

		describe('#preprocessCss', function () {
			describe('given no preprocessor', function () {
				it('should not modify css', function (done) {
					var inCss = '.the-css{}';
					this.subject.preprocessCss(inCss, function(err, outCss){
						expect(err).to.be.falsy;
						expect(outCss).to.equal(inCss);
						done();
					});
				});
			});
			describe('given a preprocessor', function () {
				it('should modify css', function (done) {

					// shortcut dsf.getPreprocessor
					var getPreprocessor = dsf.getPreprocessor;
					dsf.getPreprocessor = function(){
						return {
							process: function(css, basePath, cb){
								cb(null, '/*preprocessed('+basePath+')*/' + css);
							}
						};
					};
					this.subject.config = {
						preprocessor:{
							css: 'harry potter'
						}
					};
					var inCss = '.the-css{}';
					this.subject.preprocessCss(inCss, function(err, outCss){
						expect(err).to.be.falsy;
						expect(outCss).to.equal('/*preprocessed(test/test-components/Base)*/' + inCss);

						// remove shortcut
						dsf.getPreprocessor = getPreprocessor;

						done();
					});
				});
			});
		});


	});

};
