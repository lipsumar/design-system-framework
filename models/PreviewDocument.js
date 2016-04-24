var fs = require('fs'),
    path = require('path'),
    Handlebars = require('handlebars'),
    pageTemplate = Handlebars.compile(fs.readFileSync(path.join(__dirname,'../tpl/PreviewDocument.hbs')).toString());

/*
    Register a special helper for missing vars.
    A missing var will simply return its name:
    {{myMissingVar}} => "myMissingVar"
 */
Handlebars.registerHelper('helperMissing', function(options) {
    var varName = options.name;
    return varName;
});

function PreviewDocument(){
    this.components = [];
}

PreviewDocument.prototype.addComponent = function(component) {
    this.components.push(component);
};

PreviewDocument.prototype.render = function() {

    return pageTemplate({
        component: this.components[0],
        html: this.components[0].render(),
        cacheBust: (new Date()).getTime()
    });
};

module.exports = PreviewDocument;
