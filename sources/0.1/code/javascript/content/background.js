
(function($) {

    var _ = this;

    _.history = {};

    _.ready = function() {
        this.attachChromeListeners();
    };

    _.getHistory = function(tabId) {
        return tabId in this.history ? this.history[tabId] : null;
    };

    _.attachChromeListeners = function() {
        var self = this;
        chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
            self.injectCode(changeInfo.status, tab);
        });
    };

    _.injectCode = function(status, tab) {
        if (status != 'complete') {
            return;
        }

        _.history[tab.id] = {
            code: {
                js: '',
                css: ''
            },
            rules: []
        };

        var snippet = this.getCodeSnippet(tab.url, tab),
            js = snippet.js,
            css = snippet.css;

        this.history[tab.id].code.js = js;
        this.history[tab.id].code.css = css;

        setTimeout(function() {
            if (js) {
                chrome.tabs.executeScript(tab.id, { code: js });
            }
            if (css) {
                chrome.tabs.insertCSS(tab.id, { code: css });
            }
        }, 200);
    };

    _.getCodeSnippet = function(url, tab) {
        var env = this.parent();
        var snippet = {
            js: '',
            css: ''
        };

        var snippetPrefix = { js: '', css: '' },
            snippetSuffix = { js: '', css: '' };

        var rules = env.db.rules.collection();
        for (var i = 0; i < rules.length; i++) {
            var re = new RegExp(rules[i].url, 'i');
            if (!re.test(url)) {
                continue;
            }

            var ruleId = rules[i].uuid.substr(0, 8);
            this.history[tab.id].rules.push(rules[i]);

            for (var j = 0; j < rules[i].scripts.length; j++) {
                var script = env.db.scripts.get(rules[i].scripts[j]),
                    scriptId = script.uuid.substr(0, 8),
                    type = script.type == 'javascript' ? 'js' : 'css';

                if (script.code) {
                    snippet[type] += '\n/**\n * BEGIN "' + script.name + '" <' + ruleId + '.' + scriptId + '>\n **/\n';
                    snippet[type] += $.trim(type == 'js' ? this.protectSnippet(script.code) : script.code);
                    snippet[type] += '\n/**\n * END "' + script.name + '" <' + ruleId + '.' + scriptId + '>\n **/\n';
                } else if (script.url) {
                    if ('prefixFollowing' in script && script.prefixFollowing) {
                        snippetPrefix[type] += script.prefixFollowing;
                    }
                    if ('suffixFollowing' in script && script.suffixFollowing) {
                        snippetSuffix[type] = script.suffixFollowing + snippetSuffix[type];
                    }
                    if (type == 'js') {
                        chrome.tabs.executeScript(tab.id, { file: script.url });
                    } else if (type == 'css') {
                        chrome.tabs.insertCSS(tab.id, { file: script.url });
                    }
                }
            }
        }

        snippet.js = $.trim($.trim(snippetPrefix.js) + '\n\n' + $.trim(snippet.js) + '\n\n' + $.trim(snippetSuffix.js));
        snippet.css = $.trim($.trim(snippetPrefix.css) + '\n\n' + $.trim(snippet.css) + '\n\n' + $.trim(snippetSuffix.css));

        return snippet;
    };

    _.protectSnippet = function(code) {
        return '(function() {\n' + $.trim(code) + '\n}());\n'
    };

}.call(d4w.env('script-injector.background'), jQuery));
