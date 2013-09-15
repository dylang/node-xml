var xml = require('../lib/xml');


var example1 = { url: 'http://www.google.com/search?aq=f&sourceid=chrome&ie=UTF-8&q=opower' };
console.log(xml(example1));
//<url>http://www.google.com/search?aq=f&amp;sourceid=chrome&amp;ie=UTF-8&amp;q=opower</url>

var example2 = [ { url: { _attr: { hostname: 'www.google.com', path: '/search?aq=f&sourceid=chrome&ie=UTF-8&q=opower' }  } } ];
console.log(xml(example2));
//<url hostname="www.google.com" path="/search?aq=f&amp;sourceid=chrome&amp;ie=UTF-8&amp;q=opower"/>

var example3 = [ { toys: [ { toy: 'Transformers' } , { toy: 'GI Joe' }, { toy: 'He-man' } ] } ];
console.log(xml(example3));
//<toys><toy>Transformers</toy><toy>GI Joe</toy><toy>He-man</toy></toys>
console.log(xml(example3, true));
/*
<toys>
    <toy>Transformers</toy>
    <toy>GI Joe</toy>
    <toy>He-man</toy>
</toys>
*/

var example4 = [ { toys: [ { _attr: { decade: '80s', locale: 'US'} }, { toy: 'Transformers' } , { toy: 'GI Joe' }, { toy: 'He-man' } ] } ];
console.log(xml(example4, true));
/*
<toys decade="80s" locale="US">
    <toy>Transformers</toy>
    <toy>GI Joe</toy>
    <toy>He-man</toy>
</toys>
*/

var example5 = [ { toys: [ { _attr: { decade: '80s', locale: 'US'} }, { toy: 'Transformers' } , { toy: [ { _attr: { knowing: 'half the battle' } }, 'GI Joe'] }, { toy: [ { name: 'He-man' }, { description: { _cdata: '<strong>Master of the Universe!</strong>'} } ] } ] } ];
console.log(xml(example5, true));
/*
<toys><toy>Transformers</toy><toy>GI Joe</toy><toy>He-man</toy></toys>
<toys>
    <toy>Transformers</toy>
    <toy>GI Joe</toy>
    <toy>He-man</toy>
</toys>
<toys decade="80s" locale="US">
    <toy>Transformers</toy>
    <toy>GI Joe</toy>
    <toy>He-man</toy>
</toys>
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

var elem = xml.Element({ _attr: { decade: '80s', locale: 'US'} });
var xmlStream = xml({ toys: elem }, true);
xmlStream.on('data', function (chunk) {console.log("data:", chunk)});
elem.push({ toy: 'Transformers' });
elem.push({ toy: 'GI Joe' });
elem.push({ toy: [{name:'He-man'}] });
elem.close();

/*
data: <toys decade="80s" locale="US">
data:     <toy>Transformers</toy>
data:     <toy>GI Joe</toy>
data:     <toy>
        <name>He-man</name>
    </toy>
data: </toys>
*/
