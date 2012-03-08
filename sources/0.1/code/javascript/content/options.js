
(function($) {

    var _ = this;

    _.scriptsTable = null;

    _.ready = function() {
        this.initScripts();
        this.initRules();
    };

    /**
     * Scripts
     */

    _.initScripts = function() {
        var self = this,
            env = this.parent();

        this.scriptsTable = new d4w.u.Table({
            container: '#scripts',
            displayColumns: false,
            emptyMessage: 'Nothing here... Click on "Create a new script".',
            columns: [
                { name: 'uuid', type: 'text', visible: false },
                { name: 'type', type: 'text' },
                { name: 'name', type: 'text' },
                {
                    name: 'modify',
                    type: 'html',
                    content: '<span class="link">Modify</span>',
                    padding: false
                },
                {
                    name: 'delete',
                    type: 'html',
                    content: '<span class="button-delete"></span>',
                    className: 'button',
                    padding: false
                }
            ]
        });

        $('#scripts .button-delete').live('click', function() {
            var uuid = $(this).parents('li:first').data('uuid'),
                name = $(this).parents('li:first').data('name');

            d4w.u.dialog({
                title: 'Delete script',
                html: 'Are you sure you want to delete the script ' + name + '?',
                buttons: [{ label: 'No' }, {
                    label: 'Yes',
                    highlight: true,
                    click: function() {
                        env.db.scripts.delete(uuid);
                        self.updateScripts();

                        var rules = env.db.rules.collection();
                        for (var i = 0; i < rules.length; i++) {
                            var scripts = [];
                            for (var j = 0; j < rules[i].scripts.length; j++) {
                                if (rules[i].scripts[j] == uuid) {
                                    continue;
                                }
                                scripts.push(rules[i].scripts[j]);
                            }
                            rules[i].scripts = scripts;
                            env.db.rules.save(rules[i]);
                        }

                        d4w.u.dialog.hide();
                    }
                }]
            });
        });

        $('#scripts .link').live('click', function() {
            var li = $(this).parents('li:first'),
                uuid = li.data('uuid'),
                infos = env.db.scripts.get(uuid);
            self.showScriptWindow('Change script information', 'Save', {
                type: infos.type,
                name: infos.name,
                code: infos.code
            }, function(data) {
                data.uuid = uuid;
                env.db.scripts.save(data);
                self.updateScripts();
                $('#scripts [data-uuid=' + uuid + ']').effect('highlight', {}, 3000);
            });
        });

        $('[data-action=new-script]').click(function() {
            self.showScriptWindow('Add script', 'Add', {}, function(data) {
                data = env.db.scripts.save(data);
                self.updateScripts();
                $('#scripts [data-uuid=' + data.uuid + ']').effect('highlight', {}, 3000);
            });
        });

        this.updateScripts();
    };

    _.updateScripts = function() {
        var env = this.parent();

        this.scriptsTable.empty();
        var collection = env.db.scripts.collection();

        for (var i = 0; i < collection.length; i++) {
            this.scriptsTable.append({
                uuid: collection[i].uuid,
                type: env.db.scripts.typeName(collection[i].type),
                name: collection[i].name
            });
        }

        $('#scripts .row').draggable({
            helper: 'clone',
            appendTo: 'body',
            cursor: 'move',
            distance: 5
        });
    };

    _.showScriptWindow = function(title, saveLabel, defaultValues, callback) {
        var editor;

        defaultValues = $.extend({
            type: 'javascript',
            name: 'Unnamed Script',
            code: ''
        }, defaultValues);

        var html = $('<div></div>');
        html
            .append('<div class="field"></div>')
            .find('.field:last')
                .append('<label for="script-type">Content type:</label>')
                .append('<select id="script-type"></select>')
                .find('#script-type')
                    .append('<option value="javascript">JavaScript</option>')
                    .append('<option value="css">CSS</option>')
                    .parent()
                .parent()
            .append('<div class="field"></div>')
            .find('.field:last')
                .append('<label for="script-name">Name:</label>')
                .append('<input type="text" id="script-name">')
                .parent()
            .append('<textarea class="editor" id="script-code"></textarea>');

        var saveInformation = function() {
            var data = {
                type: $('#script-type').val(),
                name: $('#script-name').val(),
                code: editor.getValue()
            };

            d4w.u.dialog.hide();
            callback.call(_, data);
        };

        d4w.u.dialog({
            title: title,
            html: html,
            buttons: [{ label: 'Cancel' }, {
                label: saveLabel,
                highlight: true,
                click: function() {
                    saveInformation();
                }
            }],
            init: function() {
                var pop = $(this);

                pop.find('#script-type').val(defaultValues.type);
                pop.find('#script-name').val(defaultValues.name);
                pop.find('#script-code').val(defaultValues.code);

                editor = CodeMirror.fromTextArea(pop.find('#script-code')[0], {
                    lineNumbers: true,
                    theme: 'eclipse',
                    mode: pop.find('#script-type').val()
                });

                pop.find('#script-type').change(function() {
                    editor.setOption('mode', $(this).val());
                });
            }
        });
    };

    /**
     * Rules
     */

    _.initRules = function() {
        var self = this,
            env = this.parent();

        $('#rule-scripts').sortable({
            items: '.item',
            cursor: 'move',
            axis: 'y',
            containment: 'parent',
            distance: 5
        });

        $('#rule-scripts .add').click(function() {
            self.showScriptsList($(this).index() === 1 ? 'first' : 'last');
        });

        $('#rule-scripts').droppable({
            over: function(e, ui) {
                if (!ui.draggable.hasClass('row')) {
                    return;
                }
                $(this).addClass('dropping');
            },
            out: function(e, ui) {
                $(this).removeClass('dropping');
            },
            drop: function(e, ui) {
                if (!ui.draggable.hasClass('row')) {
                    return;
                }

                $(this).removeClass('dropping');
                var script = env.db.scripts.get(ui.draggable.data('uuid'));
                self.attachScriptToRule(script);
            }
        });

        $('[data-action=save-rule]').click(function() {
            var uuid = $('#rule').data('uuid');
            var data = {
                name: $('#rule-name').val(),
                url: $('#rule-url').val(),
                scripts: []
            };

            if (uuid) {
                data.uuid = uuid;
            }

            $('#rule-scripts .item').each(function() {
                data.scripts.push($(this).data('uuid'));
            });

            var rule = env.db.rules.save(data);
            self.updateRules();
            $('#rules').val(rule.uuid);
            self.loadRule(rule);
        });

        $('[data-action=delete-rule]').click(function() {
            var uuid = $('#rule').data('uuid');

            d4w.u.dialog({
                title: 'Delete rule',
                html: 'Are you sure you want to delete this rule?',
                buttons: [{ label: 'No' }, {
                    label: 'Yes',
                    highlight: true,
                    click: function() {
                        env.db.rules.delete(uuid);
                        self.updateRules();
                        self.hideRule();
                        d4w.u.dialog.hide();
                    }
                }]
            });
        });

        $('#rules').val('');

        this.hideRule();
        $('#rules').change(function() {
            var v = $(this).val();
            if (!v) {
                self.hideRule();
                return;
            }
            self.loadRule(v != 'add' ? env.db.rules.get(v) : null);
        });

        this.updateRules();
    };

    _.updateRules = function() {
        var env = this.parent();

        $('#rules optgroup').empty();
        var collection = env.db.rules.collection();

        if (!collection.length) {
            $('#rules optgroup')
                .append('<option></option>')
                .find('option:last')
                    .attr('disabled', 'disabled')
                    .html('Nothing here...');
            return;
        }

        for (var i = 0; i < collection.length; i++) {
            $('#rules optgroup')
                .append('<option></option>')
                .find('option:last')
                    .attr('value', collection[i].uuid)
                    .html(collection[i].name);
        }
    };

    _.hideRule = function() {
        $('#rule').hide();
        $('[data-action=save-rule], [data-action=delete-rule]').hide();
    };

    _.loadRule = function(rule) {
        var self = this,
            env = this.parent();

        if (rule) {
            $('[data-action=delete-rule]').show();
        } else {
            $('[data-action=delete-rule]').hide();
        }

        $('[data-action=save-rule]')
            .html(rule ? 'Save modifications' : 'Add this rule')
            .show();

        $('#rule-name').val(rule ? rule.name : '');
        $('#rule-url').val(rule ? rule.url : '');
        $('#rule-scripts .item').remove();

        if (rule) {
            var script;
            for (var i = 0; i < rule.scripts.length; i++) {
                script = env.db.scripts.get(rule.scripts[i]);
                if (!script) {
                    continue;
                }
                self.attachScriptToRule(script);
            }
        }

        $('#rule').data('uuid', rule ? rule.uuid : '');
        $('#rule').attr('data-uuid', $('#rule').data('uuid'));
        $('#rule').show();
    };

    _.attachScriptToRule = function(script, position) {
        var self = this,
            env = this.parent(),
            item;

        if (position == 'first') {
            item = $('#rule-scripts .add:first').after('<div class="item"></div>').parent().find('div.item:first');
        } else {
            item = $('#rule-scripts .add:last').before('<div class="item"></div>').parent().find('div.item:last');
        }

        item
            .attr('data-uuid', script.uuid)
            .data('uuid', script.uuid)
            .append('<span class="name"></span>')
            .find('.name')
                .html(script.name)
                .parent()
            .append('<span class="category"></span>')
            .find('.category')
                .html(env.db.scripts.typeName(script.type))
                .parent()
            .append('<span class="button-delete"></span>')
            .find('.button-delete')
                .click(function() {
                    $(this).parent().remove();
                });
    };

    _.showScriptsList = function(position) {
        var self = this,
            env = this.parent();

        var list = $('<ul class="all-scripts"></ul>');

        var currentScript = null;

        var selectScriptItem = function(li, params) {
            li.parent().find('li').removeClass('selected');
            li.addClass('selected');
            li.find('input').attr('checked', 'checked');
            currentScript = params;
        };

        var addScriptItem = function(params) {
            params = $.extend({
                category: '',
                name: '',
                featured: false,
                add: null
            }, params);

            if (params.featured) {
                list.find('li').removeClass('featured-last');
            }

            list
                .append('<li></li>')
                .find('li:last')
                    .append('<span class="category"></span>')
                    .find('.category')
                        .html(params.category)
                        .parent()
                    .append('<span class="name"></span>')
                    .find('.name')
                        .html(params.name)
                        .parent()
                    .append('<input type="radio" name="script_selector">')
                    .find('input')
                        .click(function() { selectScriptItem($(this).parent(), params); })
                        .parent()
                    .addClass(params.featured ? 'featured featured-last' : 'custom')
                    .click(function() { selectScriptItem($(this), params); });
        };

        var addScriptItemToRule = function(script, position) {
            return function() {
                self.attachScriptToRule(script, position);
            };
        };

        for (var n in env.featuredScripts) {
            addScriptItem({
                category: env.db.scripts.typeName(env.featuredScripts[n].type),
                name: env.featuredScripts[n].name,
                featured: true,
                add: addScriptItemToRule(env.featuredScripts[n], position)
            });
        }

        var collection = env.db.scripts.collection();
        for (var i = 0; i < collection.length; i++) {
            addScriptItem({
                category: env.db.scripts.typeName(collection[i].type),
                name: collection[i].name,
                featured: false,
                add: addScriptItemToRule(collection[i], position)
            });
        }

        d4w.u.dialog({
            title: 'Add script to rule',
            html: list,
            buttons: [{ label: 'Cancel' }, {
                label: 'Add to rule',
                highlight: true,
                click: function() {
                    if (currentScript) {
                        currentScript.add.call(self);
                    }

                    d4w.u.dialog.hide();
                }
            }]
        });
    };

}.call(d4w.env('script-injector.options'), jQuery));
