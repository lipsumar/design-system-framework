/*jshint -W030 */

var expect = require('chai').expect,
    _ = require('lodash');

// load config on file to compare later
var DEFAULT_CONFIG = require('../../config.json');
var USER_CONFIG = require('../test-config.json');

module.exports = function(dsf){

    describe('dsf object', function () {
        before(function () {
            this.subject = dsf;
        });

        it('should exist', function () {
            expect(this.subject).to.exist;
        });

        describe('#start', function () {
            it('should exist', function () {
                expect(this.subject.start).to.be.a('function');
            });
        });

        describe('#getConfig', function () {
            it('should return config', function () {
                var mergedOptions = _.merge({}, DEFAULT_CONFIG, USER_CONFIG);
                expect(this.subject.getConfig()).to.deep.equal(mergedOptions);
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

        describe('#getComponent (async)', function () {
            it('should return component', function (done) {
                this.subject.getComponent('Dumbledore', function(component){
                    expect(component.id).to.equal('Dumbledore');
                    done();
                });
            });
        });


        describe('#getComponent (sync)', function () {
            it('should return component', function () {
                var component = this.subject.getComponent('Dumbledore');
                expect(component.id).to.equal('Dumbledore');
            });
        });

    });

};
