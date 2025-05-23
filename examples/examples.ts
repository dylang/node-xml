// To run: tsx examples/examples.ts
import xml, { Element as XmlElement } from '../lib/xml';
import { Stream } from 'stream';

console.log('===== Example 1 ====');
const example1: Record<string, any> = { url: 'http://www.google.com/search?aq=f&sourceid=chrome&ie=UTF-8&q=opower' };
console.log(xml(example1));
//<url>http://www.google.com/search?aq=f&amp;sourceid=chrome&amp;ie=UTF-8&amp;q=opower</url>

console.log('\n===== Example 2 ====');
const example2 = [ { url: { _attr: { hostname: 'www.google.com', path: '/search?aq=f&sourceid=chrome&ie=UTF-8&q=opower' }  } } ];
console.log(xml(example2));
//<url hostname="www.google.com" path="/search?aq=f&amp;sourceid=chrome&amp;ie=UTF-8&amp;q=opower"/>

console.log('\n===== Example 3 ====');
const example3 = [ { toys: [ { toy: 'Transformers' } , { toy: 'GI Joe' }, { toy: 'He-man' } ] } ];
console.log(xml(example3));
//<toys><toy>Transformers</toy><toy>GI Joe</toy><toy>He-man</toy></toys>
console.log(xml(example3, { indent: true }));
/*
<toys>
    <toy>Transformers</toy>
    <toy>GI Joe</toy>
    <toy>He-man</toy>
</toys>
*/

console.log('\n===== Example 4 ====');
const example4 = [ { toys: [ { _attr: { decade: '80s', locale: 'US'} }, { toy: 'Transformers' } , { toy: 'GI Joe' }, { toy: 'He-man' } ] } ];
console.log(xml(example4, { indent: true }));
/*
<toys decade="80s" locale="US">
    <toy>Transformers</toy>
    <toy>GI Joe</toy>
    <toy>He-man</toy>
</toys>
*/

console.log('\n===== Example 5 ====');
const example5 = [ { toys: [ { _attr: { decade: '80s', locale: 'US'} }, { toy: 'Transformers' } , { toy: [ { _attr: { knowing: 'half the battle' } }, 'GI Joe'] }, { toy: [ { name: 'He-man' }, { description: { _cdata: '<strong>Master of the Universe!</strong>'} } ] } ] } ];
console.log(xml(example5, { indent: true, declaration: true }));
/*
<?xml version="1.0" encoding="UTF-8" standalone="yes"?> //This output in comment is slightly different from actual due to boolean standalone
<toys decade="80s" locale="US">
    <toy>Transformers</toy>
    <toy knowing="half the battle">
        GI Joe
    </toy>
    <toy>
        <name>He-man</name>
        <description><![CDATA[<strong>Master of the Universe!</strong>]]></description>
    </toy>
</toys>
*/

console.log('\n===== Example 6 ====');
// Note: The ElementInstance type would ideally be exported from xml.ts for stronger typing here
const elem: any = XmlElement({ _attr: { decade: '80s', locale: 'US'} });
const xmlStream = xml({ toys: elem }, { stream: true, indent: true } ) as Stream; // Added stream:true based on original intent
xmlStream.on('data', function (chunk: string) {console.log("data:", chunk)});
elem.push({ toy: 'Transformers' });
elem.push({ toy: 'GI Joe' });
elem.push({ toy: [{name:'He-man'}] });
elem.close();

/*
Actual output for Example 6 with stream: true and indent: true will be chunked:
data: <toys decade="80s" locale="US">
data:
    <toy>Transformers</toy>
data:
    <toy>GI Joe</toy>
data:
    <toy>
        <name>He-man</name>
    </toy>
data:
</toys>
*/
