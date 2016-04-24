var express = require('express'),
	app = express(),
	http = require('http').Server(app),
	io = require('socket.io')(http),
	path = require('path'),
	dsf = require('./dsf.js');




// Define route: static
app.use(express.static(path.join(__dirname, '../public')));

// Define route: /components
app.get('/components', function(req, res){
	var json = JSON.stringify(dsf.getComponents());
	res.end(json);
});

// Define route: /build/*
app.get(/^\/build\/(.*$)/, function(req, res){
	var componentId = req.params[0];

	///@TODO wait for dsf to be ready. dsf.ready(=>) or dsf(=>)
	var component = dsf.getComponent(componentId);
	if(!component){
		res.end('component "'+componentId+'" not found');
		return;
	}

	var preview = dsf.createPreviewDocument();
	preview.addComponent(component);

	res.end(preview.render());

});


// sockets
io.on('connection', function(socket){
	console.log('socket connected');
});
dsf.onRebuild(function(component){
	io.emit('rebuild', {id:component.id});
});


// start dsf
dsf.init(function(){
	dsf.start();
});


// start server
http.listen(3000);
console.log('Server ready at http://localhost:3000');