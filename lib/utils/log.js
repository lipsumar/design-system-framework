var fancyLog = require('fancy-log'),
    chalk = require('chalk');

function log(msg, nodim){
    if(!nodim){
        msg = chalk.dim(msg);
    }

    fancyLog(msg);
}

function warning(msg){
    msg = chalk.yellow(msg);
    fancyLog(msg);
}


module.exports = log;
module.exports.warning = warning;
