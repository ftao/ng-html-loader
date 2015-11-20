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

function getHighResolutionURL(url) {
    var infix = '@2x';
    var parts = url.split('.');
    if (parts.length < 2){
        return url; 
    }
    parts[parts.length - 2] += infix;
    return parts.join('.');
}

module.exports = function(content) {
    this.cacheable && this.cacheable();
    var query = loaderUtils.parseQuery(this.query);
    var forceAbsolute = query.forceAbsolute;
    var checkRetina = query.checkRetina;
    var noRetinaSuffix = {
        'svg' : true
    }
    function requireRetina(path){
        var parts = path.split('.');
        if(parts.length >= 2){
            var suffix = parts[parts.length-1];
            return !(noRetinaSuffix[suffix] === true);
        }
        return true;
    }
    var attributes = ["ng-include", "ng-inline", "img:src"];
    var embedAttrs = ["ng-include", "ng-inline"];
    if(query.attrs !== undefined) {
        if(typeof query.attrs === "string"){
            attributes = query.attrs.split(" ");
        } else if(Array.isArray(query.attrs)){
            attributes = query.attrs;
        } else if(query.attrs === false){
            attributes = [];
        } else {
            throw new Error("Invalid value to query parameter attrs");
        }
    }
    var root = query.root;
    var links = attrParse(content, function(tag, attr) {
        if(attributes.indexOf(tag + ":" + attr) >= 0){
            return true;
        }
        if(attributes.indexOf(attr) >= 0){
            return true;
        }
        return false;
    });
    links.reverse();
    var data = {};
    content = [content];
    links.forEach(function(link) {
        //not ng-include / ng-inline
        if(embedAttrs.indexOf(link.attrName) < 0){
            if(!loaderUtils.isUrlRequest(link.value, root)) {
                return;
            }
        }

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
        if(embedAttrs.indexOf(link.attrName) >= 0){
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
        } else {
            var linkValueNext = link.valueStart + link.valueLength + 1;
            content.push(x.substr(linkValueNext));
            if(checkRetina && requireRetina(link.value)){
                var hrUrl = getHighResolutionURL(link.value);
                if(loaderUtils.isUrlRequest(hrUrl, root)){
                    do {
                        var ident2 = randomIdent();
                    } while(data[ident2]);
                    data[ident2] = hrUrl;
                    content.push('"');
                    content.push(ident2);
                    content.push(' data-at2x="');
                }
            }
            content.push(x.substr(linkValueNext-1, 1))
            content.push(ident);
            content.push(x.substr(0, link.valueStart));
        }
    });
    content.reverse();
    content = content.join("");
    return "module.exports = " + JSON.stringify(content).replace(/xxxNGINCLUDExxx[0-9\.]+xxx/g, function(match) {
        if(!data[match]) return match;
        return '" + require(' + JSON.stringify(loaderUtils.urlToRequest(data[match], root)) + ') + "';
    }) + ";";
}
