
module.exports = function(dsf, done){
    'use strict';

    dsf.setUI({
        'component-path': 'src',
        'document': '../document.hbs'
    });

    done();
};
