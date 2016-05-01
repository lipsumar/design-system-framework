var fancyLog = require('fancy-log'),
    chalk = require('chalk');

function logWithTime(msg){
    msg = msg.split('\n').join('\n           ');
    fancyLog(msg);
}

function log(msg, nodim){
    if(!nodim){
        msg = chalk.dim(msg);
    }

    logWithTime(msg);
}

function warning(msg){
    msg = chalk.yellow(msg);
    logWithTime(msg);
}

function error(msg){
    logWithTime(chalk.red(msg));
}


module.exports = log;
module.exports.warning = warning;
module.exports.error = error;
module.exports.chalk = chalk;
