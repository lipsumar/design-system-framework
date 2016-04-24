var sass = require('node-sass');

module.exports = {
    process: function(input, basePath, callback){
        sass.render({
            data: input
        }, function(error, result) {
            if (error){
                var error = new Error(error.message + ' On line ' + error.line + ' at column ' + error.column);
                callback(error, input);
            }
            else{
                callback(null, result.css.toString())
            }
        })
    }
};