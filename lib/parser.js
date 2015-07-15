// Copy From https://github.com/webpack/html-loader/blob/master/lib/attributesParser.js
/*
    MIT License http://www.opensource.org/licenses/mit-license.php
    Author Tobias Koppers @sokra
*/

/*
    MIT License http://www.opensource.org/licenses/mit-license.php
    Modified by Tao Fei 
*/

var Parser = require("fastparse");

var processMatch = function(match, strUntilValue, name, value, index, matchLength) {
    if(!this.isRelevantTagAttr(this.currentTag, name)) return;
    this.currentResult = {
        attrStart: index,
        attrLength: matchLength,
        valueStart: index + strUntilValue.length,
        valueLength: value.length,
        value: value
    };
};

var processEndOfTag = function(match, selfClose, index, matchLength){
    if(this.currentResult.value){
        this.currentResult.tagName = this.currentTag;
        this.currentResult.close = selfClose.length > 0;
        this.currentResult.endAt = index + matchLength;
        this.results.push(this.currentResult);
    }
    this.currentResult = null;
    return "outside";
}

var parser = new Parser({
    outside: {
        "<!--.*?-->": true,
        "<![CDATA[.*?]]>": true,
        "<[!\\?].*?>": true,
        "<\/[^>]+>": true,
        "<([a-zA-Z\\-:]+)\\s*": function(match, tagName) {
            this.currentTag = tagName;
            this.currentResult = {};
            return "inside";
        }
    },
    inside: {
        "\\s+": true, // eat up whitespace
        "(/?)>": processEndOfTag,// end of attributes
        "(([a-zA-Z\\-]+)\\s*=\\s*\")([^\"]*)\"": processMatch,
        "(([a-zA-Z\\-]+)\\s*=\\s*\')([^\']*)\'": processMatch,
        "(([a-zA-Z\\-]+)\\s*=\\s*)([^\\s>]+)": processMatch
    }
});


module.exports = function parse(html, isRelevantTagAttr) {
    return parser.parse("outside", html, {
        currentTag: null,
        results: [],
        isRelevantTagAttr: isRelevantTagAttr
    }).results;
};
