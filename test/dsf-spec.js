var expect = require('chai').expect;

describe('dsf object', function () {
	before(function () {
		this.subject = require('..');
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
		before(function () {
			this.optionsOnFile = require('../options.json');
		});
		it('should return config', function () {
			expect(this.subject.getOptions()).to.deep.equal(this.optionsOnFile);
		});
	});

});