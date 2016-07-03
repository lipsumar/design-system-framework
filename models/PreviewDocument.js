var fs = require('fs'),
    path = require('path'),
    Handlebars = require('handlebars'),
    pageTemplate = Handlebars.compile(fs.readFileSync(path.join(__dirname,'../tpl/PreviewDocument.hbs')).toString()),
    _ = require('lodash');

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

PreviewDocument.prototype.setComponent = function(component, variation, ctx) {
    this.component = component;
    this.componentVariation = variation;
    this.componentContext = ctx;
};

///@TODO accept also a context for the document
///@TODO render other types
PreviewDocument.prototype.render = function(context, callback) {


    var self = this;

    this.component.renderHtml(this.componentContext, this.componentVariation, function(err, html){
        var tpl = pageTemplate;
        if(self.component.config.document){
            try{
                tpl = self.component.getDocument();
            }catch(err){
                tpl = pageTemplate;
            }

        }
        var doc = tpl(_.merge({
            component: self.component.toJson(),
            html: html,
            cacheBust: (new Date()).getTime()
        }, context));
        callback(null, doc);
    });

};

module.exports = PreviewDocument;
