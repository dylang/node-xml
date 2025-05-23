# xml

[![NPM](https://nodei.co/npm/xml.png?downloads=true)](https://nodei.co/npm/xml/)

> Fast and simple TypeScript-based XML generator/builder for Node, Deno, and Bun projects.

## Install

   $ npm install xml

## API

### `xml(xmlObject, options)`

Returns an XML string.

```typescript
import xml from 'xml';

const xmlString = xml(xmlObject, options);
```

#### `xmlObject`

`xmlObject` is a normal JavaScript/TypeScript Object that defines the data for the XML string.

Keys will become tag names.
Values can be an `array of xmlObjects` or a value such as a `string` or `number`.

```typescript
xml({a: 1}); // Output: '<a>1</a>'
xml({nested: [{ keys: [{ fun: 'hi' }]}]}); // Output: '<nested><keys><fun>hi</fun></keys></nested>'
```

There are two special keys:

`_attr`

Set attributes using a hash of key/value pairs.

```typescript
xml({a: [{ _attr: { attributes: 'are fun', too: '!' }}, 1]}); // Output: '<a attributes="are fun" too="!">1</a>'
```
`_cdata`

Value of `_cdata` is wrapped in xml `<![CDATA[]]>` so the data does not need to be escaped.

```typescript
xml({a: { _cdata: "i'm not escaped: <xml>!"}}); // Output: '<a><![CDATA[i\'m not escaped: <xml>!]]></a>'
```

Mixed together:
```typescript
xml({a: { _attr: { attr:'hi'}, _cdata: "I'm not escaped" }}); // Output: '<a attr="hi"><![CDATA[I\'m not escaped]]></a>'
```

#### `options`

`indent` _optional_ **string | boolean** What to use as a tab. Defaults to no tabs (compressed).
 For example you can use `'\t'` for tab character, `'  '` for two-space tabs, or `true` for the default of 4 spaces.

`stream` _optional_ **boolean** Return the result as a `ReadableStream`. Defaults to `false`.

**Stream Example**

```typescript
import xml, { Element } from 'xml'; // Use 'element' if you prefer lowercase

const elem = Element({ _attr: { decade: '80s', locale: 'US'} });
const stream = xml({ toys: elem }, { stream: true, indent: true }); // indent added for readability

stream.on('data', function (chunk: string) {
    console.log("data:", chunk);
});

elem.push({ toy: 'Transformers' });
elem.push({ toy: 'GI Joe' });
elem.push({ toy: [{name:'He-man'}] });
elem.close();

/*
Actual output will be chunked, for example:
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
```

`declaration` _optional_ Add default xml declaration as first node.

_options_ (passed as an object `{}`):
* `encoding`: string (e.g., 'UTF-8', 'UTF-16')
* `standalone`: string (e.g., 'yes', 'no')

**Declaration Example**

```typescript
import xml from 'xml';

xml([{ a: 'test' }], { declaration: true });
// result: '<?xml version="1.0" encoding="UTF-8"?><a>test</a>'

xml([{ a: 'test' }], { declaration: { standalone: 'yes', encoding: 'UTF-16' }});
// result: '<?xml version="1.0" encoding="UTF-16" standalone="yes"?><a>test</a>'
```

## Examples

The following examples demonstrate basic usage. For more, see the `examples` directory.

**Simple Example**

```typescript
import xml from 'xml';

const example1 = [{ url: 'http://www.google.com/search?aq=f&sourceid=chrome&ie=UTF-8&q=opower' }];
console.log(xml(example1));
// <url>http://www.google.com/search?aq=f&amp;sourceid=chrome&amp;ie=UTF-8&amp;q=opower</url>
```

**Example with attributes**

```typescript
import xml from 'xml';

const example2 = [{ url: { _attr: { hostname: 'www.google.com', path: '/search?aq=f&sourceid=chrome&ie=UTF-8&q=opower' } } }];
console.log(xml(example2));
// <url hostname="www.google.com" path="/search?aq=f&amp;sourceid=chrome&amp;ie=UTF-8&amp;q=opower"/>
```

**Example with array of same-named elements and nice formatting**

```typescript
import xml from 'xml';

const example3 = [{ toys: [{ toy: 'Transformers' }, { toy: 'GI Joe' }, { toy: 'He-man' }] }];
console.log(xml(example3));
// <toys><toy>Transformers</toy><toy>GI Joe</toy><toy>He-man</toy></toys>

console.log(xml(example3, { indent: true }));
/*
Output:
<toys>
    <toy>Transformers</toy>
    <toy>GI Joe</toy>
    <toy>He-man</toy>
</toys>
*/
```

**More complex example**

```typescript
import xml from 'xml';

const example4 = [{ toys: [{ _attr: { decade: '80s', locale: 'US'} }, { toy: 'Transformers' }, { toy: 'GI Joe' }, { toy: 'He-man' }] }];
console.log(xml(example4, { indent: true }));
/*
Output:
<toys decade="80s" locale="US">
    <toy>Transformers</toy>
    <toy>GI Joe</toy>
    <toy>He-man</toy>
</toys>
*/
```

**Even more complex example**

```typescript
import xml from 'xml';

const example5 = [{ toys: [{ _attr: { decade: '80s', locale: 'US'} }, { toy: 'Transformers' }, { toy: [{ _attr: { knowing: 'half the battle' } }, 'GI Joe'] }, { toy: [{ name: 'He-man' }, { description: { _cdata: '<strong>Master of the Universe!</strong>'} }] }] }];
console.log(xml(example5, { indent: true }));
/*
Output:
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
```

## Tests

Tests are written using [Vitest](https://vitest.dev/). Use `npm test` to run the tests.

    $ npm test

## Usage with Bun and Deno

This library is ESM compatible and can be used with modern JavaScript runtimes.

### Bun

Bun can typically run TypeScript files directly.

```typescript
// example.ts
import xml, { Element } from 'xml';

const myXml = xml({ greeting: 'Hello Bun!' });
console.log(myXml);
```
```bash
bun run example.ts
```

### Deno

Deno runs TypeScript directly and handles ESM modules. You can import modules using URLs or by using an [import map](https://deno.land/manual@v1.x/basics/import_maps).

For published NPM packages, Deno can import them using the `npm:` specifier:

```typescript
// example.ts
import xml, { Element } from 'npm:xml';

const myXml = xml({ greeting: 'Hello Deno from NPM!' });
console.log(myXml);
```
```bash
deno run --allow-net --allow-read example.ts
```
*Note: `--allow-net` is required for `npm:` specifiers to fetch the package information and files. `--allow-read` might be needed if the package itself performs file system operations that require permission (though `xml` itself primarily operates in memory).*

Alternatively, when developing locally or importing directly from a Git repository, you can use relative paths or URLs:
```typescript
// example.ts
// Adjust path as needed if your example.ts is outside the project root.
import xml, { Element } from './lib/xml.ts'; 

const myXml = xml({ greeting: 'Hello Deno!' });
console.log(myXml);
```
```bash
deno run example.ts
```


## Examples

There are more examples in the `examples` directory.

# Contributing

Contributions to the project are welcome. Feel free to fork and improve. I accept pull requests when tests are included.
