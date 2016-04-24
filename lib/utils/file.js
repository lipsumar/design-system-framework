var fs = require('fs');

module.exports = {
    readJSON: function(path, callback){
        fs.readFile(path, function(err, buffer){
            if(err){
                callback(new Error('"'+path+'": '+err));
                return;
            }
            var str = buffer.toString(),
                obj;
            try{
                obj = JSON.parse(str);
            }catch(err){
                callback(new Error('"'+path+'": invalid json'));
                return;
            }
            callback(null, obj);
        });
    }
};
