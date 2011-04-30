var util       = require('./util');

var DEFAULT_INDENT = '    ';

function xml (input, indent) {
    var output = [];

    indent = !indent ? '' : indent === true ? DEFAULT_INDENT : indent;

    if (input && input.forEach) {
        input.forEach(function(value){
            output.push(format(resolve(value, indent, indent ? 1 : 0)));
        });
    } else {
        output.push(format(resolve(input, indent, indent ? 1 : 0)));
    }
    return output.join(indent ? '\n' : '');
}

function create_indent(character, count) {
    return (new Array(count || 0).join(character || ''))
}

function resolve(data, indent, indent_count) {
    indent_count = indent_count || 0;
    var indent_spaces = create_indent(indent, indent_count);
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
            if (values === null) break;

            if (values._attr) {
                get_attributes(values._attr);
            }

            if (values._cdata) {
                content.push('<![CDATA[' + values._cdata + ']]>');
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
                        content.push(create_indent(indent, indent_count + 1) + util.xml_safe(value));
                    }

                });
                content.push('');
            }
        break;

        default:
            //string
            content.push(util.xml_safe(values));

    }

    return { name:  name,
        attributes: attributes,
        content:    content,
        indents:    indent_spaces,
        indent:     indent };
}

function format(elem) {
    if (typeof elem != 'object')
        return elem;

    var len = elem.content.length;
    var output = elem.indents
        + (elem.name ? '<' + elem.name : '')
        + (elem.attributes.length ? ' ' + elem.attributes.join(' ') : '')
        + (len ? (elem.name ? '>' : '') : (elem.name ? '/>' : ''));

    if (!len)
        return output;

    var first = true;
    while (elem.content.length) {
        var value = elem.content.shift();
        if (value === undefined)
            continue;
        output += (elem.indent && !first ? '\n' : '') + format(value);
        first = false;
    }

    return output + (len > 1 ? elem.indents : '')
        + (elem.name ? '</' + elem.name + '>' : '');
}

function attribute(key, value) {
    return key + '=' + '"' + util.xml_safe(value) + '"';
}

module.exports = xml;
