import { it, expect, describe } from 'vitest';
import xml, { element } from '../lib/xml';
import { Stream } from 'stream';

describe('xml function', () => {
    it('should handle no elements', () => {
        expect(xml()).toBe('');
        expect(xml([])).toBe('');
        expect(xml('test')).toBe('test');
        expect(xml('scotch & whisky')).toBe('scotch &amp; whisky');
        expect(xml('bob\'s escape character')).toBe('bob&apos;s escape character');
    });

    it('should handle simple options', () => {
        expect(xml([{a: {}}])).toBe('<a/>');
        expect(xml([{a: null}]), '<a/>');
        expect(xml([{a: []}]), '<a></a>');
        expect(xml([{a: -1}]), '<a>-1</a>');
        expect(xml([{a: false}]), '<a>false</a>');
        expect(xml([{a: 'test'}]), '<a>test</a>');
        expect(xml({a: {}})).toBe('<a/>');
        expect(xml({a: null})).toBe('<a/>');
        expect(xml({a: []})).toBe('<a></a>');
        expect(xml({a: -1})).toBe('<a>-1</a>');
        expect(xml({a: false})).toBe('<a>false</a>');
        expect(xml({a: 'test'})).toBe('<a>test</a>');
        expect(xml([{a: 'test'}, {b: 123}, {c: -0.5}])).toBe('<a>test</a><b>123</b><c>-0.5</c>');
    });

    it('should handle deeply nested objects', () => {
        expect(xml([{a: [{b: [{c: 1}, {c: 2}, {c: 3}]}]}]), '<a><b><c>1</c><c>2</c><c>3</c></b></a>');
    });

    it('should handle indents property', () => {
        expect(xml([{a: [{b: [{c: 1}, {c: 2}, {c: 3}]}]}], true)).toBe('<a>\n    <b>\n        <c>1</c>\n        <c>2</c>\n        <c>3</c>\n    </b>\n</a>');
        expect(xml([{a: [{b: [{c: 1}, {c: 2}, {c: 3}]}]}], '  ')).toBe('<a>\n  <b>\n    <c>1</c>\n    <c>2</c>\n    <c>3</c>\n  </b>\n</a>');
        expect(xml([{a: [{b: [{c: 1}, {c: 2}, {c: 3}]}]}], '\t')).toBe('<a>\n\t<b>\n\t\t<c>1</c>\n\t\t<c>2</c>\n\t\t<c>3</c>\n\t</b>\n</a>');
        expect(xml({guid: [{_attr: {premalink: true}}, 'content']}, true)).toBe('<guid premalink="true">content</guid>');
    });

    it('should support xml attributes', () => {
        expect(xml([{b: {_attr: {}}}]), '<b/>');
        expect(xml([{
            a: {
                _attr: {
                    attribute1: 'some value',
                    attribute2: 12345
                }
            }
        }]), '<a attribute1="some value" attribute2="12345"/>');
        expect(xml([{
            a: [{
                _attr: {
                    attribute1: 'some value',
                    attribute2: 12345
                }
            }]
        }]), '<a attribute1="some value" attribute2="12345"></a>');
        expect(xml([{
            a: [{
                _attr: {
                    attribute1: 'some value',
                    attribute2: 12345
                }
            }, 'content']
        }]), '<a attribute1="some value" attribute2="12345">content</a>');
    });

    it('should support cdata', () => {
        expect(xml([{a: {_cdata: 'This is some <strong>CDATA</strong>'}}])).toBe('<a><![CDATA[This is some <strong>CDATA</strong>]]></a>');
        expect(xml([{
            a: {
                _attr: {attribute1: 'some value', attribute2: 12345},
                _cdata: 'This is some <strong>CDATA</strong>'
            }
        }]), '<a attribute1="some value" attribute2="12345"><![CDATA[This is some <strong>CDATA</strong>]]></a>');
        expect(xml([{a: {_cdata: 'This is some <strong>CDATA</strong> with ]]> and then again ]]>'}}])).toBe('<a><![CDATA[This is some <strong>CDATA</strong> with ]]]]><![CDATA[> and then again ]]]]><![CDATA[>]]></a>');
    });

    it('should support encoding', () => {
        expect(xml([{
            a: [{
                _attr: {
                    anglebrackets: 'this is <strong>strong</strong>',
                    url: 'http://google.com?s=opower&y=fun'
                }
            }, 'text']
        }]), '<a anglebrackets="this is &lt;strong&gt;strong&lt;/strong&gt;" url="http://google.com?s=opower&amp;y=fun">text</a>');
    });
});

describe('stream functionality', () => {
    it('should support stream interface', () => {
        const elem = element({_attr: {decade: '80s', locale: 'US'}});
        const xmlStream = xml({toys: elem}, {stream: true}) as Stream;
        const results: string[] = ['<toys decade="80s" locale="US">', '<toy>Transformers</toy>', '<toy><name>He-man</name></toy>', '<toy>GI Joe</toy>', '</toys>'];

        elem.push({toy: 'Transformers'});
        elem.push({toy: [{name: 'He-man'}]});
        elem.push({toy: 'GI Joe'});
        elem.close();

        xmlStream.on('data', (stanza: string) => {
            expect(stanza).toBe(results.shift());
        });

        return new Promise<void>( (resolve, reject) => {
            xmlStream.on('close', () => {
                expect(results).toEqual([]);
                resolve();
            });
            xmlStream.on('error', reject);
        });
    });

    it('should end streams properly', () => {
        const elem = element({ _attr: { decade: '80s', locale: 'US'} });
        const xmlStream = xml({ toys: elem }, { stream: true }) as Stream;

        let gotData: boolean = false;

        elem.push({ toy: 'Transformers' });
        elem.push({ toy: 'GI Joe' });
        elem.push({ toy: [{name:'He-man'}] });
        elem.close();

        xmlStream.on('data',  (data: string) => {
            expect(data).toBeTruthy();
            gotData = true;
        });

        xmlStream.on('end',  () => {
            expect(gotData).toBeTruthy();
        });

        return new Promise<void>( (resolve, reject) => {
            xmlStream.on('close',  () => {
                expect(gotData).toBeTruthy();
                resolve();
            });
            xmlStream.on('error', reject);
        });
    });
});


describe('xml declaration options', () => {
    it('should handle xml declaration options', () => {
        expect(xml([{a: 'test'}], {declaration: true})).toBe('<?xml version="1.0" encoding="UTF-8"?><a>test</a>');
        expect(xml([{a: 'test'}], {declaration: {encoding: 'foo'}})).toBe('<?xml version="1.0" encoding="foo"?><a>test</a>');
        expect(xml([{a: 'test'}], {declaration: {standalone: 'yes'}})).toBe('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a>test</a>');
        expect(xml([{a: 'test'}], {declaration: false})).toBe('<a>test</a>');
        expect(xml([{a: 'test'}], {declaration: true, indent: '\n'})).toBe('<?xml version="1.0" encoding="UTF-8"?>\n<a>test</a>');
        expect(xml([{a: 'test'}], {})).toBe('<a>test</a>');
    });
});
