// To run: tsx examples/server.ts
import http from 'http';
import XML, { Element as XmlElement } from '../lib/xml';
import { Stream } from 'stream';
import { AddressInfo } from 'net';

const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
    res.writeHead(200, {"Content-Type": "text/xml"});

    // Note: The ElementInstance type would ideally be exported from xml.ts for stronger typing here
    const elem: any = XmlElement({ _attr: { decade: '80s', locale: 'US'} });
    const xmlStream: Stream = XML({ toys: elem }, {indent:true, stream:true});

    res.write('<?xml version="1.0" encoding="utf-8"?>\n');

    xmlStream.pipe(res);

    process.nextTick(function () {
        elem.push({ toy: 'Transformers' });
        elem.push({ toy: 'GI Joe' });
        elem.push({ toy: [{name:'He-man'}] });
        elem.close();
    });

});

server.listen(parseInt(process.env.PORT || "3000") || 3000);

const address = server.address();
if (address && typeof address !== 'string') {
    console.log("server listening on port %d ...", (address as AddressInfo).port);
} else {
    console.log("server listening on %s", address);
}
