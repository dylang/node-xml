import escapeForXML from './escapeForXML';
import { Stream } from 'stream';

const DEFAULT_INDENT: string = '    ';

interface ElementAttributes {
    [key: string]: string | number | boolean;
}

interface CDataElement {
    _cdata: string;
}

interface ElementWithOptions {
    _attr?: ElementAttributes;
    _cdata?: string;
    // Content can be an array of strings, numbers, booleans, or other elements
    [key: string]: any; // For other element keys
}

type XmlInput = string | Record<string, any> | Array<Record<string, any> | string | number | boolean>;


interface XmlDeclarationOptions {
    encoding?: string;
    standalone?: string;
    version?: string; // version is usually '1.0'
}

interface XmlOptions {
    indent?: boolean | string;
    stream?: boolean;
    declaration?: XmlDeclarationOptions | boolean; // boolean for backward compatibility if only 'true' was passed
}

interface ResolvedElement {
    name?: string;
    attributes: string[];
    content: (ResolvedElement | string)[];
    indent?: string;
    icount: number;
    indents: string;
    interrupt: any | false; // Can be 'this' from element() or false
}

interface ElementInternal {
    name?: string;
    indent?: string;
    icount: number;
    indents: string;
    interrupt?: any; // Stores the 'element' instance for stream interruption
    append?: (interrupt: boolean, out?: string) => void;
    end?: () => void;
}

interface ElementInstance {
    _elem: ElementInternal;
    push: (input: XmlInput) => void;
    close: (input?: XmlInput) => void;
    // Internal properties that might be set by the xml function
    append?: (interrupt: boolean, out?: string) => void;
    end?: () => void;
}


function xml(input: XmlInput, options?: boolean | string | XmlOptions): string | Stream {

    let xmlOptions: XmlOptions;
    if (typeof options === 'object') {
        xmlOptions = options;
    } else {
        xmlOptions = {
            indent: options
        };
    }

    let stream: Stream | null = xmlOptions.stream ? new Stream() : null,
        output: string      = "",
        interrupted: boolean = false,
        indent: string      = !xmlOptions.indent ? ''
                        : xmlOptions.indent === true ? DEFAULT_INDENT
                            : xmlOptions.indent as string,
        instant: boolean     = true;


    function delay (func: () => void): void {
        if (!instant) {
            func();
        } else {
            process.nextTick(func);
        }
    }

    function append (interrupt: boolean, out?: string): void {
        if (out !== undefined) {
            output += out;
        }
        if (interrupt && !interrupted) {
            stream = stream || new Stream();
            if (stream && !stream.readable) stream.readable = true; // Ensure readable is set
            interrupted = true;
        }
        if (interrupt && interrupted && stream) {
            const data = output;
            delay(function () { stream!.emit('data', data) });
            output = "";
        }
    }

    function add (value: XmlInput, last?: () => void): void {
        format(append, resolve(value, indent, indent ? 1 : 0), last);
    }

    function end(): void {
        if (stream) {
            const data = output;
            delay(function () {
              stream!.emit('data', data);
              stream!.emit('end');
              if (stream) stream.readable = false;
              stream!.emit('close');
            });
        }
    }

    function addXmlDeclaration(declaration: XmlDeclarationOptions | true): void {
        const decl = declaration === true ? {} : declaration;
        const encoding = decl.encoding || 'UTF-8';
        const attr: ElementAttributes =  { version: '1.0', encoding: encoding };

        if (decl.standalone) {
            attr.standalone = decl.standalone;
        }

        add({'?xml': { _attr: attr } });
        output = output.replace('/>', '?>'); // XML declaration uses ?>
    }

    // disable delay
    delay(function () { instant = false });

    if (xmlOptions.declaration) {
        addXmlDeclaration(xmlOptions.declaration as (XmlDeclarationOptions | true));
    }

    if (input && Array.isArray(input)) {
        input.forEach(function (value, i) {
            let last: (() => void) | undefined;
            if (i + 1 === input.length)
                last = end;
            add(value, last);
        });
    } else {
        add(input, end);
    }

    if (stream) {
        if (!stream.readable) stream.readable = true; // Ensure readable if stream was created late
        return stream;
    }
    return output;
}

function element (...inputArgs: any[]): ElementInstance {
    const self: ElementInstance = {
            _elem:  resolve(inputArgs.length === 1 ? inputArgs[0] : inputArgs, '', 0) as ElementInternal, // Cast to ElementInternal
            push: function (inputPush: XmlInput): void {
                if (!this.append) { // 'this' refers to ElementInstance
                    throw new Error("not assigned to a parent!");
                }
                const that = this; // 'this' refers to ElementInstance
                const currentElem = this._elem as ElementInternal; // Ensure type
                const resolvedInput = resolve(
                    inputPush,
                    currentElem.indent,
                    currentElem.icount + (currentElem.indent ? 1 : 0)
                );
                format(this.append, resolvedInput,
                    function () { that.append!(true) }); // append is guaranteed by the check above
            },
            close: function (inputClose?: XmlInput): void { // 'this' refers to ElementInstance
                if (inputClose !== undefined) {
                    this.push(inputClose);
                }
                if (this.end) { // 'this' refers to ElementInstance
                    this.end();
                }
            }
        };
    // Ensure _elem is properly typed before returning
    if (self._elem && !(self._elem as ResolvedElement).attributes) {
        // If resolve returned a simple string or similar non-ResolvedElement structure
        // This case should ideally be handled better by resolve's return type or logic
        // For now, we'll assume resolve for element() always gives a structure with 'interrupt' potential
        const resolved = resolve(inputArgs.length === 1 ? inputArgs[0] : inputArgs, '', 0);
        self._elem = { // Default structure for ElementInternal
            name: typeof inputArgs[0] === 'string' ? inputArgs[0] : undefined, // Basic name detection
            attributes: [],
            content: [],
            icount: 0,
            indents: '',
            indent: '',
            interrupt: false, // Initial state
            ...resolved // Spread the resolved properties, may overwrite defaults
        } as ElementInternal;
    }
     self._elem.interrupt = self; // Assign the whole element instance to interrupt

    return self;
}

function create_indent(character: string, count: number): string {
    return (new Array(Math.max(0, count) + 1).join(character)) // Ensure count is not negative
}

function resolve(data: XmlInput, indent: string, indent_count: number): ResolvedElement | string {
    indent_count = indent_count || 0;
    const indent_spaces = create_indent(indent, indent_count);
    let name: string | undefined;
    let values: any = data; // Use any for now, narrow down inside
    let interrupt: any | false = false; // ElementInstance or false

    if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
        return escapeForXML(data);
    }


    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
        const keys = Object.keys(data);
        if (keys.length === 1 && !(data as ElementWithOptions)._attr && !(data as CDataElement)._cdata) {
            name = keys[0];
            values = (data as Record<string, any>)[name!];

            if (values && values._elem) { // This is an ElementInstance
                 const elemInstance = values as ElementInstance;
                 elemInstance._elem.name = name;
                 elemInstance._elem.icount = indent_count;
                 elemInstance._elem.indent = indent;
                 elemInstance._elem.indents = indent_spaces;
                 // elemInstance._elem.interrupt is already set to 'self' (the instance itself)
                 return elemInstance._elem as ResolvedElement; // It's an ElementInternal which fits ResolvedElement
            }
        } else {
            // It's an object with attributes or multiple keys, treat as root-level attributes/content
            values = data; // Process this object as a collection of elements or attributes
        }
    }


    const attributes: string[] = [];
    const content: (ResolvedElement | string)[] = [];
    let isStringContent: boolean | undefined = undefined;


    function get_attributes(obj: ElementAttributes): void{
        const keys = Object.keys(obj);
        keys.forEach(function(key){
            attributes.push(attribute(key, obj[key]));
        });
    }

    switch(typeof values) {
        case 'object':
            if (values === null) break;

            const opts = values as ElementWithOptions; // Type assertion

            if (opts._attr) {
                get_attributes(opts._attr);
            }

            if (opts._cdata) {
                content.push(
                    ('<![CDATA[' + opts._cdata).replace(/\]\]>/g, ']]]]><![CDATA[>') + ']]>'
                );
            }

            if (Array.isArray(values)) { // Direct array input or array content for an element
                isStringContent = false;
                if (values.length > 0) content.push(''); // Placeholder for potential leading mixed content
                values.forEach(function(value: any) {
                    if (typeof value === 'object' && value !== null) {
                        if (value._attr) { // Handle attributes object within an array
                            get_attributes(value._attr);
                        } else if (value._cdata) {
                             content.push(('<![CDATA[' + value._cdata).replace(/\]\]>/g, ']]]]><![CDATA[>') + ']]>');
                        } else {
                            if (content[content.length-1] === '') content.pop(); // Remove placeholder if object follows
                            content.push(resolve(
                                value, indent, indent_count + (indent ? 1 : 0)));
                            if (values.indexOf(value) < values.length -1 ) content.push(''); // Add placeholder back if more elements
                        }
                    } else {
                        // string, number, boolean
                        if (content[content.length-1] === '' && isStringContent === false) content.pop();
                        isStringContent=true;
                        content.push(escapeForXML(value));
                    }

                });
                if (content[content.length-1] === '' && !isStringContent) { // Trailing placeholder
                    content.pop();
                }
            } else if (typeof opts === 'object' && !opts._cdata && !opts._attr) { // Object representing child elements
                 Object.keys(opts).forEach(key => {
                    if (key !== '_attr' && key !== '_cdata') {
                        content.push(resolve({ [key]: opts[key] }, indent, indent_count + (indent ? 1 : 0)));
                    }
                });
            }
        break;

        default: // string, number, boolean (already escaped if it was the direct input to resolve)
            if (typeof values !== 'undefined') { // Ensure values is not undefined
                 content.push(escapeForXML(values));
            }
    }

    return {
        name:       name,
        interrupt:  interrupt,
        attributes: attributes,
        content:    content,
        icount:     indent_count,
        indents:    indent_spaces,
        indent:     indent
    };
}


function format(appendFunc: (interrupt: boolean, out?: string) => void, elem: ResolvedElement | string, end?: (() => void) | undefined): void {

    if (typeof elem === 'string') { // Changed from '!= object' to handle string directly
        return appendFunc(false, elem);
    }
    // Now elem is definitely ResolvedElement
    const resolvedElem = elem as ResolvedElement;


    const len = resolvedElem.interrupt ? 1 : resolvedElem.content.length;

    function proceed (): void {
        while (resolvedElem.content.length) {
            const value = resolvedElem.content.shift();

            if (value === undefined) continue;
            // Check if 'value' is an ElementInternal (which is a type of ResolvedElement) and has an interrupt property
            if (typeof value !== 'string' && value.interrupt && interrupt(value as ResolvedElement)) return;


            format(appendFunc, value, undefined); // end is not passed for content elements
        }

        appendFunc(false, (len > 1 && resolvedElem.name ? resolvedElem.indents : '') // No indent for single line text content unless it's a named element
            + (resolvedElem.name ? '</' + resolvedElem.name + '>' : '')
            + (resolvedElem.indent && resolvedElem.name && !end ? '\n' : '')); // Add newline if indenting, it's a named element, and not the final end

        if (end) {
            end();
        }
    }

    function interrupt(valueToInterrupt: ResolvedElement): boolean {
       // valueToInterrupt.interrupt here is the ElementInstance
       if (valueToInterrupt.interrupt && typeof valueToInterrupt.interrupt.push === 'function') {
           const elementInstance = valueToInterrupt.interrupt as ElementInstance;
           elementInstance.append = appendFunc;
           elementInstance.end = proceed;
           valueToInterrupt.interrupt = false; // Clear interrupt flag on the ResolvedElement (which is _elem of ElementInstance)
           appendFunc(true); // Signal interruption for stream
           return true;
       }
       return false;
    }

    appendFunc(false, resolvedElem.indents
        + (resolvedElem.name ? '<' + resolvedElem.name : '')
        + (resolvedElem.attributes.length ? ' ' + resolvedElem.attributes.join(' ') : '')
        + (len || resolvedElem.content.length > 0 ? (resolvedElem.name ? '>' : '') : (resolvedElem.name ? '/>' : '')) // content.length check for empty elements like <tag></tag> vs <tag/>
        + (resolvedElem.indent && len > 1 && resolvedElem.name ? '\n' : '')); // Add newline if indenting, multi-content, and it's a named element

    if (!len && resolvedElem.name) { // Handles <tag/>
         appendFunc(false, resolvedElem.indent ? '\n' : '');
         if (end) end();
         return;
    }
    if (!resolvedElem.name && resolvedElem.content.length === 0) { // Handles empty input or pure attributes object
        if (end) end();
        return;
    }


    if (typeof resolvedElem !== 'string' && !interrupt(resolvedElem)) {
        proceed();
    }
}

function attribute(key: string, value: string | number | boolean): string {
    return key + '=' + '"' + escapeForXML(value) + '"';
}

export default xml;
export { element, element as Element };
