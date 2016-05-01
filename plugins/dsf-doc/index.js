var fs = require('fs'),
	MarkdownIt = require('markdown-it'),
	md = new MarkdownIt();

module.exports = function(dsf, done){
	'use strict';

	if(!dsf.getConfig().glob.doc){
		dsf.log.error('[dsf-doc] config.glob.doc is required.');
		done();
	}

	dsf.registerInspectorPlugin('dsf-doc', {
		dirname: __dirname,
		'component-path': 'src',
		name: 'Documentation'
	});

	dsf.registerResourceType('doc', function(component, callback){
		component.getResourcePaths('doc', function(err, files){
			if(files[0]){
				fs.readFile(files[0], function(err, file){
					var mdSource = file.toString();
					callback(null, md.render(mdSource));
				});
			}else{
				callback(null, 'No documentation found for '+component.id);
			}
		});

	});

	done();
};
