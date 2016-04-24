/*jshint -W030 */

var expect = require('chai').expect;

var ComponentCandidate = require('../../models/ComponentCandidate.js');

module.exports = function(dsf){


    describe('ComponentCandidate', function () {

        it('should exist', function () {
            expect(ComponentCandidate).to.be.a('function');
        });

        describe('given a valid component path', function () {
            before(function () {
                this.subject = new ComponentCandidate({
                    dsf: dsf,
                    path: 'test/test-components/Base'
                });
            });

            it('should resolve as a component', function (done) {
                this.subject.resolve(function(candidate){
                    expect(candidate.isComponent).to.be.true;
                    done();
                });
            });
        });

        describe('given an invalid component path', function () {
            before(function () {
                this.subject = new ComponentCandidate({
                    dsf: dsf,
                    path: 'test/test-components/NotAComponent'
                });
            });

            it('should not resolve as a component', function (done) {
                this.subject.resolve(function(candidate){
                    expect(candidate.isComponent).to.be.false;
                    done();
                });
            });
        });

    });

};
