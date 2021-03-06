var express = require('express'),
    app = express(),
    http = require('http').Server(app),
    bodyParser = require('body-parser'),
    io = require('socket.io')(http),
    path = require('path'),
    fs = require('fs'),
    _ = require('lodash');

function setupUI(dsf){
    try{
        fs.mkdirSync(path.join(__dirname, '../public'));
    }catch(err){}

    dsf.getComponent('_plugin/ui', function(ui){

        var doc = dsf.createPreviewDocument();
        doc.addComponent(ui);

        doc.render({}, function(err, html){
            fs.writeFileSync(path.join(__dirname, '../public/index.html'), html);
        });
    });

}

module.exports = function(dsf, callback){
    'use strict';

    setupUI(dsf);

    // parse json
    app.use(bodyParser.json());

    // Define route: static
    app.use(express.static(path.join(__dirname, '../public')));

    // Define route: /components
    app.get('/components', function(req, res){
        var json = JSON.stringify(dsf.getComponents());
        res.end(json);
    });

    // Define route: /plugins
    app.get('/plugins', function(req, res){
        var json = JSON.stringify(dsf.getPlugins());
        res.end(json);
    });

    // Define route: /plugin/*
    app.post(/^\/plugin\/(.*$)/, function(req, res){
        var pluginId = req.params[0].split('/')[0],
            method = req.params[0].split('/')[1];

        var plugins = dsf.getPlugins().server,
            plugin = _.find(plugins, function(o){ return o.id === pluginId; });
        if(plugin){
            if(plugin.methods[method]){
                plugin.methods[method].apply(null, arguments);
            }else{
                res.end('plugin "'+pluginId+'": method "'+method+'" not found');
            }

        }else{
            res.end('plugin "'+pluginId+'" not found');
        }

    });

    // Define route: /build/*
    app.get(/^\/build\/(.*$)/, function(req, res){

        var componentId = dsf.getComponentIdFromPath(path.join(dsf.getConfig()['components-path'], req.params[0]));///@TODO could probably be cleaner
        if(!componentId){
            res.end('component "'+req.params+'" not found');
            return;
        }


        var resourceType = req.params[0].split(componentId)[1];
        if(resourceType && resourceType.length > 1){
            // remove query
            resourceType = resourceType.substring(1).split('?')[0];

            // remove extension
            resourceType = resourceType.split('.')[0];
        }

        dsf.getComponent(componentId, function(component){
            if(resourceType === 'css'){
                component.renderCss(function(err, css){
                    res.end(css || err);
                });
            }else if(resourceType === 'html'){
                component.renderHtml(req.query, function(err, html){
                   res.end(html || err);
                });
            }else{
                if(component.getResourceHandler(resourceType)){
                    component.renderResource(resourceType, function(err, str){
                        res.end(str || err);
                    });
                }else{
                    var context = req.query;
                    var variation = 'index';
                    if(context.__variation){
                        variation = context.__variation;
                        delete context.__variation;
                    }
                    var preview = dsf.createPreviewDocument();
                    preview.addComponent(component);

                    preview.render(context, variation, function(err, html){
                        res.end(html || err);
                    });
                }


            }
        });

    });



    // sockets
    io.on('connection', function(){
        console.log('socket connected');
    });
    dsf.onRebuild(function(component){
        io.emit('rebuild', {id:component.id});
    });
    dsf.onNewComponent(function(component){
        io.emit('new', {id:component.id});
    });


    // start listening
    var port = 3000;

    http.on('error', function(err){
        if(err.code === 'EADDRINUSE'){
            dsf.log('Port '+port+' already in use, trying '+(port+1)+'...');
            port++;
            http.listen(port);
        }
    });

    http.on('listening', function(){
        dsf.server = {
            port: port
        };
        dsf.log('Server ready at http://localhost:'+dsf.server.port);
        callback();
    })

    http.listen(port);

};

