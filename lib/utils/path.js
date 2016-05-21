var path = require('path'),
    fs = require('fs');


function absolutePath(relPath){
    return path.join(process.cwd(), relPath);
}

function isDirectory(path){
    var stats;
    try{
        stats = fs.statSync(path);
    }catch(err){
        if(err.code === 'ENOENT'){
            return false;
        }
        throw err;
    }

    return stats.isDirectory();
}



module.exports = {
    absolutePath: absolutePath,
    absolute: absolutePath,
    isDirectory: isDirectory,
    remove: require('rimraf')
};
