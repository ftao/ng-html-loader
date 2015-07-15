// https://github.com/webpack/html-loader/blob/master/index.js
/*
    MIT License http://www.opensource.org/licenses/mit-license.php
    Author Tobias Koppers @sokra
*/

/*
    MIT License http://www.opensource.org/licenses/mit-license.php
    Modified by Tao Fei 
*/

var attrParse = require("./lib/parser");
var loaderUtils = require("loader-utils");

function randomIdent() {
    return "xxxNGINCLUDExxx" + Math.random() + Math.random() + "xxx";
};


module.exports = function(content) {
    this.cacheable && this.cacheable();
    var query = loaderUtils.parseQuery(this.query);
    var forceAbsolute = query.forceAbsolute;
    var attributes = ["ng-include", "ng-inline"];
    if(query.attrs !== undefined) {
        if(typeof query.attrs === "string")
            attributes = query.attrs.split(" ");
        else if(Array.isArray(query.attrs))
            attributes = query.attrs;
        else if(query.attrs === false)
            attributes = [];
        else
            throw new Error("Invalid value to query parameter attrs");
    }
    var root = query.root;
    var links = attrParse(content, function(tag, attr) {
        return attributes.indexOf(attr) >= 0;
    });
    links.reverse();
    var data = {};
    content = [content];
    links.forEach(function(link) {
        var value = link.value;
        if(link.value && link.value[0] == "'" && link.value[link.value.length-1] == "'"){
            link.value = link.value.slice(1, link.value.length-1);
        }
        if(link.value && link.value[0] != '/' && forceAbsolute){
            link.value = '/' + link.value;
        }

        do {
            var ident = randomIdent();
        } while(data[ident]);
        data[ident] = link.value;
        var x = content.pop();
        content.push(x.substr(link.endAt));
        if(link.close){
            content.push("</" + link.tagName + ">");
            content.push(ident);
            content.push(">");
            content.push(x.slice(link.attrStart + link.attrLength, link.endAt-2));
        } else {
            content.push(ident);
            content.push(x.slice(link.attrStart + link.attrLength, link.endAt));
        }
        content.push(x.substr(0, link.attrStart));
    });
    content.reverse();
    content = content.join("");
    return "module.exports = " + JSON.stringify(content).replace(/xxxNGINCLUDExxx[0-9\.]+xxx/g, function(match) {
        if(!data[match]) return match;
        return '" + require(' + JSON.stringify(loaderUtils.urlToRequest(data[match], root)) + ') + "';
    }) + ";";
}
