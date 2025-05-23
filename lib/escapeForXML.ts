
const XML_CHARACTER_MAP: Record<string, string> = {
    '&': '&amp;',
    '"': '&quot;',
    "'": '&apos;',
    '<': '&lt;',
    '>': '&gt;'
};

function escapeForXML(string: any): any {
    return string && string.replace
        ? string.replace(/([&"<>'])/g, function(str: string, item: string) {
            return XML_CHARACTER_MAP[item];
          })
        : string;
}

export default escapeForXML;
