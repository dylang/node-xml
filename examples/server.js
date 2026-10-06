var https = require('https'),
    fs = require('fs'),
    path = require('path'),
    XML = require('../lib/xml');

var privateKey = fs.readFileSync(path.join(__dirname, 'server.key'), 'utf8');
var certificate = fs.readFileSync(path.join(__dirname, 'server.crt'), 'utf8');

var options = {
    key: privateKey,
    cert: certificate
};

var server = https.createServer(options, function(req, res) {
    res.writeHead(200, {"Content-Type": "text/xml"});

    var elem = XML.Element({ _attr: { decade: '80s', locale: 'US'} });
    var xml = XML({ toys: elem }, {indent:true, stream:true});

    res.write('<?xml version="1.0" encoding="utf-8"?>\n');

    xml.pipe(res);

    process.nextTick(function () {
        elem.push({ toy: 'Transformers' });
        elem.push({ toy: 'GI Joe' });
        elem.push({ toy: [{name:'He-man'}] });
        elem.close();
    });

});

server.listen(parseInt(process.env.PORT) || 3000);
console.log("server listening on port %d …", server.address().port);