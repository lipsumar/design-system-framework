var express = require('express'),
    app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    path = require('path');


module.exports = function(dsf){
    'use strict';

    dsf.start();

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

    // Define route: /build/*
    app.get(/^\/build\/(.*$)/, function(req, res){

        var componentId = dsf.getComponentIdFromPath(path.join(dsf.getConfig()['components-path'], req.params[0]));///@TODO could probably be cleaner
        if(!componentId){
            res.end('component "'+req.params+'" not found');
            return;
        }


        var resourceType = req.params[0].split(componentId)[1];
        if(resourceType && resourceType.length > 1){
            resourceType = resourceType.substring(1).split('?')[0];
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
                var preview = dsf.createPreviewDocument();
                preview.addComponent(component);
                preview.render(req.query, function(err, html){
                    res.end(html);
                });

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


    // start server
    http.listen(3000);
    dsf.log('Server ready at http://localhost:3000');
};

