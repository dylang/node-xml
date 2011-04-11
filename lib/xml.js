var util       = require('./util');

var DEFAULT_INDENT = '    ';

function xml (input, indent) {
    var output = [];

    indent = !indent ? '' : indent === true ? DEFAULT_INDENT : indent;

    if (input && input.forEach) {
        input.forEach(function(value){
            output.push(resolve(value, indent, indent ? 1 : 0));
        });
    } else {
        output.push(resolve(input, indent, indent ? 1 : 0));
    }
    return output.join(indent ? '\n' : '');
}

function resolve(data, indent, indent_count) {
    indent_count = indent_count || 0;
    var indent_spaces = (new Array(indent_count).join(indent));
    var name;
    var values = data;

    if (typeof data == 'object') {
        var keys = Object.keys(data);
        name = keys[0];
        values = data[name];
    }

    var attributes = [],
        content = [];

    function get_attributes(obj){
        var keys = Object.keys(obj);
        keys.forEach(function(key){
            attributes.push(attribute(key, obj[key]));
        });

    }

    switch(typeof values) {
        case 'object':
            if (values._attr) {
                get_attributes(values._attr);
            }

            if (values._cdata) {
                content.push('');
                content.push('<![CDATA[');
                content.push(values._cdata);
                content.push(']]>');
                content.push('');
            }

            if (values.forEach) {
                content.push('');

                values.forEach(function(value) {
                    if (typeof value == 'object') {
                        var _name = Object.keys(value)[0];

                        if (_name == '_attr') {
                            get_attributes(value._attr);
                        } else {
                            content.push(resolve(value, indent, indent_count + 1));
                        }
                    } else {
                        //string
                        content.push(util.xml_safe(value));
                    }

                });
                content.push('');
            }
        break;

        default:
            //string
            content.push(util.xml_safe(values));

    }

    return indent_spaces
        + (name ? '<' + name : '')
        + (attributes.length ? ' '
                + attributes.join(' ')
                : '')
        + (content.length ? (name ? '>' : '')
                + content.join(indent ? '\n' : '')
                + (content.length > 1 ? indent_spaces : '')
                + (name ? '</' + name + '>' : '')
            : (name ? '/>' : ''));
}

function attribute(key, value) {
    return key + '=' + '"' + util.xml_safe(value) + '"';
}

module.exports = xml;
