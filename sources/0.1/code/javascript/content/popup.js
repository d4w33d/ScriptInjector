
(function($) {

    var _ = this;

    _.history = {};
    _.editors = { javascript: null, css: null };

    _.ready = function() {
        var self = this;

        this.getHistory(function(history) {
            self.history = history;
            self.draw();
            self.attachEvents();
        });
    };

    _.draw = function() {
        var self = this;

        $('body')
            .append('<div class="buttons"></div>')
            .find('.buttons')
                .append('<button type="button">Run</button>')
                .find('button:last')
                    .click(function() { self.runCode(); })
                    .parent()
                .append('<button type="button" class="highlighted">Manage scripts</button>')
                .find('button:last')
                    .click(function() { self.manageScripts(); })
                    .parent();

        if (this.history && this.history.code) {
            $('body').append('<h2>JavaScript</h2>');
            this.buildEditor('javascript', this.history.code.js || '/**\n * Nothing here...\n **/');
            $('body').append('<h2>CSS</h2>');
            this.buildEditor('css', this.history.code.css || '/**\n * Nothing here...\n **/');
        }
    };

    _.buildEditor = function(type, code) {
        $('body')
            .append('<div class="code-preview"><textarea id="code-' + type + '"></textarea></div>')
            .find('textarea')
                .text($.trim(code));

        this.editors[type] = CodeMirror.fromTextArea($('#code-' + type)[0], {
            lineNumbers: true,
            theme: 'eclipse',
            mode: type
        });
    };

    _.attachEvents = function() {
    };

    _.getHistory = function(callback) {
        var self = this,
            bg = chrome.extension.getBackgroundPage();

        d4w.u.getCurrentTab(function(tab) {
            callback.call(self, bg.d4w.env('script-injector.background').getHistory(tab.id));
        });
    };

    _.manageScripts = function() {
        var loc = document.location.href;
        chrome.tabs.create({
            url: loc.substr(0, loc.lastIndexOf('/') + 1) + 'options.html',
            active: true
        });
    };

    _.runCode = function() {
        var self = this;
        d4w.u.getCurrentTab(function(tab) {
            if (self.editors.javascript) {
                chrome.tabs.executeScript(tab.id, { code: self.editors.javascript.getValue() });
            }
            if (self.editors.css) {
                chrome.tabs.insertCSS(tab.id, { code: self.editors.css.getValue() });
            }
        });
    };

}.call(d4w.env('script-injector.popup'), jQuery));
