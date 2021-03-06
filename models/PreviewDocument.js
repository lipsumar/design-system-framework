var fs = require('fs'),
    path = require('path'),
    Handlebars = require('handlebars'),
    pageTemplate = Handlebars.compile(fs.readFileSync(path.join(__dirname,'../tpl/PreviewDocument.hbs')).toString());

/*
    Register a special helper for missing vars.
    A missing var will simply return its name:
    {{myMissingVar}} => "myMissingVar"
 */
Handlebars.registerHelper('helperMissing', function() {
    var options = arguments[arguments.length - 1],
        varName = options.name;
    return varName;
});

function PreviewDocument(){
    this.components = [];
}

PreviewDocument.prototype.addComponent = function(component) {
    this.components.push(component);
};

///@TODO accept also a context for the document
///@TODO render other types
PreviewDocument.prototype.render = function(context, variation, callback) {
    if(typeof variation === 'function'){
        callback = variation;
        variation = 'index';
    }

    var self = this,
        component = this.components[0]; // this implementation only supports 1 component

    component.renderHtml(context, variation, function(err, html){
        var tpl = pageTemplate;
        if(component.config.document){
            tpl = component.getDocument();
        }
        var doc = tpl({
            component: component.toJson(),
            html: html,
            cacheBust: (new Date()).getTime()
        });
        callback(null, doc);
    });

};

module.exports = PreviewDocument;
