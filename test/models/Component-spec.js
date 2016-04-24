/*jshint -W030 */

var expect = require('chai').expect;

var Component = require('../../models/Component.js');
var dsf = require('../..');
dsf.init('test/test-options.json');

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
		expect(this.subject.config).to.deep.equal(dsf.getOptions());
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


});