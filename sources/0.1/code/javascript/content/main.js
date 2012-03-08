
(function($) {

    var _ = this;

    _.featuredScripts = {
        jquery: {
            uuid: 'jquery',
            type: 'javascript',
            name: 'jQuery',
            url: 'code/vendor/jquery-1.7.1.min.js',
            prefixFollowing: 'jQuery.noConflict();\n(function($) {\n',
            suffixFollowing: '}(jQuery));\n'
        }
    };

    _.ready = function() {
        if (!_.db.get('scripts')) {
            _.db.set('scripts', {});
        }
        if (!_.db.get('rules')) {
            _.db.set('rules', {});
        }
    };

    _.db = {};

    _.db.set = function(name, value) {
        d4w.localStorage(_.name + '.' + name, value);
    };

    _.db.get = function(name, defaultValue) {
        var value = d4w.localStorage(_.name + '.' + name);
        if (value !== null) {
            return value;
        }
        return typeof defaultValue != 'undefined' ? defaultValue : null;
    };

    _.db.scripts = {};

    _.db.scripts.collection = function() {
        var rawItems = _.db.get('scripts'),
            items = [];
        for (var n in rawItems) {
            items.push(rawItems[n]);
        }

        items.sort(function(a, b) {
            if (a.name === b.name) {
                return 0;
            } else {
                return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
            }
        });

        return items;
    };

    _.db.scripts.get = function(uuid) {
        if (uuid in _.featuredScripts) {
            return _.featuredScripts[uuid];
        }
        var scripts = _.db.get('scripts');
        return uuid in scripts ? scripts[uuid] : null;
    };

    _.db.scripts.save = function(data) {
        data = $.extend({
            uuid: d4w.u.uuid(),
            type: 'javascript',
            code: ''
        }, data);

        var scripts = _.db.get('scripts');
        scripts[data.uuid] = data;
        _.db.set('scripts', scripts);

        return data;
    };

    _.db.scripts.delete = function(uuid) {
        var scripts = _.db.get('scripts'),
            newScripts = {};
        for (var n in scripts) {
            if (n == uuid) {
                continue;
            }
            newScripts[n] = scripts[n];
        }
        _.db.set('scripts', newScripts);
    };

    _.db.scripts.typeName = function(type) {
        var typeStr = '';
        switch (type) {
            case 'javascript':
                typeStr = 'JavaScript';
                break;
            case 'css':
                typeStr = 'CSS';
                break;
        }
        return typeStr;
    };

    _.db.rules = {};

    _.db.rules.collection = function() {
        var rawItems = _.db.get('rules'),
            items = [];
        for (var n in rawItems) {
            items.push(rawItems[n]);
        }

        items.sort(function(a, b) {
            if (a.name === b.name) {
                return 0;
            } else {
                return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
            }
        });

        return items;
    };

    _.db.rules.get = function(uuid) {
        var rules = _.db.get('rules');
        return uuid in rules ? rules[uuid] : null;
    };

    _.db.rules.save = function(data) {
        data = $.extend({
            uuid: d4w.u.uuid(),
            name: '',
            url: '',
            scripts: []
        }, data);

        var rules = _.db.get('rules');
        rules[data.uuid] = data;
        _.db.set('rules', rules);

        return data;
    };

    _.db.rules.delete = function(uuid) {
        var rules = _.db.get('rules'),
            newRules = {};
        for (var n in rules) {
            if (n == uuid) {
                continue;
            }
            newRules[n] = rules[n];
        }
        _.db.set('rules', newRules);
    };

}.call(d4w.env('script-injector'), jQuery));
