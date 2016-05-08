(function(){
    // https://gist.github.com/lipsumar/d99d5e79d530429887eaf9bc32b5f986
    function $(n){var t=document.querySelector(n);return t&&(t.on=function(n,c){return t.addEventListener.call(t,n,function(n){c.call(t,n)})}),t}function $$(n){function t(n){[].forEach.call(this,n)}var c=n;return n&&"string"==typeof n&&(c=document.querySelectorAll(n)),{each:function(n,e){if(c instanceof NodeList)t.call(c,function(t){n.call(e||t)});else for(var l in c)c.hasOwnProperty(l)&&n.call(e||c[l],c[l],l,c)},on:function(n,e){t.call(c,function(t){t.addEventListener.call(t,n,e.bind(t))})}}}


    function getScript(source, callback) {
        var script = document.createElement('script');
        var prior = document.getElementsByTagName('script')[0];
        script.async = 1;
        prior.parentNode.insertBefore(script, prior);

        script.onload = script.onreadystatechange = function( _, isAbort ) {
            if(isAbort || !script.readyState || /loaded|complete/.test(script.readyState) ) {
                script.onload = script.onreadystatechange = null;
                script = undefined;

                if(!isAbort) { if(callback) callback(); }
            }
        };

        script.src = source;
    }






    window.dsf = {
        InspectorPlugins: {},
        registerInspectorPlugin: function(pluginId, Plugin){
            this.InspectorPlugins[pluginId] = Plugin;
        }
    };


    function renderComponentsList(components){
        console.log('renderComponentsList',components);
        if(components === 'still fetching components'){
            setTimeout(fetchComponents, 300);
            return;
        }

        var html = '<div class="group"><div class="group__title">Components</div>';
        components.forEach(function(component){
            if(component.id.split('/')[0]==='_plugin') return;
            html+='<div class="item" data-component="'+component.id+'">'+component.id+'</div>';
        });
        html+= '</div>';
        $('.js-insert-menu').innerHTML = html;

        $$('.item').on('click', function(e){
            var el = e.currentTarget,
                componentId = el.getAttribute('data-component');
            selectComponent(componentId);

        });
    }

    function selectComponent(componentId){
        $('.item--active') && $('.item--active').classList.remove('item--active');
        $('.item[data-component="'+componentId+'"]').classList.add('item--active');
        $('iframe').src = 'build/' + componentId + '/';

        $('.header').classList.remove('u-hide');
        $('.header__title').innerHTML = componentId;

        $('.component').classList.remove('u-hide');

        if(inspectorPlugins.length > 0){
            $('.inspector').classList.remove('u-hide');
            $('.navigation-tabs__item[data-tab="'+currentInspectorPlugin.id+'"]').classList.add('navigation-tabs__item--active');
            $('.tab-content[data-tab="'+currentInspectorPlugin.id+'"]').classList.add('tab-content--active');
            currentInspectorPlugin.render(componentId);
        }

    }

    function fetchComponents(callback){
        fetch('components')
            .then(function(resp){
                return resp.json();
            })
            .then(callback);
    }
    fetchComponents(renderComponentsList);




    var inspectorPlugins = [],
        inspectorPluginsById = {},
        currentInspectorPlugin;
    function loadPlugins(plugins, callback){
        console.log('loadPlugins',plugins);

        if(plugins.inspector){

            function next(i){
                var inspectorPlugin = plugins.inspector[i];
                if(!inspectorPlugin){
                    currentInspectorPlugin = inspectorPlugins[0];
                    if(callback){ callback(); }
                    return;
                }
                var tab = document.createElement('div');
                tab.className = 'navigation-tabs__item';
                tab.setAttribute('data-tab', inspectorPlugin.id);
                tab.innerHTML = inspectorPlugin.name;
                $('.js-insert-inspector-tabs').appendChild(tab);


                var el = document.createElement('div');
                el.className = 'tab-content';
                el.setAttribute('data-tab', inspectorPlugin.id);
                $('.js-insert-inspectors').appendChild(el);

                getScript('build/_plugin/'+inspectorPlugin.id+'/js', function(){
                    var plugin = new window.dsf.InspectorPlugins[inspectorPlugin.id](inspectorPlugin);
                    plugin.id = inspectorPlugin.id;
                    plugin.config = inspectorPlugin;
                    plugin.el = el;
                    if(plugin.init){
                        plugin.init();
                    }
                    inspectorPluginsById[inspectorPlugin.id] = plugin
                    inspectorPlugins.push(plugin);

                    next(i+1);
                })

            }
            next(0);


        }
    }

    fetch('plugins')
        .then(function(resp){
            return resp.json();
        })
        .then(loadPlugins);

    // init socket
    var socket = io();
    socket.on('rebuild', function(resp){
        console.log('rebuild', resp);
        selectComponent(resp.id);
    });

    socket.on('new', function(resp){
        console.log('new', resp);
        fetchComponents(renderComponentsList);
    })

}());
