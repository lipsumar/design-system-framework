var dsf = require('..');

describe('', function () {
    before(function (done) {
        dsf.init('test/test-config.json', function(){
            dsf.start();
            done();
        });

    });

    require('./lib')(dsf);
    require('./models')(dsf);
});


