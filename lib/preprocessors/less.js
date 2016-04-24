var less = require('less');

module.exports = {
    process: function(input, basePath, callback){
        less.render(input,{paths:basePath})
            .then(function(output){
                callback(null, output.css, {raw:output});
            }, callback);
    }
};
