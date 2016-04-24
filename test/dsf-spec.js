/*jshint -W030 */

var expect = require('chai').expect,
	_ = require('lodash');

// load config on file to compare later
var DEFAULT_OPTIONS = require('../options.json');
var USER_OPTIONS = require('./test-options.json');

describe('dsf object', function () {
	before(function () {
		this.subject = require('..');
		this.subject.init('test/test-options.json');
		this.subject.start();
	});

	it('should exist', function () {
		expect(this.subject).to.exist;
	});

	describe('#start', function () {
		it('should exist', function () {
			expect(this.subject.start).to.be.a('function');
		});
	});

	describe('#getOptions', function () {
		it('should return config', function () {
			var mergedOptions = _.merge({}, DEFAULT_OPTIONS, USER_OPTIONS);
			expect(this.subject.getOptions()).to.deep.equal(mergedOptions);
		});
	});

	describe('#getBaseCss', function () {
		it('should return the base CSS', function (done) {
			this.subject.getBaseCss(function(css){
				expect(css.trim()).to.equal('body{padding:0;margin:0}');
				done();
			});

		});
	});

});