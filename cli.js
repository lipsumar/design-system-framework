#!/usr/bin/env node

var fs = require('fs'),
    path = require('path');

// vanity screen
console.log('   ⌜                         ⌝');
console.log('     Design System Framework  ');
console.log('   ⌞                         ⌟');
console.log('');


(function(){
    'use strict';

    var commandLineCommands = require('command-line-commands');

    // define cli commands
    var cliCommands = [
        {
            name: 'help'
        },
        {
            name: 'server'
        }
    ];


    var dsf = require('./lib/dsf');

    function startServer(openBrowser){
        dsf.log('Starting server...');
        require('./lib/server.js')(dsf);
        if(openBrowser){
            dsf.log('Open browser...');
            require('openurl').open('http://localhost:'+dsf.server.port);
        }
    }


    // start dsf
    dsf.init(function(){

        // add commands for plugins
        var plugins = dsf.getPlugins(),
            cliPluginsById = {};
        plugins.cli.forEach(function(plugin){
            cliCommands.push({
                name: plugin.id
            });
            cliPluginsById[plugin.id] = plugin;
        });

        var cli = commandLineCommands(cliCommands);
        // parse the command line
        var command = cli.parse();

        switch(command.name){

            // built-in commands
            case 'help':
                console.log(fs.readFileSync(path.join(__dirname,'resources/cli-help.txt')).toString());
                break;
            case 'server':
                startServer();
                break;

            // delegate anything else to plugins
            default:
                if(!command.name){ // except no command
                    startServer(true);
                }else{
                    dsf.log('Run plugin '+command.name);
                    cliPluginsById[command.name].func(command.options, function(){
                        dsf.log('Plugin '+command.name+' finished');
                    });
                }


        }
    });



}());
