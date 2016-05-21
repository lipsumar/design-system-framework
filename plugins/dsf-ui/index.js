var path = require('path'),
    fs = require('fs'),
    fse = require('fs-extra');

module.exports = function(dsf, done){
    'use strict';

    dsf.setUI({
        'component-path': 'src',
        'document': '../document.hbs',
        'external-components':{
            'modal': {
                'component-path': './node_modules/remodal/dist',
                'glob':{
                    'css':'remodal.css',
                    'js': 'remodal.js'
                }
            }
        }
    });

    dsf.registerServerPlugin('dsf-ui', 'quick-create', function(req, res){
        var name = req.body.name,
            directory = path.join(dsf.getConfig()['components-path'], name),
            html = req.body.html,
            css = req.body.css;

        if(dsf.util.path.isDirectory(directory)){
            res.end(JSON.stringify({ok:false, error:'isdir'}));
            return;
        }

        fse.mkdirpSync(directory);

        if(name.split('/').length > 1){
            name = name.split('/').pop();
        }

        fs.writeFileSync(path.join(directory, name+'.html'), html);
        fs.writeFileSync(path.join(directory, name+'.css'), css);

        res.end(JSON.stringify({ok:true}));
    });

    done();
};
