(function(){
    function InspectorPlugin(){}
    InspectorPlugin.prototype.render = function(componentId) {
        var self = this;
        this.el.innerHTML = 'Loading...';
        fetch('build/'+componentId+'/doc')
            .then(function(resp){
                return resp.text() || '';
            })
            .then(function(text){
                self.el.innerHTML = text;
            });
    };


    window.dsf.registerInspectorPlugin('dsf-doc', InspectorPlugin);

}());
