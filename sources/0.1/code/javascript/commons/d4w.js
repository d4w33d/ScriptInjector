
var d4w = d4w || {};

d4w.environments = {};

/**
 * Environments management
 */

d4w.env = function(name) {
    if (!(name in d4w.environments)) {
        d4w.environments[name] = {};
        d4w.environments[name].name = name;
        d4w.environments[name].parent = function() {
            if (name.indexOf('.') == -1) {
                return;
            }
            var parentName = name.substr(0, name.indexOf('.'));
            if (!parentName || !(parentName in d4w.environments)) {
                return;
            }
            return d4w.environments[parentName];
        };
    }
    return d4w.environments[name];
};

/**
 * Initialization
 */

d4w.init = function() {
    for (var env in this.environments) {
        if ('ready' in this.environments[env]) {
            this.environments[env].ready.call(this.environments[env]);
        }
    }
};

/**
 * Local storage
 */

d4w.localStorage = function(name, value) {
    var prefix = 'd4w..';
    if (typeof value != 'undefined') {
        localStorage[prefix + name] = $.toJSON({ v: value });
    }
    return ((prefix + name) in localStorage) ? $.evalJSON(localStorage[prefix + name]).v : null;
};

/**
 * Utils
 */

d4w.u = {};

/**
 * Dialog
 */

d4w.u.dialog = function(params) {
    params = $.extend({ title: '', html: '', buttons: [] }, params || {});

    $('#dialog-overlay, #dialog').remove();
    $('body')
        .append('<div id="dialog-overlay"></div>')
        .append('<div id="dialog"></div>');
    $('#dialog-overlay').hide();
    $('#dialog')
        .append('<h3></h3>')
        .append('<div id="dialog-content"></div>')
        .append('<div id="dialog-buttons"></div>')
        .find('h3')
            .text(params.title)
            .parent()
        .find('#dialog-content')
            .html(params.html)
            .parent();

    var buttonCallback = function(btn) {
        return function() {
            if (btn.click) {
                btn.click.call(d4w, this);
            } else {
                d4w.u.dialog.hide();
            }
        };
    };

    for (var i = 0; i < params.buttons.length; i++) {
        params.buttons[i] = $.extend({ label: '', click: null, highlight: false }, params.buttons[i]);
        $('#dialog-buttons')
            .append('<button type="button"></button>')
            .find('button:last')
                .html(params.buttons[i].label)
                .click(buttonCallback(params.buttons[i]));
        if (params.buttons[i].highlight) {
            $('#dialog-buttons button:last').addClass('highlighted');
        }
    }

    if (params.init) {
        params.init.call($('#dialog')[0]);
    }

    $('#dialog').hide();
    setTimeout(function() {
        $('#dialog')
            .show()
            .css({
                marginLeft: '-' + Math.round($('#dialog').width() / 2) + 'px',
                marginTop: '-' + Math.round($('#dialog').height() / 2) + 'px'
            })
            .hide();

        $('#dialog-overlay').animate({ opacity: 'show' }, 250, function() {
            $('#dialog').animate({ opacity: 'show' }, 250);
        });
    }, 100);
};

d4w.u.dialog.hide = function() {
    $('#dialog').animate({ opacity: 'hide' }, 250, function() {
        $('#dialog-overlay').animate({ opacity: 'hide' }, 250);
    });
};

d4w.u.uuid = function() {
    var s4 = function() {
       return (((1 + Math.random()) * 0x10000)|0).toString(16).substring(1);
    };
    return (s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4());
};

d4w.u.getCurrentTab = function(callback) {
    chrome.windows.getCurrent(function(win) {
        chrome.tabs.query({
            active: true,
            windowId: win.id
        }, function(tabs) {
            if (!tabs.length) {
                return;
            }
            callback.call(d4w, tabs[0]);
        });
    });
};

/**
 * Table
 */

d4w.u.Table = function(params) {
    params = $.extend({
        container: null,
        columns: [],
        displayColumns: true,
        emptyMessage: null
    }, params || {});

    this.emptyMessage = params.emptyMessage;
    this.columns = [];
    this.target = $(params.container)
        .append('<div class="table"></div>')
        .find('div.table:last')
            .append('<div class="table-content"></div>')
            .find('div.table-content')
                .append('<ul></ul>')
                .find('ul');

    var li, cell;
    if (params.displayColumns) {
        this.target.append('<li class="columns"></li>');
        li = this.target.find('li.columns:last');
    }

    for (var i = 0; i < params.columns.length; i++) {
        params.columns[i] = $.extend({
            name: '',
            title: '',
            type: 'text',
            visible: true,
            content: null,
            padding: true,
            className: null
        }, params.columns[i]);

        if (!params.columns[i].title) {
            params.columns[i].title = params.columns[i].name;
        }

        this.columns.push(params.columns[i]);
        if (!params.displayColumns || !params.columns[i].visible) {
            continue;
        }

        cell = li.append('<span class="cell"></span>').find('span.cell:last');
        cell.data('name', params.columns[i].name);
        cell.attr('data-name', params.columns[i].name);
        cell.data('type', params.columns[i].type);
        cell.attr('data-type', params.columns[i].type);
        if (params.className) {
            cell.addClass(params.className);
        }
        if (!params.columns[i].padding) {
            cell.addClass('no-padding');
        }
        cell.html(params.columns[i].title);
    }
};

d4w.u.Table.prototype.append = function(data) {
    var row = new d4w.u.TableRow(this, data);
    this.target.find('li.info').remove();
    this.target.append(row.html());
};

d4w.u.Table.prototype.empty = function() {
    this.target.empty();
    if (this.emptyMessage) {
        this.target
            .append('<li class="info"></li>')
            .find('.info')
                .html(this.emptyMessage);
    }
};

d4w.u.TableRow = function(cl, data) {
    this.cl = cl;
    this.data = data;
};

d4w.u.TableRow.prototype.html = function() {
    var value,
        cell,
        row = $('<li class="row"></li>');
    this.element = row;
    if (this.cl.sortable) {
        row.append('<span class="cell sortable"></span>');
    }
    for (var i = 0; i < this.cl.columns.length; i++) {
        if (this.cl.columns[i].content !== null) {
            value = this.cl.columns[i].content;
        } else {
            value = (this.cl.columns[i].name in this.data) ? this.data[this.cl.columns[i].name] : '';
        }
        row.data(this.cl.columns[i].name, value);
        row.attr('data-' + this.cl.columns[i].name, value);
        if (!this.cl.columns[i].visible) {
            continue;
        }
        cell = row.append('<span class="cell"></span>').find('span.cell:last');
        cell.data('name', this.cl.columns[i].name);
        cell.attr('data-name', this.cl.columns[i].name);
        cell.data('type', this.cl.columns[i].type);
        cell.attr('data-type', this.cl.columns[i].type);
        if (this.cl.columns[i].className) {
            cell.addClass(this.cl.columns[i].className);
        }
        if (!this.cl.columns[i].padding) {
            cell.addClass('no-padding');
        }
        switch (this.cl.columns[i].type) {
            case 'html':
                cell.html(value);
                break;
            default:
                cell.text(value);
                break;
        }
    }
    return row;
};

jQuery(function() {
    d4w.init();
});
