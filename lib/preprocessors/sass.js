var sass = require('node-sass');

module.exports = {
  process: function(input, basePath, callback){
    sass.render({
      data: input
    }, function(error, result) {
      if (error){
        console.log(error.message);
        // @todo tell the user in which file the error occurred
        console.log('Line: ' + error.line);
        console.log('Column: ' + error.column + '\n');
      }
      else{
        callback(null, result.css.toString())
      }
    })
  }
};