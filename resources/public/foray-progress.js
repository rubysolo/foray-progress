var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.evalWorksForGlobals_ = null;
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.getObjectByName(name) && !goog.implicitNamespaces_[name]) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.require = function(rule) {
  if(!COMPILED) {
    if(goog.getObjectByName(rule)) {
      return
    }
    var path = goog.getPathFromDeps_(rule);
    if(path) {
      goog.included_[path] = true;
      goog.writeScripts_()
    }else {
      var errorMessage = "goog.require could not find: " + rule;
      if(goog.global.console) {
        goog.global.console["error"](errorMessage)
      }
      throw Error(errorMessage);
    }
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(requireName in deps.nameToPath) {
            visitNode(deps.nameToPath[requireName])
          }else {
            if(!goog.getObjectByName(requireName)) {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  var context = selfObj || goog.global;
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(context, newArgs)
    }
  }else {
    return function() {
      return fn.apply(context, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = style
};
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global && !goog.string.contains(str, "<")) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var el = goog.global["document"]["createElement"]("div");
  el["innerHTML"] = "<pre>x" + str + "</pre>";
  if(el["firstChild"][goog.string.NORMALIZE_FN_]) {
    el["firstChild"][goog.string.NORMALIZE_FN_]()
  }
  str = el["firstChild"]["firstChild"]["nodeValue"].slice(1);
  el["innerHTML"] = "";
  return goog.string.canonicalizeNewlines(str)
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.NORMALIZE_FN_ = "normalize";
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
void 0;
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  if(p[goog.typeOf(x)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
void 0;
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error(["No protocol method ", proto, " defined for type ", goog.typeOf(obj), ": ", obj].join(""))
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
void 0;
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__6274__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__6274 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6274__delegate.call(this, array, i, idxs)
    };
    G__6274.cljs$lang$maxFixedArity = 2;
    G__6274.cljs$lang$applyTo = function(arglist__6275) {
      var array = cljs.core.first(arglist__6275);
      var i = cljs.core.first(cljs.core.next(arglist__6275));
      var idxs = cljs.core.rest(cljs.core.next(arglist__6275));
      return G__6274__delegate(array, i, idxs)
    };
    G__6274.cljs$lang$arity$variadic = G__6274__delegate;
    return G__6274
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
void 0;
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
void 0;
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3941__auto____6339 = this$;
      if(and__3941__auto____6339) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3941__auto____6339
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      return function() {
        var or__3943__auto____6340 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____6340) {
          return or__3943__auto____6340
        }else {
          var or__3943__auto____6341 = cljs.core._invoke["_"];
          if(or__3943__auto____6341) {
            return or__3943__auto____6341
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3941__auto____6342 = this$;
      if(and__3941__auto____6342) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3941__auto____6342
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      return function() {
        var or__3943__auto____6343 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____6343) {
          return or__3943__auto____6343
        }else {
          var or__3943__auto____6344 = cljs.core._invoke["_"];
          if(or__3943__auto____6344) {
            return or__3943__auto____6344
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3941__auto____6345 = this$;
      if(and__3941__auto____6345) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3941__auto____6345
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      return function() {
        var or__3943__auto____6346 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____6346) {
          return or__3943__auto____6346
        }else {
          var or__3943__auto____6347 = cljs.core._invoke["_"];
          if(or__3943__auto____6347) {
            return or__3943__auto____6347
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3941__auto____6348 = this$;
      if(and__3941__auto____6348) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3941__auto____6348
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      return function() {
        var or__3943__auto____6349 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____6349) {
          return or__3943__auto____6349
        }else {
          var or__3943__auto____6350 = cljs.core._invoke["_"];
          if(or__3943__auto____6350) {
            return or__3943__auto____6350
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3941__auto____6351 = this$;
      if(and__3941__auto____6351) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3941__auto____6351
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      return function() {
        var or__3943__auto____6352 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____6352) {
          return or__3943__auto____6352
        }else {
          var or__3943__auto____6353 = cljs.core._invoke["_"];
          if(or__3943__auto____6353) {
            return or__3943__auto____6353
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3941__auto____6354 = this$;
      if(and__3941__auto____6354) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3941__auto____6354
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3943__auto____6355 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____6355) {
          return or__3943__auto____6355
        }else {
          var or__3943__auto____6356 = cljs.core._invoke["_"];
          if(or__3943__auto____6356) {
            return or__3943__auto____6356
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3941__auto____6357 = this$;
      if(and__3941__auto____6357) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3941__auto____6357
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3943__auto____6358 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____6358) {
          return or__3943__auto____6358
        }else {
          var or__3943__auto____6359 = cljs.core._invoke["_"];
          if(or__3943__auto____6359) {
            return or__3943__auto____6359
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3941__auto____6360 = this$;
      if(and__3941__auto____6360) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3941__auto____6360
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3943__auto____6361 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____6361) {
          return or__3943__auto____6361
        }else {
          var or__3943__auto____6362 = cljs.core._invoke["_"];
          if(or__3943__auto____6362) {
            return or__3943__auto____6362
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3941__auto____6363 = this$;
      if(and__3941__auto____6363) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3941__auto____6363
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3943__auto____6364 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____6364) {
          return or__3943__auto____6364
        }else {
          var or__3943__auto____6365 = cljs.core._invoke["_"];
          if(or__3943__auto____6365) {
            return or__3943__auto____6365
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3941__auto____6366 = this$;
      if(and__3941__auto____6366) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3941__auto____6366
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3943__auto____6367 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____6367) {
          return or__3943__auto____6367
        }else {
          var or__3943__auto____6368 = cljs.core._invoke["_"];
          if(or__3943__auto____6368) {
            return or__3943__auto____6368
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3941__auto____6369 = this$;
      if(and__3941__auto____6369) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3941__auto____6369
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3943__auto____6370 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____6370) {
          return or__3943__auto____6370
        }else {
          var or__3943__auto____6371 = cljs.core._invoke["_"];
          if(or__3943__auto____6371) {
            return or__3943__auto____6371
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3941__auto____6372 = this$;
      if(and__3941__auto____6372) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3941__auto____6372
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3943__auto____6373 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____6373) {
          return or__3943__auto____6373
        }else {
          var or__3943__auto____6374 = cljs.core._invoke["_"];
          if(or__3943__auto____6374) {
            return or__3943__auto____6374
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3941__auto____6375 = this$;
      if(and__3941__auto____6375) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3941__auto____6375
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3943__auto____6376 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____6376) {
          return or__3943__auto____6376
        }else {
          var or__3943__auto____6377 = cljs.core._invoke["_"];
          if(or__3943__auto____6377) {
            return or__3943__auto____6377
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3941__auto____6378 = this$;
      if(and__3941__auto____6378) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3941__auto____6378
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3943__auto____6379 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____6379) {
          return or__3943__auto____6379
        }else {
          var or__3943__auto____6380 = cljs.core._invoke["_"];
          if(or__3943__auto____6380) {
            return or__3943__auto____6380
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3941__auto____6381 = this$;
      if(and__3941__auto____6381) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3941__auto____6381
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3943__auto____6382 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____6382) {
          return or__3943__auto____6382
        }else {
          var or__3943__auto____6383 = cljs.core._invoke["_"];
          if(or__3943__auto____6383) {
            return or__3943__auto____6383
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3941__auto____6384 = this$;
      if(and__3941__auto____6384) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3941__auto____6384
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3943__auto____6385 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____6385) {
          return or__3943__auto____6385
        }else {
          var or__3943__auto____6386 = cljs.core._invoke["_"];
          if(or__3943__auto____6386) {
            return or__3943__auto____6386
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3941__auto____6387 = this$;
      if(and__3941__auto____6387) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3941__auto____6387
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3943__auto____6388 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____6388) {
          return or__3943__auto____6388
        }else {
          var or__3943__auto____6389 = cljs.core._invoke["_"];
          if(or__3943__auto____6389) {
            return or__3943__auto____6389
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3941__auto____6390 = this$;
      if(and__3941__auto____6390) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3941__auto____6390
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3943__auto____6391 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____6391) {
          return or__3943__auto____6391
        }else {
          var or__3943__auto____6392 = cljs.core._invoke["_"];
          if(or__3943__auto____6392) {
            return or__3943__auto____6392
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3941__auto____6393 = this$;
      if(and__3941__auto____6393) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3941__auto____6393
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3943__auto____6394 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____6394) {
          return or__3943__auto____6394
        }else {
          var or__3943__auto____6395 = cljs.core._invoke["_"];
          if(or__3943__auto____6395) {
            return or__3943__auto____6395
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3941__auto____6396 = this$;
      if(and__3941__auto____6396) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3941__auto____6396
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3943__auto____6397 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____6397) {
          return or__3943__auto____6397
        }else {
          var or__3943__auto____6398 = cljs.core._invoke["_"];
          if(or__3943__auto____6398) {
            return or__3943__auto____6398
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3941__auto____6399 = this$;
      if(and__3941__auto____6399) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3941__auto____6399
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3943__auto____6400 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____6400) {
          return or__3943__auto____6400
        }else {
          var or__3943__auto____6401 = cljs.core._invoke["_"];
          if(or__3943__auto____6401) {
            return or__3943__auto____6401
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
void 0;
void 0;
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3941__auto____6405 = coll;
    if(and__3941__auto____6405) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3941__auto____6405
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6406 = cljs.core._count[goog.typeOf(coll)];
      if(or__3943__auto____6406) {
        return or__3943__auto____6406
      }else {
        var or__3943__auto____6407 = cljs.core._count["_"];
        if(or__3943__auto____6407) {
          return or__3943__auto____6407
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3941__auto____6411 = coll;
    if(and__3941__auto____6411) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3941__auto____6411
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6412 = cljs.core._empty[goog.typeOf(coll)];
      if(or__3943__auto____6412) {
        return or__3943__auto____6412
      }else {
        var or__3943__auto____6413 = cljs.core._empty["_"];
        if(or__3943__auto____6413) {
          return or__3943__auto____6413
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3941__auto____6417 = coll;
    if(and__3941__auto____6417) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3941__auto____6417
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    return function() {
      var or__3943__auto____6418 = cljs.core._conj[goog.typeOf(coll)];
      if(or__3943__auto____6418) {
        return or__3943__auto____6418
      }else {
        var or__3943__auto____6419 = cljs.core._conj["_"];
        if(or__3943__auto____6419) {
          return or__3943__auto____6419
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
void 0;
void 0;
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3941__auto____6426 = coll;
      if(and__3941__auto____6426) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3941__auto____6426
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      return function() {
        var or__3943__auto____6427 = cljs.core._nth[goog.typeOf(coll)];
        if(or__3943__auto____6427) {
          return or__3943__auto____6427
        }else {
          var or__3943__auto____6428 = cljs.core._nth["_"];
          if(or__3943__auto____6428) {
            return or__3943__auto____6428
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3941__auto____6429 = coll;
      if(and__3941__auto____6429) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3941__auto____6429
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      return function() {
        var or__3943__auto____6430 = cljs.core._nth[goog.typeOf(coll)];
        if(or__3943__auto____6430) {
          return or__3943__auto____6430
        }else {
          var or__3943__auto____6431 = cljs.core._nth["_"];
          if(or__3943__auto____6431) {
            return or__3943__auto____6431
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
void 0;
void 0;
cljs.core.ASeq = {};
void 0;
void 0;
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3941__auto____6435 = coll;
    if(and__3941__auto____6435) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3941__auto____6435
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6436 = cljs.core._first[goog.typeOf(coll)];
      if(or__3943__auto____6436) {
        return or__3943__auto____6436
      }else {
        var or__3943__auto____6437 = cljs.core._first["_"];
        if(or__3943__auto____6437) {
          return or__3943__auto____6437
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3941__auto____6441 = coll;
    if(and__3941__auto____6441) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3941__auto____6441
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6442 = cljs.core._rest[goog.typeOf(coll)];
      if(or__3943__auto____6442) {
        return or__3943__auto____6442
      }else {
        var or__3943__auto____6443 = cljs.core._rest["_"];
        if(or__3943__auto____6443) {
          return or__3943__auto____6443
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3941__auto____6447 = coll;
    if(and__3941__auto____6447) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3941__auto____6447
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6448 = cljs.core._next[goog.typeOf(coll)];
      if(or__3943__auto____6448) {
        return or__3943__auto____6448
      }else {
        var or__3943__auto____6449 = cljs.core._next["_"];
        if(or__3943__auto____6449) {
          return or__3943__auto____6449
        }else {
          throw cljs.core.missing_protocol.call(null, "INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3941__auto____6456 = o;
      if(and__3941__auto____6456) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3941__auto____6456
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      return function() {
        var or__3943__auto____6457 = cljs.core._lookup[goog.typeOf(o)];
        if(or__3943__auto____6457) {
          return or__3943__auto____6457
        }else {
          var or__3943__auto____6458 = cljs.core._lookup["_"];
          if(or__3943__auto____6458) {
            return or__3943__auto____6458
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3941__auto____6459 = o;
      if(and__3941__auto____6459) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3941__auto____6459
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      return function() {
        var or__3943__auto____6460 = cljs.core._lookup[goog.typeOf(o)];
        if(or__3943__auto____6460) {
          return or__3943__auto____6460
        }else {
          var or__3943__auto____6461 = cljs.core._lookup["_"];
          if(or__3943__auto____6461) {
            return or__3943__auto____6461
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
void 0;
void 0;
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3941__auto____6465 = coll;
    if(and__3941__auto____6465) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3941__auto____6465
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    return function() {
      var or__3943__auto____6466 = cljs.core._contains_key_QMARK_[goog.typeOf(coll)];
      if(or__3943__auto____6466) {
        return or__3943__auto____6466
      }else {
        var or__3943__auto____6467 = cljs.core._contains_key_QMARK_["_"];
        if(or__3943__auto____6467) {
          return or__3943__auto____6467
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3941__auto____6471 = coll;
    if(and__3941__auto____6471) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3941__auto____6471
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    return function() {
      var or__3943__auto____6472 = cljs.core._assoc[goog.typeOf(coll)];
      if(or__3943__auto____6472) {
        return or__3943__auto____6472
      }else {
        var or__3943__auto____6473 = cljs.core._assoc["_"];
        if(or__3943__auto____6473) {
          return or__3943__auto____6473
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
void 0;
void 0;
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3941__auto____6477 = coll;
    if(and__3941__auto____6477) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3941__auto____6477
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    return function() {
      var or__3943__auto____6478 = cljs.core._dissoc[goog.typeOf(coll)];
      if(or__3943__auto____6478) {
        return or__3943__auto____6478
      }else {
        var or__3943__auto____6479 = cljs.core._dissoc["_"];
        if(or__3943__auto____6479) {
          return or__3943__auto____6479
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
void 0;
void 0;
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3941__auto____6483 = coll;
    if(and__3941__auto____6483) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3941__auto____6483
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6484 = cljs.core._key[goog.typeOf(coll)];
      if(or__3943__auto____6484) {
        return or__3943__auto____6484
      }else {
        var or__3943__auto____6485 = cljs.core._key["_"];
        if(or__3943__auto____6485) {
          return or__3943__auto____6485
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3941__auto____6489 = coll;
    if(and__3941__auto____6489) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3941__auto____6489
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6490 = cljs.core._val[goog.typeOf(coll)];
      if(or__3943__auto____6490) {
        return or__3943__auto____6490
      }else {
        var or__3943__auto____6491 = cljs.core._val["_"];
        if(or__3943__auto____6491) {
          return or__3943__auto____6491
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3941__auto____6495 = coll;
    if(and__3941__auto____6495) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3941__auto____6495
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    return function() {
      var or__3943__auto____6496 = cljs.core._disjoin[goog.typeOf(coll)];
      if(or__3943__auto____6496) {
        return or__3943__auto____6496
      }else {
        var or__3943__auto____6497 = cljs.core._disjoin["_"];
        if(or__3943__auto____6497) {
          return or__3943__auto____6497
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
void 0;
void 0;
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3941__auto____6501 = coll;
    if(and__3941__auto____6501) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3941__auto____6501
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6502 = cljs.core._peek[goog.typeOf(coll)];
      if(or__3943__auto____6502) {
        return or__3943__auto____6502
      }else {
        var or__3943__auto____6503 = cljs.core._peek["_"];
        if(or__3943__auto____6503) {
          return or__3943__auto____6503
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3941__auto____6507 = coll;
    if(and__3941__auto____6507) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3941__auto____6507
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6508 = cljs.core._pop[goog.typeOf(coll)];
      if(or__3943__auto____6508) {
        return or__3943__auto____6508
      }else {
        var or__3943__auto____6509 = cljs.core._pop["_"];
        if(or__3943__auto____6509) {
          return or__3943__auto____6509
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3941__auto____6513 = coll;
    if(and__3941__auto____6513) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3941__auto____6513
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    return function() {
      var or__3943__auto____6514 = cljs.core._assoc_n[goog.typeOf(coll)];
      if(or__3943__auto____6514) {
        return or__3943__auto____6514
      }else {
        var or__3943__auto____6515 = cljs.core._assoc_n["_"];
        if(or__3943__auto____6515) {
          return or__3943__auto____6515
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
void 0;
void 0;
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3941__auto____6519 = o;
    if(and__3941__auto____6519) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3941__auto____6519
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    return function() {
      var or__3943__auto____6520 = cljs.core._deref[goog.typeOf(o)];
      if(or__3943__auto____6520) {
        return or__3943__auto____6520
      }else {
        var or__3943__auto____6521 = cljs.core._deref["_"];
        if(or__3943__auto____6521) {
          return or__3943__auto____6521
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3941__auto____6525 = o;
    if(and__3941__auto____6525) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3941__auto____6525
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    return function() {
      var or__3943__auto____6526 = cljs.core._deref_with_timeout[goog.typeOf(o)];
      if(or__3943__auto____6526) {
        return or__3943__auto____6526
      }else {
        var or__3943__auto____6527 = cljs.core._deref_with_timeout["_"];
        if(or__3943__auto____6527) {
          return or__3943__auto____6527
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
void 0;
void 0;
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3941__auto____6531 = o;
    if(and__3941__auto____6531) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3941__auto____6531
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    return function() {
      var or__3943__auto____6532 = cljs.core._meta[goog.typeOf(o)];
      if(or__3943__auto____6532) {
        return or__3943__auto____6532
      }else {
        var or__3943__auto____6533 = cljs.core._meta["_"];
        if(or__3943__auto____6533) {
          return or__3943__auto____6533
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3941__auto____6537 = o;
    if(and__3941__auto____6537) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3941__auto____6537
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    return function() {
      var or__3943__auto____6538 = cljs.core._with_meta[goog.typeOf(o)];
      if(or__3943__auto____6538) {
        return or__3943__auto____6538
      }else {
        var or__3943__auto____6539 = cljs.core._with_meta["_"];
        if(or__3943__auto____6539) {
          return or__3943__auto____6539
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
void 0;
void 0;
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3941__auto____6546 = coll;
      if(and__3941__auto____6546) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3941__auto____6546
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      return function() {
        var or__3943__auto____6547 = cljs.core._reduce[goog.typeOf(coll)];
        if(or__3943__auto____6547) {
          return or__3943__auto____6547
        }else {
          var or__3943__auto____6548 = cljs.core._reduce["_"];
          if(or__3943__auto____6548) {
            return or__3943__auto____6548
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3941__auto____6549 = coll;
      if(and__3941__auto____6549) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3941__auto____6549
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      return function() {
        var or__3943__auto____6550 = cljs.core._reduce[goog.typeOf(coll)];
        if(or__3943__auto____6550) {
          return or__3943__auto____6550
        }else {
          var or__3943__auto____6551 = cljs.core._reduce["_"];
          if(or__3943__auto____6551) {
            return or__3943__auto____6551
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
void 0;
void 0;
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3941__auto____6555 = coll;
    if(and__3941__auto____6555) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3941__auto____6555
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    return function() {
      var or__3943__auto____6556 = cljs.core._kv_reduce[goog.typeOf(coll)];
      if(or__3943__auto____6556) {
        return or__3943__auto____6556
      }else {
        var or__3943__auto____6557 = cljs.core._kv_reduce["_"];
        if(or__3943__auto____6557) {
          return or__3943__auto____6557
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
void 0;
void 0;
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3941__auto____6561 = o;
    if(and__3941__auto____6561) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3941__auto____6561
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    return function() {
      var or__3943__auto____6562 = cljs.core._equiv[goog.typeOf(o)];
      if(or__3943__auto____6562) {
        return or__3943__auto____6562
      }else {
        var or__3943__auto____6563 = cljs.core._equiv["_"];
        if(or__3943__auto____6563) {
          return or__3943__auto____6563
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
void 0;
void 0;
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3941__auto____6567 = o;
    if(and__3941__auto____6567) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3941__auto____6567
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    return function() {
      var or__3943__auto____6568 = cljs.core._hash[goog.typeOf(o)];
      if(or__3943__auto____6568) {
        return or__3943__auto____6568
      }else {
        var or__3943__auto____6569 = cljs.core._hash["_"];
        if(or__3943__auto____6569) {
          return or__3943__auto____6569
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3941__auto____6573 = o;
    if(and__3941__auto____6573) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3941__auto____6573
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    return function() {
      var or__3943__auto____6574 = cljs.core._seq[goog.typeOf(o)];
      if(or__3943__auto____6574) {
        return or__3943__auto____6574
      }else {
        var or__3943__auto____6575 = cljs.core._seq["_"];
        if(or__3943__auto____6575) {
          return or__3943__auto____6575
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.ISequential = {};
void 0;
void 0;
cljs.core.IList = {};
void 0;
void 0;
cljs.core.IRecord = {};
void 0;
void 0;
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3941__auto____6579 = coll;
    if(and__3941__auto____6579) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3941__auto____6579
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6580 = cljs.core._rseq[goog.typeOf(coll)];
      if(or__3943__auto____6580) {
        return or__3943__auto____6580
      }else {
        var or__3943__auto____6581 = cljs.core._rseq["_"];
        if(or__3943__auto____6581) {
          return or__3943__auto____6581
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3941__auto____6585 = coll;
    if(and__3941__auto____6585) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3941__auto____6585
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    return function() {
      var or__3943__auto____6586 = cljs.core._sorted_seq[goog.typeOf(coll)];
      if(or__3943__auto____6586) {
        return or__3943__auto____6586
      }else {
        var or__3943__auto____6587 = cljs.core._sorted_seq["_"];
        if(or__3943__auto____6587) {
          return or__3943__auto____6587
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3941__auto____6591 = coll;
    if(and__3941__auto____6591) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3941__auto____6591
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    return function() {
      var or__3943__auto____6592 = cljs.core._sorted_seq_from[goog.typeOf(coll)];
      if(or__3943__auto____6592) {
        return or__3943__auto____6592
      }else {
        var or__3943__auto____6593 = cljs.core._sorted_seq_from["_"];
        if(or__3943__auto____6593) {
          return or__3943__auto____6593
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3941__auto____6597 = coll;
    if(and__3941__auto____6597) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3941__auto____6597
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    return function() {
      var or__3943__auto____6598 = cljs.core._entry_key[goog.typeOf(coll)];
      if(or__3943__auto____6598) {
        return or__3943__auto____6598
      }else {
        var or__3943__auto____6599 = cljs.core._entry_key["_"];
        if(or__3943__auto____6599) {
          return or__3943__auto____6599
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3941__auto____6603 = coll;
    if(and__3941__auto____6603) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3941__auto____6603
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6604 = cljs.core._comparator[goog.typeOf(coll)];
      if(or__3943__auto____6604) {
        return or__3943__auto____6604
      }else {
        var or__3943__auto____6605 = cljs.core._comparator["_"];
        if(or__3943__auto____6605) {
          return or__3943__auto____6605
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3941__auto____6609 = o;
    if(and__3941__auto____6609) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3941__auto____6609
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    return function() {
      var or__3943__auto____6610 = cljs.core._pr_seq[goog.typeOf(o)];
      if(or__3943__auto____6610) {
        return or__3943__auto____6610
      }else {
        var or__3943__auto____6611 = cljs.core._pr_seq["_"];
        if(or__3943__auto____6611) {
          return or__3943__auto____6611
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
void 0;
void 0;
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3941__auto____6615 = d;
    if(and__3941__auto____6615) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3941__auto____6615
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    return function() {
      var or__3943__auto____6616 = cljs.core._realized_QMARK_[goog.typeOf(d)];
      if(or__3943__auto____6616) {
        return or__3943__auto____6616
      }else {
        var or__3943__auto____6617 = cljs.core._realized_QMARK_["_"];
        if(or__3943__auto____6617) {
          return or__3943__auto____6617
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
void 0;
void 0;
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3941__auto____6621 = this$;
    if(and__3941__auto____6621) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3941__auto____6621
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    return function() {
      var or__3943__auto____6622 = cljs.core._notify_watches[goog.typeOf(this$)];
      if(or__3943__auto____6622) {
        return or__3943__auto____6622
      }else {
        var or__3943__auto____6623 = cljs.core._notify_watches["_"];
        if(or__3943__auto____6623) {
          return or__3943__auto____6623
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3941__auto____6627 = this$;
    if(and__3941__auto____6627) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3941__auto____6627
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    return function() {
      var or__3943__auto____6628 = cljs.core._add_watch[goog.typeOf(this$)];
      if(or__3943__auto____6628) {
        return or__3943__auto____6628
      }else {
        var or__3943__auto____6629 = cljs.core._add_watch["_"];
        if(or__3943__auto____6629) {
          return or__3943__auto____6629
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3941__auto____6633 = this$;
    if(and__3941__auto____6633) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3941__auto____6633
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    return function() {
      var or__3943__auto____6634 = cljs.core._remove_watch[goog.typeOf(this$)];
      if(or__3943__auto____6634) {
        return or__3943__auto____6634
      }else {
        var or__3943__auto____6635 = cljs.core._remove_watch["_"];
        if(or__3943__auto____6635) {
          return or__3943__auto____6635
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
void 0;
void 0;
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3941__auto____6639 = coll;
    if(and__3941__auto____6639) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3941__auto____6639
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6640 = cljs.core._as_transient[goog.typeOf(coll)];
      if(or__3943__auto____6640) {
        return or__3943__auto____6640
      }else {
        var or__3943__auto____6641 = cljs.core._as_transient["_"];
        if(or__3943__auto____6641) {
          return or__3943__auto____6641
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3941__auto____6645 = tcoll;
    if(and__3941__auto____6645) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3941__auto____6645
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    return function() {
      var or__3943__auto____6646 = cljs.core._conj_BANG_[goog.typeOf(tcoll)];
      if(or__3943__auto____6646) {
        return or__3943__auto____6646
      }else {
        var or__3943__auto____6647 = cljs.core._conj_BANG_["_"];
        if(or__3943__auto____6647) {
          return or__3943__auto____6647
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3941__auto____6651 = tcoll;
    if(and__3941__auto____6651) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3941__auto____6651
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3943__auto____6652 = cljs.core._persistent_BANG_[goog.typeOf(tcoll)];
      if(or__3943__auto____6652) {
        return or__3943__auto____6652
      }else {
        var or__3943__auto____6653 = cljs.core._persistent_BANG_["_"];
        if(or__3943__auto____6653) {
          return or__3943__auto____6653
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
void 0;
void 0;
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3941__auto____6657 = tcoll;
    if(and__3941__auto____6657) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3941__auto____6657
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    return function() {
      var or__3943__auto____6658 = cljs.core._assoc_BANG_[goog.typeOf(tcoll)];
      if(or__3943__auto____6658) {
        return or__3943__auto____6658
      }else {
        var or__3943__auto____6659 = cljs.core._assoc_BANG_["_"];
        if(or__3943__auto____6659) {
          return or__3943__auto____6659
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
void 0;
void 0;
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3941__auto____6663 = tcoll;
    if(and__3941__auto____6663) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3941__auto____6663
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    return function() {
      var or__3943__auto____6664 = cljs.core._dissoc_BANG_[goog.typeOf(tcoll)];
      if(or__3943__auto____6664) {
        return or__3943__auto____6664
      }else {
        var or__3943__auto____6665 = cljs.core._dissoc_BANG_["_"];
        if(or__3943__auto____6665) {
          return or__3943__auto____6665
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
void 0;
void 0;
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3941__auto____6669 = tcoll;
    if(and__3941__auto____6669) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3941__auto____6669
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    return function() {
      var or__3943__auto____6670 = cljs.core._assoc_n_BANG_[goog.typeOf(tcoll)];
      if(or__3943__auto____6670) {
        return or__3943__auto____6670
      }else {
        var or__3943__auto____6671 = cljs.core._assoc_n_BANG_["_"];
        if(or__3943__auto____6671) {
          return or__3943__auto____6671
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3941__auto____6675 = tcoll;
    if(and__3941__auto____6675) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3941__auto____6675
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3943__auto____6676 = cljs.core._pop_BANG_[goog.typeOf(tcoll)];
      if(or__3943__auto____6676) {
        return or__3943__auto____6676
      }else {
        var or__3943__auto____6677 = cljs.core._pop_BANG_["_"];
        if(or__3943__auto____6677) {
          return or__3943__auto____6677
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
void 0;
void 0;
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3941__auto____6681 = tcoll;
    if(and__3941__auto____6681) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3941__auto____6681
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    return function() {
      var or__3943__auto____6682 = cljs.core._disjoin_BANG_[goog.typeOf(tcoll)];
      if(or__3943__auto____6682) {
        return or__3943__auto____6682
      }else {
        var or__3943__auto____6683 = cljs.core._disjoin_BANG_["_"];
        if(or__3943__auto____6683) {
          return or__3943__auto____6683
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
void 0;
void 0;
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3941__auto____6687 = x;
    if(and__3941__auto____6687) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3941__auto____6687
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    return function() {
      var or__3943__auto____6688 = cljs.core._compare[goog.typeOf(x)];
      if(or__3943__auto____6688) {
        return or__3943__auto____6688
      }else {
        var or__3943__auto____6689 = cljs.core._compare["_"];
        if(or__3943__auto____6689) {
          return or__3943__auto____6689
        }else {
          throw cljs.core.missing_protocol.call(null, "IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
void 0;
void 0;
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3941__auto____6693 = coll;
    if(and__3941__auto____6693) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3941__auto____6693
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6694 = cljs.core._drop_first[goog.typeOf(coll)];
      if(or__3943__auto____6694) {
        return or__3943__auto____6694
      }else {
        var or__3943__auto____6695 = cljs.core._drop_first["_"];
        if(or__3943__auto____6695) {
          return or__3943__auto____6695
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3941__auto____6699 = coll;
    if(and__3941__auto____6699) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3941__auto____6699
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6700 = cljs.core._chunked_first[goog.typeOf(coll)];
      if(or__3943__auto____6700) {
        return or__3943__auto____6700
      }else {
        var or__3943__auto____6701 = cljs.core._chunked_first["_"];
        if(or__3943__auto____6701) {
          return or__3943__auto____6701
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3941__auto____6705 = coll;
    if(and__3941__auto____6705) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3941__auto____6705
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6706 = cljs.core._chunked_rest[goog.typeOf(coll)];
      if(or__3943__auto____6706) {
        return or__3943__auto____6706
      }else {
        var or__3943__auto____6707 = cljs.core._chunked_rest["_"];
        if(or__3943__auto____6707) {
          return or__3943__auto____6707
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3941__auto____6711 = coll;
    if(and__3941__auto____6711) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3941__auto____6711
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6712 = cljs.core._chunked_next[goog.typeOf(coll)];
      if(or__3943__auto____6712) {
        return or__3943__auto____6712
      }else {
        var or__3943__auto____6713 = cljs.core._chunked_next["_"];
        if(or__3943__auto____6713) {
          return or__3943__auto____6713
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
void 0;
void 0;
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3943__auto____6715 = x === y;
    if(or__3943__auto____6715) {
      return or__3943__auto____6715
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__6716__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__6717 = y;
            var G__6718 = cljs.core.first.call(null, more);
            var G__6719 = cljs.core.next.call(null, more);
            x = G__6717;
            y = G__6718;
            more = G__6719;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6716 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6716__delegate.call(this, x, y, more)
    };
    G__6716.cljs$lang$maxFixedArity = 2;
    G__6716.cljs$lang$applyTo = function(arglist__6720) {
      var x = cljs.core.first(arglist__6720);
      var y = cljs.core.first(cljs.core.next(arglist__6720));
      var more = cljs.core.rest(cljs.core.next(arglist__6720));
      return G__6716__delegate(x, y, more)
    };
    G__6716.cljs$lang$arity$variadic = G__6716__delegate;
    return G__6716
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
void 0;
void 0;
void 0;
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__6721 = null;
  var G__6721__2 = function(o, k) {
    return null
  };
  var G__6721__3 = function(o, k, not_found) {
    return not_found
  };
  G__6721 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6721__2.call(this, o, k);
      case 3:
        return G__6721__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6721
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__6722 = null;
  var G__6722__2 = function(_, f) {
    return f.call(null)
  };
  var G__6722__3 = function(_, f, start) {
    return start
  };
  G__6722 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6722__2.call(this, _, f);
      case 3:
        return G__6722__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6722
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__6723 = null;
  var G__6723__2 = function(_, n) {
    return null
  };
  var G__6723__3 = function(_, n, not_found) {
    return not_found
  };
  G__6723 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6723__2.call(this, _, n);
      case 3:
        return G__6723__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6723
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  return o.toString() === other.toString()
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
void 0;
void 0;
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt__6736 = cljs.core._count.call(null, cicoll);
    if(cnt__6736 === 0) {
      return f.call(null)
    }else {
      var val__6737 = cljs.core._nth.call(null, cicoll, 0);
      var n__6738 = 1;
      while(true) {
        if(n__6738 < cnt__6736) {
          var nval__6739 = f.call(null, val__6737, cljs.core._nth.call(null, cicoll, n__6738));
          if(cljs.core.reduced_QMARK_.call(null, nval__6739)) {
            return cljs.core.deref.call(null, nval__6739)
          }else {
            var G__6748 = nval__6739;
            var G__6749 = n__6738 + 1;
            val__6737 = G__6748;
            n__6738 = G__6749;
            continue
          }
        }else {
          return val__6737
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__6740 = cljs.core._count.call(null, cicoll);
    var val__6741 = val;
    var n__6742 = 0;
    while(true) {
      if(n__6742 < cnt__6740) {
        var nval__6743 = f.call(null, val__6741, cljs.core._nth.call(null, cicoll, n__6742));
        if(cljs.core.reduced_QMARK_.call(null, nval__6743)) {
          return cljs.core.deref.call(null, nval__6743)
        }else {
          var G__6750 = nval__6743;
          var G__6751 = n__6742 + 1;
          val__6741 = G__6750;
          n__6742 = G__6751;
          continue
        }
      }else {
        return val__6741
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__6744 = cljs.core._count.call(null, cicoll);
    var val__6745 = val;
    var n__6746 = idx;
    while(true) {
      if(n__6746 < cnt__6744) {
        var nval__6747 = f.call(null, val__6745, cljs.core._nth.call(null, cicoll, n__6746));
        if(cljs.core.reduced_QMARK_.call(null, nval__6747)) {
          return cljs.core.deref.call(null, nval__6747)
        }else {
          var G__6752 = nval__6747;
          var G__6753 = n__6746 + 1;
          val__6745 = G__6752;
          n__6746 = G__6753;
          continue
        }
      }else {
        return val__6745
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt__6766 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__6767 = arr[0];
      var n__6768 = 1;
      while(true) {
        if(n__6768 < cnt__6766) {
          var nval__6769 = f.call(null, val__6767, arr[n__6768]);
          if(cljs.core.reduced_QMARK_.call(null, nval__6769)) {
            return cljs.core.deref.call(null, nval__6769)
          }else {
            var G__6778 = nval__6769;
            var G__6779 = n__6768 + 1;
            val__6767 = G__6778;
            n__6768 = G__6779;
            continue
          }
        }else {
          return val__6767
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__6770 = arr.length;
    var val__6771 = val;
    var n__6772 = 0;
    while(true) {
      if(n__6772 < cnt__6770) {
        var nval__6773 = f.call(null, val__6771, arr[n__6772]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6773)) {
          return cljs.core.deref.call(null, nval__6773)
        }else {
          var G__6780 = nval__6773;
          var G__6781 = n__6772 + 1;
          val__6771 = G__6780;
          n__6772 = G__6781;
          continue
        }
      }else {
        return val__6771
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__6774 = arr.length;
    var val__6775 = val;
    var n__6776 = idx;
    while(true) {
      if(n__6776 < cnt__6774) {
        var nval__6777 = f.call(null, val__6775, arr[n__6776]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6777)) {
          return cljs.core.deref.call(null, nval__6777)
        }else {
          var G__6782 = nval__6777;
          var G__6783 = n__6776 + 1;
          val__6775 = G__6782;
          n__6776 = G__6783;
          continue
        }
      }else {
        return val__6775
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_reduce.cljs$lang$arity$2 = array_reduce__2;
  array_reduce.cljs$lang$arity$3 = array_reduce__3;
  array_reduce.cljs$lang$arity$4 = array_reduce__4;
  return array_reduce
}();
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199546
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6784 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__6785 = this;
  if(this__6785.i + 1 < this__6785.a.length) {
    return new cljs.core.IndexedSeq(this__6785.a, this__6785.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6786 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6787 = this;
  var c__6788 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__6788 > 0) {
    return new cljs.core.RSeq(coll, c__6788 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__6789 = this;
  var this__6790 = this;
  return cljs.core.pr_str.call(null, this__6790)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__6791 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6791.a)) {
    return cljs.core.ci_reduce.call(null, this__6791.a, f, this__6791.a[this__6791.i], this__6791.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__6791.a[this__6791.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__6792 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6792.a)) {
    return cljs.core.ci_reduce.call(null, this__6792.a, f, start, this__6792.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6793 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__6794 = this;
  return this__6794.a.length - this__6794.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__6795 = this;
  return this__6795.a[this__6795.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__6796 = this;
  if(this__6796.i + 1 < this__6796.a.length) {
    return new cljs.core.IndexedSeq(this__6796.a, this__6796.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6797 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__6798 = this;
  var i__6799 = n + this__6798.i;
  if(i__6799 < this__6798.a.length) {
    return this__6798.a[i__6799]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__6800 = this;
  var i__6801 = n + this__6800.i;
  if(i__6801 < this__6800.a.length) {
    return this__6800.a[i__6801]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__6802 = null;
  var G__6802__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__6802__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__6802 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6802__2.call(this, array, f);
      case 3:
        return G__6802__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6802
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__6803 = null;
  var G__6803__2 = function(array, k) {
    return array[k]
  };
  var G__6803__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__6803 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6803__2.call(this, array, k);
      case 3:
        return G__6803__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6803
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__6804 = null;
  var G__6804__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__6804__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__6804 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6804__2.call(this, array, n);
      case 3:
        return G__6804__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6804
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6805 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6806 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__6807 = this;
  var this__6808 = this;
  return cljs.core.pr_str.call(null, this__6808)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6809 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6810 = this;
  return this__6810.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6811 = this;
  return cljs.core._nth.call(null, this__6811.ci, this__6811.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6812 = this;
  if(this__6812.i > 0) {
    return new cljs.core.RSeq(this__6812.ci, this__6812.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6813 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__6814 = this;
  return new cljs.core.RSeq(this__6814.ci, this__6814.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6815 = this;
  return this__6815.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6819__6820 = coll;
      if(G__6819__6820) {
        if(function() {
          var or__3943__auto____6821 = G__6819__6820.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3943__auto____6821) {
            return or__3943__auto____6821
          }else {
            return G__6819__6820.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__6819__6820.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6819__6820)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6819__6820)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6826__6827 = coll;
      if(G__6826__6827) {
        if(function() {
          var or__3943__auto____6828 = G__6826__6827.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3943__auto____6828) {
            return or__3943__auto____6828
          }else {
            return G__6826__6827.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6826__6827.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6826__6827)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6826__6827)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__6829 = cljs.core.seq.call(null, coll);
      if(s__6829 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__6829)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__6834__6835 = coll;
      if(G__6834__6835) {
        if(function() {
          var or__3943__auto____6836 = G__6834__6835.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3943__auto____6836) {
            return or__3943__auto____6836
          }else {
            return G__6834__6835.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6834__6835.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6834__6835)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6834__6835)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__6837 = cljs.core.seq.call(null, coll);
      if(!(s__6837 == null)) {
        return cljs.core._rest.call(null, s__6837)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6841__6842 = coll;
      if(G__6841__6842) {
        if(function() {
          var or__3943__auto____6843 = G__6841__6842.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3943__auto____6843) {
            return or__3943__auto____6843
          }else {
            return G__6841__6842.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__6841__6842.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6841__6842)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6841__6842)
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn__6845 = cljs.core.next.call(null, s);
    if(!(sn__6845 == null)) {
      var G__6846 = sn__6845;
      s = G__6846;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__6847__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__6848 = conj.call(null, coll, x);
          var G__6849 = cljs.core.first.call(null, xs);
          var G__6850 = cljs.core.next.call(null, xs);
          coll = G__6848;
          x = G__6849;
          xs = G__6850;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__6847 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6847__delegate.call(this, coll, x, xs)
    };
    G__6847.cljs$lang$maxFixedArity = 2;
    G__6847.cljs$lang$applyTo = function(arglist__6851) {
      var coll = cljs.core.first(arglist__6851);
      var x = cljs.core.first(cljs.core.next(arglist__6851));
      var xs = cljs.core.rest(cljs.core.next(arglist__6851));
      return G__6847__delegate(coll, x, xs)
    };
    G__6847.cljs$lang$arity$variadic = G__6847__delegate;
    return G__6847
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
void 0;
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__6854 = cljs.core.seq.call(null, coll);
  var acc__6855 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__6854)) {
      return acc__6855 + cljs.core._count.call(null, s__6854)
    }else {
      var G__6856 = cljs.core.next.call(null, s__6854);
      var G__6857 = acc__6855 + 1;
      s__6854 = G__6856;
      acc__6855 = G__6857;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
void 0;
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__6864__6865 = coll;
        if(G__6864__6865) {
          if(function() {
            var or__3943__auto____6866 = G__6864__6865.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3943__auto____6866) {
              return or__3943__auto____6866
            }else {
              return G__6864__6865.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6864__6865.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6864__6865)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6864__6865)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__6867__6868 = coll;
        if(G__6867__6868) {
          if(function() {
            var or__3943__auto____6869 = G__6867__6868.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3943__auto____6869) {
              return or__3943__auto____6869
            }else {
              return G__6867__6868.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6867__6868.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6867__6868)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6867__6868)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__6872__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__6871 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__6873 = ret__6871;
          var G__6874 = cljs.core.first.call(null, kvs);
          var G__6875 = cljs.core.second.call(null, kvs);
          var G__6876 = cljs.core.nnext.call(null, kvs);
          coll = G__6873;
          k = G__6874;
          v = G__6875;
          kvs = G__6876;
          continue
        }else {
          return ret__6871
        }
        break
      }
    };
    var G__6872 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6872__delegate.call(this, coll, k, v, kvs)
    };
    G__6872.cljs$lang$maxFixedArity = 3;
    G__6872.cljs$lang$applyTo = function(arglist__6877) {
      var coll = cljs.core.first(arglist__6877);
      var k = cljs.core.first(cljs.core.next(arglist__6877));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6877)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6877)));
      return G__6872__delegate(coll, k, v, kvs)
    };
    G__6872.cljs$lang$arity$variadic = G__6872__delegate;
    return G__6872
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__6880__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6879 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6881 = ret__6879;
          var G__6882 = cljs.core.first.call(null, ks);
          var G__6883 = cljs.core.next.call(null, ks);
          coll = G__6881;
          k = G__6882;
          ks = G__6883;
          continue
        }else {
          return ret__6879
        }
        break
      }
    };
    var G__6880 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6880__delegate.call(this, coll, k, ks)
    };
    G__6880.cljs$lang$maxFixedArity = 2;
    G__6880.cljs$lang$applyTo = function(arglist__6884) {
      var coll = cljs.core.first(arglist__6884);
      var k = cljs.core.first(cljs.core.next(arglist__6884));
      var ks = cljs.core.rest(cljs.core.next(arglist__6884));
      return G__6880__delegate(coll, k, ks)
    };
    G__6880.cljs$lang$arity$variadic = G__6880__delegate;
    return G__6880
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__6888__6889 = o;
    if(G__6888__6889) {
      if(function() {
        var or__3943__auto____6890 = G__6888__6889.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3943__auto____6890) {
          return or__3943__auto____6890
        }else {
          return G__6888__6889.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__6888__6889.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6888__6889)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6888__6889)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__6893__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6892 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6894 = ret__6892;
          var G__6895 = cljs.core.first.call(null, ks);
          var G__6896 = cljs.core.next.call(null, ks);
          coll = G__6894;
          k = G__6895;
          ks = G__6896;
          continue
        }else {
          return ret__6892
        }
        break
      }
    };
    var G__6893 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6893__delegate.call(this, coll, k, ks)
    };
    G__6893.cljs$lang$maxFixedArity = 2;
    G__6893.cljs$lang$applyTo = function(arglist__6897) {
      var coll = cljs.core.first(arglist__6897);
      var k = cljs.core.first(cljs.core.next(arglist__6897));
      var ks = cljs.core.rest(cljs.core.next(arglist__6897));
      return G__6893__delegate(coll, k, ks)
    };
    G__6893.cljs$lang$arity$variadic = G__6893__delegate;
    return G__6893
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h__6899 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__6899;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__6899
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__6901 = cljs.core.string_hash_cache[k];
  if(!(h__6901 == null)) {
    return h__6901
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.call(null, o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3941__auto____6903 = goog.isString(o);
      if(and__3941__auto____6903) {
        return check_cache
      }else {
        return and__3941__auto____6903
      }
    }()) {
      return cljs.core.check_string_hash_cache.call(null, o)
    }else {
      return cljs.core._hash.call(null, o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash.cljs$lang$arity$1 = hash__1;
  hash.cljs$lang$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6907__6908 = x;
    if(G__6907__6908) {
      if(function() {
        var or__3943__auto____6909 = G__6907__6908.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3943__auto____6909) {
          return or__3943__auto____6909
        }else {
          return G__6907__6908.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__6907__6908.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6907__6908)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6907__6908)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6913__6914 = x;
    if(G__6913__6914) {
      if(function() {
        var or__3943__auto____6915 = G__6913__6914.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3943__auto____6915) {
          return or__3943__auto____6915
        }else {
          return G__6913__6914.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__6913__6914.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6913__6914)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6913__6914)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__6919__6920 = x;
  if(G__6919__6920) {
    if(function() {
      var or__3943__auto____6921 = G__6919__6920.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3943__auto____6921) {
        return or__3943__auto____6921
      }else {
        return G__6919__6920.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__6919__6920.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6919__6920)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6919__6920)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__6925__6926 = x;
  if(G__6925__6926) {
    if(function() {
      var or__3943__auto____6927 = G__6925__6926.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3943__auto____6927) {
        return or__3943__auto____6927
      }else {
        return G__6925__6926.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__6925__6926.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6925__6926)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6925__6926)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__6931__6932 = x;
  if(G__6931__6932) {
    if(function() {
      var or__3943__auto____6933 = G__6931__6932.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3943__auto____6933) {
        return or__3943__auto____6933
      }else {
        return G__6931__6932.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__6931__6932.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6931__6932)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6931__6932)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__6937__6938 = x;
  if(G__6937__6938) {
    if(function() {
      var or__3943__auto____6939 = G__6937__6938.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3943__auto____6939) {
        return or__3943__auto____6939
      }else {
        return G__6937__6938.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__6937__6938.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6937__6938)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6937__6938)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__6943__6944 = x;
  if(G__6943__6944) {
    if(function() {
      var or__3943__auto____6945 = G__6943__6944.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3943__auto____6945) {
        return or__3943__auto____6945
      }else {
        return G__6943__6944.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__6943__6944.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6943__6944)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6943__6944)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6949__6950 = x;
    if(G__6949__6950) {
      if(function() {
        var or__3943__auto____6951 = G__6949__6950.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3943__auto____6951) {
          return or__3943__auto____6951
        }else {
          return G__6949__6950.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__6949__6950.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__6949__6950)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__6949__6950)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__6955__6956 = x;
  if(G__6955__6956) {
    if(function() {
      var or__3943__auto____6957 = G__6955__6956.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3943__auto____6957) {
        return or__3943__auto____6957
      }else {
        return G__6955__6956.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__6955__6956.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__6955__6956)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__6955__6956)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__6961__6962 = x;
  if(G__6961__6962) {
    if(cljs.core.truth_(function() {
      var or__3943__auto____6963 = null;
      if(cljs.core.truth_(or__3943__auto____6963)) {
        return or__3943__auto____6963
      }else {
        return G__6961__6962.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__6961__6962.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__6961__6962)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__6961__6962)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__6964__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__6964 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__6964__delegate.call(this, keyvals)
    };
    G__6964.cljs$lang$maxFixedArity = 0;
    G__6964.cljs$lang$applyTo = function(arglist__6965) {
      var keyvals = cljs.core.seq(arglist__6965);
      return G__6964__delegate(keyvals)
    };
    G__6964.cljs$lang$arity$variadic = G__6964__delegate;
    return G__6964
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(falsecljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__6967 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__6967.push(key)
  });
  return keys__6967
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__6971 = i;
  var j__6972 = j;
  var len__6973 = len;
  while(true) {
    if(len__6973 === 0) {
      return to
    }else {
      to[j__6972] = from[i__6971];
      var G__6974 = i__6971 + 1;
      var G__6975 = j__6972 + 1;
      var G__6976 = len__6973 - 1;
      i__6971 = G__6974;
      j__6972 = G__6975;
      len__6973 = G__6976;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__6980 = i + (len - 1);
  var j__6981 = j + (len - 1);
  var len__6982 = len;
  while(true) {
    if(len__6982 === 0) {
      return to
    }else {
      to[j__6981] = from[i__6980];
      var G__6983 = i__6980 - 1;
      var G__6984 = j__6981 - 1;
      var G__6985 = len__6982 - 1;
      i__6980 = G__6983;
      j__6981 = G__6984;
      len__6982 = G__6985;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__6989__6990 = s;
    if(G__6989__6990) {
      if(function() {
        var or__3943__auto____6991 = G__6989__6990.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3943__auto____6991) {
          return or__3943__auto____6991
        }else {
          return G__6989__6990.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__6989__6990.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6989__6990)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6989__6990)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__6995__6996 = s;
  if(G__6995__6996) {
    if(function() {
      var or__3943__auto____6997 = G__6995__6996.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3943__auto____6997) {
        return or__3943__auto____6997
      }else {
        return G__6995__6996.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__6995__6996.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__6995__6996)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__6995__6996)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3941__auto____7000 = goog.isString(x);
  if(and__3941__auto____7000) {
    return!function() {
      var or__3943__auto____7001 = x.charAt(0) === "\ufdd0";
      if(or__3943__auto____7001) {
        return or__3943__auto____7001
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3941__auto____7000
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3941__auto____7003 = goog.isString(x);
  if(and__3941__auto____7003) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3941__auto____7003
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3941__auto____7005 = goog.isString(x);
  if(and__3941__auto____7005) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3941__auto____7005
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3943__auto____7010 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3943__auto____7010) {
    return or__3943__auto____7010
  }else {
    var G__7011__7012 = f;
    if(G__7011__7012) {
      if(function() {
        var or__3943__auto____7013 = G__7011__7012.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3943__auto____7013) {
          return or__3943__auto____7013
        }else {
          return G__7011__7012.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__7011__7012.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7011__7012)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7011__7012)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3941__auto____7015 = cljs.core.number_QMARK_.call(null, n);
  if(and__3941__auto____7015) {
    return n == n.toFixed()
  }else {
    return and__3941__auto____7015
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3941__auto____7018 = coll;
    if(cljs.core.truth_(and__3941__auto____7018)) {
      var and__3941__auto____7019 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3941__auto____7019) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3941__auto____7019
      }
    }else {
      return and__3941__auto____7018
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__7028__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__7024 = cljs.core.set([y, x]);
        var xs__7025 = more;
        while(true) {
          var x__7026 = cljs.core.first.call(null, xs__7025);
          var etc__7027 = cljs.core.next.call(null, xs__7025);
          if(cljs.core.truth_(xs__7025)) {
            if(cljs.core.contains_QMARK_.call(null, s__7024, x__7026)) {
              return false
            }else {
              var G__7029 = cljs.core.conj.call(null, s__7024, x__7026);
              var G__7030 = etc__7027;
              s__7024 = G__7029;
              xs__7025 = G__7030;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__7028 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7028__delegate.call(this, x, y, more)
    };
    G__7028.cljs$lang$maxFixedArity = 2;
    G__7028.cljs$lang$applyTo = function(arglist__7031) {
      var x = cljs.core.first(arglist__7031);
      var y = cljs.core.first(cljs.core.next(arglist__7031));
      var more = cljs.core.rest(cljs.core.next(arglist__7031));
      return G__7028__delegate(x, y, more)
    };
    G__7028.cljs$lang$arity$variadic = G__7028__delegate;
    return G__7028
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
          if(function() {
            var G__7035__7036 = x;
            if(G__7035__7036) {
              if(cljs.core.truth_(function() {
                var or__3943__auto____7037 = null;
                if(cljs.core.truth_(or__3943__auto____7037)) {
                  return or__3943__auto____7037
                }else {
                  return G__7035__7036.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__7035__7036.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7035__7036)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7035__7036)
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0'else") {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl__7042 = cljs.core.count.call(null, xs);
    var yl__7043 = cljs.core.count.call(null, ys);
    if(xl__7042 < yl__7043) {
      return-1
    }else {
      if(xl__7042 > yl__7043) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__7042, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__7044 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3941__auto____7045 = d__7044 === 0;
        if(and__3941__auto____7045) {
          return n + 1 < len
        }else {
          return and__3941__auto____7045
        }
      }()) {
        var G__7046 = xs;
        var G__7047 = ys;
        var G__7048 = len;
        var G__7049 = n + 1;
        xs = G__7046;
        ys = G__7047;
        len = G__7048;
        n = G__7049;
        continue
      }else {
        return d__7044
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  compare_indexed.cljs$lang$arity$2 = compare_indexed__2;
  compare_indexed.cljs$lang$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__7051 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__7051)) {
        return r__7051
      }else {
        if(cljs.core.truth_(r__7051)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
void 0;
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq.call(null, coll)) {
      var a__7053 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__7053, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__7053)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__4090__auto____7059 = cljs.core.seq.call(null, coll);
    if(temp__4090__auto____7059) {
      var s__7060 = temp__4090__auto____7059;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__7060), cljs.core.next.call(null, s__7060))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__7061 = val;
    var coll__7062 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__7062) {
        var nval__7063 = f.call(null, val__7061, cljs.core.first.call(null, coll__7062));
        if(cljs.core.reduced_QMARK_.call(null, nval__7063)) {
          return cljs.core.deref.call(null, nval__7063)
        }else {
          var G__7064 = nval__7063;
          var G__7065 = cljs.core.next.call(null, coll__7062);
          val__7061 = G__7064;
          coll__7062 = G__7065;
          continue
        }
      }else {
        return val__7061
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
void 0;
cljs.core.shuffle = function shuffle(coll) {
  var a__7067 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__7067);
  return cljs.core.vec.call(null, a__7067)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__7074__7075 = coll;
      if(G__7074__7075) {
        if(function() {
          var or__3943__auto____7076 = G__7074__7075.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3943__auto____7076) {
            return or__3943__auto____7076
          }else {
            return G__7074__7075.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7074__7075.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7074__7075)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7074__7075)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__7077__7078 = coll;
      if(G__7077__7078) {
        if(function() {
          var or__3943__auto____7079 = G__7077__7078.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3943__auto____7079) {
            return or__3943__auto____7079
          }else {
            return G__7077__7078.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7077__7078.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7077__7078)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7077__7078)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__7080 = this;
  return this__7080.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__7081__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__7081 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7081__delegate.call(this, x, y, more)
    };
    G__7081.cljs$lang$maxFixedArity = 2;
    G__7081.cljs$lang$applyTo = function(arglist__7082) {
      var x = cljs.core.first(arglist__7082);
      var y = cljs.core.first(cljs.core.next(arglist__7082));
      var more = cljs.core.rest(cljs.core.next(arglist__7082));
      return G__7081__delegate(x, y, more)
    };
    G__7081.cljs$lang$arity$variadic = G__7081__delegate;
    return G__7081
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__7083__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__7083 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7083__delegate.call(this, x, y, more)
    };
    G__7083.cljs$lang$maxFixedArity = 2;
    G__7083.cljs$lang$applyTo = function(arglist__7084) {
      var x = cljs.core.first(arglist__7084);
      var y = cljs.core.first(cljs.core.next(arglist__7084));
      var more = cljs.core.rest(cljs.core.next(arglist__7084));
      return G__7083__delegate(x, y, more)
    };
    G__7083.cljs$lang$arity$variadic = G__7083__delegate;
    return G__7083
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__7085__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__7085 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7085__delegate.call(this, x, y, more)
    };
    G__7085.cljs$lang$maxFixedArity = 2;
    G__7085.cljs$lang$applyTo = function(arglist__7086) {
      var x = cljs.core.first(arglist__7086);
      var y = cljs.core.first(cljs.core.next(arglist__7086));
      var more = cljs.core.rest(cljs.core.next(arglist__7086));
      return G__7085__delegate(x, y, more)
    };
    G__7085.cljs$lang$arity$variadic = G__7085__delegate;
    return G__7085
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__7087__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__7087 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7087__delegate.call(this, x, y, more)
    };
    G__7087.cljs$lang$maxFixedArity = 2;
    G__7087.cljs$lang$applyTo = function(arglist__7088) {
      var x = cljs.core.first(arglist__7088);
      var y = cljs.core.first(cljs.core.next(arglist__7088));
      var more = cljs.core.rest(cljs.core.next(arglist__7088));
      return G__7087__delegate(x, y, more)
    };
    G__7087.cljs$lang$arity$variadic = G__7087__delegate;
    return G__7087
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__7089__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__7090 = y;
            var G__7091 = cljs.core.first.call(null, more);
            var G__7092 = cljs.core.next.call(null, more);
            x = G__7090;
            y = G__7091;
            more = G__7092;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7089 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7089__delegate.call(this, x, y, more)
    };
    G__7089.cljs$lang$maxFixedArity = 2;
    G__7089.cljs$lang$applyTo = function(arglist__7093) {
      var x = cljs.core.first(arglist__7093);
      var y = cljs.core.first(cljs.core.next(arglist__7093));
      var more = cljs.core.rest(cljs.core.next(arglist__7093));
      return G__7089__delegate(x, y, more)
    };
    G__7089.cljs$lang$arity$variadic = G__7089__delegate;
    return G__7089
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__7094__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7095 = y;
            var G__7096 = cljs.core.first.call(null, more);
            var G__7097 = cljs.core.next.call(null, more);
            x = G__7095;
            y = G__7096;
            more = G__7097;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7094 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7094__delegate.call(this, x, y, more)
    };
    G__7094.cljs$lang$maxFixedArity = 2;
    G__7094.cljs$lang$applyTo = function(arglist__7098) {
      var x = cljs.core.first(arglist__7098);
      var y = cljs.core.first(cljs.core.next(arglist__7098));
      var more = cljs.core.rest(cljs.core.next(arglist__7098));
      return G__7094__delegate(x, y, more)
    };
    G__7094.cljs$lang$arity$variadic = G__7094__delegate;
    return G__7094
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__7099__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__7100 = y;
            var G__7101 = cljs.core.first.call(null, more);
            var G__7102 = cljs.core.next.call(null, more);
            x = G__7100;
            y = G__7101;
            more = G__7102;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7099 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7099__delegate.call(this, x, y, more)
    };
    G__7099.cljs$lang$maxFixedArity = 2;
    G__7099.cljs$lang$applyTo = function(arglist__7103) {
      var x = cljs.core.first(arglist__7103);
      var y = cljs.core.first(cljs.core.next(arglist__7103));
      var more = cljs.core.rest(cljs.core.next(arglist__7103));
      return G__7099__delegate(x, y, more)
    };
    G__7099.cljs$lang$arity$variadic = G__7099__delegate;
    return G__7099
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__7104__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7105 = y;
            var G__7106 = cljs.core.first.call(null, more);
            var G__7107 = cljs.core.next.call(null, more);
            x = G__7105;
            y = G__7106;
            more = G__7107;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7104 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7104__delegate.call(this, x, y, more)
    };
    G__7104.cljs$lang$maxFixedArity = 2;
    G__7104.cljs$lang$applyTo = function(arglist__7108) {
      var x = cljs.core.first(arglist__7108);
      var y = cljs.core.first(cljs.core.next(arglist__7108));
      var more = cljs.core.rest(cljs.core.next(arglist__7108));
      return G__7104__delegate(x, y, more)
    };
    G__7104.cljs$lang$arity$variadic = G__7104__delegate;
    return G__7104
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__7109__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__7109 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7109__delegate.call(this, x, y, more)
    };
    G__7109.cljs$lang$maxFixedArity = 2;
    G__7109.cljs$lang$applyTo = function(arglist__7110) {
      var x = cljs.core.first(arglist__7110);
      var y = cljs.core.first(cljs.core.next(arglist__7110));
      var more = cljs.core.rest(cljs.core.next(arglist__7110));
      return G__7109__delegate(x, y, more)
    };
    G__7109.cljs$lang$arity$variadic = G__7109__delegate;
    return G__7109
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__7111__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__7111 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7111__delegate.call(this, x, y, more)
    };
    G__7111.cljs$lang$maxFixedArity = 2;
    G__7111.cljs$lang$applyTo = function(arglist__7112) {
      var x = cljs.core.first(arglist__7112);
      var y = cljs.core.first(cljs.core.next(arglist__7112));
      var more = cljs.core.rest(cljs.core.next(arglist__7112));
      return G__7111__delegate(x, y, more)
    };
    G__7111.cljs$lang$arity$variadic = G__7111__delegate;
    return G__7111
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__7114 = n % d;
  return cljs.core.fix.call(null, (n - rem__7114) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__7116 = cljs.core.quot.call(null, n, d);
  return n - d * q__7116
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__7119 = v - (v >> 1 & 1431655765);
  var v__7120 = (v__7119 & 858993459) + (v__7119 >> 2 & 858993459);
  return(v__7120 + (v__7120 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__7121__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__7122 = y;
            var G__7123 = cljs.core.first.call(null, more);
            var G__7124 = cljs.core.next.call(null, more);
            x = G__7122;
            y = G__7123;
            more = G__7124;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7121 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7121__delegate.call(this, x, y, more)
    };
    G__7121.cljs$lang$maxFixedArity = 2;
    G__7121.cljs$lang$applyTo = function(arglist__7125) {
      var x = cljs.core.first(arglist__7125);
      var y = cljs.core.first(cljs.core.next(arglist__7125));
      var more = cljs.core.rest(cljs.core.next(arglist__7125));
      return G__7121__delegate(x, y, more)
    };
    G__7121.cljs$lang$arity$variadic = G__7121__delegate;
    return G__7121
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__7129 = n;
  var xs__7130 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3941__auto____7131 = xs__7130;
      if(and__3941__auto____7131) {
        return n__7129 > 0
      }else {
        return and__3941__auto____7131
      }
    }())) {
      var G__7132 = n__7129 - 1;
      var G__7133 = cljs.core.next.call(null, xs__7130);
      n__7129 = G__7132;
      xs__7130 = G__7133;
      continue
    }else {
      return xs__7130
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__7134__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7135 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__7136 = cljs.core.next.call(null, more);
            sb = G__7135;
            more = G__7136;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__7134 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7134__delegate.call(this, x, ys)
    };
    G__7134.cljs$lang$maxFixedArity = 1;
    G__7134.cljs$lang$applyTo = function(arglist__7137) {
      var x = cljs.core.first(arglist__7137);
      var ys = cljs.core.rest(arglist__7137);
      return G__7134__delegate(x, ys)
    };
    G__7134.cljs$lang$arity$variadic = G__7134__delegate;
    return G__7134
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__7138__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7139 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__7140 = cljs.core.next.call(null, more);
            sb = G__7139;
            more = G__7140;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__7138 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7138__delegate.call(this, x, ys)
    };
    G__7138.cljs$lang$maxFixedArity = 1;
    G__7138.cljs$lang$applyTo = function(arglist__7141) {
      var x = cljs.core.first(arglist__7141);
      var ys = cljs.core.rest(arglist__7141);
      return G__7138__delegate(x, ys)
    };
    G__7138.cljs$lang$arity$variadic = G__7138__delegate;
    return G__7138
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__7144 = cljs.core.seq.call(null, x);
    var ys__7145 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__7144 == null) {
        return ys__7145 == null
      }else {
        if(ys__7145 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__7144), cljs.core.first.call(null, ys__7145))) {
            var G__7146 = cljs.core.next.call(null, xs__7144);
            var G__7147 = cljs.core.next.call(null, ys__7145);
            xs__7144 = G__7146;
            ys__7145 = G__7147;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__7148_SHARP_, p2__7149_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__7148_SHARP_, cljs.core.hash.call(null, p2__7149_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
void 0;
void 0;
cljs.core.hash_imap = function hash_imap(m) {
  var h__7153 = 0;
  var s__7154 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__7154) {
      var e__7155 = cljs.core.first.call(null, s__7154);
      var G__7156 = (h__7153 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__7155)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__7155)))) % 4503599627370496;
      var G__7157 = cljs.core.next.call(null, s__7154);
      h__7153 = G__7156;
      s__7154 = G__7157;
      continue
    }else {
      return h__7153
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__7161 = 0;
  var s__7162 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__7162) {
      var e__7163 = cljs.core.first.call(null, s__7162);
      var G__7164 = (h__7161 + cljs.core.hash.call(null, e__7163)) % 4503599627370496;
      var G__7165 = cljs.core.next.call(null, s__7162);
      h__7161 = G__7164;
      s__7162 = G__7165;
      continue
    }else {
      return h__7161
    }
    break
  }
};
void 0;
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__7186__7187 = cljs.core.seq.call(null, fn_map);
  if(G__7186__7187) {
    var G__7189__7191 = cljs.core.first.call(null, G__7186__7187);
    var vec__7190__7192 = G__7189__7191;
    var key_name__7193 = cljs.core.nth.call(null, vec__7190__7192, 0, null);
    var f__7194 = cljs.core.nth.call(null, vec__7190__7192, 1, null);
    var G__7186__7195 = G__7186__7187;
    var G__7189__7196 = G__7189__7191;
    var G__7186__7197 = G__7186__7195;
    while(true) {
      var vec__7198__7199 = G__7189__7196;
      var key_name__7200 = cljs.core.nth.call(null, vec__7198__7199, 0, null);
      var f__7201 = cljs.core.nth.call(null, vec__7198__7199, 1, null);
      var G__7186__7202 = G__7186__7197;
      var str_name__7203 = cljs.core.name.call(null, key_name__7200);
      obj[str_name__7203] = f__7201;
      var temp__4092__auto____7204 = cljs.core.next.call(null, G__7186__7202);
      if(temp__4092__auto____7204) {
        var G__7186__7205 = temp__4092__auto____7204;
        var G__7206 = cljs.core.first.call(null, G__7186__7205);
        var G__7207 = G__7186__7205;
        G__7189__7196 = G__7206;
        G__7186__7197 = G__7207;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413358
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7208 = this;
  var h__2087__auto____7209 = this__7208.__hash;
  if(!(h__2087__auto____7209 == null)) {
    return h__2087__auto____7209
  }else {
    var h__2087__auto____7210 = cljs.core.hash_coll.call(null, coll);
    this__7208.__hash = h__2087__auto____7210;
    return h__2087__auto____7210
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7211 = this;
  if(this__7211.count === 1) {
    return null
  }else {
    return this__7211.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7212 = this;
  return new cljs.core.List(this__7212.meta, o, coll, this__7212.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__7213 = this;
  var this__7214 = this;
  return cljs.core.pr_str.call(null, this__7214)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7215 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7216 = this;
  return this__7216.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7217 = this;
  return this__7217.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7218 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7219 = this;
  return this__7219.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7220 = this;
  if(this__7220.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__7220.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7221 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7222 = this;
  return new cljs.core.List(meta, this__7222.first, this__7222.rest, this__7222.count, this__7222.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7223 = this;
  return this__7223.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7224 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7225 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7226 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7227 = this;
  return new cljs.core.List(this__7227.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__7228 = this;
  var this__7229 = this;
  return cljs.core.pr_str.call(null, this__7229)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7230 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7231 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7232 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7233 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7234 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7235 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7236 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7237 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7238 = this;
  return this__7238.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7239 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__7243__7244 = coll;
  if(G__7243__7244) {
    if(function() {
      var or__3943__auto____7245 = G__7243__7244.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3943__auto____7245) {
        return or__3943__auto____7245
      }else {
        return G__7243__7244.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__7243__7244.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7243__7244)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7243__7244)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_.call(null, coll)) {
    return cljs.core.rseq.call(null, coll)
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list = null;
  var list__0 = function() {
    return cljs.core.List.EMPTY
  };
  var list__1 = function(x) {
    return cljs.core.conj.call(null, cljs.core.List.EMPTY, x)
  };
  var list__2 = function(x, y) {
    return cljs.core.conj.call(null, list.call(null, y), x)
  };
  var list__3 = function(x, y, z) {
    return cljs.core.conj.call(null, list.call(null, y, z), x)
  };
  var list__4 = function() {
    var G__7246__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__7246 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7246__delegate.call(this, x, y, z, items)
    };
    G__7246.cljs$lang$maxFixedArity = 3;
    G__7246.cljs$lang$applyTo = function(arglist__7247) {
      var x = cljs.core.first(arglist__7247);
      var y = cljs.core.first(cljs.core.next(arglist__7247));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7247)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7247)));
      return G__7246__delegate(x, y, z, items)
    };
    G__7246.cljs$lang$arity$variadic = G__7246__delegate;
    return G__7246
  }();
  list = function(x, y, z, var_args) {
    var items = var_args;
    switch(arguments.length) {
      case 0:
        return list__0.call(this);
      case 1:
        return list__1.call(this, x);
      case 2:
        return list__2.call(this, x, y);
      case 3:
        return list__3.call(this, x, y, z);
      default:
        return list__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list.cljs$lang$maxFixedArity = 3;
  list.cljs$lang$applyTo = list__4.cljs$lang$applyTo;
  list.cljs$lang$arity$0 = list__0;
  list.cljs$lang$arity$1 = list__1;
  list.cljs$lang$arity$2 = list__2;
  list.cljs$lang$arity$3 = list__3;
  list.cljs$lang$arity$variadic = list__4.cljs$lang$arity$variadic;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7248 = this;
  var h__2087__auto____7249 = this__7248.__hash;
  if(!(h__2087__auto____7249 == null)) {
    return h__2087__auto____7249
  }else {
    var h__2087__auto____7250 = cljs.core.hash_coll.call(null, coll);
    this__7248.__hash = h__2087__auto____7250;
    return h__2087__auto____7250
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7251 = this;
  if(this__7251.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__7251.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7252 = this;
  return new cljs.core.Cons(null, o, coll, this__7252.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__7253 = this;
  var this__7254 = this;
  return cljs.core.pr_str.call(null, this__7254)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7255 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7256 = this;
  return this__7256.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7257 = this;
  if(this__7257.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7257.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7258 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7259 = this;
  return new cljs.core.Cons(meta, this__7259.first, this__7259.rest, this__7259.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7260 = this;
  return this__7260.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7261 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7261.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3943__auto____7266 = coll == null;
    if(or__3943__auto____7266) {
      return or__3943__auto____7266
    }else {
      var G__7267__7268 = coll;
      if(G__7267__7268) {
        if(function() {
          var or__3943__auto____7269 = G__7267__7268.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3943__auto____7269) {
            return or__3943__auto____7269
          }else {
            return G__7267__7268.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7267__7268.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7267__7268)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7267__7268)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__7273__7274 = x;
  if(G__7273__7274) {
    if(function() {
      var or__3943__auto____7275 = G__7273__7274.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3943__auto____7275) {
        return or__3943__auto____7275
      }else {
        return G__7273__7274.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__7273__7274.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7273__7274)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7273__7274)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__7276 = null;
  var G__7276__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__7276__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__7276 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7276__2.call(this, string, f);
      case 3:
        return G__7276__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7276
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__7277 = null;
  var G__7277__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__7277__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__7277 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7277__2.call(this, string, k);
      case 3:
        return G__7277__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7277
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__7278 = null;
  var G__7278__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__7278__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__7278 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7278__2.call(this, string, n);
      case 3:
        return G__7278__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7278
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function(this_sym7281, coll) {
  var this__7282 = this;
  var this_sym7281__7283 = this;
  var ___7284 = this_sym7281__7283;
  if(coll == null) {
    return null
  }else {
    var strobj__7285 = coll.strobj;
    if(strobj__7285 == null) {
      return cljs.core._lookup.call(null, coll, this__7282.k, null)
    }else {
      return strobj__7285[this__7282.k]
    }
  }
};
cljs.core.Keyword.prototype.apply = function(this_sym7279, args7280) {
  var this__7286 = this;
  return this_sym7279.call.apply(this_sym7279, [this_sym7279].concat(args7280.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__7295 = null;
  var G__7295__2 = function(this_sym7289, coll) {
    var this_sym7289__7291 = this;
    var this__7292 = this_sym7289__7291;
    return cljs.core._lookup.call(null, coll, this__7292.toString(), null)
  };
  var G__7295__3 = function(this_sym7290, coll, not_found) {
    var this_sym7290__7293 = this;
    var this__7294 = this_sym7290__7293;
    return cljs.core._lookup.call(null, coll, this__7294.toString(), not_found)
  };
  G__7295 = function(this_sym7290, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7295__2.call(this, this_sym7290, coll);
      case 3:
        return G__7295__3.call(this, this_sym7290, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7295
}();
String.prototype.apply = function(this_sym7287, args7288) {
  return this_sym7287.call.apply(this_sym7287, [this_sym7287].concat(args7288.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__7297 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__7297
  }else {
    lazy_seq.x = x__7297.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7298 = this;
  var h__2087__auto____7299 = this__7298.__hash;
  if(!(h__2087__auto____7299 == null)) {
    return h__2087__auto____7299
  }else {
    var h__2087__auto____7300 = cljs.core.hash_coll.call(null, coll);
    this__7298.__hash = h__2087__auto____7300;
    return h__2087__auto____7300
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7301 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7302 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__7303 = this;
  var this__7304 = this;
  return cljs.core.pr_str.call(null, this__7304)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7305 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7306 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7307 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7308 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7309 = this;
  return new cljs.core.LazySeq(meta, this__7309.realized, this__7309.x, this__7309.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7310 = this;
  return this__7310.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7311 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7311.meta)
};
cljs.core.LazySeq;
void 0;
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7312 = this;
  return this__7312.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__7313 = this;
  var ___7314 = this;
  this__7313.buf[this__7313.end] = o;
  return this__7313.end = this__7313.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__7315 = this;
  var ___7316 = this;
  var ret__7317 = new cljs.core.ArrayChunk(this__7315.buf, 0, this__7315.end);
  this__7315.buf = null;
  return ret__7317
};
cljs.core.ChunkBuffer;
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(cljs.core.make_array.call(null, capacity), 0)
};
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__7318 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__7318.arr[this__7318.off], this__7318.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7319 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__7319.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__7320 = this;
  if(this__7320.off === this__7320.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__7320.arr, this__7320.off + 1, this__7320.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__7321 = this;
  return this__7321.arr[this__7321.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__7322 = this;
  if(function() {
    var and__3941__auto____7323 = i >= 0;
    if(and__3941__auto____7323) {
      return i < this__7322.end - this__7322.off
    }else {
      return and__3941__auto____7323
    }
  }()) {
    return this__7322.arr[this__7322.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7324 = this;
  return this__7324.end - this__7324.off
};
cljs.core.ArrayChunk;
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return array_chunk.call(null, arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return array_chunk.call(null, arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_chunk.cljs$lang$arity$1 = array_chunk__1;
  array_chunk.cljs$lang$arity$2 = array_chunk__2;
  array_chunk.cljs$lang$arity$3 = array_chunk__3;
  return array_chunk
}();
cljs.core.ChunkedCons = function(chunk, more, meta) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27656296
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var this__7325 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7326 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7327 = this;
  return cljs.core._nth.call(null, this__7327.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7328 = this;
  if(cljs.core._count.call(null, this__7328.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__7328.chunk), this__7328.more, this__7328.meta)
  }else {
    if(this__7328.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__7328.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__7329 = this;
  if(this__7329.more == null) {
    return null
  }else {
    return this__7329.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7330 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__7331 = this;
  return new cljs.core.ChunkedCons(this__7331.chunk, this__7331.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7332 = this;
  return this__7332.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__7333 = this;
  return this__7333.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__7334 = this;
  if(this__7334.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7334.more
  }
};
cljs.core.ChunkedCons;
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first.call(null, s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest.call(null, s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__7338__7339 = s;
    if(G__7338__7339) {
      if(cljs.core.truth_(function() {
        var or__3943__auto____7340 = null;
        if(cljs.core.truth_(or__3943__auto____7340)) {
          return or__3943__auto____7340
        }else {
          return G__7338__7339.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__7338__7339.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7338__7339)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7338__7339)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__7343 = [];
  var s__7344 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__7344)) {
      ary__7343.push(cljs.core.first.call(null, s__7344));
      var G__7345 = cljs.core.next.call(null, s__7344);
      s__7344 = G__7345;
      continue
    }else {
      return ary__7343
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__7349 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__7350 = 0;
  var xs__7351 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__7351) {
      ret__7349[i__7350] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__7351));
      var G__7352 = i__7350 + 1;
      var G__7353 = cljs.core.next.call(null, xs__7351);
      i__7350 = G__7352;
      xs__7351 = G__7353;
      continue
    }else {
    }
    break
  }
  return ret__7349
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__7361 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7362 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7363 = 0;
      var s__7364 = s__7362;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto____7365 = s__7364;
          if(and__3941__auto____7365) {
            return i__7363 < size
          }else {
            return and__3941__auto____7365
          }
        }())) {
          a__7361[i__7363] = cljs.core.first.call(null, s__7364);
          var G__7368 = i__7363 + 1;
          var G__7369 = cljs.core.next.call(null, s__7364);
          i__7363 = G__7368;
          s__7364 = G__7369;
          continue
        }else {
          return a__7361
        }
        break
      }
    }else {
      var n__2426__auto____7366 = size;
      var i__7367 = 0;
      while(true) {
        if(i__7367 < n__2426__auto____7366) {
          a__7361[i__7367] = init_val_or_seq;
          var G__7370 = i__7367 + 1;
          i__7367 = G__7370;
          continue
        }else {
        }
        break
      }
      return a__7361
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__7378 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7379 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7380 = 0;
      var s__7381 = s__7379;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto____7382 = s__7381;
          if(and__3941__auto____7382) {
            return i__7380 < size
          }else {
            return and__3941__auto____7382
          }
        }())) {
          a__7378[i__7380] = cljs.core.first.call(null, s__7381);
          var G__7385 = i__7380 + 1;
          var G__7386 = cljs.core.next.call(null, s__7381);
          i__7380 = G__7385;
          s__7381 = G__7386;
          continue
        }else {
          return a__7378
        }
        break
      }
    }else {
      var n__2426__auto____7383 = size;
      var i__7384 = 0;
      while(true) {
        if(i__7384 < n__2426__auto____7383) {
          a__7378[i__7384] = init_val_or_seq;
          var G__7387 = i__7384 + 1;
          i__7384 = G__7387;
          continue
        }else {
        }
        break
      }
      return a__7378
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__7395 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7396 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7397 = 0;
      var s__7398 = s__7396;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto____7399 = s__7398;
          if(and__3941__auto____7399) {
            return i__7397 < size
          }else {
            return and__3941__auto____7399
          }
        }())) {
          a__7395[i__7397] = cljs.core.first.call(null, s__7398);
          var G__7402 = i__7397 + 1;
          var G__7403 = cljs.core.next.call(null, s__7398);
          i__7397 = G__7402;
          s__7398 = G__7403;
          continue
        }else {
          return a__7395
        }
        break
      }
    }else {
      var n__2426__auto____7400 = size;
      var i__7401 = 0;
      while(true) {
        if(i__7401 < n__2426__auto____7400) {
          a__7395[i__7401] = init_val_or_seq;
          var G__7404 = i__7401 + 1;
          i__7401 = G__7404;
          continue
        }else {
        }
        break
      }
      return a__7395
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__7409 = s;
    var i__7410 = n;
    var sum__7411 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3941__auto____7412 = i__7410 > 0;
        if(and__3941__auto____7412) {
          return cljs.core.seq.call(null, s__7409)
        }else {
          return and__3941__auto____7412
        }
      }())) {
        var G__7413 = cljs.core.next.call(null, s__7409);
        var G__7414 = i__7410 - 1;
        var G__7415 = sum__7411 + 1;
        s__7409 = G__7413;
        i__7410 = G__7414;
        sum__7411 = G__7415;
        continue
      }else {
        return sum__7411
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__7420 = cljs.core.seq.call(null, x);
      if(s__7420) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7420)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__7420), concat.call(null, cljs.core.chunk_rest.call(null, s__7420), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__7420), concat.call(null, cljs.core.rest.call(null, s__7420), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__7424__delegate = function(x, y, zs) {
      var cat__7423 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__7422 = cljs.core.seq.call(null, xys);
          if(xys__7422) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__7422)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__7422), cat.call(null, cljs.core.chunk_rest.call(null, xys__7422), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__7422), cat.call(null, cljs.core.rest.call(null, xys__7422), zs))
            }
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat__7423.call(null, concat.call(null, x, y), zs)
    };
    var G__7424 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7424__delegate.call(this, x, y, zs)
    };
    G__7424.cljs$lang$maxFixedArity = 2;
    G__7424.cljs$lang$applyTo = function(arglist__7425) {
      var x = cljs.core.first(arglist__7425);
      var y = cljs.core.first(cljs.core.next(arglist__7425));
      var zs = cljs.core.rest(cljs.core.next(arglist__7425));
      return G__7424__delegate(x, y, zs)
    };
    G__7424.cljs$lang$arity$variadic = G__7424__delegate;
    return G__7424
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__7426__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__7426 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7426__delegate.call(this, a, b, c, d, more)
    };
    G__7426.cljs$lang$maxFixedArity = 4;
    G__7426.cljs$lang$applyTo = function(arglist__7427) {
      var a = cljs.core.first(arglist__7427);
      var b = cljs.core.first(cljs.core.next(arglist__7427));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7427)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7427))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7427))));
      return G__7426__delegate(a, b, c, d, more)
    };
    G__7426.cljs$lang$arity$variadic = G__7426__delegate;
    return G__7426
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
void 0;
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__7469 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__7470 = cljs.core._first.call(null, args__7469);
    var args__7471 = cljs.core._rest.call(null, args__7469);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__7470)
      }else {
        return f.call(null, a__7470)
      }
    }else {
      var b__7472 = cljs.core._first.call(null, args__7471);
      var args__7473 = cljs.core._rest.call(null, args__7471);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__7470, b__7472)
        }else {
          return f.call(null, a__7470, b__7472)
        }
      }else {
        var c__7474 = cljs.core._first.call(null, args__7473);
        var args__7475 = cljs.core._rest.call(null, args__7473);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__7470, b__7472, c__7474)
          }else {
            return f.call(null, a__7470, b__7472, c__7474)
          }
        }else {
          var d__7476 = cljs.core._first.call(null, args__7475);
          var args__7477 = cljs.core._rest.call(null, args__7475);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__7470, b__7472, c__7474, d__7476)
            }else {
              return f.call(null, a__7470, b__7472, c__7474, d__7476)
            }
          }else {
            var e__7478 = cljs.core._first.call(null, args__7477);
            var args__7479 = cljs.core._rest.call(null, args__7477);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__7470, b__7472, c__7474, d__7476, e__7478)
              }else {
                return f.call(null, a__7470, b__7472, c__7474, d__7476, e__7478)
              }
            }else {
              var f__7480 = cljs.core._first.call(null, args__7479);
              var args__7481 = cljs.core._rest.call(null, args__7479);
              if(argc === 6) {
                if(f__7480.cljs$lang$arity$6) {
                  return f__7480.cljs$lang$arity$6(a__7470, b__7472, c__7474, d__7476, e__7478, f__7480)
                }else {
                  return f__7480.call(null, a__7470, b__7472, c__7474, d__7476, e__7478, f__7480)
                }
              }else {
                var g__7482 = cljs.core._first.call(null, args__7481);
                var args__7483 = cljs.core._rest.call(null, args__7481);
                if(argc === 7) {
                  if(f__7480.cljs$lang$arity$7) {
                    return f__7480.cljs$lang$arity$7(a__7470, b__7472, c__7474, d__7476, e__7478, f__7480, g__7482)
                  }else {
                    return f__7480.call(null, a__7470, b__7472, c__7474, d__7476, e__7478, f__7480, g__7482)
                  }
                }else {
                  var h__7484 = cljs.core._first.call(null, args__7483);
                  var args__7485 = cljs.core._rest.call(null, args__7483);
                  if(argc === 8) {
                    if(f__7480.cljs$lang$arity$8) {
                      return f__7480.cljs$lang$arity$8(a__7470, b__7472, c__7474, d__7476, e__7478, f__7480, g__7482, h__7484)
                    }else {
                      return f__7480.call(null, a__7470, b__7472, c__7474, d__7476, e__7478, f__7480, g__7482, h__7484)
                    }
                  }else {
                    var i__7486 = cljs.core._first.call(null, args__7485);
                    var args__7487 = cljs.core._rest.call(null, args__7485);
                    if(argc === 9) {
                      if(f__7480.cljs$lang$arity$9) {
                        return f__7480.cljs$lang$arity$9(a__7470, b__7472, c__7474, d__7476, e__7478, f__7480, g__7482, h__7484, i__7486)
                      }else {
                        return f__7480.call(null, a__7470, b__7472, c__7474, d__7476, e__7478, f__7480, g__7482, h__7484, i__7486)
                      }
                    }else {
                      var j__7488 = cljs.core._first.call(null, args__7487);
                      var args__7489 = cljs.core._rest.call(null, args__7487);
                      if(argc === 10) {
                        if(f__7480.cljs$lang$arity$10) {
                          return f__7480.cljs$lang$arity$10(a__7470, b__7472, c__7474, d__7476, e__7478, f__7480, g__7482, h__7484, i__7486, j__7488)
                        }else {
                          return f__7480.call(null, a__7470, b__7472, c__7474, d__7476, e__7478, f__7480, g__7482, h__7484, i__7486, j__7488)
                        }
                      }else {
                        var k__7490 = cljs.core._first.call(null, args__7489);
                        var args__7491 = cljs.core._rest.call(null, args__7489);
                        if(argc === 11) {
                          if(f__7480.cljs$lang$arity$11) {
                            return f__7480.cljs$lang$arity$11(a__7470, b__7472, c__7474, d__7476, e__7478, f__7480, g__7482, h__7484, i__7486, j__7488, k__7490)
                          }else {
                            return f__7480.call(null, a__7470, b__7472, c__7474, d__7476, e__7478, f__7480, g__7482, h__7484, i__7486, j__7488, k__7490)
                          }
                        }else {
                          var l__7492 = cljs.core._first.call(null, args__7491);
                          var args__7493 = cljs.core._rest.call(null, args__7491);
                          if(argc === 12) {
                            if(f__7480.cljs$lang$arity$12) {
                              return f__7480.cljs$lang$arity$12(a__7470, b__7472, c__7474, d__7476, e__7478, f__7480, g__7482, h__7484, i__7486, j__7488, k__7490, l__7492)
                            }else {
                              return f__7480.call(null, a__7470, b__7472, c__7474, d__7476, e__7478, f__7480, g__7482, h__7484, i__7486, j__7488, k__7490, l__7492)
                            }
                          }else {
                            var m__7494 = cljs.core._first.call(null, args__7493);
                            var args__7495 = cljs.core._rest.call(null, args__7493);
                            if(argc === 13) {
                              if(f__7480.cljs$lang$arity$13) {
                                return f__7480.cljs$lang$arity$13(a__7470, b__7472, c__7474, d__7476, e__7478, f__7480, g__7482, h__7484, i__7486, j__7488, k__7490, l__7492, m__7494)
                              }else {
                                return f__7480.call(null, a__7470, b__7472, c__7474, d__7476, e__7478, f__7480, g__7482, h__7484, i__7486, j__7488, k__7490, l__7492, m__7494)
                              }
                            }else {
                              var n__7496 = cljs.core._first.call(null, args__7495);
                              var args__7497 = cljs.core._rest.call(null, args__7495);
                              if(argc === 14) {
                                if(f__7480.cljs$lang$arity$14) {
                                  return f__7480.cljs$lang$arity$14(a__7470, b__7472, c__7474, d__7476, e__7478, f__7480, g__7482, h__7484, i__7486, j__7488, k__7490, l__7492, m__7494, n__7496)
                                }else {
                                  return f__7480.call(null, a__7470, b__7472, c__7474, d__7476, e__7478, f__7480, g__7482, h__7484, i__7486, j__7488, k__7490, l__7492, m__7494, n__7496)
                                }
                              }else {
                                var o__7498 = cljs.core._first.call(null, args__7497);
                                var args__7499 = cljs.core._rest.call(null, args__7497);
                                if(argc === 15) {
                                  if(f__7480.cljs$lang$arity$15) {
                                    return f__7480.cljs$lang$arity$15(a__7470, b__7472, c__7474, d__7476, e__7478, f__7480, g__7482, h__7484, i__7486, j__7488, k__7490, l__7492, m__7494, n__7496, o__7498)
                                  }else {
                                    return f__7480.call(null, a__7470, b__7472, c__7474, d__7476, e__7478, f__7480, g__7482, h__7484, i__7486, j__7488, k__7490, l__7492, m__7494, n__7496, o__7498)
                                  }
                                }else {
                                  var p__7500 = cljs.core._first.call(null, args__7499);
                                  var args__7501 = cljs.core._rest.call(null, args__7499);
                                  if(argc === 16) {
                                    if(f__7480.cljs$lang$arity$16) {
                                      return f__7480.cljs$lang$arity$16(a__7470, b__7472, c__7474, d__7476, e__7478, f__7480, g__7482, h__7484, i__7486, j__7488, k__7490, l__7492, m__7494, n__7496, o__7498, p__7500)
                                    }else {
                                      return f__7480.call(null, a__7470, b__7472, c__7474, d__7476, e__7478, f__7480, g__7482, h__7484, i__7486, j__7488, k__7490, l__7492, m__7494, n__7496, o__7498, p__7500)
                                    }
                                  }else {
                                    var q__7502 = cljs.core._first.call(null, args__7501);
                                    var args__7503 = cljs.core._rest.call(null, args__7501);
                                    if(argc === 17) {
                                      if(f__7480.cljs$lang$arity$17) {
                                        return f__7480.cljs$lang$arity$17(a__7470, b__7472, c__7474, d__7476, e__7478, f__7480, g__7482, h__7484, i__7486, j__7488, k__7490, l__7492, m__7494, n__7496, o__7498, p__7500, q__7502)
                                      }else {
                                        return f__7480.call(null, a__7470, b__7472, c__7474, d__7476, e__7478, f__7480, g__7482, h__7484, i__7486, j__7488, k__7490, l__7492, m__7494, n__7496, o__7498, p__7500, q__7502)
                                      }
                                    }else {
                                      var r__7504 = cljs.core._first.call(null, args__7503);
                                      var args__7505 = cljs.core._rest.call(null, args__7503);
                                      if(argc === 18) {
                                        if(f__7480.cljs$lang$arity$18) {
                                          return f__7480.cljs$lang$arity$18(a__7470, b__7472, c__7474, d__7476, e__7478, f__7480, g__7482, h__7484, i__7486, j__7488, k__7490, l__7492, m__7494, n__7496, o__7498, p__7500, q__7502, r__7504)
                                        }else {
                                          return f__7480.call(null, a__7470, b__7472, c__7474, d__7476, e__7478, f__7480, g__7482, h__7484, i__7486, j__7488, k__7490, l__7492, m__7494, n__7496, o__7498, p__7500, q__7502, r__7504)
                                        }
                                      }else {
                                        var s__7506 = cljs.core._first.call(null, args__7505);
                                        var args__7507 = cljs.core._rest.call(null, args__7505);
                                        if(argc === 19) {
                                          if(f__7480.cljs$lang$arity$19) {
                                            return f__7480.cljs$lang$arity$19(a__7470, b__7472, c__7474, d__7476, e__7478, f__7480, g__7482, h__7484, i__7486, j__7488, k__7490, l__7492, m__7494, n__7496, o__7498, p__7500, q__7502, r__7504, s__7506)
                                          }else {
                                            return f__7480.call(null, a__7470, b__7472, c__7474, d__7476, e__7478, f__7480, g__7482, h__7484, i__7486, j__7488, k__7490, l__7492, m__7494, n__7496, o__7498, p__7500, q__7502, r__7504, s__7506)
                                          }
                                        }else {
                                          var t__7508 = cljs.core._first.call(null, args__7507);
                                          var args__7509 = cljs.core._rest.call(null, args__7507);
                                          if(argc === 20) {
                                            if(f__7480.cljs$lang$arity$20) {
                                              return f__7480.cljs$lang$arity$20(a__7470, b__7472, c__7474, d__7476, e__7478, f__7480, g__7482, h__7484, i__7486, j__7488, k__7490, l__7492, m__7494, n__7496, o__7498, p__7500, q__7502, r__7504, s__7506, t__7508)
                                            }else {
                                              return f__7480.call(null, a__7470, b__7472, c__7474, d__7476, e__7478, f__7480, g__7482, h__7484, i__7486, j__7488, k__7490, l__7492, m__7494, n__7496, o__7498, p__7500, q__7502, r__7504, s__7506, t__7508)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
void 0;
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__7524 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7525 = cljs.core.bounded_count.call(null, args, fixed_arity__7524 + 1);
      if(bc__7525 <= fixed_arity__7524) {
        return cljs.core.apply_to.call(null, f, bc__7525, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__7526 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__7527 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7528 = cljs.core.bounded_count.call(null, arglist__7526, fixed_arity__7527 + 1);
      if(bc__7528 <= fixed_arity__7527) {
        return cljs.core.apply_to.call(null, f, bc__7528, arglist__7526)
      }else {
        return f.cljs$lang$applyTo(arglist__7526)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7526))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__7529 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__7530 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7531 = cljs.core.bounded_count.call(null, arglist__7529, fixed_arity__7530 + 1);
      if(bc__7531 <= fixed_arity__7530) {
        return cljs.core.apply_to.call(null, f, bc__7531, arglist__7529)
      }else {
        return f.cljs$lang$applyTo(arglist__7529)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7529))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__7532 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__7533 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7534 = cljs.core.bounded_count.call(null, arglist__7532, fixed_arity__7533 + 1);
      if(bc__7534 <= fixed_arity__7533) {
        return cljs.core.apply_to.call(null, f, bc__7534, arglist__7532)
      }else {
        return f.cljs$lang$applyTo(arglist__7532)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7532))
    }
  };
  var apply__6 = function() {
    var G__7538__delegate = function(f, a, b, c, d, args) {
      var arglist__7535 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__7536 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__7537 = cljs.core.bounded_count.call(null, arglist__7535, fixed_arity__7536 + 1);
        if(bc__7537 <= fixed_arity__7536) {
          return cljs.core.apply_to.call(null, f, bc__7537, arglist__7535)
        }else {
          return f.cljs$lang$applyTo(arglist__7535)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__7535))
      }
    };
    var G__7538 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__7538__delegate.call(this, f, a, b, c, d, args)
    };
    G__7538.cljs$lang$maxFixedArity = 5;
    G__7538.cljs$lang$applyTo = function(arglist__7539) {
      var f = cljs.core.first(arglist__7539);
      var a = cljs.core.first(cljs.core.next(arglist__7539));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7539)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7539))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7539)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7539)))));
      return G__7538__delegate(f, a, b, c, d, args)
    };
    G__7538.cljs$lang$arity$variadic = G__7538__delegate;
    return G__7538
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__7540) {
    var obj = cljs.core.first(arglist__7540);
    var f = cljs.core.first(cljs.core.next(arglist__7540));
    var args = cljs.core.rest(cljs.core.next(arglist__7540));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var not_EQ___3 = function() {
    var G__7541__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__7541 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7541__delegate.call(this, x, y, more)
    };
    G__7541.cljs$lang$maxFixedArity = 2;
    G__7541.cljs$lang$applyTo = function(arglist__7542) {
      var x = cljs.core.first(arglist__7542);
      var y = cljs.core.first(cljs.core.next(arglist__7542));
      var more = cljs.core.rest(cljs.core.next(arglist__7542));
      return G__7541__delegate(x, y, more)
    };
    G__7541.cljs$lang$arity$variadic = G__7541__delegate;
    return G__7541
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq.call(null, coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__7543 = pred;
        var G__7544 = cljs.core.next.call(null, coll);
        pred = G__7543;
        coll = G__7544;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_.call(null, pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll)) {
      var or__3943__auto____7546 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3943__auto____7546)) {
        return or__3943__auto____7546
      }else {
        var G__7547 = pred;
        var G__7548 = cljs.core.next.call(null, coll);
        pred = G__7547;
        coll = G__7548;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_.call(null, n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__7549 = null;
    var G__7549__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__7549__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__7549__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__7549__3 = function() {
      var G__7550__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__7550 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__7550__delegate.call(this, x, y, zs)
      };
      G__7550.cljs$lang$maxFixedArity = 2;
      G__7550.cljs$lang$applyTo = function(arglist__7551) {
        var x = cljs.core.first(arglist__7551);
        var y = cljs.core.first(cljs.core.next(arglist__7551));
        var zs = cljs.core.rest(cljs.core.next(arglist__7551));
        return G__7550__delegate(x, y, zs)
      };
      G__7550.cljs$lang$arity$variadic = G__7550__delegate;
      return G__7550
    }();
    G__7549 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__7549__0.call(this);
        case 1:
          return G__7549__1.call(this, x);
        case 2:
          return G__7549__2.call(this, x, y);
        default:
          return G__7549__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__7549.cljs$lang$maxFixedArity = 2;
    G__7549.cljs$lang$applyTo = G__7549__3.cljs$lang$applyTo;
    return G__7549
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__7552__delegate = function(args) {
      return x
    };
    var G__7552 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7552__delegate.call(this, args)
    };
    G__7552.cljs$lang$maxFixedArity = 0;
    G__7552.cljs$lang$applyTo = function(arglist__7553) {
      var args = cljs.core.seq(arglist__7553);
      return G__7552__delegate(args)
    };
    G__7552.cljs$lang$arity$variadic = G__7552__delegate;
    return G__7552
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__7560 = null;
      var G__7560__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__7560__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__7560__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__7560__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__7560__4 = function() {
        var G__7561__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__7561 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7561__delegate.call(this, x, y, z, args)
        };
        G__7561.cljs$lang$maxFixedArity = 3;
        G__7561.cljs$lang$applyTo = function(arglist__7562) {
          var x = cljs.core.first(arglist__7562);
          var y = cljs.core.first(cljs.core.next(arglist__7562));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7562)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7562)));
          return G__7561__delegate(x, y, z, args)
        };
        G__7561.cljs$lang$arity$variadic = G__7561__delegate;
        return G__7561
      }();
      G__7560 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7560__0.call(this);
          case 1:
            return G__7560__1.call(this, x);
          case 2:
            return G__7560__2.call(this, x, y);
          case 3:
            return G__7560__3.call(this, x, y, z);
          default:
            return G__7560__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7560.cljs$lang$maxFixedArity = 3;
      G__7560.cljs$lang$applyTo = G__7560__4.cljs$lang$applyTo;
      return G__7560
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__7563 = null;
      var G__7563__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__7563__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__7563__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__7563__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__7563__4 = function() {
        var G__7564__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__7564 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7564__delegate.call(this, x, y, z, args)
        };
        G__7564.cljs$lang$maxFixedArity = 3;
        G__7564.cljs$lang$applyTo = function(arglist__7565) {
          var x = cljs.core.first(arglist__7565);
          var y = cljs.core.first(cljs.core.next(arglist__7565));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7565)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7565)));
          return G__7564__delegate(x, y, z, args)
        };
        G__7564.cljs$lang$arity$variadic = G__7564__delegate;
        return G__7564
      }();
      G__7563 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7563__0.call(this);
          case 1:
            return G__7563__1.call(this, x);
          case 2:
            return G__7563__2.call(this, x, y);
          case 3:
            return G__7563__3.call(this, x, y, z);
          default:
            return G__7563__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7563.cljs$lang$maxFixedArity = 3;
      G__7563.cljs$lang$applyTo = G__7563__4.cljs$lang$applyTo;
      return G__7563
    }()
  };
  var comp__4 = function() {
    var G__7566__delegate = function(f1, f2, f3, fs) {
      var fs__7557 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__7567__delegate = function(args) {
          var ret__7558 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__7557), args);
          var fs__7559 = cljs.core.next.call(null, fs__7557);
          while(true) {
            if(fs__7559) {
              var G__7568 = cljs.core.first.call(null, fs__7559).call(null, ret__7558);
              var G__7569 = cljs.core.next.call(null, fs__7559);
              ret__7558 = G__7568;
              fs__7559 = G__7569;
              continue
            }else {
              return ret__7558
            }
            break
          }
        };
        var G__7567 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7567__delegate.call(this, args)
        };
        G__7567.cljs$lang$maxFixedArity = 0;
        G__7567.cljs$lang$applyTo = function(arglist__7570) {
          var args = cljs.core.seq(arglist__7570);
          return G__7567__delegate(args)
        };
        G__7567.cljs$lang$arity$variadic = G__7567__delegate;
        return G__7567
      }()
    };
    var G__7566 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7566__delegate.call(this, f1, f2, f3, fs)
    };
    G__7566.cljs$lang$maxFixedArity = 3;
    G__7566.cljs$lang$applyTo = function(arglist__7571) {
      var f1 = cljs.core.first(arglist__7571);
      var f2 = cljs.core.first(cljs.core.next(arglist__7571));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7571)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7571)));
      return G__7566__delegate(f1, f2, f3, fs)
    };
    G__7566.cljs$lang$arity$variadic = G__7566__delegate;
    return G__7566
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__7572__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__7572 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7572__delegate.call(this, args)
      };
      G__7572.cljs$lang$maxFixedArity = 0;
      G__7572.cljs$lang$applyTo = function(arglist__7573) {
        var args = cljs.core.seq(arglist__7573);
        return G__7572__delegate(args)
      };
      G__7572.cljs$lang$arity$variadic = G__7572__delegate;
      return G__7572
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__7574__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__7574 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7574__delegate.call(this, args)
      };
      G__7574.cljs$lang$maxFixedArity = 0;
      G__7574.cljs$lang$applyTo = function(arglist__7575) {
        var args = cljs.core.seq(arglist__7575);
        return G__7574__delegate(args)
      };
      G__7574.cljs$lang$arity$variadic = G__7574__delegate;
      return G__7574
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__7576__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__7576 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7576__delegate.call(this, args)
      };
      G__7576.cljs$lang$maxFixedArity = 0;
      G__7576.cljs$lang$applyTo = function(arglist__7577) {
        var args = cljs.core.seq(arglist__7577);
        return G__7576__delegate(args)
      };
      G__7576.cljs$lang$arity$variadic = G__7576__delegate;
      return G__7576
    }()
  };
  var partial__5 = function() {
    var G__7578__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__7579__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__7579 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7579__delegate.call(this, args)
        };
        G__7579.cljs$lang$maxFixedArity = 0;
        G__7579.cljs$lang$applyTo = function(arglist__7580) {
          var args = cljs.core.seq(arglist__7580);
          return G__7579__delegate(args)
        };
        G__7579.cljs$lang$arity$variadic = G__7579__delegate;
        return G__7579
      }()
    };
    var G__7578 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7578__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__7578.cljs$lang$maxFixedArity = 4;
    G__7578.cljs$lang$applyTo = function(arglist__7581) {
      var f = cljs.core.first(arglist__7581);
      var arg1 = cljs.core.first(cljs.core.next(arglist__7581));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7581)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7581))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7581))));
      return G__7578__delegate(f, arg1, arg2, arg3, more)
    };
    G__7578.cljs$lang$arity$variadic = G__7578__delegate;
    return G__7578
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__7582 = null;
      var G__7582__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__7582__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__7582__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__7582__4 = function() {
        var G__7583__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__7583 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7583__delegate.call(this, a, b, c, ds)
        };
        G__7583.cljs$lang$maxFixedArity = 3;
        G__7583.cljs$lang$applyTo = function(arglist__7584) {
          var a = cljs.core.first(arglist__7584);
          var b = cljs.core.first(cljs.core.next(arglist__7584));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7584)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7584)));
          return G__7583__delegate(a, b, c, ds)
        };
        G__7583.cljs$lang$arity$variadic = G__7583__delegate;
        return G__7583
      }();
      G__7582 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__7582__1.call(this, a);
          case 2:
            return G__7582__2.call(this, a, b);
          case 3:
            return G__7582__3.call(this, a, b, c);
          default:
            return G__7582__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7582.cljs$lang$maxFixedArity = 3;
      G__7582.cljs$lang$applyTo = G__7582__4.cljs$lang$applyTo;
      return G__7582
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__7585 = null;
      var G__7585__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7585__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__7585__4 = function() {
        var G__7586__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__7586 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7586__delegate.call(this, a, b, c, ds)
        };
        G__7586.cljs$lang$maxFixedArity = 3;
        G__7586.cljs$lang$applyTo = function(arglist__7587) {
          var a = cljs.core.first(arglist__7587);
          var b = cljs.core.first(cljs.core.next(arglist__7587));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7587)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7587)));
          return G__7586__delegate(a, b, c, ds)
        };
        G__7586.cljs$lang$arity$variadic = G__7586__delegate;
        return G__7586
      }();
      G__7585 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7585__2.call(this, a, b);
          case 3:
            return G__7585__3.call(this, a, b, c);
          default:
            return G__7585__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7585.cljs$lang$maxFixedArity = 3;
      G__7585.cljs$lang$applyTo = G__7585__4.cljs$lang$applyTo;
      return G__7585
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__7588 = null;
      var G__7588__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7588__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__7588__4 = function() {
        var G__7589__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__7589 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7589__delegate.call(this, a, b, c, ds)
        };
        G__7589.cljs$lang$maxFixedArity = 3;
        G__7589.cljs$lang$applyTo = function(arglist__7590) {
          var a = cljs.core.first(arglist__7590);
          var b = cljs.core.first(cljs.core.next(arglist__7590));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7590)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7590)));
          return G__7589__delegate(a, b, c, ds)
        };
        G__7589.cljs$lang$arity$variadic = G__7589__delegate;
        return G__7589
      }();
      G__7588 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7588__2.call(this, a, b);
          case 3:
            return G__7588__3.call(this, a, b, c);
          default:
            return G__7588__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7588.cljs$lang$maxFixedArity = 3;
      G__7588.cljs$lang$applyTo = G__7588__4.cljs$lang$applyTo;
      return G__7588
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__7606 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____7614 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____7614) {
        var s__7615 = temp__4092__auto____7614;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7615)) {
          var c__7616 = cljs.core.chunk_first.call(null, s__7615);
          var size__7617 = cljs.core.count.call(null, c__7616);
          var b__7618 = cljs.core.chunk_buffer.call(null, size__7617);
          var n__2426__auto____7619 = size__7617;
          var i__7620 = 0;
          while(true) {
            if(i__7620 < n__2426__auto____7619) {
              cljs.core.chunk_append.call(null, b__7618, f.call(null, idx + i__7620, cljs.core._nth.call(null, c__7616, i__7620)));
              var G__7621 = i__7620 + 1;
              i__7620 = G__7621;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7618), mapi.call(null, idx + size__7617, cljs.core.chunk_rest.call(null, s__7615)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__7615)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__7615)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__7606.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____7631 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____7631) {
      var s__7632 = temp__4092__auto____7631;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__7632)) {
        var c__7633 = cljs.core.chunk_first.call(null, s__7632);
        var size__7634 = cljs.core.count.call(null, c__7633);
        var b__7635 = cljs.core.chunk_buffer.call(null, size__7634);
        var n__2426__auto____7636 = size__7634;
        var i__7637 = 0;
        while(true) {
          if(i__7637 < n__2426__auto____7636) {
            var x__7638 = f.call(null, cljs.core._nth.call(null, c__7633, i__7637));
            if(x__7638 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__7635, x__7638)
            }
            var G__7640 = i__7637 + 1;
            i__7637 = G__7640;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7635), keep.call(null, f, cljs.core.chunk_rest.call(null, s__7632)))
      }else {
        var x__7639 = f.call(null, cljs.core.first.call(null, s__7632));
        if(x__7639 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__7632))
        }else {
          return cljs.core.cons.call(null, x__7639, keep.call(null, f, cljs.core.rest.call(null, s__7632)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__7666 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____7676 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____7676) {
        var s__7677 = temp__4092__auto____7676;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7677)) {
          var c__7678 = cljs.core.chunk_first.call(null, s__7677);
          var size__7679 = cljs.core.count.call(null, c__7678);
          var b__7680 = cljs.core.chunk_buffer.call(null, size__7679);
          var n__2426__auto____7681 = size__7679;
          var i__7682 = 0;
          while(true) {
            if(i__7682 < n__2426__auto____7681) {
              var x__7683 = f.call(null, idx + i__7682, cljs.core._nth.call(null, c__7678, i__7682));
              if(x__7683 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__7680, x__7683)
              }
              var G__7685 = i__7682 + 1;
              i__7682 = G__7685;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7680), keepi.call(null, idx + size__7679, cljs.core.chunk_rest.call(null, s__7677)))
        }else {
          var x__7684 = f.call(null, idx, cljs.core.first.call(null, s__7677));
          if(x__7684 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7677))
          }else {
            return cljs.core.cons.call(null, x__7684, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7677)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__7666.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7771 = p.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7771)) {
            return p.call(null, y)
          }else {
            return and__3941__auto____7771
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7772 = p.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7772)) {
            var and__3941__auto____7773 = p.call(null, y);
            if(cljs.core.truth_(and__3941__auto____7773)) {
              return p.call(null, z)
            }else {
              return and__3941__auto____7773
            }
          }else {
            return and__3941__auto____7772
          }
        }())
      };
      var ep1__4 = function() {
        var G__7842__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3941__auto____7774 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3941__auto____7774)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3941__auto____7774
            }
          }())
        };
        var G__7842 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7842__delegate.call(this, x, y, z, args)
        };
        G__7842.cljs$lang$maxFixedArity = 3;
        G__7842.cljs$lang$applyTo = function(arglist__7843) {
          var x = cljs.core.first(arglist__7843);
          var y = cljs.core.first(cljs.core.next(arglist__7843));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7843)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7843)));
          return G__7842__delegate(x, y, z, args)
        };
        G__7842.cljs$lang$arity$variadic = G__7842__delegate;
        return G__7842
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7786 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7786)) {
            return p2.call(null, x)
          }else {
            return and__3941__auto____7786
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7787 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7787)) {
            var and__3941__auto____7788 = p1.call(null, y);
            if(cljs.core.truth_(and__3941__auto____7788)) {
              var and__3941__auto____7789 = p2.call(null, x);
              if(cljs.core.truth_(and__3941__auto____7789)) {
                return p2.call(null, y)
              }else {
                return and__3941__auto____7789
              }
            }else {
              return and__3941__auto____7788
            }
          }else {
            return and__3941__auto____7787
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7790 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7790)) {
            var and__3941__auto____7791 = p1.call(null, y);
            if(cljs.core.truth_(and__3941__auto____7791)) {
              var and__3941__auto____7792 = p1.call(null, z);
              if(cljs.core.truth_(and__3941__auto____7792)) {
                var and__3941__auto____7793 = p2.call(null, x);
                if(cljs.core.truth_(and__3941__auto____7793)) {
                  var and__3941__auto____7794 = p2.call(null, y);
                  if(cljs.core.truth_(and__3941__auto____7794)) {
                    return p2.call(null, z)
                  }else {
                    return and__3941__auto____7794
                  }
                }else {
                  return and__3941__auto____7793
                }
              }else {
                return and__3941__auto____7792
              }
            }else {
              return and__3941__auto____7791
            }
          }else {
            return and__3941__auto____7790
          }
        }())
      };
      var ep2__4 = function() {
        var G__7844__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3941__auto____7795 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3941__auto____7795)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7641_SHARP_) {
                var and__3941__auto____7796 = p1.call(null, p1__7641_SHARP_);
                if(cljs.core.truth_(and__3941__auto____7796)) {
                  return p2.call(null, p1__7641_SHARP_)
                }else {
                  return and__3941__auto____7796
                }
              }, args)
            }else {
              return and__3941__auto____7795
            }
          }())
        };
        var G__7844 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7844__delegate.call(this, x, y, z, args)
        };
        G__7844.cljs$lang$maxFixedArity = 3;
        G__7844.cljs$lang$applyTo = function(arglist__7845) {
          var x = cljs.core.first(arglist__7845);
          var y = cljs.core.first(cljs.core.next(arglist__7845));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7845)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7845)));
          return G__7844__delegate(x, y, z, args)
        };
        G__7844.cljs$lang$arity$variadic = G__7844__delegate;
        return G__7844
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7815 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7815)) {
            var and__3941__auto____7816 = p2.call(null, x);
            if(cljs.core.truth_(and__3941__auto____7816)) {
              return p3.call(null, x)
            }else {
              return and__3941__auto____7816
            }
          }else {
            return and__3941__auto____7815
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7817 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7817)) {
            var and__3941__auto____7818 = p2.call(null, x);
            if(cljs.core.truth_(and__3941__auto____7818)) {
              var and__3941__auto____7819 = p3.call(null, x);
              if(cljs.core.truth_(and__3941__auto____7819)) {
                var and__3941__auto____7820 = p1.call(null, y);
                if(cljs.core.truth_(and__3941__auto____7820)) {
                  var and__3941__auto____7821 = p2.call(null, y);
                  if(cljs.core.truth_(and__3941__auto____7821)) {
                    return p3.call(null, y)
                  }else {
                    return and__3941__auto____7821
                  }
                }else {
                  return and__3941__auto____7820
                }
              }else {
                return and__3941__auto____7819
              }
            }else {
              return and__3941__auto____7818
            }
          }else {
            return and__3941__auto____7817
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7822 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7822)) {
            var and__3941__auto____7823 = p2.call(null, x);
            if(cljs.core.truth_(and__3941__auto____7823)) {
              var and__3941__auto____7824 = p3.call(null, x);
              if(cljs.core.truth_(and__3941__auto____7824)) {
                var and__3941__auto____7825 = p1.call(null, y);
                if(cljs.core.truth_(and__3941__auto____7825)) {
                  var and__3941__auto____7826 = p2.call(null, y);
                  if(cljs.core.truth_(and__3941__auto____7826)) {
                    var and__3941__auto____7827 = p3.call(null, y);
                    if(cljs.core.truth_(and__3941__auto____7827)) {
                      var and__3941__auto____7828 = p1.call(null, z);
                      if(cljs.core.truth_(and__3941__auto____7828)) {
                        var and__3941__auto____7829 = p2.call(null, z);
                        if(cljs.core.truth_(and__3941__auto____7829)) {
                          return p3.call(null, z)
                        }else {
                          return and__3941__auto____7829
                        }
                      }else {
                        return and__3941__auto____7828
                      }
                    }else {
                      return and__3941__auto____7827
                    }
                  }else {
                    return and__3941__auto____7826
                  }
                }else {
                  return and__3941__auto____7825
                }
              }else {
                return and__3941__auto____7824
              }
            }else {
              return and__3941__auto____7823
            }
          }else {
            return and__3941__auto____7822
          }
        }())
      };
      var ep3__4 = function() {
        var G__7846__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3941__auto____7830 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3941__auto____7830)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7642_SHARP_) {
                var and__3941__auto____7831 = p1.call(null, p1__7642_SHARP_);
                if(cljs.core.truth_(and__3941__auto____7831)) {
                  var and__3941__auto____7832 = p2.call(null, p1__7642_SHARP_);
                  if(cljs.core.truth_(and__3941__auto____7832)) {
                    return p3.call(null, p1__7642_SHARP_)
                  }else {
                    return and__3941__auto____7832
                  }
                }else {
                  return and__3941__auto____7831
                }
              }, args)
            }else {
              return and__3941__auto____7830
            }
          }())
        };
        var G__7846 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7846__delegate.call(this, x, y, z, args)
        };
        G__7846.cljs$lang$maxFixedArity = 3;
        G__7846.cljs$lang$applyTo = function(arglist__7847) {
          var x = cljs.core.first(arglist__7847);
          var y = cljs.core.first(cljs.core.next(arglist__7847));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7847)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7847)));
          return G__7846__delegate(x, y, z, args)
        };
        G__7846.cljs$lang$arity$variadic = G__7846__delegate;
        return G__7846
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__7848__delegate = function(p1, p2, p3, ps) {
      var ps__7833 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__7643_SHARP_) {
            return p1__7643_SHARP_.call(null, x)
          }, ps__7833)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__7644_SHARP_) {
            var and__3941__auto____7838 = p1__7644_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3941__auto____7838)) {
              return p1__7644_SHARP_.call(null, y)
            }else {
              return and__3941__auto____7838
            }
          }, ps__7833)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__7645_SHARP_) {
            var and__3941__auto____7839 = p1__7645_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3941__auto____7839)) {
              var and__3941__auto____7840 = p1__7645_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3941__auto____7840)) {
                return p1__7645_SHARP_.call(null, z)
              }else {
                return and__3941__auto____7840
              }
            }else {
              return and__3941__auto____7839
            }
          }, ps__7833)
        };
        var epn__4 = function() {
          var G__7849__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3941__auto____7841 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3941__auto____7841)) {
                return cljs.core.every_QMARK_.call(null, function(p1__7646_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__7646_SHARP_, args)
                }, ps__7833)
              }else {
                return and__3941__auto____7841
              }
            }())
          };
          var G__7849 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__7849__delegate.call(this, x, y, z, args)
          };
          G__7849.cljs$lang$maxFixedArity = 3;
          G__7849.cljs$lang$applyTo = function(arglist__7850) {
            var x = cljs.core.first(arglist__7850);
            var y = cljs.core.first(cljs.core.next(arglist__7850));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7850)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7850)));
            return G__7849__delegate(x, y, z, args)
          };
          G__7849.cljs$lang$arity$variadic = G__7849__delegate;
          return G__7849
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__7848 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7848__delegate.call(this, p1, p2, p3, ps)
    };
    G__7848.cljs$lang$maxFixedArity = 3;
    G__7848.cljs$lang$applyTo = function(arglist__7851) {
      var p1 = cljs.core.first(arglist__7851);
      var p2 = cljs.core.first(cljs.core.next(arglist__7851));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7851)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7851)));
      return G__7848__delegate(p1, p2, p3, ps)
    };
    G__7848.cljs$lang$arity$variadic = G__7848__delegate;
    return G__7848
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3943__auto____7932 = p.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7932)) {
          return or__3943__auto____7932
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3943__auto____7933 = p.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7933)) {
          return or__3943__auto____7933
        }else {
          var or__3943__auto____7934 = p.call(null, y);
          if(cljs.core.truth_(or__3943__auto____7934)) {
            return or__3943__auto____7934
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__8003__delegate = function(x, y, z, args) {
          var or__3943__auto____7935 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3943__auto____7935)) {
            return or__3943__auto____7935
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__8003 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8003__delegate.call(this, x, y, z, args)
        };
        G__8003.cljs$lang$maxFixedArity = 3;
        G__8003.cljs$lang$applyTo = function(arglist__8004) {
          var x = cljs.core.first(arglist__8004);
          var y = cljs.core.first(cljs.core.next(arglist__8004));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8004)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8004)));
          return G__8003__delegate(x, y, z, args)
        };
        G__8003.cljs$lang$arity$variadic = G__8003__delegate;
        return G__8003
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3943__auto____7947 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7947)) {
          return or__3943__auto____7947
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3943__auto____7948 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7948)) {
          return or__3943__auto____7948
        }else {
          var or__3943__auto____7949 = p1.call(null, y);
          if(cljs.core.truth_(or__3943__auto____7949)) {
            return or__3943__auto____7949
          }else {
            var or__3943__auto____7950 = p2.call(null, x);
            if(cljs.core.truth_(or__3943__auto____7950)) {
              return or__3943__auto____7950
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3943__auto____7951 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7951)) {
          return or__3943__auto____7951
        }else {
          var or__3943__auto____7952 = p1.call(null, y);
          if(cljs.core.truth_(or__3943__auto____7952)) {
            return or__3943__auto____7952
          }else {
            var or__3943__auto____7953 = p1.call(null, z);
            if(cljs.core.truth_(or__3943__auto____7953)) {
              return or__3943__auto____7953
            }else {
              var or__3943__auto____7954 = p2.call(null, x);
              if(cljs.core.truth_(or__3943__auto____7954)) {
                return or__3943__auto____7954
              }else {
                var or__3943__auto____7955 = p2.call(null, y);
                if(cljs.core.truth_(or__3943__auto____7955)) {
                  return or__3943__auto____7955
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__8005__delegate = function(x, y, z, args) {
          var or__3943__auto____7956 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3943__auto____7956)) {
            return or__3943__auto____7956
          }else {
            return cljs.core.some.call(null, function(p1__7686_SHARP_) {
              var or__3943__auto____7957 = p1.call(null, p1__7686_SHARP_);
              if(cljs.core.truth_(or__3943__auto____7957)) {
                return or__3943__auto____7957
              }else {
                return p2.call(null, p1__7686_SHARP_)
              }
            }, args)
          }
        };
        var G__8005 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8005__delegate.call(this, x, y, z, args)
        };
        G__8005.cljs$lang$maxFixedArity = 3;
        G__8005.cljs$lang$applyTo = function(arglist__8006) {
          var x = cljs.core.first(arglist__8006);
          var y = cljs.core.first(cljs.core.next(arglist__8006));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8006)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8006)));
          return G__8005__delegate(x, y, z, args)
        };
        G__8005.cljs$lang$arity$variadic = G__8005__delegate;
        return G__8005
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3943__auto____7976 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7976)) {
          return or__3943__auto____7976
        }else {
          var or__3943__auto____7977 = p2.call(null, x);
          if(cljs.core.truth_(or__3943__auto____7977)) {
            return or__3943__auto____7977
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3943__auto____7978 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7978)) {
          return or__3943__auto____7978
        }else {
          var or__3943__auto____7979 = p2.call(null, x);
          if(cljs.core.truth_(or__3943__auto____7979)) {
            return or__3943__auto____7979
          }else {
            var or__3943__auto____7980 = p3.call(null, x);
            if(cljs.core.truth_(or__3943__auto____7980)) {
              return or__3943__auto____7980
            }else {
              var or__3943__auto____7981 = p1.call(null, y);
              if(cljs.core.truth_(or__3943__auto____7981)) {
                return or__3943__auto____7981
              }else {
                var or__3943__auto____7982 = p2.call(null, y);
                if(cljs.core.truth_(or__3943__auto____7982)) {
                  return or__3943__auto____7982
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3943__auto____7983 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7983)) {
          return or__3943__auto____7983
        }else {
          var or__3943__auto____7984 = p2.call(null, x);
          if(cljs.core.truth_(or__3943__auto____7984)) {
            return or__3943__auto____7984
          }else {
            var or__3943__auto____7985 = p3.call(null, x);
            if(cljs.core.truth_(or__3943__auto____7985)) {
              return or__3943__auto____7985
            }else {
              var or__3943__auto____7986 = p1.call(null, y);
              if(cljs.core.truth_(or__3943__auto____7986)) {
                return or__3943__auto____7986
              }else {
                var or__3943__auto____7987 = p2.call(null, y);
                if(cljs.core.truth_(or__3943__auto____7987)) {
                  return or__3943__auto____7987
                }else {
                  var or__3943__auto____7988 = p3.call(null, y);
                  if(cljs.core.truth_(or__3943__auto____7988)) {
                    return or__3943__auto____7988
                  }else {
                    var or__3943__auto____7989 = p1.call(null, z);
                    if(cljs.core.truth_(or__3943__auto____7989)) {
                      return or__3943__auto____7989
                    }else {
                      var or__3943__auto____7990 = p2.call(null, z);
                      if(cljs.core.truth_(or__3943__auto____7990)) {
                        return or__3943__auto____7990
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__8007__delegate = function(x, y, z, args) {
          var or__3943__auto____7991 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3943__auto____7991)) {
            return or__3943__auto____7991
          }else {
            return cljs.core.some.call(null, function(p1__7687_SHARP_) {
              var or__3943__auto____7992 = p1.call(null, p1__7687_SHARP_);
              if(cljs.core.truth_(or__3943__auto____7992)) {
                return or__3943__auto____7992
              }else {
                var or__3943__auto____7993 = p2.call(null, p1__7687_SHARP_);
                if(cljs.core.truth_(or__3943__auto____7993)) {
                  return or__3943__auto____7993
                }else {
                  return p3.call(null, p1__7687_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__8007 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8007__delegate.call(this, x, y, z, args)
        };
        G__8007.cljs$lang$maxFixedArity = 3;
        G__8007.cljs$lang$applyTo = function(arglist__8008) {
          var x = cljs.core.first(arglist__8008);
          var y = cljs.core.first(cljs.core.next(arglist__8008));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8008)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8008)));
          return G__8007__delegate(x, y, z, args)
        };
        G__8007.cljs$lang$arity$variadic = G__8007__delegate;
        return G__8007
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__8009__delegate = function(p1, p2, p3, ps) {
      var ps__7994 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__7688_SHARP_) {
            return p1__7688_SHARP_.call(null, x)
          }, ps__7994)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__7689_SHARP_) {
            var or__3943__auto____7999 = p1__7689_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3943__auto____7999)) {
              return or__3943__auto____7999
            }else {
              return p1__7689_SHARP_.call(null, y)
            }
          }, ps__7994)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__7690_SHARP_) {
            var or__3943__auto____8000 = p1__7690_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3943__auto____8000)) {
              return or__3943__auto____8000
            }else {
              var or__3943__auto____8001 = p1__7690_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3943__auto____8001)) {
                return or__3943__auto____8001
              }else {
                return p1__7690_SHARP_.call(null, z)
              }
            }
          }, ps__7994)
        };
        var spn__4 = function() {
          var G__8010__delegate = function(x, y, z, args) {
            var or__3943__auto____8002 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3943__auto____8002)) {
              return or__3943__auto____8002
            }else {
              return cljs.core.some.call(null, function(p1__7691_SHARP_) {
                return cljs.core.some.call(null, p1__7691_SHARP_, args)
              }, ps__7994)
            }
          };
          var G__8010 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8010__delegate.call(this, x, y, z, args)
          };
          G__8010.cljs$lang$maxFixedArity = 3;
          G__8010.cljs$lang$applyTo = function(arglist__8011) {
            var x = cljs.core.first(arglist__8011);
            var y = cljs.core.first(cljs.core.next(arglist__8011));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8011)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8011)));
            return G__8010__delegate(x, y, z, args)
          };
          G__8010.cljs$lang$arity$variadic = G__8010__delegate;
          return G__8010
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__8009 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8009__delegate.call(this, p1, p2, p3, ps)
    };
    G__8009.cljs$lang$maxFixedArity = 3;
    G__8009.cljs$lang$applyTo = function(arglist__8012) {
      var p1 = cljs.core.first(arglist__8012);
      var p2 = cljs.core.first(cljs.core.next(arglist__8012));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8012)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8012)));
      return G__8009__delegate(p1, p2, p3, ps)
    };
    G__8009.cljs$lang$arity$variadic = G__8009__delegate;
    return G__8009
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____8031 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____8031) {
        var s__8032 = temp__4092__auto____8031;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8032)) {
          var c__8033 = cljs.core.chunk_first.call(null, s__8032);
          var size__8034 = cljs.core.count.call(null, c__8033);
          var b__8035 = cljs.core.chunk_buffer.call(null, size__8034);
          var n__2426__auto____8036 = size__8034;
          var i__8037 = 0;
          while(true) {
            if(i__8037 < n__2426__auto____8036) {
              cljs.core.chunk_append.call(null, b__8035, f.call(null, cljs.core._nth.call(null, c__8033, i__8037)));
              var G__8049 = i__8037 + 1;
              i__8037 = G__8049;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8035), map.call(null, f, cljs.core.chunk_rest.call(null, s__8032)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__8032)), map.call(null, f, cljs.core.rest.call(null, s__8032)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8038 = cljs.core.seq.call(null, c1);
      var s2__8039 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3941__auto____8040 = s1__8038;
        if(and__3941__auto____8040) {
          return s2__8039
        }else {
          return and__3941__auto____8040
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8038), cljs.core.first.call(null, s2__8039)), map.call(null, f, cljs.core.rest.call(null, s1__8038), cljs.core.rest.call(null, s2__8039)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8041 = cljs.core.seq.call(null, c1);
      var s2__8042 = cljs.core.seq.call(null, c2);
      var s3__8043 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3941__auto____8044 = s1__8041;
        if(and__3941__auto____8044) {
          var and__3941__auto____8045 = s2__8042;
          if(and__3941__auto____8045) {
            return s3__8043
          }else {
            return and__3941__auto____8045
          }
        }else {
          return and__3941__auto____8044
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8041), cljs.core.first.call(null, s2__8042), cljs.core.first.call(null, s3__8043)), map.call(null, f, cljs.core.rest.call(null, s1__8041), cljs.core.rest.call(null, s2__8042), cljs.core.rest.call(null, s3__8043)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__8050__delegate = function(f, c1, c2, c3, colls) {
      var step__8048 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__8047 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8047)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__8047), step.call(null, map.call(null, cljs.core.rest, ss__8047)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__7852_SHARP_) {
        return cljs.core.apply.call(null, f, p1__7852_SHARP_)
      }, step__8048.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__8050 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8050__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8050.cljs$lang$maxFixedArity = 4;
    G__8050.cljs$lang$applyTo = function(arglist__8051) {
      var f = cljs.core.first(arglist__8051);
      var c1 = cljs.core.first(cljs.core.next(arglist__8051));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8051)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8051))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8051))));
      return G__8050__delegate(f, c1, c2, c3, colls)
    };
    G__8050.cljs$lang$arity$variadic = G__8050__delegate;
    return G__8050
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__4092__auto____8054 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____8054) {
        var s__8055 = temp__4092__auto____8054;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__8055), take.call(null, n - 1, cljs.core.rest.call(null, s__8055)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__8061 = function(n, coll) {
    while(true) {
      var s__8059 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3941__auto____8060 = n > 0;
        if(and__3941__auto____8060) {
          return s__8059
        }else {
          return and__3941__auto____8060
        }
      }())) {
        var G__8062 = n - 1;
        var G__8063 = cljs.core.rest.call(null, s__8059);
        n = G__8062;
        coll = G__8063;
        continue
      }else {
        return s__8059
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8061.call(null, n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__8066 = cljs.core.seq.call(null, coll);
  var lead__8067 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__8067) {
      var G__8068 = cljs.core.next.call(null, s__8066);
      var G__8069 = cljs.core.next.call(null, lead__8067);
      s__8066 = G__8068;
      lead__8067 = G__8069;
      continue
    }else {
      return s__8066
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__8075 = function(pred, coll) {
    while(true) {
      var s__8073 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3941__auto____8074 = s__8073;
        if(and__3941__auto____8074) {
          return pred.call(null, cljs.core.first.call(null, s__8073))
        }else {
          return and__3941__auto____8074
        }
      }())) {
        var G__8076 = pred;
        var G__8077 = cljs.core.rest.call(null, s__8073);
        pred = G__8076;
        coll = G__8077;
        continue
      }else {
        return s__8073
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8075.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____8080 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____8080) {
      var s__8081 = temp__4092__auto____8080;
      return cljs.core.concat.call(null, s__8081, cycle.call(null, s__8081))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8086 = cljs.core.seq.call(null, c1);
      var s2__8087 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3941__auto____8088 = s1__8086;
        if(and__3941__auto____8088) {
          return s2__8087
        }else {
          return and__3941__auto____8088
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__8086), cljs.core.cons.call(null, cljs.core.first.call(null, s2__8087), interleave.call(null, cljs.core.rest.call(null, s1__8086), cljs.core.rest.call(null, s2__8087))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__8090__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__8089 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8089)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__8089), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__8089)))
        }else {
          return null
        }
      }, null)
    };
    var G__8090 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8090__delegate.call(this, c1, c2, colls)
    };
    G__8090.cljs$lang$maxFixedArity = 2;
    G__8090.cljs$lang$applyTo = function(arglist__8091) {
      var c1 = cljs.core.first(arglist__8091);
      var c2 = cljs.core.first(cljs.core.next(arglist__8091));
      var colls = cljs.core.rest(cljs.core.next(arglist__8091));
      return G__8090__delegate(c1, c2, colls)
    };
    G__8090.cljs$lang$arity$variadic = G__8090__delegate;
    return G__8090
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__8101 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4090__auto____8099 = cljs.core.seq.call(null, coll);
      if(temp__4090__auto____8099) {
        var coll__8100 = temp__4090__auto____8099;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__8100), cat.call(null, cljs.core.rest.call(null, coll__8100), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__8101.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__8102__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__8102 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8102__delegate.call(this, f, coll, colls)
    };
    G__8102.cljs$lang$maxFixedArity = 2;
    G__8102.cljs$lang$applyTo = function(arglist__8103) {
      var f = cljs.core.first(arglist__8103);
      var coll = cljs.core.first(cljs.core.next(arglist__8103));
      var colls = cljs.core.rest(cljs.core.next(arglist__8103));
      return G__8102__delegate(f, coll, colls)
    };
    G__8102.cljs$lang$arity$variadic = G__8102__delegate;
    return G__8102
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____8113 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____8113) {
      var s__8114 = temp__4092__auto____8113;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__8114)) {
        var c__8115 = cljs.core.chunk_first.call(null, s__8114);
        var size__8116 = cljs.core.count.call(null, c__8115);
        var b__8117 = cljs.core.chunk_buffer.call(null, size__8116);
        var n__2426__auto____8118 = size__8116;
        var i__8119 = 0;
        while(true) {
          if(i__8119 < n__2426__auto____8118) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__8115, i__8119)))) {
              cljs.core.chunk_append.call(null, b__8117, cljs.core._nth.call(null, c__8115, i__8119))
            }else {
            }
            var G__8122 = i__8119 + 1;
            i__8119 = G__8122;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8117), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__8114)))
      }else {
        var f__8120 = cljs.core.first.call(null, s__8114);
        var r__8121 = cljs.core.rest.call(null, s__8114);
        if(cljs.core.truth_(pred.call(null, f__8120))) {
          return cljs.core.cons.call(null, f__8120, filter.call(null, pred, r__8121))
        }else {
          return filter.call(null, pred, r__8121)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__8125 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__8125.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__8123_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__8123_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__8129__8130 = to;
    if(G__8129__8130) {
      if(function() {
        var or__3943__auto____8131 = G__8129__8130.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3943__auto____8131) {
          return or__3943__auto____8131
        }else {
          return G__8129__8130.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__8129__8130.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8129__8130)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8129__8130)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__8132__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__8132 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8132__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8132.cljs$lang$maxFixedArity = 4;
    G__8132.cljs$lang$applyTo = function(arglist__8133) {
      var f = cljs.core.first(arglist__8133);
      var c1 = cljs.core.first(cljs.core.next(arglist__8133));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8133)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8133))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8133))));
      return G__8132__delegate(f, c1, c2, c3, colls)
    };
    G__8132.cljs$lang$arity$variadic = G__8132__delegate;
    return G__8132
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____8140 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____8140) {
        var s__8141 = temp__4092__auto____8140;
        var p__8142 = cljs.core.take.call(null, n, s__8141);
        if(n === cljs.core.count.call(null, p__8142)) {
          return cljs.core.cons.call(null, p__8142, partition.call(null, n, step, cljs.core.drop.call(null, step, s__8141)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____8143 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____8143) {
        var s__8144 = temp__4092__auto____8143;
        var p__8145 = cljs.core.take.call(null, n, s__8144);
        if(n === cljs.core.count.call(null, p__8145)) {
          return cljs.core.cons.call(null, p__8145, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__8144)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__8145, pad)))
        }
      }else {
        return null
      }
    }, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__8150 = cljs.core.lookup_sentinel;
    var m__8151 = m;
    var ks__8152 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__8152) {
        var m__8153 = cljs.core._lookup.call(null, m__8151, cljs.core.first.call(null, ks__8152), sentinel__8150);
        if(sentinel__8150 === m__8153) {
          return not_found
        }else {
          var G__8154 = sentinel__8150;
          var G__8155 = m__8153;
          var G__8156 = cljs.core.next.call(null, ks__8152);
          sentinel__8150 = G__8154;
          m__8151 = G__8155;
          ks__8152 = G__8156;
          continue
        }
      }else {
        return m__8151
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__8157, v) {
  var vec__8162__8163 = p__8157;
  var k__8164 = cljs.core.nth.call(null, vec__8162__8163, 0, null);
  var ks__8165 = cljs.core.nthnext.call(null, vec__8162__8163, 1);
  if(cljs.core.truth_(ks__8165)) {
    return cljs.core.assoc.call(null, m, k__8164, assoc_in.call(null, cljs.core._lookup.call(null, m, k__8164, null), ks__8165, v))
  }else {
    return cljs.core.assoc.call(null, m, k__8164, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__8166, f, args) {
    var vec__8171__8172 = p__8166;
    var k__8173 = cljs.core.nth.call(null, vec__8171__8172, 0, null);
    var ks__8174 = cljs.core.nthnext.call(null, vec__8171__8172, 1);
    if(cljs.core.truth_(ks__8174)) {
      return cljs.core.assoc.call(null, m, k__8173, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__8173, null), ks__8174, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__8173, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__8173, null), args))
    }
  };
  var update_in = function(m, p__8166, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__8166, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__8175) {
    var m = cljs.core.first(arglist__8175);
    var p__8166 = cljs.core.first(cljs.core.next(arglist__8175));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8175)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8175)));
    return update_in__delegate(m, p__8166, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8178 = this;
  var h__2087__auto____8179 = this__8178.__hash;
  if(!(h__2087__auto____8179 == null)) {
    return h__2087__auto____8179
  }else {
    var h__2087__auto____8180 = cljs.core.hash_coll.call(null, coll);
    this__8178.__hash = h__2087__auto____8180;
    return h__2087__auto____8180
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8181 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8182 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8183 = this;
  var new_array__8184 = this__8183.array.slice();
  new_array__8184[k] = v;
  return new cljs.core.Vector(this__8183.meta, new_array__8184, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__8215 = null;
  var G__8215__2 = function(this_sym8185, k) {
    var this__8187 = this;
    var this_sym8185__8188 = this;
    var coll__8189 = this_sym8185__8188;
    return coll__8189.cljs$core$ILookup$_lookup$arity$2(coll__8189, k)
  };
  var G__8215__3 = function(this_sym8186, k, not_found) {
    var this__8187 = this;
    var this_sym8186__8190 = this;
    var coll__8191 = this_sym8186__8190;
    return coll__8191.cljs$core$ILookup$_lookup$arity$3(coll__8191, k, not_found)
  };
  G__8215 = function(this_sym8186, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8215__2.call(this, this_sym8186, k);
      case 3:
        return G__8215__3.call(this, this_sym8186, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8215
}();
cljs.core.Vector.prototype.apply = function(this_sym8176, args8177) {
  var this__8192 = this;
  return this_sym8176.call.apply(this_sym8176, [this_sym8176].concat(args8177.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8193 = this;
  var new_array__8194 = this__8193.array.slice();
  new_array__8194.push(o);
  return new cljs.core.Vector(this__8193.meta, new_array__8194, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__8195 = this;
  var this__8196 = this;
  return cljs.core.pr_str.call(null, this__8196)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8197 = this;
  return cljs.core.ci_reduce.call(null, this__8197.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8198 = this;
  return cljs.core.ci_reduce.call(null, this__8198.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8199 = this;
  if(this__8199.array.length > 0) {
    var vector_seq__8200 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__8199.array.length) {
          return cljs.core.cons.call(null, this__8199.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__8200.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8201 = this;
  return this__8201.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8202 = this;
  var count__8203 = this__8202.array.length;
  if(count__8203 > 0) {
    return this__8202.array[count__8203 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8204 = this;
  if(this__8204.array.length > 0) {
    var new_array__8205 = this__8204.array.slice();
    new_array__8205.pop();
    return new cljs.core.Vector(this__8204.meta, new_array__8205, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8206 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8207 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8208 = this;
  return new cljs.core.Vector(meta, this__8208.array, this__8208.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8209 = this;
  return this__8209.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8210 = this;
  if(function() {
    var and__3941__auto____8211 = 0 <= n;
    if(and__3941__auto____8211) {
      return n < this__8210.array.length
    }else {
      return and__3941__auto____8211
    }
  }()) {
    return this__8210.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8212 = this;
  if(function() {
    var and__3941__auto____8213 = 0 <= n;
    if(and__3941__auto____8213) {
      return n < this__8212.array.length
    }else {
      return and__3941__auto____8213
    }
  }()) {
    return this__8212.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8214 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8214.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__2205__auto__) {
  return cljs.core.list.call(null, "cljs.core/VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__8217 = pv.cnt;
  if(cnt__8217 < 32) {
    return 0
  }else {
    return cnt__8217 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__8223 = level;
  var ret__8224 = node;
  while(true) {
    if(ll__8223 === 0) {
      return ret__8224
    }else {
      var embed__8225 = ret__8224;
      var r__8226 = cljs.core.pv_fresh_node.call(null, edit);
      var ___8227 = cljs.core.pv_aset.call(null, r__8226, 0, embed__8225);
      var G__8228 = ll__8223 - 5;
      var G__8229 = r__8226;
      ll__8223 = G__8228;
      ret__8224 = G__8229;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__8235 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__8236 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__8235, subidx__8236, tailnode);
    return ret__8235
  }else {
    var child__8237 = cljs.core.pv_aget.call(null, parent, subidx__8236);
    if(!(child__8237 == null)) {
      var node_to_insert__8238 = push_tail.call(null, pv, level - 5, child__8237, tailnode);
      cljs.core.pv_aset.call(null, ret__8235, subidx__8236, node_to_insert__8238);
      return ret__8235
    }else {
      var node_to_insert__8239 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__8235, subidx__8236, node_to_insert__8239);
      return ret__8235
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3941__auto____8243 = 0 <= i;
    if(and__3941__auto____8243) {
      return i < pv.cnt
    }else {
      return and__3941__auto____8243
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__8244 = pv.root;
      var level__8245 = pv.shift;
      while(true) {
        if(level__8245 > 0) {
          var G__8246 = cljs.core.pv_aget.call(null, node__8244, i >>> level__8245 & 31);
          var G__8247 = level__8245 - 5;
          node__8244 = G__8246;
          level__8245 = G__8247;
          continue
        }else {
          return node__8244.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__8250 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__8250, i & 31, val);
    return ret__8250
  }else {
    var subidx__8251 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__8250, subidx__8251, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8251), i, val));
    return ret__8250
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__8257 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8258 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8257));
    if(function() {
      var and__3941__auto____8259 = new_child__8258 == null;
      if(and__3941__auto____8259) {
        return subidx__8257 === 0
      }else {
        return and__3941__auto____8259
      }
    }()) {
      return null
    }else {
      var ret__8260 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__8260, subidx__8257, new_child__8258);
      return ret__8260
    }
  }else {
    if(subidx__8257 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__8261 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__8261, subidx__8257, null);
        return ret__8261
      }else {
        return null
      }
    }
  }
};
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8264 = this;
  return new cljs.core.TransientVector(this__8264.cnt, this__8264.shift, cljs.core.tv_editable_root.call(null, this__8264.root), cljs.core.tv_editable_tail.call(null, this__8264.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8265 = this;
  var h__2087__auto____8266 = this__8265.__hash;
  if(!(h__2087__auto____8266 == null)) {
    return h__2087__auto____8266
  }else {
    var h__2087__auto____8267 = cljs.core.hash_coll.call(null, coll);
    this__8265.__hash = h__2087__auto____8267;
    return h__2087__auto____8267
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8268 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8269 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8270 = this;
  if(function() {
    var and__3941__auto____8271 = 0 <= k;
    if(and__3941__auto____8271) {
      return k < this__8270.cnt
    }else {
      return and__3941__auto____8271
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__8272 = this__8270.tail.slice();
      new_tail__8272[k & 31] = v;
      return new cljs.core.PersistentVector(this__8270.meta, this__8270.cnt, this__8270.shift, this__8270.root, new_tail__8272, null)
    }else {
      return new cljs.core.PersistentVector(this__8270.meta, this__8270.cnt, this__8270.shift, cljs.core.do_assoc.call(null, coll, this__8270.shift, this__8270.root, k, v), this__8270.tail, null)
    }
  }else {
    if(k === this__8270.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__8270.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__8320 = null;
  var G__8320__2 = function(this_sym8273, k) {
    var this__8275 = this;
    var this_sym8273__8276 = this;
    var coll__8277 = this_sym8273__8276;
    return coll__8277.cljs$core$ILookup$_lookup$arity$2(coll__8277, k)
  };
  var G__8320__3 = function(this_sym8274, k, not_found) {
    var this__8275 = this;
    var this_sym8274__8278 = this;
    var coll__8279 = this_sym8274__8278;
    return coll__8279.cljs$core$ILookup$_lookup$arity$3(coll__8279, k, not_found)
  };
  G__8320 = function(this_sym8274, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8320__2.call(this, this_sym8274, k);
      case 3:
        return G__8320__3.call(this, this_sym8274, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8320
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym8262, args8263) {
  var this__8280 = this;
  return this_sym8262.call.apply(this_sym8262, [this_sym8262].concat(args8263.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__8281 = this;
  var step_init__8282 = [0, init];
  var i__8283 = 0;
  while(true) {
    if(i__8283 < this__8281.cnt) {
      var arr__8284 = cljs.core.array_for.call(null, v, i__8283);
      var len__8285 = arr__8284.length;
      var init__8289 = function() {
        var j__8286 = 0;
        var init__8287 = step_init__8282[1];
        while(true) {
          if(j__8286 < len__8285) {
            var init__8288 = f.call(null, init__8287, j__8286 + i__8283, arr__8284[j__8286]);
            if(cljs.core.reduced_QMARK_.call(null, init__8288)) {
              return init__8288
            }else {
              var G__8321 = j__8286 + 1;
              var G__8322 = init__8288;
              j__8286 = G__8321;
              init__8287 = G__8322;
              continue
            }
          }else {
            step_init__8282[0] = len__8285;
            step_init__8282[1] = init__8287;
            return init__8287
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8289)) {
        return cljs.core.deref.call(null, init__8289)
      }else {
        var G__8323 = i__8283 + step_init__8282[0];
        i__8283 = G__8323;
        continue
      }
    }else {
      return step_init__8282[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8290 = this;
  if(this__8290.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__8291 = this__8290.tail.slice();
    new_tail__8291.push(o);
    return new cljs.core.PersistentVector(this__8290.meta, this__8290.cnt + 1, this__8290.shift, this__8290.root, new_tail__8291, null)
  }else {
    var root_overflow_QMARK___8292 = this__8290.cnt >>> 5 > 1 << this__8290.shift;
    var new_shift__8293 = root_overflow_QMARK___8292 ? this__8290.shift + 5 : this__8290.shift;
    var new_root__8295 = root_overflow_QMARK___8292 ? function() {
      var n_r__8294 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__8294, 0, this__8290.root);
      cljs.core.pv_aset.call(null, n_r__8294, 1, cljs.core.new_path.call(null, null, this__8290.shift, new cljs.core.VectorNode(null, this__8290.tail)));
      return n_r__8294
    }() : cljs.core.push_tail.call(null, coll, this__8290.shift, this__8290.root, new cljs.core.VectorNode(null, this__8290.tail));
    return new cljs.core.PersistentVector(this__8290.meta, this__8290.cnt + 1, new_shift__8293, new_root__8295, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__8296 = this;
  if(this__8296.cnt > 0) {
    return new cljs.core.RSeq(coll, this__8296.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__8297 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__8298 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__8299 = this;
  var this__8300 = this;
  return cljs.core.pr_str.call(null, this__8300)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8301 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8302 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8303 = this;
  if(this__8303.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8304 = this;
  return this__8304.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8305 = this;
  if(this__8305.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__8305.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8306 = this;
  if(this__8306.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__8306.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8306.meta)
    }else {
      if(1 < this__8306.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__8306.meta, this__8306.cnt - 1, this__8306.shift, this__8306.root, this__8306.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__8307 = cljs.core.array_for.call(null, coll, this__8306.cnt - 2);
          var nr__8308 = cljs.core.pop_tail.call(null, coll, this__8306.shift, this__8306.root);
          var new_root__8309 = nr__8308 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__8308;
          var cnt_1__8310 = this__8306.cnt - 1;
          if(function() {
            var and__3941__auto____8311 = 5 < this__8306.shift;
            if(and__3941__auto____8311) {
              return cljs.core.pv_aget.call(null, new_root__8309, 1) == null
            }else {
              return and__3941__auto____8311
            }
          }()) {
            return new cljs.core.PersistentVector(this__8306.meta, cnt_1__8310, this__8306.shift - 5, cljs.core.pv_aget.call(null, new_root__8309, 0), new_tail__8307, null)
          }else {
            return new cljs.core.PersistentVector(this__8306.meta, cnt_1__8310, this__8306.shift, new_root__8309, new_tail__8307, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8312 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8313 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8314 = this;
  return new cljs.core.PersistentVector(meta, this__8314.cnt, this__8314.shift, this__8314.root, this__8314.tail, this__8314.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8315 = this;
  return this__8315.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8316 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8317 = this;
  if(function() {
    var and__3941__auto____8318 = 0 <= n;
    if(and__3941__auto____8318) {
      return n < this__8317.cnt
    }else {
      return and__3941__auto____8318
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8319 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8319.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__8324 = xs.length;
  var xs__8325 = no_clone === true ? xs : xs.slice();
  if(l__8324 < 32) {
    return new cljs.core.PersistentVector(null, l__8324, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__8325, null)
  }else {
    var node__8326 = xs__8325.slice(0, 32);
    var v__8327 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__8326, null);
    var i__8328 = 32;
    var out__8329 = cljs.core._as_transient.call(null, v__8327);
    while(true) {
      if(i__8328 < l__8324) {
        var G__8330 = i__8328 + 1;
        var G__8331 = cljs.core.conj_BANG_.call(null, out__8329, xs__8325[i__8328]);
        i__8328 = G__8330;
        out__8329 = G__8331;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__8329)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core._as_transient.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__8332) {
    var args = cljs.core.seq(arglist__8332);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.ChunkedSeq = function(vec, node, i, off, meta) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27525356
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__8333 = this;
  if(this__8333.off + 1 < this__8333.node.length) {
    var s__8334 = cljs.core.chunked_seq.call(null, this__8333.vec, this__8333.node, this__8333.i, this__8333.off + 1);
    if(s__8334 == null) {
      return null
    }else {
      return s__8334
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8335 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8336 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8337 = this;
  return this__8337.node[this__8337.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8338 = this;
  if(this__8338.off + 1 < this__8338.node.length) {
    var s__8339 = cljs.core.chunked_seq.call(null, this__8338.vec, this__8338.node, this__8338.i, this__8338.off + 1);
    if(s__8339 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__8339
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__8340 = this;
  var l__8341 = this__8340.node.length;
  var s__8342 = this__8340.i + l__8341 < cljs.core._count.call(null, this__8340.vec) ? cljs.core.chunked_seq.call(null, this__8340.vec, this__8340.i + l__8341, 0) : null;
  if(s__8342 == null) {
    return null
  }else {
    return s__8342
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8343 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__8344 = this;
  return cljs.core.chunked_seq.call(null, this__8344.vec, this__8344.node, this__8344.i, this__8344.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__8345 = this;
  return this__8345.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8346 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8346.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__8347 = this;
  return cljs.core.array_chunk.call(null, this__8347.node, this__8347.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__8348 = this;
  var l__8349 = this__8348.node.length;
  var s__8350 = this__8348.i + l__8349 < cljs.core._count.call(null, this__8348.vec) ? cljs.core.chunked_seq.call(null, this__8348.vec, this__8348.i + l__8349, 0) : null;
  if(s__8350 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__8350
  }
};
cljs.core.ChunkedSeq;
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return chunked_seq.call(null, vec, cljs.core.array_for.call(null, vec, i), i, off, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return chunked_seq.call(null, vec, node, i, off, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw"Invalid arity: " + arguments.length;
  };
  chunked_seq.cljs$lang$arity$3 = chunked_seq__3;
  chunked_seq.cljs$lang$arity$4 = chunked_seq__4;
  chunked_seq.cljs$lang$arity$5 = chunked_seq__5;
  return chunked_seq
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8353 = this;
  var h__2087__auto____8354 = this__8353.__hash;
  if(!(h__2087__auto____8354 == null)) {
    return h__2087__auto____8354
  }else {
    var h__2087__auto____8355 = cljs.core.hash_coll.call(null, coll);
    this__8353.__hash = h__2087__auto____8355;
    return h__2087__auto____8355
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8356 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8357 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__8358 = this;
  var v_pos__8359 = this__8358.start + key;
  return new cljs.core.Subvec(this__8358.meta, cljs.core._assoc.call(null, this__8358.v, v_pos__8359, val), this__8358.start, this__8358.end > v_pos__8359 + 1 ? this__8358.end : v_pos__8359 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__8385 = null;
  var G__8385__2 = function(this_sym8360, k) {
    var this__8362 = this;
    var this_sym8360__8363 = this;
    var coll__8364 = this_sym8360__8363;
    return coll__8364.cljs$core$ILookup$_lookup$arity$2(coll__8364, k)
  };
  var G__8385__3 = function(this_sym8361, k, not_found) {
    var this__8362 = this;
    var this_sym8361__8365 = this;
    var coll__8366 = this_sym8361__8365;
    return coll__8366.cljs$core$ILookup$_lookup$arity$3(coll__8366, k, not_found)
  };
  G__8385 = function(this_sym8361, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8385__2.call(this, this_sym8361, k);
      case 3:
        return G__8385__3.call(this, this_sym8361, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8385
}();
cljs.core.Subvec.prototype.apply = function(this_sym8351, args8352) {
  var this__8367 = this;
  return this_sym8351.call.apply(this_sym8351, [this_sym8351].concat(args8352.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8368 = this;
  return new cljs.core.Subvec(this__8368.meta, cljs.core._assoc_n.call(null, this__8368.v, this__8368.end, o), this__8368.start, this__8368.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__8369 = this;
  var this__8370 = this;
  return cljs.core.pr_str.call(null, this__8370)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__8371 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__8372 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8373 = this;
  var subvec_seq__8374 = function subvec_seq(i) {
    if(i === this__8373.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__8373.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__8374.call(null, this__8373.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8375 = this;
  return this__8375.end - this__8375.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8376 = this;
  return cljs.core._nth.call(null, this__8376.v, this__8376.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8377 = this;
  if(this__8377.start === this__8377.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__8377.meta, this__8377.v, this__8377.start, this__8377.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8378 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8379 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8380 = this;
  return new cljs.core.Subvec(meta, this__8380.v, this__8380.start, this__8380.end, this__8380.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8381 = this;
  return this__8381.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8382 = this;
  return cljs.core._nth.call(null, this__8382.v, this__8382.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8383 = this;
  return cljs.core._nth.call(null, this__8383.v, this__8383.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8384 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8384.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__8387 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__8387, 0, tl.length);
  return ret__8387
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__8391 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__8392 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__8391, subidx__8392, level === 5 ? tail_node : function() {
    var child__8393 = cljs.core.pv_aget.call(null, ret__8391, subidx__8392);
    if(!(child__8393 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__8393, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__8391
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__8398 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__8399 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8400 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__8398, subidx__8399));
    if(function() {
      var and__3941__auto____8401 = new_child__8400 == null;
      if(and__3941__auto____8401) {
        return subidx__8399 === 0
      }else {
        return and__3941__auto____8401
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__8398, subidx__8399, new_child__8400);
      return node__8398
    }
  }else {
    if(subidx__8399 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__8398, subidx__8399, null);
        return node__8398
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3941__auto____8406 = 0 <= i;
    if(and__3941__auto____8406) {
      return i < tv.cnt
    }else {
      return and__3941__auto____8406
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__8407 = tv.root;
      var node__8408 = root__8407;
      var level__8409 = tv.shift;
      while(true) {
        if(level__8409 > 0) {
          var G__8410 = cljs.core.tv_ensure_editable.call(null, root__8407.edit, cljs.core.pv_aget.call(null, node__8408, i >>> level__8409 & 31));
          var G__8411 = level__8409 - 5;
          node__8408 = G__8410;
          level__8409 = G__8411;
          continue
        }else {
          return node__8408.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 22
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__8451 = null;
  var G__8451__2 = function(this_sym8414, k) {
    var this__8416 = this;
    var this_sym8414__8417 = this;
    var coll__8418 = this_sym8414__8417;
    return coll__8418.cljs$core$ILookup$_lookup$arity$2(coll__8418, k)
  };
  var G__8451__3 = function(this_sym8415, k, not_found) {
    var this__8416 = this;
    var this_sym8415__8419 = this;
    var coll__8420 = this_sym8415__8419;
    return coll__8420.cljs$core$ILookup$_lookup$arity$3(coll__8420, k, not_found)
  };
  G__8451 = function(this_sym8415, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8451__2.call(this, this_sym8415, k);
      case 3:
        return G__8451__3.call(this, this_sym8415, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8451
}();
cljs.core.TransientVector.prototype.apply = function(this_sym8412, args8413) {
  var this__8421 = this;
  return this_sym8412.call.apply(this_sym8412, [this_sym8412].concat(args8413.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8422 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8423 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8424 = this;
  if(this__8424.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8425 = this;
  if(function() {
    var and__3941__auto____8426 = 0 <= n;
    if(and__3941__auto____8426) {
      return n < this__8425.cnt
    }else {
      return and__3941__auto____8426
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8427 = this;
  if(this__8427.root.edit) {
    return this__8427.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__8428 = this;
  if(this__8428.root.edit) {
    if(function() {
      var and__3941__auto____8429 = 0 <= n;
      if(and__3941__auto____8429) {
        return n < this__8428.cnt
      }else {
        return and__3941__auto____8429
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__8428.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__8434 = function go(level, node) {
          var node__8432 = cljs.core.tv_ensure_editable.call(null, this__8428.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__8432, n & 31, val);
            return node__8432
          }else {
            var subidx__8433 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__8432, subidx__8433, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__8432, subidx__8433)));
            return node__8432
          }
        }.call(null, this__8428.shift, this__8428.root);
        this__8428.root = new_root__8434;
        return tcoll
      }
    }else {
      if(n === this__8428.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__8428.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__8435 = this;
  if(this__8435.root.edit) {
    if(this__8435.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__8435.cnt) {
        this__8435.cnt = 0;
        return tcoll
      }else {
        if((this__8435.cnt - 1 & 31) > 0) {
          this__8435.cnt = this__8435.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__8436 = cljs.core.editable_array_for.call(null, tcoll, this__8435.cnt - 2);
            var new_root__8438 = function() {
              var nr__8437 = cljs.core.tv_pop_tail.call(null, tcoll, this__8435.shift, this__8435.root);
              if(!(nr__8437 == null)) {
                return nr__8437
              }else {
                return new cljs.core.VectorNode(this__8435.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3941__auto____8439 = 5 < this__8435.shift;
              if(and__3941__auto____8439) {
                return cljs.core.pv_aget.call(null, new_root__8438, 1) == null
              }else {
                return and__3941__auto____8439
              }
            }()) {
              var new_root__8440 = cljs.core.tv_ensure_editable.call(null, this__8435.root.edit, cljs.core.pv_aget.call(null, new_root__8438, 0));
              this__8435.root = new_root__8440;
              this__8435.shift = this__8435.shift - 5;
              this__8435.cnt = this__8435.cnt - 1;
              this__8435.tail = new_tail__8436;
              return tcoll
            }else {
              this__8435.root = new_root__8438;
              this__8435.cnt = this__8435.cnt - 1;
              this__8435.tail = new_tail__8436;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8441 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8442 = this;
  if(this__8442.root.edit) {
    if(this__8442.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__8442.tail[this__8442.cnt & 31] = o;
      this__8442.cnt = this__8442.cnt + 1;
      return tcoll
    }else {
      var tail_node__8443 = new cljs.core.VectorNode(this__8442.root.edit, this__8442.tail);
      var new_tail__8444 = cljs.core.make_array.call(null, 32);
      new_tail__8444[0] = o;
      this__8442.tail = new_tail__8444;
      if(this__8442.cnt >>> 5 > 1 << this__8442.shift) {
        var new_root_array__8445 = cljs.core.make_array.call(null, 32);
        var new_shift__8446 = this__8442.shift + 5;
        new_root_array__8445[0] = this__8442.root;
        new_root_array__8445[1] = cljs.core.new_path.call(null, this__8442.root.edit, this__8442.shift, tail_node__8443);
        this__8442.root = new cljs.core.VectorNode(this__8442.root.edit, new_root_array__8445);
        this__8442.shift = new_shift__8446;
        this__8442.cnt = this__8442.cnt + 1;
        return tcoll
      }else {
        var new_root__8447 = cljs.core.tv_push_tail.call(null, tcoll, this__8442.shift, this__8442.root, tail_node__8443);
        this__8442.root = new_root__8447;
        this__8442.cnt = this__8442.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8448 = this;
  if(this__8448.root.edit) {
    this__8448.root.edit = null;
    var len__8449 = this__8448.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__8450 = cljs.core.make_array.call(null, len__8449);
    cljs.core.array_copy.call(null, this__8448.tail, 0, trimmed_tail__8450, 0, len__8449);
    return new cljs.core.PersistentVector(null, this__8448.cnt, this__8448.shift, this__8448.root, trimmed_tail__8450, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8452 = this;
  var h__2087__auto____8453 = this__8452.__hash;
  if(!(h__2087__auto____8453 == null)) {
    return h__2087__auto____8453
  }else {
    var h__2087__auto____8454 = cljs.core.hash_coll.call(null, coll);
    this__8452.__hash = h__2087__auto____8454;
    return h__2087__auto____8454
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8455 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__8456 = this;
  var this__8457 = this;
  return cljs.core.pr_str.call(null, this__8457)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8458 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8459 = this;
  return cljs.core._first.call(null, this__8459.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8460 = this;
  var temp__4090__auto____8461 = cljs.core.next.call(null, this__8460.front);
  if(temp__4090__auto____8461) {
    var f1__8462 = temp__4090__auto____8461;
    return new cljs.core.PersistentQueueSeq(this__8460.meta, f1__8462, this__8460.rear, null)
  }else {
    if(this__8460.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__8460.meta, this__8460.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8463 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8464 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__8464.front, this__8464.rear, this__8464.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8465 = this;
  return this__8465.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8466 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8466.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8467 = this;
  var h__2087__auto____8468 = this__8467.__hash;
  if(!(h__2087__auto____8468 == null)) {
    return h__2087__auto____8468
  }else {
    var h__2087__auto____8469 = cljs.core.hash_coll.call(null, coll);
    this__8467.__hash = h__2087__auto____8469;
    return h__2087__auto____8469
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8470 = this;
  if(cljs.core.truth_(this__8470.front)) {
    return new cljs.core.PersistentQueue(this__8470.meta, this__8470.count + 1, this__8470.front, cljs.core.conj.call(null, function() {
      var or__3943__auto____8471 = this__8470.rear;
      if(cljs.core.truth_(or__3943__auto____8471)) {
        return or__3943__auto____8471
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__8470.meta, this__8470.count + 1, cljs.core.conj.call(null, this__8470.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__8472 = this;
  var this__8473 = this;
  return cljs.core.pr_str.call(null, this__8473)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8474 = this;
  var rear__8475 = cljs.core.seq.call(null, this__8474.rear);
  if(cljs.core.truth_(function() {
    var or__3943__auto____8476 = this__8474.front;
    if(cljs.core.truth_(or__3943__auto____8476)) {
      return or__3943__auto____8476
    }else {
      return rear__8475
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__8474.front, cljs.core.seq.call(null, rear__8475), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8477 = this;
  return this__8477.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8478 = this;
  return cljs.core._first.call(null, this__8478.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8479 = this;
  if(cljs.core.truth_(this__8479.front)) {
    var temp__4090__auto____8480 = cljs.core.next.call(null, this__8479.front);
    if(temp__4090__auto____8480) {
      var f1__8481 = temp__4090__auto____8480;
      return new cljs.core.PersistentQueue(this__8479.meta, this__8479.count - 1, f1__8481, this__8479.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__8479.meta, this__8479.count - 1, cljs.core.seq.call(null, this__8479.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8482 = this;
  return cljs.core.first.call(null, this__8482.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8483 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8484 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8485 = this;
  return new cljs.core.PersistentQueue(meta, this__8485.count, this__8485.front, this__8485.rear, this__8485.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8486 = this;
  return this__8486.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8487 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__8488 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core._lookup.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__8491 = array.length;
  var i__8492 = 0;
  while(true) {
    if(i__8492 < len__8491) {
      if(k === array[i__8492]) {
        return i__8492
      }else {
        var G__8493 = i__8492 + incr;
        i__8492 = G__8493;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__8496 = cljs.core.hash.call(null, a);
  var b__8497 = cljs.core.hash.call(null, b);
  if(a__8496 < b__8497) {
    return-1
  }else {
    if(a__8496 > b__8497) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__8505 = m.keys;
  var len__8506 = ks__8505.length;
  var so__8507 = m.strobj;
  var out__8508 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__8509 = 0;
  var out__8510 = cljs.core.transient$.call(null, out__8508);
  while(true) {
    if(i__8509 < len__8506) {
      var k__8511 = ks__8505[i__8509];
      var G__8512 = i__8509 + 1;
      var G__8513 = cljs.core.assoc_BANG_.call(null, out__8510, k__8511, so__8507[k__8511]);
      i__8509 = G__8512;
      out__8510 = G__8513;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__8510, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__8519 = {};
  var l__8520 = ks.length;
  var i__8521 = 0;
  while(true) {
    if(i__8521 < l__8520) {
      var k__8522 = ks[i__8521];
      new_obj__8519[k__8522] = obj[k__8522];
      var G__8523 = i__8521 + 1;
      i__8521 = G__8523;
      continue
    }else {
    }
    break
  }
  return new_obj__8519
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8526 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8527 = this;
  var h__2087__auto____8528 = this__8527.__hash;
  if(!(h__2087__auto____8528 == null)) {
    return h__2087__auto____8528
  }else {
    var h__2087__auto____8529 = cljs.core.hash_imap.call(null, coll);
    this__8527.__hash = h__2087__auto____8529;
    return h__2087__auto____8529
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8530 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8531 = this;
  if(function() {
    var and__3941__auto____8532 = goog.isString(k);
    if(and__3941__auto____8532) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8531.keys) == null)
    }else {
      return and__3941__auto____8532
    }
  }()) {
    return this__8531.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8533 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3943__auto____8534 = this__8533.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3943__auto____8534) {
        return or__3943__auto____8534
      }else {
        return this__8533.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__8533.keys) == null)) {
        var new_strobj__8535 = cljs.core.obj_clone.call(null, this__8533.strobj, this__8533.keys);
        new_strobj__8535[k] = v;
        return new cljs.core.ObjMap(this__8533.meta, this__8533.keys, new_strobj__8535, this__8533.update_count + 1, null)
      }else {
        var new_strobj__8536 = cljs.core.obj_clone.call(null, this__8533.strobj, this__8533.keys);
        var new_keys__8537 = this__8533.keys.slice();
        new_strobj__8536[k] = v;
        new_keys__8537.push(k);
        return new cljs.core.ObjMap(this__8533.meta, new_keys__8537, new_strobj__8536, this__8533.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8538 = this;
  if(function() {
    var and__3941__auto____8539 = goog.isString(k);
    if(and__3941__auto____8539) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8538.keys) == null)
    }else {
      return and__3941__auto____8539
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__8561 = null;
  var G__8561__2 = function(this_sym8540, k) {
    var this__8542 = this;
    var this_sym8540__8543 = this;
    var coll__8544 = this_sym8540__8543;
    return coll__8544.cljs$core$ILookup$_lookup$arity$2(coll__8544, k)
  };
  var G__8561__3 = function(this_sym8541, k, not_found) {
    var this__8542 = this;
    var this_sym8541__8545 = this;
    var coll__8546 = this_sym8541__8545;
    return coll__8546.cljs$core$ILookup$_lookup$arity$3(coll__8546, k, not_found)
  };
  G__8561 = function(this_sym8541, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8561__2.call(this, this_sym8541, k);
      case 3:
        return G__8561__3.call(this, this_sym8541, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8561
}();
cljs.core.ObjMap.prototype.apply = function(this_sym8524, args8525) {
  var this__8547 = this;
  return this_sym8524.call.apply(this_sym8524, [this_sym8524].concat(args8525.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8548 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__8549 = this;
  var this__8550 = this;
  return cljs.core.pr_str.call(null, this__8550)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8551 = this;
  if(this__8551.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__8514_SHARP_) {
      return cljs.core.vector.call(null, p1__8514_SHARP_, this__8551.strobj[p1__8514_SHARP_])
    }, this__8551.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8552 = this;
  return this__8552.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8553 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8554 = this;
  return new cljs.core.ObjMap(meta, this__8554.keys, this__8554.strobj, this__8554.update_count, this__8554.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8555 = this;
  return this__8555.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8556 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__8556.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8557 = this;
  if(function() {
    var and__3941__auto____8558 = goog.isString(k);
    if(and__3941__auto____8558) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8557.keys) == null)
    }else {
      return and__3941__auto____8558
    }
  }()) {
    var new_keys__8559 = this__8557.keys.slice();
    var new_strobj__8560 = cljs.core.obj_clone.call(null, this__8557.strobj, this__8557.keys);
    new_keys__8559.splice(cljs.core.scan_array.call(null, 1, k, new_keys__8559), 1);
    cljs.core.js_delete.call(null, new_strobj__8560, k);
    return new cljs.core.ObjMap(this__8557.meta, new_keys__8559, new_strobj__8560, this__8557.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8565 = this;
  var h__2087__auto____8566 = this__8565.__hash;
  if(!(h__2087__auto____8566 == null)) {
    return h__2087__auto____8566
  }else {
    var h__2087__auto____8567 = cljs.core.hash_imap.call(null, coll);
    this__8565.__hash = h__2087__auto____8567;
    return h__2087__auto____8567
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8568 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8569 = this;
  var bucket__8570 = this__8569.hashobj[cljs.core.hash.call(null, k)];
  var i__8571 = cljs.core.truth_(bucket__8570) ? cljs.core.scan_array.call(null, 2, k, bucket__8570) : null;
  if(cljs.core.truth_(i__8571)) {
    return bucket__8570[i__8571 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8572 = this;
  var h__8573 = cljs.core.hash.call(null, k);
  var bucket__8574 = this__8572.hashobj[h__8573];
  if(cljs.core.truth_(bucket__8574)) {
    var new_bucket__8575 = bucket__8574.slice();
    var new_hashobj__8576 = goog.object.clone(this__8572.hashobj);
    new_hashobj__8576[h__8573] = new_bucket__8575;
    var temp__4090__auto____8577 = cljs.core.scan_array.call(null, 2, k, new_bucket__8575);
    if(cljs.core.truth_(temp__4090__auto____8577)) {
      var i__8578 = temp__4090__auto____8577;
      new_bucket__8575[i__8578 + 1] = v;
      return new cljs.core.HashMap(this__8572.meta, this__8572.count, new_hashobj__8576, null)
    }else {
      new_bucket__8575.push(k, v);
      return new cljs.core.HashMap(this__8572.meta, this__8572.count + 1, new_hashobj__8576, null)
    }
  }else {
    var new_hashobj__8579 = goog.object.clone(this__8572.hashobj);
    new_hashobj__8579[h__8573] = [k, v];
    return new cljs.core.HashMap(this__8572.meta, this__8572.count + 1, new_hashobj__8579, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8580 = this;
  var bucket__8581 = this__8580.hashobj[cljs.core.hash.call(null, k)];
  var i__8582 = cljs.core.truth_(bucket__8581) ? cljs.core.scan_array.call(null, 2, k, bucket__8581) : null;
  if(cljs.core.truth_(i__8582)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__8607 = null;
  var G__8607__2 = function(this_sym8583, k) {
    var this__8585 = this;
    var this_sym8583__8586 = this;
    var coll__8587 = this_sym8583__8586;
    return coll__8587.cljs$core$ILookup$_lookup$arity$2(coll__8587, k)
  };
  var G__8607__3 = function(this_sym8584, k, not_found) {
    var this__8585 = this;
    var this_sym8584__8588 = this;
    var coll__8589 = this_sym8584__8588;
    return coll__8589.cljs$core$ILookup$_lookup$arity$3(coll__8589, k, not_found)
  };
  G__8607 = function(this_sym8584, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8607__2.call(this, this_sym8584, k);
      case 3:
        return G__8607__3.call(this, this_sym8584, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8607
}();
cljs.core.HashMap.prototype.apply = function(this_sym8563, args8564) {
  var this__8590 = this;
  return this_sym8563.call.apply(this_sym8563, [this_sym8563].concat(args8564.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8591 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__8592 = this;
  var this__8593 = this;
  return cljs.core.pr_str.call(null, this__8593)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8594 = this;
  if(this__8594.count > 0) {
    var hashes__8595 = cljs.core.js_keys.call(null, this__8594.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__8562_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__8594.hashobj[p1__8562_SHARP_]))
    }, hashes__8595)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8596 = this;
  return this__8596.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8597 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8598 = this;
  return new cljs.core.HashMap(meta, this__8598.count, this__8598.hashobj, this__8598.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8599 = this;
  return this__8599.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8600 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__8600.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8601 = this;
  var h__8602 = cljs.core.hash.call(null, k);
  var bucket__8603 = this__8601.hashobj[h__8602];
  var i__8604 = cljs.core.truth_(bucket__8603) ? cljs.core.scan_array.call(null, 2, k, bucket__8603) : null;
  if(cljs.core.not.call(null, i__8604)) {
    return coll
  }else {
    var new_hashobj__8605 = goog.object.clone(this__8601.hashobj);
    if(3 > bucket__8603.length) {
      cljs.core.js_delete.call(null, new_hashobj__8605, h__8602)
    }else {
      var new_bucket__8606 = bucket__8603.slice();
      new_bucket__8606.splice(i__8604, 2);
      new_hashobj__8605[h__8602] = new_bucket__8606
    }
    return new cljs.core.HashMap(this__8601.meta, this__8601.count - 1, new_hashobj__8605, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__8608 = ks.length;
  var i__8609 = 0;
  var out__8610 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__8609 < len__8608) {
      var G__8611 = i__8609 + 1;
      var G__8612 = cljs.core.assoc.call(null, out__8610, ks[i__8609], vs[i__8609]);
      i__8609 = G__8611;
      out__8610 = G__8612;
      continue
    }else {
      return out__8610
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__8616 = m.arr;
  var len__8617 = arr__8616.length;
  var i__8618 = 0;
  while(true) {
    if(len__8617 <= i__8618) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__8616[i__8618], k)) {
        return i__8618
      }else {
        if("\ufdd0'else") {
          var G__8619 = i__8618 + 2;
          i__8618 = G__8619;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
void 0;
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8622 = this;
  return new cljs.core.TransientArrayMap({}, this__8622.arr.length, this__8622.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8623 = this;
  var h__2087__auto____8624 = this__8623.__hash;
  if(!(h__2087__auto____8624 == null)) {
    return h__2087__auto____8624
  }else {
    var h__2087__auto____8625 = cljs.core.hash_imap.call(null, coll);
    this__8623.__hash = h__2087__auto____8625;
    return h__2087__auto____8625
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8626 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8627 = this;
  var idx__8628 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8628 === -1) {
    return not_found
  }else {
    return this__8627.arr[idx__8628 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8629 = this;
  var idx__8630 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8630 === -1) {
    if(this__8629.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__8629.meta, this__8629.cnt + 1, function() {
        var G__8631__8632 = this__8629.arr.slice();
        G__8631__8632.push(k);
        G__8631__8632.push(v);
        return G__8631__8632
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__8629.arr[idx__8630 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__8629.meta, this__8629.cnt, function() {
          var G__8633__8634 = this__8629.arr.slice();
          G__8633__8634[idx__8630 + 1] = v;
          return G__8633__8634
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8635 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__8667 = null;
  var G__8667__2 = function(this_sym8636, k) {
    var this__8638 = this;
    var this_sym8636__8639 = this;
    var coll__8640 = this_sym8636__8639;
    return coll__8640.cljs$core$ILookup$_lookup$arity$2(coll__8640, k)
  };
  var G__8667__3 = function(this_sym8637, k, not_found) {
    var this__8638 = this;
    var this_sym8637__8641 = this;
    var coll__8642 = this_sym8637__8641;
    return coll__8642.cljs$core$ILookup$_lookup$arity$3(coll__8642, k, not_found)
  };
  G__8667 = function(this_sym8637, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8667__2.call(this, this_sym8637, k);
      case 3:
        return G__8667__3.call(this, this_sym8637, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8667
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym8620, args8621) {
  var this__8643 = this;
  return this_sym8620.call.apply(this_sym8620, [this_sym8620].concat(args8621.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__8644 = this;
  var len__8645 = this__8644.arr.length;
  var i__8646 = 0;
  var init__8647 = init;
  while(true) {
    if(i__8646 < len__8645) {
      var init__8648 = f.call(null, init__8647, this__8644.arr[i__8646], this__8644.arr[i__8646 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__8648)) {
        return cljs.core.deref.call(null, init__8648)
      }else {
        var G__8668 = i__8646 + 2;
        var G__8669 = init__8648;
        i__8646 = G__8668;
        init__8647 = G__8669;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8649 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__8650 = this;
  var this__8651 = this;
  return cljs.core.pr_str.call(null, this__8651)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8652 = this;
  if(this__8652.cnt > 0) {
    var len__8653 = this__8652.arr.length;
    var array_map_seq__8654 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__8653) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__8652.arr[i], this__8652.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__8654.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8655 = this;
  return this__8655.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8656 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8657 = this;
  return new cljs.core.PersistentArrayMap(meta, this__8657.cnt, this__8657.arr, this__8657.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8658 = this;
  return this__8658.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8659 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__8659.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8660 = this;
  var idx__8661 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8661 >= 0) {
    var len__8662 = this__8660.arr.length;
    var new_len__8663 = len__8662 - 2;
    if(new_len__8663 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__8664 = cljs.core.make_array.call(null, new_len__8663);
      var s__8665 = 0;
      var d__8666 = 0;
      while(true) {
        if(s__8665 >= len__8662) {
          return new cljs.core.PersistentArrayMap(this__8660.meta, this__8660.cnt - 1, new_arr__8664, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__8660.arr[s__8665])) {
            var G__8670 = s__8665 + 2;
            var G__8671 = d__8666;
            s__8665 = G__8670;
            d__8666 = G__8671;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__8664[d__8666] = this__8660.arr[s__8665];
              new_arr__8664[d__8666 + 1] = this__8660.arr[s__8665 + 1];
              var G__8672 = s__8665 + 2;
              var G__8673 = d__8666 + 2;
              s__8665 = G__8672;
              d__8666 = G__8673;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__8674 = cljs.core.count.call(null, ks);
  var i__8675 = 0;
  var out__8676 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__8675 < len__8674) {
      var G__8677 = i__8675 + 1;
      var G__8678 = cljs.core.assoc_BANG_.call(null, out__8676, ks[i__8675], vs[i__8675]);
      i__8675 = G__8677;
      out__8676 = G__8678;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__8676)
    }
    break
  }
};
void 0;
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__8679 = this;
  if(cljs.core.truth_(this__8679.editable_QMARK_)) {
    var idx__8680 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8680 >= 0) {
      this__8679.arr[idx__8680] = this__8679.arr[this__8679.len - 2];
      this__8679.arr[idx__8680 + 1] = this__8679.arr[this__8679.len - 1];
      var G__8681__8682 = this__8679.arr;
      G__8681__8682.pop();
      G__8681__8682.pop();
      G__8681__8682;
      this__8679.len = this__8679.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8683 = this;
  if(cljs.core.truth_(this__8683.editable_QMARK_)) {
    var idx__8684 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8684 === -1) {
      if(this__8683.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__8683.len = this__8683.len + 2;
        this__8683.arr.push(key);
        this__8683.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__8683.len, this__8683.arr), key, val)
      }
    }else {
      if(val === this__8683.arr[idx__8684 + 1]) {
        return tcoll
      }else {
        this__8683.arr[idx__8684 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8685 = this;
  if(cljs.core.truth_(this__8685.editable_QMARK_)) {
    if(function() {
      var G__8686__8687 = o;
      if(G__8686__8687) {
        if(function() {
          var or__3943__auto____8688 = G__8686__8687.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3943__auto____8688) {
            return or__3943__auto____8688
          }else {
            return G__8686__8687.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__8686__8687.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8686__8687)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8686__8687)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__8689 = cljs.core.seq.call(null, o);
      var tcoll__8690 = tcoll;
      while(true) {
        var temp__4090__auto____8691 = cljs.core.first.call(null, es__8689);
        if(cljs.core.truth_(temp__4090__auto____8691)) {
          var e__8692 = temp__4090__auto____8691;
          var G__8698 = cljs.core.next.call(null, es__8689);
          var G__8699 = tcoll__8690.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__8690, cljs.core.key.call(null, e__8692), cljs.core.val.call(null, e__8692));
          es__8689 = G__8698;
          tcoll__8690 = G__8699;
          continue
        }else {
          return tcoll__8690
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8693 = this;
  if(cljs.core.truth_(this__8693.editable_QMARK_)) {
    this__8693.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__8693.len, 2), this__8693.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__8694 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__8695 = this;
  if(cljs.core.truth_(this__8695.editable_QMARK_)) {
    var idx__8696 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__8696 === -1) {
      return not_found
    }else {
      return this__8695.arr[idx__8696 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__8697 = this;
  if(cljs.core.truth_(this__8697.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__8697.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
void 0;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__8702 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__8703 = 0;
  while(true) {
    if(i__8703 < len) {
      var G__8704 = cljs.core.assoc_BANG_.call(null, out__8702, arr[i__8703], arr[i__8703 + 1]);
      var G__8705 = i__8703 + 2;
      out__8702 = G__8704;
      i__8703 = G__8705;
      continue
    }else {
      return out__8702
    }
    break
  }
};
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__2205__auto__) {
  return cljs.core.list.call(null, "cljs.core/Box")
};
cljs.core.Box;
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.call(null, key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__8710__8711 = arr.slice();
    G__8710__8711[i] = a;
    return G__8710__8711
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__8712__8713 = arr.slice();
    G__8712__8713[i] = a;
    G__8712__8713[j] = b;
    return G__8712__8713
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__8715 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__8715, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__8715, 2 * i, new_arr__8715.length - 2 * i);
  return new_arr__8715
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__8718 = inode.ensure_editable(edit);
    editable__8718.arr[i] = a;
    return editable__8718
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__8719 = inode.ensure_editable(edit);
    editable__8719.arr[i] = a;
    editable__8719.arr[j] = b;
    return editable__8719
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__8726 = arr.length;
  var i__8727 = 0;
  var init__8728 = init;
  while(true) {
    if(i__8727 < len__8726) {
      var init__8731 = function() {
        var k__8729 = arr[i__8727];
        if(!(k__8729 == null)) {
          return f.call(null, init__8728, k__8729, arr[i__8727 + 1])
        }else {
          var node__8730 = arr[i__8727 + 1];
          if(!(node__8730 == null)) {
            return node__8730.kv_reduce(f, init__8728)
          }else {
            return init__8728
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8731)) {
        return cljs.core.deref.call(null, init__8731)
      }else {
        var G__8732 = i__8727 + 2;
        var G__8733 = init__8731;
        i__8727 = G__8732;
        init__8728 = G__8733;
        continue
      }
    }else {
      return init__8728
    }
    break
  }
};
void 0;
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__8734 = this;
  var inode__8735 = this;
  if(this__8734.bitmap === bit) {
    return null
  }else {
    var editable__8736 = inode__8735.ensure_editable(e);
    var earr__8737 = editable__8736.arr;
    var len__8738 = earr__8737.length;
    editable__8736.bitmap = bit ^ editable__8736.bitmap;
    cljs.core.array_copy.call(null, earr__8737, 2 * (i + 1), earr__8737, 2 * i, len__8738 - 2 * (i + 1));
    earr__8737[len__8738 - 2] = null;
    earr__8737[len__8738 - 1] = null;
    return editable__8736
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8739 = this;
  var inode__8740 = this;
  var bit__8741 = 1 << (hash >>> shift & 31);
  var idx__8742 = cljs.core.bitmap_indexed_node_index.call(null, this__8739.bitmap, bit__8741);
  if((this__8739.bitmap & bit__8741) === 0) {
    var n__8743 = cljs.core.bit_count.call(null, this__8739.bitmap);
    if(2 * n__8743 < this__8739.arr.length) {
      var editable__8744 = inode__8740.ensure_editable(edit);
      var earr__8745 = editable__8744.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__8745, 2 * idx__8742, earr__8745, 2 * (idx__8742 + 1), 2 * (n__8743 - idx__8742));
      earr__8745[2 * idx__8742] = key;
      earr__8745[2 * idx__8742 + 1] = val;
      editable__8744.bitmap = editable__8744.bitmap | bit__8741;
      return editable__8744
    }else {
      if(n__8743 >= 16) {
        var nodes__8746 = cljs.core.make_array.call(null, 32);
        var jdx__8747 = hash >>> shift & 31;
        nodes__8746[jdx__8747] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__8748 = 0;
        var j__8749 = 0;
        while(true) {
          if(i__8748 < 32) {
            if((this__8739.bitmap >>> i__8748 & 1) === 0) {
              var G__8802 = i__8748 + 1;
              var G__8803 = j__8749;
              i__8748 = G__8802;
              j__8749 = G__8803;
              continue
            }else {
              nodes__8746[i__8748] = !(this__8739.arr[j__8749] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__8739.arr[j__8749]), this__8739.arr[j__8749], this__8739.arr[j__8749 + 1], added_leaf_QMARK_) : this__8739.arr[j__8749 + 1];
              var G__8804 = i__8748 + 1;
              var G__8805 = j__8749 + 2;
              i__8748 = G__8804;
              j__8749 = G__8805;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__8743 + 1, nodes__8746)
      }else {
        if("\ufdd0'else") {
          var new_arr__8750 = cljs.core.make_array.call(null, 2 * (n__8743 + 4));
          cljs.core.array_copy.call(null, this__8739.arr, 0, new_arr__8750, 0, 2 * idx__8742);
          new_arr__8750[2 * idx__8742] = key;
          new_arr__8750[2 * idx__8742 + 1] = val;
          cljs.core.array_copy.call(null, this__8739.arr, 2 * idx__8742, new_arr__8750, 2 * (idx__8742 + 1), 2 * (n__8743 - idx__8742));
          added_leaf_QMARK_.val = true;
          var editable__8751 = inode__8740.ensure_editable(edit);
          editable__8751.arr = new_arr__8750;
          editable__8751.bitmap = editable__8751.bitmap | bit__8741;
          return editable__8751
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__8752 = this__8739.arr[2 * idx__8742];
    var val_or_node__8753 = this__8739.arr[2 * idx__8742 + 1];
    if(key_or_nil__8752 == null) {
      var n__8754 = val_or_node__8753.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8754 === val_or_node__8753) {
        return inode__8740
      }else {
        return cljs.core.edit_and_set.call(null, inode__8740, edit, 2 * idx__8742 + 1, n__8754)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8752)) {
        if(val === val_or_node__8753) {
          return inode__8740
        }else {
          return cljs.core.edit_and_set.call(null, inode__8740, edit, 2 * idx__8742 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__8740, edit, 2 * idx__8742, null, 2 * idx__8742 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__8752, val_or_node__8753, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__8755 = this;
  var inode__8756 = this;
  return cljs.core.create_inode_seq.call(null, this__8755.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8757 = this;
  var inode__8758 = this;
  var bit__8759 = 1 << (hash >>> shift & 31);
  if((this__8757.bitmap & bit__8759) === 0) {
    return inode__8758
  }else {
    var idx__8760 = cljs.core.bitmap_indexed_node_index.call(null, this__8757.bitmap, bit__8759);
    var key_or_nil__8761 = this__8757.arr[2 * idx__8760];
    var val_or_node__8762 = this__8757.arr[2 * idx__8760 + 1];
    if(key_or_nil__8761 == null) {
      var n__8763 = val_or_node__8762.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__8763 === val_or_node__8762) {
        return inode__8758
      }else {
        if(!(n__8763 == null)) {
          return cljs.core.edit_and_set.call(null, inode__8758, edit, 2 * idx__8760 + 1, n__8763)
        }else {
          if(this__8757.bitmap === bit__8759) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__8758.edit_and_remove_pair(edit, bit__8759, idx__8760)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8761)) {
        removed_leaf_QMARK_[0] = true;
        return inode__8758.edit_and_remove_pair(edit, bit__8759, idx__8760)
      }else {
        if("\ufdd0'else") {
          return inode__8758
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__8764 = this;
  var inode__8765 = this;
  if(e === this__8764.edit) {
    return inode__8765
  }else {
    var n__8766 = cljs.core.bit_count.call(null, this__8764.bitmap);
    var new_arr__8767 = cljs.core.make_array.call(null, n__8766 < 0 ? 4 : 2 * (n__8766 + 1));
    cljs.core.array_copy.call(null, this__8764.arr, 0, new_arr__8767, 0, 2 * n__8766);
    return new cljs.core.BitmapIndexedNode(e, this__8764.bitmap, new_arr__8767)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__8768 = this;
  var inode__8769 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8768.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8770 = this;
  var inode__8771 = this;
  var bit__8772 = 1 << (hash >>> shift & 31);
  if((this__8770.bitmap & bit__8772) === 0) {
    return not_found
  }else {
    var idx__8773 = cljs.core.bitmap_indexed_node_index.call(null, this__8770.bitmap, bit__8772);
    var key_or_nil__8774 = this__8770.arr[2 * idx__8773];
    var val_or_node__8775 = this__8770.arr[2 * idx__8773 + 1];
    if(key_or_nil__8774 == null) {
      return val_or_node__8775.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8774)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__8774, val_or_node__8775], true)
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__8776 = this;
  var inode__8777 = this;
  var bit__8778 = 1 << (hash >>> shift & 31);
  if((this__8776.bitmap & bit__8778) === 0) {
    return inode__8777
  }else {
    var idx__8779 = cljs.core.bitmap_indexed_node_index.call(null, this__8776.bitmap, bit__8778);
    var key_or_nil__8780 = this__8776.arr[2 * idx__8779];
    var val_or_node__8781 = this__8776.arr[2 * idx__8779 + 1];
    if(key_or_nil__8780 == null) {
      var n__8782 = val_or_node__8781.inode_without(shift + 5, hash, key);
      if(n__8782 === val_or_node__8781) {
        return inode__8777
      }else {
        if(!(n__8782 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__8776.bitmap, cljs.core.clone_and_set.call(null, this__8776.arr, 2 * idx__8779 + 1, n__8782))
        }else {
          if(this__8776.bitmap === bit__8778) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__8776.bitmap ^ bit__8778, cljs.core.remove_pair.call(null, this__8776.arr, idx__8779))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8780)) {
        return new cljs.core.BitmapIndexedNode(null, this__8776.bitmap ^ bit__8778, cljs.core.remove_pair.call(null, this__8776.arr, idx__8779))
      }else {
        if("\ufdd0'else") {
          return inode__8777
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8783 = this;
  var inode__8784 = this;
  var bit__8785 = 1 << (hash >>> shift & 31);
  var idx__8786 = cljs.core.bitmap_indexed_node_index.call(null, this__8783.bitmap, bit__8785);
  if((this__8783.bitmap & bit__8785) === 0) {
    var n__8787 = cljs.core.bit_count.call(null, this__8783.bitmap);
    if(n__8787 >= 16) {
      var nodes__8788 = cljs.core.make_array.call(null, 32);
      var jdx__8789 = hash >>> shift & 31;
      nodes__8788[jdx__8789] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__8790 = 0;
      var j__8791 = 0;
      while(true) {
        if(i__8790 < 32) {
          if((this__8783.bitmap >>> i__8790 & 1) === 0) {
            var G__8806 = i__8790 + 1;
            var G__8807 = j__8791;
            i__8790 = G__8806;
            j__8791 = G__8807;
            continue
          }else {
            nodes__8788[i__8790] = !(this__8783.arr[j__8791] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__8783.arr[j__8791]), this__8783.arr[j__8791], this__8783.arr[j__8791 + 1], added_leaf_QMARK_) : this__8783.arr[j__8791 + 1];
            var G__8808 = i__8790 + 1;
            var G__8809 = j__8791 + 2;
            i__8790 = G__8808;
            j__8791 = G__8809;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__8787 + 1, nodes__8788)
    }else {
      var new_arr__8792 = cljs.core.make_array.call(null, 2 * (n__8787 + 1));
      cljs.core.array_copy.call(null, this__8783.arr, 0, new_arr__8792, 0, 2 * idx__8786);
      new_arr__8792[2 * idx__8786] = key;
      new_arr__8792[2 * idx__8786 + 1] = val;
      cljs.core.array_copy.call(null, this__8783.arr, 2 * idx__8786, new_arr__8792, 2 * (idx__8786 + 1), 2 * (n__8787 - idx__8786));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__8783.bitmap | bit__8785, new_arr__8792)
    }
  }else {
    var key_or_nil__8793 = this__8783.arr[2 * idx__8786];
    var val_or_node__8794 = this__8783.arr[2 * idx__8786 + 1];
    if(key_or_nil__8793 == null) {
      var n__8795 = val_or_node__8794.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8795 === val_or_node__8794) {
        return inode__8784
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__8783.bitmap, cljs.core.clone_and_set.call(null, this__8783.arr, 2 * idx__8786 + 1, n__8795))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8793)) {
        if(val === val_or_node__8794) {
          return inode__8784
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__8783.bitmap, cljs.core.clone_and_set.call(null, this__8783.arr, 2 * idx__8786 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__8783.bitmap, cljs.core.clone_and_set.call(null, this__8783.arr, 2 * idx__8786, null, 2 * idx__8786 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__8793, val_or_node__8794, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8796 = this;
  var inode__8797 = this;
  var bit__8798 = 1 << (hash >>> shift & 31);
  if((this__8796.bitmap & bit__8798) === 0) {
    return not_found
  }else {
    var idx__8799 = cljs.core.bitmap_indexed_node_index.call(null, this__8796.bitmap, bit__8798);
    var key_or_nil__8800 = this__8796.arr[2 * idx__8799];
    var val_or_node__8801 = this__8796.arr[2 * idx__8799 + 1];
    if(key_or_nil__8800 == null) {
      return val_or_node__8801.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8800)) {
        return val_or_node__8801
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__8817 = array_node.arr;
  var len__8818 = 2 * (array_node.cnt - 1);
  var new_arr__8819 = cljs.core.make_array.call(null, len__8818);
  var i__8820 = 0;
  var j__8821 = 1;
  var bitmap__8822 = 0;
  while(true) {
    if(i__8820 < len__8818) {
      if(function() {
        var and__3941__auto____8823 = !(i__8820 === idx);
        if(and__3941__auto____8823) {
          return!(arr__8817[i__8820] == null)
        }else {
          return and__3941__auto____8823
        }
      }()) {
        new_arr__8819[j__8821] = arr__8817[i__8820];
        var G__8824 = i__8820 + 1;
        var G__8825 = j__8821 + 2;
        var G__8826 = bitmap__8822 | 1 << i__8820;
        i__8820 = G__8824;
        j__8821 = G__8825;
        bitmap__8822 = G__8826;
        continue
      }else {
        var G__8827 = i__8820 + 1;
        var G__8828 = j__8821;
        var G__8829 = bitmap__8822;
        i__8820 = G__8827;
        j__8821 = G__8828;
        bitmap__8822 = G__8829;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__8822, new_arr__8819)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8830 = this;
  var inode__8831 = this;
  var idx__8832 = hash >>> shift & 31;
  var node__8833 = this__8830.arr[idx__8832];
  if(node__8833 == null) {
    var editable__8834 = cljs.core.edit_and_set.call(null, inode__8831, edit, idx__8832, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__8834.cnt = editable__8834.cnt + 1;
    return editable__8834
  }else {
    var n__8835 = node__8833.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8835 === node__8833) {
      return inode__8831
    }else {
      return cljs.core.edit_and_set.call(null, inode__8831, edit, idx__8832, n__8835)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__8836 = this;
  var inode__8837 = this;
  return cljs.core.create_array_node_seq.call(null, this__8836.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8838 = this;
  var inode__8839 = this;
  var idx__8840 = hash >>> shift & 31;
  var node__8841 = this__8838.arr[idx__8840];
  if(node__8841 == null) {
    return inode__8839
  }else {
    var n__8842 = node__8841.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__8842 === node__8841) {
      return inode__8839
    }else {
      if(n__8842 == null) {
        if(this__8838.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8839, edit, idx__8840)
        }else {
          var editable__8843 = cljs.core.edit_and_set.call(null, inode__8839, edit, idx__8840, n__8842);
          editable__8843.cnt = editable__8843.cnt - 1;
          return editable__8843
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__8839, edit, idx__8840, n__8842)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__8844 = this;
  var inode__8845 = this;
  if(e === this__8844.edit) {
    return inode__8845
  }else {
    return new cljs.core.ArrayNode(e, this__8844.cnt, this__8844.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__8846 = this;
  var inode__8847 = this;
  var len__8848 = this__8846.arr.length;
  var i__8849 = 0;
  var init__8850 = init;
  while(true) {
    if(i__8849 < len__8848) {
      var node__8851 = this__8846.arr[i__8849];
      if(!(node__8851 == null)) {
        var init__8852 = node__8851.kv_reduce(f, init__8850);
        if(cljs.core.reduced_QMARK_.call(null, init__8852)) {
          return cljs.core.deref.call(null, init__8852)
        }else {
          var G__8871 = i__8849 + 1;
          var G__8872 = init__8852;
          i__8849 = G__8871;
          init__8850 = G__8872;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__8850
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8853 = this;
  var inode__8854 = this;
  var idx__8855 = hash >>> shift & 31;
  var node__8856 = this__8853.arr[idx__8855];
  if(!(node__8856 == null)) {
    return node__8856.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__8857 = this;
  var inode__8858 = this;
  var idx__8859 = hash >>> shift & 31;
  var node__8860 = this__8857.arr[idx__8859];
  if(!(node__8860 == null)) {
    var n__8861 = node__8860.inode_without(shift + 5, hash, key);
    if(n__8861 === node__8860) {
      return inode__8858
    }else {
      if(n__8861 == null) {
        if(this__8857.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8858, null, idx__8859)
        }else {
          return new cljs.core.ArrayNode(null, this__8857.cnt - 1, cljs.core.clone_and_set.call(null, this__8857.arr, idx__8859, n__8861))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__8857.cnt, cljs.core.clone_and_set.call(null, this__8857.arr, idx__8859, n__8861))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__8858
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8862 = this;
  var inode__8863 = this;
  var idx__8864 = hash >>> shift & 31;
  var node__8865 = this__8862.arr[idx__8864];
  if(node__8865 == null) {
    return new cljs.core.ArrayNode(null, this__8862.cnt + 1, cljs.core.clone_and_set.call(null, this__8862.arr, idx__8864, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__8866 = node__8865.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8866 === node__8865) {
      return inode__8863
    }else {
      return new cljs.core.ArrayNode(null, this__8862.cnt, cljs.core.clone_and_set.call(null, this__8862.arr, idx__8864, n__8866))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8867 = this;
  var inode__8868 = this;
  var idx__8869 = hash >>> shift & 31;
  var node__8870 = this__8867.arr[idx__8869];
  if(!(node__8870 == null)) {
    return node__8870.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__8875 = 2 * cnt;
  var i__8876 = 0;
  while(true) {
    if(i__8876 < lim__8875) {
      if(cljs.core.key_test.call(null, key, arr[i__8876])) {
        return i__8876
      }else {
        var G__8877 = i__8876 + 2;
        i__8876 = G__8877;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8878 = this;
  var inode__8879 = this;
  if(hash === this__8878.collision_hash) {
    var idx__8880 = cljs.core.hash_collision_node_find_index.call(null, this__8878.arr, this__8878.cnt, key);
    if(idx__8880 === -1) {
      if(this__8878.arr.length > 2 * this__8878.cnt) {
        var editable__8881 = cljs.core.edit_and_set.call(null, inode__8879, edit, 2 * this__8878.cnt, key, 2 * this__8878.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__8881.cnt = editable__8881.cnt + 1;
        return editable__8881
      }else {
        var len__8882 = this__8878.arr.length;
        var new_arr__8883 = cljs.core.make_array.call(null, len__8882 + 2);
        cljs.core.array_copy.call(null, this__8878.arr, 0, new_arr__8883, 0, len__8882);
        new_arr__8883[len__8882] = key;
        new_arr__8883[len__8882 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__8879.ensure_editable_array(edit, this__8878.cnt + 1, new_arr__8883)
      }
    }else {
      if(this__8878.arr[idx__8880 + 1] === val) {
        return inode__8879
      }else {
        return cljs.core.edit_and_set.call(null, inode__8879, edit, idx__8880 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__8878.collision_hash >>> shift & 31), [null, inode__8879, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__8884 = this;
  var inode__8885 = this;
  return cljs.core.create_inode_seq.call(null, this__8884.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8886 = this;
  var inode__8887 = this;
  var idx__8888 = cljs.core.hash_collision_node_find_index.call(null, this__8886.arr, this__8886.cnt, key);
  if(idx__8888 === -1) {
    return inode__8887
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__8886.cnt === 1) {
      return null
    }else {
      var editable__8889 = inode__8887.ensure_editable(edit);
      var earr__8890 = editable__8889.arr;
      earr__8890[idx__8888] = earr__8890[2 * this__8886.cnt - 2];
      earr__8890[idx__8888 + 1] = earr__8890[2 * this__8886.cnt - 1];
      earr__8890[2 * this__8886.cnt - 1] = null;
      earr__8890[2 * this__8886.cnt - 2] = null;
      editable__8889.cnt = editable__8889.cnt - 1;
      return editable__8889
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__8891 = this;
  var inode__8892 = this;
  if(e === this__8891.edit) {
    return inode__8892
  }else {
    var new_arr__8893 = cljs.core.make_array.call(null, 2 * (this__8891.cnt + 1));
    cljs.core.array_copy.call(null, this__8891.arr, 0, new_arr__8893, 0, 2 * this__8891.cnt);
    return new cljs.core.HashCollisionNode(e, this__8891.collision_hash, this__8891.cnt, new_arr__8893)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__8894 = this;
  var inode__8895 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8894.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8896 = this;
  var inode__8897 = this;
  var idx__8898 = cljs.core.hash_collision_node_find_index.call(null, this__8896.arr, this__8896.cnt, key);
  if(idx__8898 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__8896.arr[idx__8898])) {
      return cljs.core.PersistentVector.fromArray([this__8896.arr[idx__8898], this__8896.arr[idx__8898 + 1]], true)
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__8899 = this;
  var inode__8900 = this;
  var idx__8901 = cljs.core.hash_collision_node_find_index.call(null, this__8899.arr, this__8899.cnt, key);
  if(idx__8901 === -1) {
    return inode__8900
  }else {
    if(this__8899.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__8899.collision_hash, this__8899.cnt - 1, cljs.core.remove_pair.call(null, this__8899.arr, cljs.core.quot.call(null, idx__8901, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8902 = this;
  var inode__8903 = this;
  if(hash === this__8902.collision_hash) {
    var idx__8904 = cljs.core.hash_collision_node_find_index.call(null, this__8902.arr, this__8902.cnt, key);
    if(idx__8904 === -1) {
      var len__8905 = this__8902.arr.length;
      var new_arr__8906 = cljs.core.make_array.call(null, len__8905 + 2);
      cljs.core.array_copy.call(null, this__8902.arr, 0, new_arr__8906, 0, len__8905);
      new_arr__8906[len__8905] = key;
      new_arr__8906[len__8905 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__8902.collision_hash, this__8902.cnt + 1, new_arr__8906)
    }else {
      if(cljs.core._EQ_.call(null, this__8902.arr[idx__8904], val)) {
        return inode__8903
      }else {
        return new cljs.core.HashCollisionNode(null, this__8902.collision_hash, this__8902.cnt, cljs.core.clone_and_set.call(null, this__8902.arr, idx__8904 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__8902.collision_hash >>> shift & 31), [null, inode__8903])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8907 = this;
  var inode__8908 = this;
  var idx__8909 = cljs.core.hash_collision_node_find_index.call(null, this__8907.arr, this__8907.cnt, key);
  if(idx__8909 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__8907.arr[idx__8909])) {
      return this__8907.arr[idx__8909 + 1]
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var this__8910 = this;
  var inode__8911 = this;
  if(e === this__8910.edit) {
    this__8910.arr = array;
    this__8910.cnt = count;
    return inode__8911
  }else {
    return new cljs.core.HashCollisionNode(this__8910.edit, this__8910.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8916 = cljs.core.hash.call(null, key1);
    if(key1hash__8916 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8916, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8917 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__8916, key1, val1, added_leaf_QMARK___8917).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___8917)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8918 = cljs.core.hash.call(null, key1);
    if(key1hash__8918 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8918, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8919 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__8918, key1, val1, added_leaf_QMARK___8919).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___8919)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8920 = this;
  var h__2087__auto____8921 = this__8920.__hash;
  if(!(h__2087__auto____8921 == null)) {
    return h__2087__auto____8921
  }else {
    var h__2087__auto____8922 = cljs.core.hash_coll.call(null, coll);
    this__8920.__hash = h__2087__auto____8922;
    return h__2087__auto____8922
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8923 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__8924 = this;
  var this__8925 = this;
  return cljs.core.pr_str.call(null, this__8925)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8926 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8927 = this;
  if(this__8927.s == null) {
    return cljs.core.PersistentVector.fromArray([this__8927.nodes[this__8927.i], this__8927.nodes[this__8927.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__8927.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8928 = this;
  if(this__8928.s == null) {
    return cljs.core.create_inode_seq.call(null, this__8928.nodes, this__8928.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__8928.nodes, this__8928.i, cljs.core.next.call(null, this__8928.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8929 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8930 = this;
  return new cljs.core.NodeSeq(meta, this__8930.nodes, this__8930.i, this__8930.s, this__8930.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8931 = this;
  return this__8931.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8932 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8932.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__8939 = nodes.length;
      var j__8940 = i;
      while(true) {
        if(j__8940 < len__8939) {
          if(!(nodes[j__8940] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__8940, null, null)
          }else {
            var temp__4090__auto____8941 = nodes[j__8940 + 1];
            if(cljs.core.truth_(temp__4090__auto____8941)) {
              var node__8942 = temp__4090__auto____8941;
              var temp__4090__auto____8943 = node__8942.inode_seq();
              if(cljs.core.truth_(temp__4090__auto____8943)) {
                var node_seq__8944 = temp__4090__auto____8943;
                return new cljs.core.NodeSeq(null, nodes, j__8940 + 2, node_seq__8944, null)
              }else {
                var G__8945 = j__8940 + 2;
                j__8940 = G__8945;
                continue
              }
            }else {
              var G__8946 = j__8940 + 2;
              j__8940 = G__8946;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8947 = this;
  var h__2087__auto____8948 = this__8947.__hash;
  if(!(h__2087__auto____8948 == null)) {
    return h__2087__auto____8948
  }else {
    var h__2087__auto____8949 = cljs.core.hash_coll.call(null, coll);
    this__8947.__hash = h__2087__auto____8949;
    return h__2087__auto____8949
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8950 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__8951 = this;
  var this__8952 = this;
  return cljs.core.pr_str.call(null, this__8952)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8953 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8954 = this;
  return cljs.core.first.call(null, this__8954.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8955 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__8955.nodes, this__8955.i, cljs.core.next.call(null, this__8955.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8956 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8957 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__8957.nodes, this__8957.i, this__8957.s, this__8957.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8958 = this;
  return this__8958.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8959 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8959.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__8966 = nodes.length;
      var j__8967 = i;
      while(true) {
        if(j__8967 < len__8966) {
          var temp__4090__auto____8968 = nodes[j__8967];
          if(cljs.core.truth_(temp__4090__auto____8968)) {
            var nj__8969 = temp__4090__auto____8968;
            var temp__4090__auto____8970 = nj__8969.inode_seq();
            if(cljs.core.truth_(temp__4090__auto____8970)) {
              var ns__8971 = temp__4090__auto____8970;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__8967 + 1, ns__8971, null)
            }else {
              var G__8972 = j__8967 + 1;
              j__8967 = G__8972;
              continue
            }
          }else {
            var G__8973 = j__8967 + 1;
            j__8967 = G__8973;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
void 0;
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8976 = this;
  return new cljs.core.TransientHashMap({}, this__8976.root, this__8976.cnt, this__8976.has_nil_QMARK_, this__8976.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8977 = this;
  var h__2087__auto____8978 = this__8977.__hash;
  if(!(h__2087__auto____8978 == null)) {
    return h__2087__auto____8978
  }else {
    var h__2087__auto____8979 = cljs.core.hash_imap.call(null, coll);
    this__8977.__hash = h__2087__auto____8979;
    return h__2087__auto____8979
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8980 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8981 = this;
  if(k == null) {
    if(this__8981.has_nil_QMARK_) {
      return this__8981.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__8981.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__8981.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8982 = this;
  if(k == null) {
    if(function() {
      var and__3941__auto____8983 = this__8982.has_nil_QMARK_;
      if(and__3941__auto____8983) {
        return v === this__8982.nil_val
      }else {
        return and__3941__auto____8983
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__8982.meta, this__8982.has_nil_QMARK_ ? this__8982.cnt : this__8982.cnt + 1, this__8982.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___8984 = new cljs.core.Box(false);
    var new_root__8985 = (this__8982.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__8982.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___8984);
    if(new_root__8985 === this__8982.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__8982.meta, added_leaf_QMARK___8984.val ? this__8982.cnt + 1 : this__8982.cnt, new_root__8985, this__8982.has_nil_QMARK_, this__8982.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8986 = this;
  if(k == null) {
    return this__8986.has_nil_QMARK_
  }else {
    if(this__8986.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__8986.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__9009 = null;
  var G__9009__2 = function(this_sym8987, k) {
    var this__8989 = this;
    var this_sym8987__8990 = this;
    var coll__8991 = this_sym8987__8990;
    return coll__8991.cljs$core$ILookup$_lookup$arity$2(coll__8991, k)
  };
  var G__9009__3 = function(this_sym8988, k, not_found) {
    var this__8989 = this;
    var this_sym8988__8992 = this;
    var coll__8993 = this_sym8988__8992;
    return coll__8993.cljs$core$ILookup$_lookup$arity$3(coll__8993, k, not_found)
  };
  G__9009 = function(this_sym8988, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9009__2.call(this, this_sym8988, k);
      case 3:
        return G__9009__3.call(this, this_sym8988, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9009
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym8974, args8975) {
  var this__8994 = this;
  return this_sym8974.call.apply(this_sym8974, [this_sym8974].concat(args8975.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__8995 = this;
  var init__8996 = this__8995.has_nil_QMARK_ ? f.call(null, init, null, this__8995.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__8996)) {
    return cljs.core.deref.call(null, init__8996)
  }else {
    if(!(this__8995.root == null)) {
      return this__8995.root.kv_reduce(f, init__8996)
    }else {
      if("\ufdd0'else") {
        return init__8996
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8997 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__8998 = this;
  var this__8999 = this;
  return cljs.core.pr_str.call(null, this__8999)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9000 = this;
  if(this__9000.cnt > 0) {
    var s__9001 = !(this__9000.root == null) ? this__9000.root.inode_seq() : null;
    if(this__9000.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__9000.nil_val], true), s__9001)
    }else {
      return s__9001
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9002 = this;
  return this__9002.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9003 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9004 = this;
  return new cljs.core.PersistentHashMap(meta, this__9004.cnt, this__9004.root, this__9004.has_nil_QMARK_, this__9004.nil_val, this__9004.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9005 = this;
  return this__9005.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9006 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__9006.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9007 = this;
  if(k == null) {
    if(this__9007.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__9007.meta, this__9007.cnt - 1, this__9007.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__9007.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__9008 = this__9007.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__9008 === this__9007.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__9007.meta, this__9007.cnt - 1, new_root__9008, this__9007.has_nil_QMARK_, this__9007.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__9010 = ks.length;
  var i__9011 = 0;
  var out__9012 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__9011 < len__9010) {
      var G__9013 = i__9011 + 1;
      var G__9014 = cljs.core.assoc_BANG_.call(null, out__9012, ks[i__9011], vs[i__9011]);
      i__9011 = G__9013;
      out__9012 = G__9014;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9012)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__9015 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9016 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__9017 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9018 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__9019 = this;
  if(k == null) {
    if(this__9019.has_nil_QMARK_) {
      return this__9019.nil_val
    }else {
      return null
    }
  }else {
    if(this__9019.root == null) {
      return null
    }else {
      return this__9019.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__9020 = this;
  if(k == null) {
    if(this__9020.has_nil_QMARK_) {
      return this__9020.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9020.root == null) {
      return not_found
    }else {
      return this__9020.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9021 = this;
  if(this__9021.edit) {
    return this__9021.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__9022 = this;
  var tcoll__9023 = this;
  if(this__9022.edit) {
    if(function() {
      var G__9024__9025 = o;
      if(G__9024__9025) {
        if(function() {
          var or__3943__auto____9026 = G__9024__9025.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3943__auto____9026) {
            return or__3943__auto____9026
          }else {
            return G__9024__9025.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__9024__9025.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9024__9025)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9024__9025)
      }
    }()) {
      return tcoll__9023.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__9027 = cljs.core.seq.call(null, o);
      var tcoll__9028 = tcoll__9023;
      while(true) {
        var temp__4090__auto____9029 = cljs.core.first.call(null, es__9027);
        if(cljs.core.truth_(temp__4090__auto____9029)) {
          var e__9030 = temp__4090__auto____9029;
          var G__9041 = cljs.core.next.call(null, es__9027);
          var G__9042 = tcoll__9028.assoc_BANG_(cljs.core.key.call(null, e__9030), cljs.core.val.call(null, e__9030));
          es__9027 = G__9041;
          tcoll__9028 = G__9042;
          continue
        }else {
          return tcoll__9028
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__9031 = this;
  var tcoll__9032 = this;
  if(this__9031.edit) {
    if(k == null) {
      if(this__9031.nil_val === v) {
      }else {
        this__9031.nil_val = v
      }
      if(this__9031.has_nil_QMARK_) {
      }else {
        this__9031.count = this__9031.count + 1;
        this__9031.has_nil_QMARK_ = true
      }
      return tcoll__9032
    }else {
      var added_leaf_QMARK___9033 = new cljs.core.Box(false);
      var node__9034 = (this__9031.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9031.root).inode_assoc_BANG_(this__9031.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9033);
      if(node__9034 === this__9031.root) {
      }else {
        this__9031.root = node__9034
      }
      if(added_leaf_QMARK___9033.val) {
        this__9031.count = this__9031.count + 1
      }else {
      }
      return tcoll__9032
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__9035 = this;
  var tcoll__9036 = this;
  if(this__9035.edit) {
    if(k == null) {
      if(this__9035.has_nil_QMARK_) {
        this__9035.has_nil_QMARK_ = false;
        this__9035.nil_val = null;
        this__9035.count = this__9035.count - 1;
        return tcoll__9036
      }else {
        return tcoll__9036
      }
    }else {
      if(this__9035.root == null) {
        return tcoll__9036
      }else {
        var removed_leaf_QMARK___9037 = new cljs.core.Box(false);
        var node__9038 = this__9035.root.inode_without_BANG_(this__9035.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___9037);
        if(node__9038 === this__9035.root) {
        }else {
          this__9035.root = node__9038
        }
        if(cljs.core.truth_(removed_leaf_QMARK___9037[0])) {
          this__9035.count = this__9035.count - 1
        }else {
        }
        return tcoll__9036
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__9039 = this;
  var tcoll__9040 = this;
  if(this__9039.edit) {
    this__9039.edit = null;
    return new cljs.core.PersistentHashMap(null, this__9039.count, this__9039.root, this__9039.has_nil_QMARK_, this__9039.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__9045 = node;
  var stack__9046 = stack;
  while(true) {
    if(!(t__9045 == null)) {
      var G__9047 = ascending_QMARK_ ? t__9045.left : t__9045.right;
      var G__9048 = cljs.core.conj.call(null, stack__9046, t__9045);
      t__9045 = G__9047;
      stack__9046 = G__9048;
      continue
    }else {
      return stack__9046
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9049 = this;
  var h__2087__auto____9050 = this__9049.__hash;
  if(!(h__2087__auto____9050 == null)) {
    return h__2087__auto____9050
  }else {
    var h__2087__auto____9051 = cljs.core.hash_coll.call(null, coll);
    this__9049.__hash = h__2087__auto____9051;
    return h__2087__auto____9051
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9052 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__9053 = this;
  var this__9054 = this;
  return cljs.core.pr_str.call(null, this__9054)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9055 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9056 = this;
  if(this__9056.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__9056.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__9057 = this;
  return cljs.core.peek.call(null, this__9057.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__9058 = this;
  var t__9059 = cljs.core.first.call(null, this__9058.stack);
  var next_stack__9060 = cljs.core.tree_map_seq_push.call(null, this__9058.ascending_QMARK_ ? t__9059.right : t__9059.left, cljs.core.next.call(null, this__9058.stack), this__9058.ascending_QMARK_);
  if(!(next_stack__9060 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__9060, this__9058.ascending_QMARK_, this__9058.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9061 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9062 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__9062.stack, this__9062.ascending_QMARK_, this__9062.cnt, this__9062.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9063 = this;
  return this__9063.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
void 0;
void 0;
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3941__auto____9065 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3941__auto____9065) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3941__auto____9065
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3941__auto____9067 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3941__auto____9067) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3941__auto____9067
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__9071 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__9071)) {
    return cljs.core.deref.call(null, init__9071)
  }else {
    var init__9072 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__9071) : init__9071;
    if(cljs.core.reduced_QMARK_.call(null, init__9072)) {
      return cljs.core.deref.call(null, init__9072)
    }else {
      var init__9073 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__9072) : init__9072;
      if(cljs.core.reduced_QMARK_.call(null, init__9073)) {
        return cljs.core.deref.call(null, init__9073)
      }else {
        return init__9073
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9076 = this;
  var h__2087__auto____9077 = this__9076.__hash;
  if(!(h__2087__auto____9077 == null)) {
    return h__2087__auto____9077
  }else {
    var h__2087__auto____9078 = cljs.core.hash_coll.call(null, coll);
    this__9076.__hash = h__2087__auto____9078;
    return h__2087__auto____9078
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9079 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9080 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9081 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9081.key, this__9081.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__9129 = null;
  var G__9129__2 = function(this_sym9082, k) {
    var this__9084 = this;
    var this_sym9082__9085 = this;
    var node__9086 = this_sym9082__9085;
    return node__9086.cljs$core$ILookup$_lookup$arity$2(node__9086, k)
  };
  var G__9129__3 = function(this_sym9083, k, not_found) {
    var this__9084 = this;
    var this_sym9083__9087 = this;
    var node__9088 = this_sym9083__9087;
    return node__9088.cljs$core$ILookup$_lookup$arity$3(node__9088, k, not_found)
  };
  G__9129 = function(this_sym9083, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9129__2.call(this, this_sym9083, k);
      case 3:
        return G__9129__3.call(this, this_sym9083, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9129
}();
cljs.core.BlackNode.prototype.apply = function(this_sym9074, args9075) {
  var this__9089 = this;
  return this_sym9074.call.apply(this_sym9074, [this_sym9074].concat(args9075.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9090 = this;
  return cljs.core.PersistentVector.fromArray([this__9090.key, this__9090.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9091 = this;
  return this__9091.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9092 = this;
  return this__9092.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__9093 = this;
  var node__9094 = this;
  return ins.balance_right(node__9094)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__9095 = this;
  var node__9096 = this;
  return new cljs.core.RedNode(this__9095.key, this__9095.val, this__9095.left, this__9095.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__9097 = this;
  var node__9098 = this;
  return cljs.core.balance_right_del.call(null, this__9097.key, this__9097.val, this__9097.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__9099 = this;
  var node__9100 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__9101 = this;
  var node__9102 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9102, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__9103 = this;
  var node__9104 = this;
  return cljs.core.balance_left_del.call(null, this__9103.key, this__9103.val, del, this__9103.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__9105 = this;
  var node__9106 = this;
  return ins.balance_left(node__9106)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__9107 = this;
  var node__9108 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__9108, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__9130 = null;
  var G__9130__0 = function() {
    var this__9109 = this;
    var this__9111 = this;
    return cljs.core.pr_str.call(null, this__9111)
  };
  G__9130 = function() {
    switch(arguments.length) {
      case 0:
        return G__9130__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9130
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__9112 = this;
  var node__9113 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9113, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__9114 = this;
  var node__9115 = this;
  return node__9115
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9116 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9117 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9118 = this;
  return cljs.core.list.call(null, this__9118.key, this__9118.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9119 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9120 = this;
  return this__9120.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9121 = this;
  return cljs.core.PersistentVector.fromArray([this__9121.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9122 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9122.key, this__9122.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9123 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9124 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9124.key, this__9124.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9125 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9126 = this;
  if(n === 0) {
    return this__9126.key
  }else {
    if(n === 1) {
      return this__9126.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__9127 = this;
  if(n === 0) {
    return this__9127.key
  }else {
    if(n === 1) {
      return this__9127.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__9128 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9133 = this;
  var h__2087__auto____9134 = this__9133.__hash;
  if(!(h__2087__auto____9134 == null)) {
    return h__2087__auto____9134
  }else {
    var h__2087__auto____9135 = cljs.core.hash_coll.call(null, coll);
    this__9133.__hash = h__2087__auto____9135;
    return h__2087__auto____9135
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9136 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9137 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9138 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9138.key, this__9138.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__9186 = null;
  var G__9186__2 = function(this_sym9139, k) {
    var this__9141 = this;
    var this_sym9139__9142 = this;
    var node__9143 = this_sym9139__9142;
    return node__9143.cljs$core$ILookup$_lookup$arity$2(node__9143, k)
  };
  var G__9186__3 = function(this_sym9140, k, not_found) {
    var this__9141 = this;
    var this_sym9140__9144 = this;
    var node__9145 = this_sym9140__9144;
    return node__9145.cljs$core$ILookup$_lookup$arity$3(node__9145, k, not_found)
  };
  G__9186 = function(this_sym9140, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9186__2.call(this, this_sym9140, k);
      case 3:
        return G__9186__3.call(this, this_sym9140, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9186
}();
cljs.core.RedNode.prototype.apply = function(this_sym9131, args9132) {
  var this__9146 = this;
  return this_sym9131.call.apply(this_sym9131, [this_sym9131].concat(args9132.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9147 = this;
  return cljs.core.PersistentVector.fromArray([this__9147.key, this__9147.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9148 = this;
  return this__9148.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9149 = this;
  return this__9149.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__9150 = this;
  var node__9151 = this;
  return new cljs.core.RedNode(this__9150.key, this__9150.val, this__9150.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__9152 = this;
  var node__9153 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__9154 = this;
  var node__9155 = this;
  return new cljs.core.RedNode(this__9154.key, this__9154.val, this__9154.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__9156 = this;
  var node__9157 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__9158 = this;
  var node__9159 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9159, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__9160 = this;
  var node__9161 = this;
  return new cljs.core.RedNode(this__9160.key, this__9160.val, del, this__9160.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__9162 = this;
  var node__9163 = this;
  return new cljs.core.RedNode(this__9162.key, this__9162.val, ins, this__9162.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__9164 = this;
  var node__9165 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9164.left)) {
    return new cljs.core.RedNode(this__9164.key, this__9164.val, this__9164.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__9164.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9164.right)) {
      return new cljs.core.RedNode(this__9164.right.key, this__9164.right.val, new cljs.core.BlackNode(this__9164.key, this__9164.val, this__9164.left, this__9164.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__9164.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__9165, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__9187 = null;
  var G__9187__0 = function() {
    var this__9166 = this;
    var this__9168 = this;
    return cljs.core.pr_str.call(null, this__9168)
  };
  G__9187 = function() {
    switch(arguments.length) {
      case 0:
        return G__9187__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9187
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__9169 = this;
  var node__9170 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9169.right)) {
    return new cljs.core.RedNode(this__9169.key, this__9169.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9169.left, null), this__9169.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9169.left)) {
      return new cljs.core.RedNode(this__9169.left.key, this__9169.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9169.left.left, null), new cljs.core.BlackNode(this__9169.key, this__9169.val, this__9169.left.right, this__9169.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9170, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__9171 = this;
  var node__9172 = this;
  return new cljs.core.BlackNode(this__9171.key, this__9171.val, this__9171.left, this__9171.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9173 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9174 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9175 = this;
  return cljs.core.list.call(null, this__9175.key, this__9175.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9176 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9177 = this;
  return this__9177.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9178 = this;
  return cljs.core.PersistentVector.fromArray([this__9178.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9179 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9179.key, this__9179.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9180 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9181 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9181.key, this__9181.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9182 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9183 = this;
  if(n === 0) {
    return this__9183.key
  }else {
    if(n === 1) {
      return this__9183.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__9184 = this;
  if(n === 0) {
    return this__9184.key
  }else {
    if(n === 1) {
      return this__9184.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__9185 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__9191 = comp.call(null, k, tree.key);
    if(c__9191 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__9191 < 0) {
        var ins__9192 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__9192 == null)) {
          return tree.add_left(ins__9192)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__9193 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__9193 == null)) {
            return tree.add_right(ins__9193)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__9196 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9196)) {
            return new cljs.core.RedNode(app__9196.key, app__9196.val, new cljs.core.RedNode(left.key, left.val, left.left, app__9196.left, null), new cljs.core.RedNode(right.key, right.val, app__9196.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__9196, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__9197 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9197)) {
              return new cljs.core.RedNode(app__9197.key, app__9197.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__9197.left, null), new cljs.core.BlackNode(right.key, right.val, app__9197.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__9197, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c__9203 = comp.call(null, k, tree.key);
    if(c__9203 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__9203 < 0) {
        var del__9204 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3943__auto____9205 = !(del__9204 == null);
          if(or__3943__auto____9205) {
            return or__3943__auto____9205
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__9204, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__9204, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__9206 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3943__auto____9207 = !(del__9206 == null);
            if(or__3943__auto____9207) {
              return or__3943__auto____9207
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__9206)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__9206, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__9210 = tree.key;
  var c__9211 = comp.call(null, k, tk__9210);
  if(c__9211 === 0) {
    return tree.replace(tk__9210, v, tree.left, tree.right)
  }else {
    if(c__9211 < 0) {
      return tree.replace(tk__9210, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__9210, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
void 0;
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9214 = this;
  var h__2087__auto____9215 = this__9214.__hash;
  if(!(h__2087__auto____9215 == null)) {
    return h__2087__auto____9215
  }else {
    var h__2087__auto____9216 = cljs.core.hash_imap.call(null, coll);
    this__9214.__hash = h__2087__auto____9216;
    return h__2087__auto____9216
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9217 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9218 = this;
  var n__9219 = coll.entry_at(k);
  if(!(n__9219 == null)) {
    return n__9219.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9220 = this;
  var found__9221 = [null];
  var t__9222 = cljs.core.tree_map_add.call(null, this__9220.comp, this__9220.tree, k, v, found__9221);
  if(t__9222 == null) {
    var found_node__9223 = cljs.core.nth.call(null, found__9221, 0);
    if(cljs.core._EQ_.call(null, v, found_node__9223.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9220.comp, cljs.core.tree_map_replace.call(null, this__9220.comp, this__9220.tree, k, v), this__9220.cnt, this__9220.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9220.comp, t__9222.blacken(), this__9220.cnt + 1, this__9220.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9224 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__9258 = null;
  var G__9258__2 = function(this_sym9225, k) {
    var this__9227 = this;
    var this_sym9225__9228 = this;
    var coll__9229 = this_sym9225__9228;
    return coll__9229.cljs$core$ILookup$_lookup$arity$2(coll__9229, k)
  };
  var G__9258__3 = function(this_sym9226, k, not_found) {
    var this__9227 = this;
    var this_sym9226__9230 = this;
    var coll__9231 = this_sym9226__9230;
    return coll__9231.cljs$core$ILookup$_lookup$arity$3(coll__9231, k, not_found)
  };
  G__9258 = function(this_sym9226, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9258__2.call(this, this_sym9226, k);
      case 3:
        return G__9258__3.call(this, this_sym9226, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9258
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym9212, args9213) {
  var this__9232 = this;
  return this_sym9212.call.apply(this_sym9212, [this_sym9212].concat(args9213.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9233 = this;
  if(!(this__9233.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__9233.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9234 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9235 = this;
  if(this__9235.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9235.tree, false, this__9235.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__9236 = this;
  var this__9237 = this;
  return cljs.core.pr_str.call(null, this__9237)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__9238 = this;
  var coll__9239 = this;
  var t__9240 = this__9238.tree;
  while(true) {
    if(!(t__9240 == null)) {
      var c__9241 = this__9238.comp.call(null, k, t__9240.key);
      if(c__9241 === 0) {
        return t__9240
      }else {
        if(c__9241 < 0) {
          var G__9259 = t__9240.left;
          t__9240 = G__9259;
          continue
        }else {
          if("\ufdd0'else") {
            var G__9260 = t__9240.right;
            t__9240 = G__9260;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9242 = this;
  if(this__9242.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9242.tree, ascending_QMARK_, this__9242.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9243 = this;
  if(this__9243.cnt > 0) {
    var stack__9244 = null;
    var t__9245 = this__9243.tree;
    while(true) {
      if(!(t__9245 == null)) {
        var c__9246 = this__9243.comp.call(null, k, t__9245.key);
        if(c__9246 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__9244, t__9245), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__9246 < 0) {
              var G__9261 = cljs.core.conj.call(null, stack__9244, t__9245);
              var G__9262 = t__9245.left;
              stack__9244 = G__9261;
              t__9245 = G__9262;
              continue
            }else {
              var G__9263 = stack__9244;
              var G__9264 = t__9245.right;
              stack__9244 = G__9263;
              t__9245 = G__9264;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__9246 > 0) {
                var G__9265 = cljs.core.conj.call(null, stack__9244, t__9245);
                var G__9266 = t__9245.right;
                stack__9244 = G__9265;
                t__9245 = G__9266;
                continue
              }else {
                var G__9267 = stack__9244;
                var G__9268 = t__9245.left;
                stack__9244 = G__9267;
                t__9245 = G__9268;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__9244 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__9244, ascending_QMARK_, -1, null)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9247 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9248 = this;
  return this__9248.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9249 = this;
  if(this__9249.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9249.tree, true, this__9249.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9250 = this;
  return this__9250.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9251 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9252 = this;
  return new cljs.core.PersistentTreeMap(this__9252.comp, this__9252.tree, this__9252.cnt, meta, this__9252.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9253 = this;
  return this__9253.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9254 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__9254.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9255 = this;
  var found__9256 = [null];
  var t__9257 = cljs.core.tree_map_remove.call(null, this__9255.comp, this__9255.tree, k, found__9256);
  if(t__9257 == null) {
    if(cljs.core.nth.call(null, found__9256, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9255.comp, null, 0, this__9255.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9255.comp, t__9257.blacken(), this__9255.cnt - 1, this__9255.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__9271 = cljs.core.seq.call(null, keyvals);
    var out__9272 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__9271) {
        var G__9273 = cljs.core.nnext.call(null, in__9271);
        var G__9274 = cljs.core.assoc_BANG_.call(null, out__9272, cljs.core.first.call(null, in__9271), cljs.core.second.call(null, in__9271));
        in__9271 = G__9273;
        out__9272 = G__9274;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__9272)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__9275) {
    var keyvals = cljs.core.seq(arglist__9275);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__9276) {
    var keyvals = cljs.core.seq(arglist__9276);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__9279 = cljs.core.seq.call(null, keyvals);
    var out__9280 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__9279) {
        var G__9281 = cljs.core.nnext.call(null, in__9279);
        var G__9282 = cljs.core.assoc.call(null, out__9280, cljs.core.first.call(null, in__9279), cljs.core.second.call(null, in__9279));
        in__9279 = G__9281;
        out__9280 = G__9282;
        continue
      }else {
        return out__9280
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__9283) {
    var keyvals = cljs.core.seq(arglist__9283);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__9286 = cljs.core.seq.call(null, keyvals);
    var out__9287 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__9286) {
        var G__9288 = cljs.core.nnext.call(null, in__9286);
        var G__9289 = cljs.core.assoc.call(null, out__9287, cljs.core.first.call(null, in__9286), cljs.core.second.call(null, in__9286));
        in__9286 = G__9288;
        out__9287 = G__9289;
        continue
      }else {
        return out__9287
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__9290) {
    var comparator = cljs.core.first(arglist__9290);
    var keyvals = cljs.core.rest(arglist__9290);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__9291_SHARP_, p2__9292_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3943__auto____9294 = p1__9291_SHARP_;
          if(cljs.core.truth_(or__3943__auto____9294)) {
            return or__3943__auto____9294
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__9292_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__9295) {
    var maps = cljs.core.seq(arglist__9295);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__9303 = function(m, e) {
        var k__9301 = cljs.core.first.call(null, e);
        var v__9302 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__9301)) {
          return cljs.core.assoc.call(null, m, k__9301, f.call(null, cljs.core._lookup.call(null, m, k__9301, null), v__9302))
        }else {
          return cljs.core.assoc.call(null, m, k__9301, v__9302)
        }
      };
      var merge2__9305 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__9303, function() {
          var or__3943__auto____9304 = m1;
          if(cljs.core.truth_(or__3943__auto____9304)) {
            return or__3943__auto____9304
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__9305, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__9306) {
    var f = cljs.core.first(arglist__9306);
    var maps = cljs.core.rest(arglist__9306);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__9311 = cljs.core.ObjMap.EMPTY;
  var keys__9312 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__9312) {
      var key__9313 = cljs.core.first.call(null, keys__9312);
      var entry__9314 = cljs.core._lookup.call(null, map, key__9313, "\ufdd0'user/not-found");
      var G__9315 = cljs.core.not_EQ_.call(null, entry__9314, "\ufdd0'user/not-found") ? cljs.core.assoc.call(null, ret__9311, key__9313, entry__9314) : ret__9311;
      var G__9316 = cljs.core.next.call(null, keys__9312);
      ret__9311 = G__9315;
      keys__9312 = G__9316;
      continue
    }else {
      return ret__9311
    }
    break
  }
};
void 0;
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9320 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__9320.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9321 = this;
  var h__2087__auto____9322 = this__9321.__hash;
  if(!(h__2087__auto____9322 == null)) {
    return h__2087__auto____9322
  }else {
    var h__2087__auto____9323 = cljs.core.hash_iset.call(null, coll);
    this__9321.__hash = h__2087__auto____9323;
    return h__2087__auto____9323
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9324 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9325 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9325.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__9346 = null;
  var G__9346__2 = function(this_sym9326, k) {
    var this__9328 = this;
    var this_sym9326__9329 = this;
    var coll__9330 = this_sym9326__9329;
    return coll__9330.cljs$core$ILookup$_lookup$arity$2(coll__9330, k)
  };
  var G__9346__3 = function(this_sym9327, k, not_found) {
    var this__9328 = this;
    var this_sym9327__9331 = this;
    var coll__9332 = this_sym9327__9331;
    return coll__9332.cljs$core$ILookup$_lookup$arity$3(coll__9332, k, not_found)
  };
  G__9346 = function(this_sym9327, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9346__2.call(this, this_sym9327, k);
      case 3:
        return G__9346__3.call(this, this_sym9327, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9346
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym9318, args9319) {
  var this__9333 = this;
  return this_sym9318.call.apply(this_sym9318, [this_sym9318].concat(args9319.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9334 = this;
  return new cljs.core.PersistentHashSet(this__9334.meta, cljs.core.assoc.call(null, this__9334.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__9335 = this;
  var this__9336 = this;
  return cljs.core.pr_str.call(null, this__9336)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9337 = this;
  return cljs.core.keys.call(null, this__9337.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9338 = this;
  return new cljs.core.PersistentHashSet(this__9338.meta, cljs.core.dissoc.call(null, this__9338.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9339 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9340 = this;
  var and__3941__auto____9341 = cljs.core.set_QMARK_.call(null, other);
  if(and__3941__auto____9341) {
    var and__3941__auto____9342 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3941__auto____9342) {
      return cljs.core.every_QMARK_.call(null, function(p1__9317_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9317_SHARP_)
      }, other)
    }else {
      return and__3941__auto____9342
    }
  }else {
    return and__3941__auto____9341
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9343 = this;
  return new cljs.core.PersistentHashSet(meta, this__9343.hash_map, this__9343.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9344 = this;
  return this__9344.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9345 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__9345.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 34
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__9364 = null;
  var G__9364__2 = function(this_sym9350, k) {
    var this__9352 = this;
    var this_sym9350__9353 = this;
    var tcoll__9354 = this_sym9350__9353;
    if(cljs.core._lookup.call(null, this__9352.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__9364__3 = function(this_sym9351, k, not_found) {
    var this__9352 = this;
    var this_sym9351__9355 = this;
    var tcoll__9356 = this_sym9351__9355;
    if(cljs.core._lookup.call(null, this__9352.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__9364 = function(this_sym9351, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9364__2.call(this, this_sym9351, k);
      case 3:
        return G__9364__3.call(this, this_sym9351, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9364
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym9348, args9349) {
  var this__9357 = this;
  return this_sym9348.call.apply(this_sym9348, [this_sym9348].concat(args9349.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__9358 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__9359 = this;
  if(cljs.core._lookup.call(null, this__9359.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__9360 = this;
  return cljs.core.count.call(null, this__9360.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__9361 = this;
  this__9361.transient_map = cljs.core.dissoc_BANG_.call(null, this__9361.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9362 = this;
  this__9362.transient_map = cljs.core.assoc_BANG_.call(null, this__9362.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9363 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__9363.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9367 = this;
  var h__2087__auto____9368 = this__9367.__hash;
  if(!(h__2087__auto____9368 == null)) {
    return h__2087__auto____9368
  }else {
    var h__2087__auto____9369 = cljs.core.hash_iset.call(null, coll);
    this__9367.__hash = h__2087__auto____9369;
    return h__2087__auto____9369
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9370 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9371 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9371.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__9397 = null;
  var G__9397__2 = function(this_sym9372, k) {
    var this__9374 = this;
    var this_sym9372__9375 = this;
    var coll__9376 = this_sym9372__9375;
    return coll__9376.cljs$core$ILookup$_lookup$arity$2(coll__9376, k)
  };
  var G__9397__3 = function(this_sym9373, k, not_found) {
    var this__9374 = this;
    var this_sym9373__9377 = this;
    var coll__9378 = this_sym9373__9377;
    return coll__9378.cljs$core$ILookup$_lookup$arity$3(coll__9378, k, not_found)
  };
  G__9397 = function(this_sym9373, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9397__2.call(this, this_sym9373, k);
      case 3:
        return G__9397__3.call(this, this_sym9373, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9397
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym9365, args9366) {
  var this__9379 = this;
  return this_sym9365.call.apply(this_sym9365, [this_sym9365].concat(args9366.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9380 = this;
  return new cljs.core.PersistentTreeSet(this__9380.meta, cljs.core.assoc.call(null, this__9380.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9381 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__9381.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__9382 = this;
  var this__9383 = this;
  return cljs.core.pr_str.call(null, this__9383)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9384 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__9384.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9385 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__9385.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9386 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9387 = this;
  return cljs.core._comparator.call(null, this__9387.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9388 = this;
  return cljs.core.keys.call(null, this__9388.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9389 = this;
  return new cljs.core.PersistentTreeSet(this__9389.meta, cljs.core.dissoc.call(null, this__9389.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9390 = this;
  return cljs.core.count.call(null, this__9390.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9391 = this;
  var and__3941__auto____9392 = cljs.core.set_QMARK_.call(null, other);
  if(and__3941__auto____9392) {
    var and__3941__auto____9393 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3941__auto____9393) {
      return cljs.core.every_QMARK_.call(null, function(p1__9347_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9347_SHARP_)
      }, other)
    }else {
      return and__3941__auto____9393
    }
  }else {
    return and__3941__auto____9392
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9394 = this;
  return new cljs.core.PersistentTreeSet(meta, this__9394.tree_map, this__9394.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9395 = this;
  return this__9395.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9396 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__9396.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.set = function set(coll) {
  var in__9400 = cljs.core.seq.call(null, coll);
  var out__9401 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(cljs.core.seq.call(null, in__9400)) {
      var G__9402 = cljs.core.next.call(null, in__9400);
      var G__9403 = cljs.core.conj_BANG_.call(null, out__9401, cljs.core.first.call(null, in__9400));
      in__9400 = G__9402;
      out__9401 = G__9403;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9401)
    }
    break
  }
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__9404) {
    var keys = cljs.core.seq(arglist__9404);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__9406) {
    var comparator = cljs.core.first(arglist__9406);
    var keys = cljs.core.rest(arglist__9406);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__9412 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__4090__auto____9413 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__4090__auto____9413)) {
        var e__9414 = temp__4090__auto____9413;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__9414))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__9412, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__9405_SHARP_) {
      var temp__4090__auto____9415 = cljs.core.find.call(null, smap, p1__9405_SHARP_);
      if(cljs.core.truth_(temp__4090__auto____9415)) {
        var e__9416 = temp__4090__auto____9415;
        return cljs.core.second.call(null, e__9416)
      }else {
        return p1__9405_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__9446 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__9439, seen) {
        while(true) {
          var vec__9440__9441 = p__9439;
          var f__9442 = cljs.core.nth.call(null, vec__9440__9441, 0, null);
          var xs__9443 = vec__9440__9441;
          var temp__4092__auto____9444 = cljs.core.seq.call(null, xs__9443);
          if(temp__4092__auto____9444) {
            var s__9445 = temp__4092__auto____9444;
            if(cljs.core.contains_QMARK_.call(null, seen, f__9442)) {
              var G__9447 = cljs.core.rest.call(null, s__9445);
              var G__9448 = seen;
              p__9439 = G__9447;
              seen = G__9448;
              continue
            }else {
              return cljs.core.cons.call(null, f__9442, step.call(null, cljs.core.rest.call(null, s__9445), cljs.core.conj.call(null, seen, f__9442)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__9446.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__9451 = cljs.core.PersistentVector.EMPTY;
  var s__9452 = s;
  while(true) {
    if(cljs.core.next.call(null, s__9452)) {
      var G__9453 = cljs.core.conj.call(null, ret__9451, cljs.core.first.call(null, s__9452));
      var G__9454 = cljs.core.next.call(null, s__9452);
      ret__9451 = G__9453;
      s__9452 = G__9454;
      continue
    }else {
      return cljs.core.seq.call(null, ret__9451)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3943__auto____9457 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3943__auto____9457) {
        return or__3943__auto____9457
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__9458 = x.lastIndexOf("/");
      if(i__9458 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__9458 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3943__auto____9461 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3943__auto____9461) {
      return or__3943__auto____9461
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__9462 = x.lastIndexOf("/");
    if(i__9462 > -1) {
      return cljs.core.subs.call(null, x, 2, i__9462)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__9469 = cljs.core.ObjMap.EMPTY;
  var ks__9470 = cljs.core.seq.call(null, keys);
  var vs__9471 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3941__auto____9472 = ks__9470;
      if(and__3941__auto____9472) {
        return vs__9471
      }else {
        return and__3941__auto____9472
      }
    }()) {
      var G__9473 = cljs.core.assoc.call(null, map__9469, cljs.core.first.call(null, ks__9470), cljs.core.first.call(null, vs__9471));
      var G__9474 = cljs.core.next.call(null, ks__9470);
      var G__9475 = cljs.core.next.call(null, vs__9471);
      map__9469 = G__9473;
      ks__9470 = G__9474;
      vs__9471 = G__9475;
      continue
    }else {
      return map__9469
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__9478__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9463_SHARP_, p2__9464_SHARP_) {
        return max_key.call(null, k, p1__9463_SHARP_, p2__9464_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__9478 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9478__delegate.call(this, k, x, y, more)
    };
    G__9478.cljs$lang$maxFixedArity = 3;
    G__9478.cljs$lang$applyTo = function(arglist__9479) {
      var k = cljs.core.first(arglist__9479);
      var x = cljs.core.first(cljs.core.next(arglist__9479));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9479)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9479)));
      return G__9478__delegate(k, x, y, more)
    };
    G__9478.cljs$lang$arity$variadic = G__9478__delegate;
    return G__9478
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__9480__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9476_SHARP_, p2__9477_SHARP_) {
        return min_key.call(null, k, p1__9476_SHARP_, p2__9477_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__9480 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9480__delegate.call(this, k, x, y, more)
    };
    G__9480.cljs$lang$maxFixedArity = 3;
    G__9480.cljs$lang$applyTo = function(arglist__9481) {
      var k = cljs.core.first(arglist__9481);
      var x = cljs.core.first(cljs.core.next(arglist__9481));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9481)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9481)));
      return G__9480__delegate(k, x, y, more)
    };
    G__9480.cljs$lang$arity$variadic = G__9480__delegate;
    return G__9480
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____9484 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____9484) {
        var s__9485 = temp__4092__auto____9484;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__9485), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__9485)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____9488 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____9488) {
      var s__9489 = temp__4092__auto____9488;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__9489)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__9489), take_while.call(null, pred, cljs.core.rest.call(null, s__9489)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__9491 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__9491.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__9503 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__4092__auto____9504 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__4092__auto____9504)) {
        var vec__9505__9506 = temp__4092__auto____9504;
        var e__9507 = cljs.core.nth.call(null, vec__9505__9506, 0, null);
        var s__9508 = vec__9505__9506;
        if(cljs.core.truth_(include__9503.call(null, e__9507))) {
          return s__9508
        }else {
          return cljs.core.next.call(null, s__9508)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9503, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__4092__auto____9509 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__4092__auto____9509)) {
      var vec__9510__9511 = temp__4092__auto____9509;
      var e__9512 = cljs.core.nth.call(null, vec__9510__9511, 0, null);
      var s__9513 = vec__9510__9511;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__9512)) ? s__9513 : cljs.core.next.call(null, s__9513))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__9525 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__4092__auto____9526 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__4092__auto____9526)) {
        var vec__9527__9528 = temp__4092__auto____9526;
        var e__9529 = cljs.core.nth.call(null, vec__9527__9528, 0, null);
        var s__9530 = vec__9527__9528;
        if(cljs.core.truth_(include__9525.call(null, e__9529))) {
          return s__9530
        }else {
          return cljs.core.next.call(null, s__9530)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9525, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__4092__auto____9531 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__4092__auto____9531)) {
      var vec__9532__9533 = temp__4092__auto____9531;
      var e__9534 = cljs.core.nth.call(null, vec__9532__9533, 0, null);
      var s__9535 = vec__9532__9533;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__9534)) ? s__9535 : cljs.core.next.call(null, s__9535))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__9536 = this;
  var h__2087__auto____9537 = this__9536.__hash;
  if(!(h__2087__auto____9537 == null)) {
    return h__2087__auto____9537
  }else {
    var h__2087__auto____9538 = cljs.core.hash_coll.call(null, rng);
    this__9536.__hash = h__2087__auto____9538;
    return h__2087__auto____9538
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__9539 = this;
  if(this__9539.step > 0) {
    if(this__9539.start + this__9539.step < this__9539.end) {
      return new cljs.core.Range(this__9539.meta, this__9539.start + this__9539.step, this__9539.end, this__9539.step, null)
    }else {
      return null
    }
  }else {
    if(this__9539.start + this__9539.step > this__9539.end) {
      return new cljs.core.Range(this__9539.meta, this__9539.start + this__9539.step, this__9539.end, this__9539.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__9540 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__9541 = this;
  var this__9542 = this;
  return cljs.core.pr_str.call(null, this__9542)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__9543 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__9544 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__9545 = this;
  if(this__9545.step > 0) {
    if(this__9545.start < this__9545.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__9545.start > this__9545.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__9546 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__9546.end - this__9546.start) / this__9546.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__9547 = this;
  return this__9547.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__9548 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__9548.meta, this__9548.start + this__9548.step, this__9548.end, this__9548.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__9549 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__9550 = this;
  return new cljs.core.Range(meta, this__9550.start, this__9550.end, this__9550.step, this__9550.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__9551 = this;
  return this__9551.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__9552 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9552.start + n * this__9552.step
  }else {
    if(function() {
      var and__3941__auto____9553 = this__9552.start > this__9552.end;
      if(and__3941__auto____9553) {
        return this__9552.step === 0
      }else {
        return and__3941__auto____9553
      }
    }()) {
      return this__9552.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__9554 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9554.start + n * this__9554.step
  }else {
    if(function() {
      var and__3941__auto____9555 = this__9554.start > this__9554.end;
      if(and__3941__auto____9555) {
        return this__9554.step === 0
      }else {
        return and__3941__auto____9555
      }
    }()) {
      return this__9554.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__9556 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9556.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____9559 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____9559) {
      var s__9560 = temp__4092__auto____9559;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__9560), take_nth.call(null, n, cljs.core.drop.call(null, n, s__9560)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____9567 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____9567) {
      var s__9568 = temp__4092__auto____9567;
      var fst__9569 = cljs.core.first.call(null, s__9568);
      var fv__9570 = f.call(null, fst__9569);
      var run__9571 = cljs.core.cons.call(null, fst__9569, cljs.core.take_while.call(null, function(p1__9561_SHARP_) {
        return cljs.core._EQ_.call(null, fv__9570, f.call(null, p1__9561_SHARP_))
      }, cljs.core.next.call(null, s__9568)));
      return cljs.core.cons.call(null, run__9571, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__9571), s__9568))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core._lookup.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4090__auto____9586 = cljs.core.seq.call(null, coll);
      if(temp__4090__auto____9586) {
        var s__9587 = temp__4090__auto____9586;
        return reductions.call(null, f, cljs.core.first.call(null, s__9587), cljs.core.rest.call(null, s__9587))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____9588 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____9588) {
        var s__9589 = temp__4092__auto____9588;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__9589)), cljs.core.rest.call(null, s__9589))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__9592 = null;
      var G__9592__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__9592__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__9592__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__9592__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__9592__4 = function() {
        var G__9593__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__9593 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9593__delegate.call(this, x, y, z, args)
        };
        G__9593.cljs$lang$maxFixedArity = 3;
        G__9593.cljs$lang$applyTo = function(arglist__9594) {
          var x = cljs.core.first(arglist__9594);
          var y = cljs.core.first(cljs.core.next(arglist__9594));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9594)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9594)));
          return G__9593__delegate(x, y, z, args)
        };
        G__9593.cljs$lang$arity$variadic = G__9593__delegate;
        return G__9593
      }();
      G__9592 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9592__0.call(this);
          case 1:
            return G__9592__1.call(this, x);
          case 2:
            return G__9592__2.call(this, x, y);
          case 3:
            return G__9592__3.call(this, x, y, z);
          default:
            return G__9592__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9592.cljs$lang$maxFixedArity = 3;
      G__9592.cljs$lang$applyTo = G__9592__4.cljs$lang$applyTo;
      return G__9592
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__9595 = null;
      var G__9595__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__9595__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__9595__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__9595__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__9595__4 = function() {
        var G__9596__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__9596 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9596__delegate.call(this, x, y, z, args)
        };
        G__9596.cljs$lang$maxFixedArity = 3;
        G__9596.cljs$lang$applyTo = function(arglist__9597) {
          var x = cljs.core.first(arglist__9597);
          var y = cljs.core.first(cljs.core.next(arglist__9597));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9597)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9597)));
          return G__9596__delegate(x, y, z, args)
        };
        G__9596.cljs$lang$arity$variadic = G__9596__delegate;
        return G__9596
      }();
      G__9595 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9595__0.call(this);
          case 1:
            return G__9595__1.call(this, x);
          case 2:
            return G__9595__2.call(this, x, y);
          case 3:
            return G__9595__3.call(this, x, y, z);
          default:
            return G__9595__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9595.cljs$lang$maxFixedArity = 3;
      G__9595.cljs$lang$applyTo = G__9595__4.cljs$lang$applyTo;
      return G__9595
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__9598 = null;
      var G__9598__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__9598__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__9598__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__9598__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__9598__4 = function() {
        var G__9599__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__9599 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9599__delegate.call(this, x, y, z, args)
        };
        G__9599.cljs$lang$maxFixedArity = 3;
        G__9599.cljs$lang$applyTo = function(arglist__9600) {
          var x = cljs.core.first(arglist__9600);
          var y = cljs.core.first(cljs.core.next(arglist__9600));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9600)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9600)));
          return G__9599__delegate(x, y, z, args)
        };
        G__9599.cljs$lang$arity$variadic = G__9599__delegate;
        return G__9599
      }();
      G__9598 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9598__0.call(this);
          case 1:
            return G__9598__1.call(this, x);
          case 2:
            return G__9598__2.call(this, x, y);
          case 3:
            return G__9598__3.call(this, x, y, z);
          default:
            return G__9598__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9598.cljs$lang$maxFixedArity = 3;
      G__9598.cljs$lang$applyTo = G__9598__4.cljs$lang$applyTo;
      return G__9598
    }()
  };
  var juxt__4 = function() {
    var G__9601__delegate = function(f, g, h, fs) {
      var fs__9591 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__9602 = null;
        var G__9602__0 = function() {
          return cljs.core.reduce.call(null, function(p1__9572_SHARP_, p2__9573_SHARP_) {
            return cljs.core.conj.call(null, p1__9572_SHARP_, p2__9573_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__9591)
        };
        var G__9602__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__9574_SHARP_, p2__9575_SHARP_) {
            return cljs.core.conj.call(null, p1__9574_SHARP_, p2__9575_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__9591)
        };
        var G__9602__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__9576_SHARP_, p2__9577_SHARP_) {
            return cljs.core.conj.call(null, p1__9576_SHARP_, p2__9577_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__9591)
        };
        var G__9602__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__9578_SHARP_, p2__9579_SHARP_) {
            return cljs.core.conj.call(null, p1__9578_SHARP_, p2__9579_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__9591)
        };
        var G__9602__4 = function() {
          var G__9603__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__9580_SHARP_, p2__9581_SHARP_) {
              return cljs.core.conj.call(null, p1__9580_SHARP_, cljs.core.apply.call(null, p2__9581_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__9591)
          };
          var G__9603 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__9603__delegate.call(this, x, y, z, args)
          };
          G__9603.cljs$lang$maxFixedArity = 3;
          G__9603.cljs$lang$applyTo = function(arglist__9604) {
            var x = cljs.core.first(arglist__9604);
            var y = cljs.core.first(cljs.core.next(arglist__9604));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9604)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9604)));
            return G__9603__delegate(x, y, z, args)
          };
          G__9603.cljs$lang$arity$variadic = G__9603__delegate;
          return G__9603
        }();
        G__9602 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__9602__0.call(this);
            case 1:
              return G__9602__1.call(this, x);
            case 2:
              return G__9602__2.call(this, x, y);
            case 3:
              return G__9602__3.call(this, x, y, z);
            default:
              return G__9602__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__9602.cljs$lang$maxFixedArity = 3;
        G__9602.cljs$lang$applyTo = G__9602__4.cljs$lang$applyTo;
        return G__9602
      }()
    };
    var G__9601 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9601__delegate.call(this, f, g, h, fs)
    };
    G__9601.cljs$lang$maxFixedArity = 3;
    G__9601.cljs$lang$applyTo = function(arglist__9605) {
      var f = cljs.core.first(arglist__9605);
      var g = cljs.core.first(cljs.core.next(arglist__9605));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9605)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9605)));
      return G__9601__delegate(f, g, h, fs)
    };
    G__9601.cljs$lang$arity$variadic = G__9601__delegate;
    return G__9601
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__9608 = cljs.core.next.call(null, coll);
        coll = G__9608;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3941__auto____9607 = cljs.core.seq.call(null, coll);
        if(and__3941__auto____9607) {
          return n > 0
        }else {
          return and__3941__auto____9607
        }
      }())) {
        var G__9609 = n - 1;
        var G__9610 = cljs.core.next.call(null, coll);
        n = G__9609;
        coll = G__9610;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches__9612 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__9612), s)) {
    if(cljs.core.count.call(null, matches__9612) === 1) {
      return cljs.core.first.call(null, matches__9612)
    }else {
      return cljs.core.vec.call(null, matches__9612)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__9614 = re.exec(s);
  if(matches__9614 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__9614) === 1) {
      return cljs.core.first.call(null, matches__9614)
    }else {
      return cljs.core.vec.call(null, matches__9614)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__9619 = cljs.core.re_find.call(null, re, s);
  var match_idx__9620 = s.search(re);
  var match_str__9621 = cljs.core.coll_QMARK_.call(null, match_data__9619) ? cljs.core.first.call(null, match_data__9619) : match_data__9619;
  var post_match__9622 = cljs.core.subs.call(null, s, match_idx__9620 + cljs.core.count.call(null, match_str__9621));
  if(cljs.core.truth_(match_data__9619)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__9619, re_seq.call(null, re, post_match__9622))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__9629__9630 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___9631 = cljs.core.nth.call(null, vec__9629__9630, 0, null);
  var flags__9632 = cljs.core.nth.call(null, vec__9629__9630, 1, null);
  var pattern__9633 = cljs.core.nth.call(null, vec__9629__9630, 2, null);
  return new RegExp(pattern__9633, flags__9632)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__9623_SHARP_) {
    return print_one.call(null, p1__9623_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end], true))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3941__auto____9643 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3941__auto____9643)) {
            var and__3941__auto____9647 = function() {
              var G__9644__9645 = obj;
              if(G__9644__9645) {
                if(function() {
                  var or__3943__auto____9646 = G__9644__9645.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3943__auto____9646) {
                    return or__3943__auto____9646
                  }else {
                    return G__9644__9645.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__9644__9645.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9644__9645)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9644__9645)
              }
            }();
            if(cljs.core.truth_(and__3941__auto____9647)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3941__auto____9647
            }
          }else {
            return and__3941__auto____9643
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3941__auto____9648 = !(obj == null);
          if(and__3941__auto____9648) {
            return obj.cljs$lang$type
          }else {
            return and__3941__auto____9648
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__9649__9650 = obj;
          if(G__9649__9650) {
            if(function() {
              var or__3943__auto____9651 = G__9649__9650.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3943__auto____9651) {
                return or__3943__auto____9651
              }else {
                return G__9649__9650.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__9649__9650.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9649__9650)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9649__9650)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var first_obj__9666 = cljs.core.first.call(null, objs);
  var sb__9667 = new goog.string.StringBuffer;
  var G__9668__9669 = cljs.core.seq.call(null, objs);
  if(G__9668__9669) {
    var obj__9670 = cljs.core.first.call(null, G__9668__9669);
    var G__9668__9671 = G__9668__9669;
    while(true) {
      if(obj__9670 === first_obj__9666) {
      }else {
        sb__9667.append(" ")
      }
      var G__9672__9673 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__9670, opts));
      if(G__9672__9673) {
        var string__9674 = cljs.core.first.call(null, G__9672__9673);
        var G__9672__9675 = G__9672__9673;
        while(true) {
          sb__9667.append(string__9674);
          var temp__4092__auto____9676 = cljs.core.next.call(null, G__9672__9675);
          if(temp__4092__auto____9676) {
            var G__9672__9677 = temp__4092__auto____9676;
            var G__9680 = cljs.core.first.call(null, G__9672__9677);
            var G__9681 = G__9672__9677;
            string__9674 = G__9680;
            G__9672__9675 = G__9681;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__4092__auto____9678 = cljs.core.next.call(null, G__9668__9671);
      if(temp__4092__auto____9678) {
        var G__9668__9679 = temp__4092__auto____9678;
        var G__9682 = cljs.core.first.call(null, G__9668__9679);
        var G__9683 = G__9668__9679;
        obj__9670 = G__9682;
        G__9668__9671 = G__9683;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__9667
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__9685 = cljs.core.pr_sb.call(null, objs, opts);
  sb__9685.append("\n");
  return[cljs.core.str(sb__9685)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__9699 = cljs.core.first.call(null, objs);
  var G__9700__9701 = cljs.core.seq.call(null, objs);
  if(G__9700__9701) {
    var obj__9702 = cljs.core.first.call(null, G__9700__9701);
    var G__9700__9703 = G__9700__9701;
    while(true) {
      if(obj__9702 === first_obj__9699) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__9704__9705 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__9702, opts));
      if(G__9704__9705) {
        var string__9706 = cljs.core.first.call(null, G__9704__9705);
        var G__9704__9707 = G__9704__9705;
        while(true) {
          cljs.core.string_print.call(null, string__9706);
          var temp__4092__auto____9708 = cljs.core.next.call(null, G__9704__9707);
          if(temp__4092__auto____9708) {
            var G__9704__9709 = temp__4092__auto____9708;
            var G__9712 = cljs.core.first.call(null, G__9704__9709);
            var G__9713 = G__9704__9709;
            string__9706 = G__9712;
            G__9704__9707 = G__9713;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__4092__auto____9710 = cljs.core.next.call(null, G__9700__9703);
      if(temp__4092__auto____9710) {
        var G__9700__9711 = temp__4092__auto____9710;
        var G__9714 = cljs.core.first.call(null, G__9700__9711);
        var G__9715 = G__9700__9711;
        obj__9702 = G__9714;
        G__9700__9703 = G__9715;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core._lookup.call(null, opts, "\ufdd0'flush-on-newline", null))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__9716) {
    var objs = cljs.core.seq(arglist__9716);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__9717) {
    var objs = cljs.core.seq(arglist__9717);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__9718) {
    var objs = cljs.core.seq(arglist__9718);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__9719) {
    var objs = cljs.core.seq(arglist__9719);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__9720) {
    var objs = cljs.core.seq(arglist__9720);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__9721) {
    var objs = cljs.core.seq(arglist__9721);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__9722) {
    var objs = cljs.core.seq(arglist__9722);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__9723) {
    var objs = cljs.core.seq(arglist__9723);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9724 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9724, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9725 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9725, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9726 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9726, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__4092__auto____9727 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__4092__auto____9727)) {
        var nspc__9728 = temp__4092__auto____9727;
        return[cljs.core.str(nspc__9728), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__4092__auto____9729 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__4092__auto____9729)) {
          var nspc__9730 = temp__4092__auto____9729;
          return[cljs.core.str(nspc__9730), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts)) ? goog.string.quote(obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9731 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9731, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintable$ = true;
Date.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(d, _) {
  var normalize__9733 = function(n, len) {
    var ns__9732 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__9732) < len) {
        var G__9735 = [cljs.core.str("0"), cljs.core.str(ns__9732)].join("");
        ns__9732 = G__9735;
        continue
      }else {
        return ns__9732
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__9733.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__9733.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__9733.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9733.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9733.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__9733.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9734 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9734, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2690809856
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__9736 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__9737 = this;
  var G__9738__9739 = cljs.core.seq.call(null, this__9737.watches);
  if(G__9738__9739) {
    var G__9741__9743 = cljs.core.first.call(null, G__9738__9739);
    var vec__9742__9744 = G__9741__9743;
    var key__9745 = cljs.core.nth.call(null, vec__9742__9744, 0, null);
    var f__9746 = cljs.core.nth.call(null, vec__9742__9744, 1, null);
    var G__9738__9747 = G__9738__9739;
    var G__9741__9748 = G__9741__9743;
    var G__9738__9749 = G__9738__9747;
    while(true) {
      var vec__9750__9751 = G__9741__9748;
      var key__9752 = cljs.core.nth.call(null, vec__9750__9751, 0, null);
      var f__9753 = cljs.core.nth.call(null, vec__9750__9751, 1, null);
      var G__9738__9754 = G__9738__9749;
      f__9753.call(null, key__9752, this$, oldval, newval);
      var temp__4092__auto____9755 = cljs.core.next.call(null, G__9738__9754);
      if(temp__4092__auto____9755) {
        var G__9738__9756 = temp__4092__auto____9755;
        var G__9763 = cljs.core.first.call(null, G__9738__9756);
        var G__9764 = G__9738__9756;
        G__9741__9748 = G__9763;
        G__9738__9749 = G__9764;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__9757 = this;
  return this$.watches = cljs.core.assoc.call(null, this__9757.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__9758 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__9758.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__9759 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__9759.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__9760 = this;
  return this__9760.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9761 = this;
  return this__9761.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__9762 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__9776__delegate = function(x, p__9765) {
      var map__9771__9772 = p__9765;
      var map__9771__9773 = cljs.core.seq_QMARK_.call(null, map__9771__9772) ? clojure.lang.PersistentHashMap.create.call(null, cljs.core.seq.call(null, map__9771__9772)) : map__9771__9772;
      var validator__9774 = cljs.core._lookup.call(null, map__9771__9773, "\ufdd0'validator", null);
      var meta__9775 = cljs.core._lookup.call(null, map__9771__9773, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__9775, validator__9774, null)
    };
    var G__9776 = function(x, var_args) {
      var p__9765 = null;
      if(goog.isDef(var_args)) {
        p__9765 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9776__delegate.call(this, x, p__9765)
    };
    G__9776.cljs$lang$maxFixedArity = 1;
    G__9776.cljs$lang$applyTo = function(arglist__9777) {
      var x = cljs.core.first(arglist__9777);
      var p__9765 = cljs.core.rest(arglist__9777);
      return G__9776__delegate(x, p__9765)
    };
    G__9776.cljs$lang$arity$variadic = G__9776__delegate;
    return G__9776
  }();
  atom = function(x, var_args) {
    var p__9765 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__4092__auto____9781 = a.validator;
  if(cljs.core.truth_(temp__4092__auto____9781)) {
    var validate__9782 = temp__4092__auto____9781;
    if(cljs.core.truth_(validate__9782.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6394, "\ufdd0'column", 13))))].join(""));
    }
  }else {
  }
  var old_value__9783 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__9783, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__9784__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__9784 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__9784__delegate.call(this, a, f, x, y, z, more)
    };
    G__9784.cljs$lang$maxFixedArity = 5;
    G__9784.cljs$lang$applyTo = function(arglist__9785) {
      var a = cljs.core.first(arglist__9785);
      var f = cljs.core.first(cljs.core.next(arglist__9785));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9785)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9785))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9785)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9785)))));
      return G__9784__delegate(a, f, x, y, z, more)
    };
    G__9784.cljs$lang$arity$variadic = G__9784__delegate;
    return G__9784
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__9786) {
    var iref = cljs.core.first(arglist__9786);
    var f = cljs.core.first(cljs.core.next(arglist__9786));
    var args = cljs.core.rest(cljs.core.next(arglist__9786));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073774592
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__9787 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__9787.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9788 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__9788.state, function(p__9789) {
    var map__9790__9791 = p__9789;
    var map__9790__9792 = cljs.core.seq_QMARK_.call(null, map__9790__9791) ? clojure.lang.PersistentHashMap.create.call(null, cljs.core.seq.call(null, map__9790__9791)) : map__9790__9791;
    var curr_state__9793 = map__9790__9792;
    var done__9794 = cljs.core._lookup.call(null, map__9790__9792, "\ufdd0'done", null);
    if(cljs.core.truth_(done__9794)) {
      return curr_state__9793
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__9788.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__9823__9824 = options;
    var map__9823__9825 = cljs.core.seq_QMARK_.call(null, map__9823__9824) ? clojure.lang.PersistentHashMap.create.call(null, cljs.core.seq.call(null, map__9823__9824)) : map__9823__9824;
    var keywordize_keys__9826 = cljs.core._lookup.call(null, map__9823__9825, "\ufdd0'keywordize-keys", null);
    var keyfn__9827 = cljs.core.truth_(keywordize_keys__9826) ? cljs.core.keyword : cljs.core.str;
    var f__9850 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray(x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
                var iter__2361__auto____9849 = function iter__9839(s__9840) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__9840__9845 = s__9840;
                    while(true) {
                      var temp__4092__auto____9846 = cljs.core.seq.call(null, s__9840__9845);
                      if(temp__4092__auto____9846) {
                        var xs__4579__auto____9847 = temp__4092__auto____9846;
                        var k__9848 = cljs.core.first.call(null, xs__4579__auto____9847);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__9827.call(null, k__9848), thisfn.call(null, x[k__9848])], true), iter__9839.call(null, cljs.core.rest.call(null, s__9840__9845)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2361__auto____9849.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__9850.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__9851) {
    var x = cljs.core.first(arglist__9851);
    var options = cljs.core.rest(arglist__9851);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__9856 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__9860__delegate = function(args) {
      var temp__4090__auto____9857 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__9856), args, null);
      if(cljs.core.truth_(temp__4090__auto____9857)) {
        var v__9858 = temp__4090__auto____9857;
        return v__9858
      }else {
        var ret__9859 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__9856, cljs.core.assoc, args, ret__9859);
        return ret__9859
      }
    };
    var G__9860 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9860__delegate.call(this, args)
    };
    G__9860.cljs$lang$maxFixedArity = 0;
    G__9860.cljs$lang$applyTo = function(arglist__9861) {
      var args = cljs.core.seq(arglist__9861);
      return G__9860__delegate(args)
    };
    G__9860.cljs$lang$arity$variadic = G__9860__delegate;
    return G__9860
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__9863 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__9863)) {
        var G__9864 = ret__9863;
        f = G__9864;
        continue
      }else {
        return ret__9863
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__9865__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__9865 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9865__delegate.call(this, f, args)
    };
    G__9865.cljs$lang$maxFixedArity = 1;
    G__9865.cljs$lang$applyTo = function(arglist__9866) {
      var f = cljs.core.first(arglist__9866);
      var args = cljs.core.rest(arglist__9866);
      return G__9865__delegate(f, args)
    };
    G__9865.cljs$lang$arity$variadic = G__9865__delegate;
    return G__9865
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random.call(null) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.call(null, Math.random.call(null) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__9868 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__9868, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__9868, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.EMPTY, "\ufdd0'descendants":cljs.core.ObjMap.EMPTY, "\ufdd0'ancestors":cljs.core.ObjMap.EMPTY})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3943__auto____9877 = cljs.core._EQ_.call(null, child, parent);
    if(or__3943__auto____9877) {
      return or__3943__auto____9877
    }else {
      var or__3943__auto____9878 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3943__auto____9878) {
        return or__3943__auto____9878
      }else {
        var and__3941__auto____9879 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3941__auto____9879) {
          var and__3941__auto____9880 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3941__auto____9880) {
            var and__3941__auto____9881 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3941__auto____9881) {
              var ret__9882 = true;
              var i__9883 = 0;
              while(true) {
                if(function() {
                  var or__3943__auto____9884 = cljs.core.not.call(null, ret__9882);
                  if(or__3943__auto____9884) {
                    return or__3943__auto____9884
                  }else {
                    return i__9883 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__9882
                }else {
                  var G__9885 = isa_QMARK_.call(null, h, child.call(null, i__9883), parent.call(null, i__9883));
                  var G__9886 = i__9883 + 1;
                  ret__9882 = G__9885;
                  i__9883 = G__9886;
                  continue
                }
                break
              }
            }else {
              return and__3941__auto____9881
            }
          }else {
            return and__3941__auto____9880
          }
        }else {
          return and__3941__auto____9879
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, null))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, null))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), tag, null))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6678, "\ufdd0'column", 12))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6682, "\ufdd0'column", 12))))].join(""));
    }
    var tp__9895 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__9896 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__9897 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__9898 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3943__auto____9899 = cljs.core.contains_QMARK_.call(null, tp__9895.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__9897.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__9897.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__9895, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__9898.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__9896, parent, ta__9897), "\ufdd0'descendants":tf__9898.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, 
      h), parent, ta__9897, tag, td__9896)})
    }();
    if(cljs.core.truth_(or__3943__auto____9899)) {
      return or__3943__auto____9899
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__9904 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__9905 = cljs.core.truth_(parentMap__9904.call(null, tag)) ? cljs.core.disj.call(null, parentMap__9904.call(null, tag), parent) : cljs.core.set([]);
    var newParents__9906 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__9905)) ? cljs.core.assoc.call(null, parentMap__9904, tag, childsParents__9905) : cljs.core.dissoc.call(null, parentMap__9904, tag);
    var deriv_seq__9907 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__9887_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__9887_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__9887_SHARP_), cljs.core.second.call(null, p1__9887_SHARP_)))
    }, cljs.core.seq.call(null, newParents__9906)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__9904.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__9888_SHARP_, p2__9889_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__9888_SHARP_, p2__9889_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__9907))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__9915 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3943__auto____9917 = cljs.core.truth_(function() {
    var and__3941__auto____9916 = xprefs__9915;
    if(cljs.core.truth_(and__3941__auto____9916)) {
      return xprefs__9915.call(null, y)
    }else {
      return and__3941__auto____9916
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3943__auto____9917)) {
    return or__3943__auto____9917
  }else {
    var or__3943__auto____9919 = function() {
      var ps__9918 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__9918) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__9918), prefer_table))) {
          }else {
          }
          var G__9922 = cljs.core.rest.call(null, ps__9918);
          ps__9918 = G__9922;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3943__auto____9919)) {
      return or__3943__auto____9919
    }else {
      var or__3943__auto____9921 = function() {
        var ps__9920 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__9920) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__9920), y, prefer_table))) {
            }else {
            }
            var G__9923 = cljs.core.rest.call(null, ps__9920);
            ps__9920 = G__9923;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3943__auto____9921)) {
        return or__3943__auto____9921
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3943__auto____9925 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3943__auto____9925)) {
    return or__3943__auto____9925
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__9943 = cljs.core.reduce.call(null, function(be, p__9935) {
    var vec__9936__9937 = p__9935;
    var k__9938 = cljs.core.nth.call(null, vec__9936__9937, 0, null);
    var ___9939 = cljs.core.nth.call(null, vec__9936__9937, 1, null);
    var e__9940 = vec__9936__9937;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__9938)) {
      var be2__9942 = cljs.core.truth_(function() {
        var or__3943__auto____9941 = be == null;
        if(or__3943__auto____9941) {
          return or__3943__auto____9941
        }else {
          return cljs.core.dominates.call(null, k__9938, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__9940 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__9942), k__9938, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__9938), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__9942)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__9942
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__9943)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__9943));
      return cljs.core.second.call(null, best_entry__9943)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
void 0;
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3941__auto____9947 = mf;
    if(and__3941__auto____9947) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3941__auto____9947
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    return function() {
      var or__3943__auto____9948 = cljs.core._reset[goog.typeOf(mf)];
      if(or__3943__auto____9948) {
        return or__3943__auto____9948
      }else {
        var or__3943__auto____9949 = cljs.core._reset["_"];
        if(or__3943__auto____9949) {
          return or__3943__auto____9949
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3941__auto____9953 = mf;
    if(and__3941__auto____9953) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3941__auto____9953
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3943__auto____9954 = cljs.core._add_method[goog.typeOf(mf)];
      if(or__3943__auto____9954) {
        return or__3943__auto____9954
      }else {
        var or__3943__auto____9955 = cljs.core._add_method["_"];
        if(or__3943__auto____9955) {
          return or__3943__auto____9955
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3941__auto____9959 = mf;
    if(and__3941__auto____9959) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3941__auto____9959
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3943__auto____9960 = cljs.core._remove_method[goog.typeOf(mf)];
      if(or__3943__auto____9960) {
        return or__3943__auto____9960
      }else {
        var or__3943__auto____9961 = cljs.core._remove_method["_"];
        if(or__3943__auto____9961) {
          return or__3943__auto____9961
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3941__auto____9965 = mf;
    if(and__3941__auto____9965) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3941__auto____9965
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3943__auto____9966 = cljs.core._prefer_method[goog.typeOf(mf)];
      if(or__3943__auto____9966) {
        return or__3943__auto____9966
      }else {
        var or__3943__auto____9967 = cljs.core._prefer_method["_"];
        if(or__3943__auto____9967) {
          return or__3943__auto____9967
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3941__auto____9971 = mf;
    if(and__3941__auto____9971) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3941__auto____9971
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3943__auto____9972 = cljs.core._get_method[goog.typeOf(mf)];
      if(or__3943__auto____9972) {
        return or__3943__auto____9972
      }else {
        var or__3943__auto____9973 = cljs.core._get_method["_"];
        if(or__3943__auto____9973) {
          return or__3943__auto____9973
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3941__auto____9977 = mf;
    if(and__3941__auto____9977) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3941__auto____9977
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    return function() {
      var or__3943__auto____9978 = cljs.core._methods[goog.typeOf(mf)];
      if(or__3943__auto____9978) {
        return or__3943__auto____9978
      }else {
        var or__3943__auto____9979 = cljs.core._methods["_"];
        if(or__3943__auto____9979) {
          return or__3943__auto____9979
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3941__auto____9983 = mf;
    if(and__3941__auto____9983) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3941__auto____9983
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    return function() {
      var or__3943__auto____9984 = cljs.core._prefers[goog.typeOf(mf)];
      if(or__3943__auto____9984) {
        return or__3943__auto____9984
      }else {
        var or__3943__auto____9985 = cljs.core._prefers["_"];
        if(or__3943__auto____9985) {
          return or__3943__auto____9985
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3941__auto____9989 = mf;
    if(and__3941__auto____9989) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3941__auto____9989
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    return function() {
      var or__3943__auto____9990 = cljs.core._dispatch[goog.typeOf(mf)];
      if(or__3943__auto____9990) {
        return or__3943__auto____9990
      }else {
        var or__3943__auto____9991 = cljs.core._dispatch["_"];
        if(or__3943__auto____9991) {
          return or__3943__auto____9991
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
void 0;
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__9994 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__9995 = cljs.core._get_method.call(null, mf, dispatch_val__9994);
  if(cljs.core.truth_(target_fn__9995)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__9994)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__9995, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 64
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__9996 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__9997 = this;
  cljs.core.swap_BANG_.call(null, this__9997.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__9997.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__9997.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__9997.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__9998 = this;
  cljs.core.swap_BANG_.call(null, this__9998.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__9998.method_cache, this__9998.method_table, this__9998.cached_hierarchy, this__9998.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__9999 = this;
  cljs.core.swap_BANG_.call(null, this__9999.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__9999.method_cache, this__9999.method_table, this__9999.cached_hierarchy, this__9999.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__10000 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__10000.cached_hierarchy), cljs.core.deref.call(null, this__10000.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__10000.method_cache, this__10000.method_table, this__10000.cached_hierarchy, this__10000.hierarchy)
  }
  var temp__4090__auto____10001 = cljs.core.deref.call(null, this__10000.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__4090__auto____10001)) {
    var target_fn__10002 = temp__4090__auto____10001;
    return target_fn__10002
  }else {
    var temp__4090__auto____10003 = cljs.core.find_and_cache_best_method.call(null, this__10000.name, dispatch_val, this__10000.hierarchy, this__10000.method_table, this__10000.prefer_table, this__10000.method_cache, this__10000.cached_hierarchy);
    if(cljs.core.truth_(temp__4090__auto____10003)) {
      var target_fn__10004 = temp__4090__auto____10003;
      return target_fn__10004
    }else {
      return cljs.core.deref.call(null, this__10000.method_table).call(null, this__10000.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__10005 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__10005.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__10005.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__10005.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__10005.method_cache, this__10005.method_table, this__10005.cached_hierarchy, this__10005.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__10006 = this;
  return cljs.core.deref.call(null, this__10006.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__10007 = this;
  return cljs.core.deref.call(null, this__10007.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__10008 = this;
  return cljs.core.do_dispatch.call(null, mf, this__10008.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__10010__delegate = function(_, args) {
    var self__10009 = this;
    return cljs.core._dispatch.call(null, self__10009, args)
  };
  var G__10010 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__10010__delegate.call(this, _, args)
  };
  G__10010.cljs$lang$maxFixedArity = 1;
  G__10010.cljs$lang$applyTo = function(arglist__10011) {
    var _ = cljs.core.first(arglist__10011);
    var args = cljs.core.rest(arglist__10011);
    return G__10010__delegate(_, args)
  };
  G__10010.cljs$lang$arity$variadic = G__10010__delegate;
  return G__10010
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__10012 = this;
  return cljs.core._dispatch.call(null, self__10012, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 543162368
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10013 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_10015, _) {
  var this__10014 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__10014.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__10016 = this;
  return this__10016.uuid === other.uuid
};
cljs.core.UUID.prototype.toString = function() {
  var this__10017 = this;
  var this__10018 = this;
  return cljs.core.pr_str.call(null, this__10018)
};
cljs.core.UUID;
goog.provide("goog.userAgent");
goog.require("goog.string");
goog.userAgent.ASSUME_IE = false;
goog.userAgent.ASSUME_GECKO = false;
goog.userAgent.ASSUME_WEBKIT = false;
goog.userAgent.ASSUME_MOBILE_WEBKIT = false;
goog.userAgent.ASSUME_OPERA = false;
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
goog.userAgent.getUserAgentString = function() {
  return goog.global["navigator"] ? goog.global["navigator"].userAgent : null
};
goog.userAgent.getNavigator = function() {
  return goog.global["navigator"]
};
goog.userAgent.init_ = function() {
  goog.userAgent.detectedOpera_ = false;
  goog.userAgent.detectedIe_ = false;
  goog.userAgent.detectedWebkit_ = false;
  goog.userAgent.detectedMobile_ = false;
  goog.userAgent.detectedGecko_ = false;
  var ua;
  if(!goog.userAgent.BROWSER_KNOWN_ && (ua = goog.userAgent.getUserAgentString())) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = ua.indexOf("Opera") == 0;
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ && ua.indexOf("MSIE") != -1;
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ && ua.indexOf("WebKit") != -1;
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ && ua.indexOf("Mobile") != -1;
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ && !goog.userAgent.detectedWebkit_ && navigator.product == "Gecko"
  }
};
if(!goog.userAgent.BROWSER_KNOWN_) {
  goog.userAgent.init_()
}
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.userAgent.detectedGecko_;
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.userAgent.detectedWebkit_;
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.detectedMobile_;
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || ""
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.userAgent.ASSUME_MAC = false;
goog.userAgent.ASSUME_WINDOWS = false;
goog.userAgent.ASSUME_LINUX = false;
goog.userAgent.ASSUME_X11 = false;
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11;
goog.userAgent.initPlatform_ = function() {
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM, "Mac");
  goog.userAgent.detectedWindows_ = goog.string.contains(goog.userAgent.PLATFORM, "Win");
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM, "Linux");
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() && goog.string.contains(goog.userAgent.getNavigator()["appVersion"] || "", "X11")
};
if(!goog.userAgent.PLATFORM_KNOWN_) {
  goog.userAgent.initPlatform_()
}
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;
goog.userAgent.determineVersion_ = function() {
  var version = "", re;
  if(goog.userAgent.OPERA && goog.global["opera"]) {
    var operaVersion = goog.global["opera"].version;
    version = typeof operaVersion == "function" ? operaVersion() : operaVersion
  }else {
    if(goog.userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/
    }else {
      if(goog.userAgent.IE) {
        re = /MSIE\s+([^\);]+)(\)|;)/
      }else {
        if(goog.userAgent.WEBKIT) {
          re = /WebKit\/(\S+)/
        }
      }
    }
    if(re) {
      var arr = re.exec(goog.userAgent.getUserAgentString());
      version = arr ? arr[1] : ""
    }
  }
  if(goog.userAgent.IE) {
    var docMode = goog.userAgent.getDocumentMode_();
    if(docMode > parseFloat(version)) {
      return String(docMode)
    }
  }
  return version
};
goog.userAgent.getDocumentMode_ = function() {
  var doc = goog.global["document"];
  return doc ? doc["documentMode"] : undefined
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2)
};
goog.userAgent.isVersionCache_ = {};
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.isVersionCache_[version] || (goog.userAgent.isVersionCache_[version] = goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0)
};
goog.provide("goog.events.EventType");
goog.require("goog.userAgent");
goog.events.EventType = {CLICK:"click", DBLCLICK:"dblclick", MOUSEDOWN:"mousedown", MOUSEUP:"mouseup", MOUSEOVER:"mouseover", MOUSEOUT:"mouseout", MOUSEMOVE:"mousemove", SELECTSTART:"selectstart", KEYPRESS:"keypress", KEYDOWN:"keydown", KEYUP:"keyup", BLUR:"blur", FOCUS:"focus", DEACTIVATE:"deactivate", FOCUSIN:goog.userAgent.IE ? "focusin" : "DOMFocusIn", FOCUSOUT:goog.userAgent.IE ? "focusout" : "DOMFocusOut", CHANGE:"change", SELECT:"select", SUBMIT:"submit", INPUT:"input", PROPERTYCHANGE:"propertychange", 
DRAGSTART:"dragstart", DRAGENTER:"dragenter", DRAGOVER:"dragover", DRAGLEAVE:"dragleave", DROP:"drop", TOUCHSTART:"touchstart", TOUCHMOVE:"touchmove", TOUCHEND:"touchend", TOUCHCANCEL:"touchcancel", CONTEXTMENU:"contextmenu", ERROR:"error", HELP:"help", LOAD:"load", LOSECAPTURE:"losecapture", READYSTATECHANGE:"readystatechange", RESIZE:"resize", SCROLL:"scroll", UNLOAD:"unload", HASHCHANGE:"hashchange", PAGEHIDE:"pagehide", PAGESHOW:"pageshow", POPSTATE:"popstate", COPY:"copy", PASTE:"paste", CUT:"cut", 
MESSAGE:"message", CONNECT:"connect"};
goog.provide("goog.disposable.IDisposable");
goog.disposable.IDisposable = function() {
};
goog.disposable.IDisposable.prototype.dispose;
goog.disposable.IDisposable.prototype.isDisposed;
goog.provide("goog.Disposable");
goog.provide("goog.dispose");
goog.require("goog.disposable.IDisposable");
goog.Disposable = function() {
  if(goog.Disposable.ENABLE_MONITORING) {
    goog.Disposable.instances_[goog.getUid(this)] = this
  }
};
goog.Disposable.ENABLE_MONITORING = false;
goog.Disposable.instances_ = {};
goog.Disposable.getUndisposedObjects = function() {
  var ret = [];
  for(var id in goog.Disposable.instances_) {
    if(goog.Disposable.instances_.hasOwnProperty(id)) {
      ret.push(goog.Disposable.instances_[Number(id)])
    }
  }
  return ret
};
goog.Disposable.clearUndisposedObjects = function() {
  goog.Disposable.instances_ = {}
};
goog.Disposable.prototype.disposed_ = false;
goog.Disposable.prototype.isDisposed = function() {
  return this.disposed_
};
goog.Disposable.prototype.getDisposed = goog.Disposable.prototype.isDisposed;
goog.Disposable.prototype.dispose = function() {
  if(!this.disposed_) {
    this.disposed_ = true;
    this.disposeInternal();
    if(goog.Disposable.ENABLE_MONITORING) {
      var uid = goog.getUid(this);
      if(!goog.Disposable.instances_.hasOwnProperty(uid)) {
        throw Error(this + " did not call the goog.Disposable base " + "constructor or was disposed of after a clearUndisposedObjects " + "call");
      }
      delete goog.Disposable.instances_[uid]
    }
  }
};
goog.Disposable.prototype.disposeInternal = function() {
};
goog.dispose = function(obj) {
  if(obj && typeof obj.dispose == "function") {
    obj.dispose()
  }
};
goog.provide("goog.debug.EntryPointMonitor");
goog.provide("goog.debug.entryPointRegistry");
goog.debug.EntryPointMonitor = function() {
};
goog.debug.EntryPointMonitor.prototype.wrap;
goog.debug.EntryPointMonitor.prototype.unwrap;
goog.debug.entryPointRegistry.refList_ = [];
goog.debug.entryPointRegistry.register = function(callback) {
  goog.debug.entryPointRegistry.refList_[goog.debug.entryPointRegistry.refList_.length] = callback
};
goog.debug.entryPointRegistry.monitorAll = function(monitor) {
  var transformer = goog.bind(monitor.wrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
};
goog.debug.entryPointRegistry.unmonitorAllIfPossible = function(monitor) {
  var transformer = goog.bind(monitor.unwrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
};
goog.provide("goog.debug.errorHandlerWeakDep");
goog.debug.errorHandlerWeakDep = {protectEntryPoint:function(fn, opt_tracers) {
  return fn
}};
goog.provide("goog.events.BrowserFeature");
goog.require("goog.userAgent");
goog.events.BrowserFeature = {HAS_W3C_BUTTON:!goog.userAgent.IE || goog.userAgent.isVersion("9"), SET_KEY_CODE_TO_PREVENT_DEFAULT:goog.userAgent.IE && !goog.userAgent.isVersion("8")};
goog.provide("goog.events.Event");
goog.require("goog.Disposable");
goog.events.Event = function(type, opt_target) {
  goog.Disposable.call(this);
  this.type = type;
  this.target = opt_target;
  this.currentTarget = this.target
};
goog.inherits(goog.events.Event, goog.Disposable);
goog.events.Event.prototype.disposeInternal = function() {
  delete this.type;
  delete this.target;
  delete this.currentTarget
};
goog.events.Event.prototype.propagationStopped_ = false;
goog.events.Event.prototype.returnValue_ = true;
goog.events.Event.prototype.stopPropagation = function() {
  this.propagationStopped_ = true
};
goog.events.Event.prototype.preventDefault = function() {
  this.returnValue_ = false
};
goog.events.Event.stopPropagation = function(e) {
  e.stopPropagation()
};
goog.events.Event.preventDefault = function(e) {
  e.preventDefault()
};
goog.provide("goog.reflect");
goog.reflect.object = function(type, object) {
  return object
};
goog.reflect.sinkValue = new Function("a", "return a");
goog.provide("goog.events.BrowserEvent");
goog.provide("goog.events.BrowserEvent.MouseButton");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Event");
goog.require("goog.events.EventType");
goog.require("goog.reflect");
goog.require("goog.userAgent");
goog.events.BrowserEvent = function(opt_e, opt_currentTarget) {
  if(opt_e) {
    this.init(opt_e, opt_currentTarget)
  }
};
goog.inherits(goog.events.BrowserEvent, goog.events.Event);
goog.events.BrowserEvent.MouseButton = {LEFT:0, MIDDLE:1, RIGHT:2};
goog.events.BrowserEvent.IEButtonMap = [1, 4, 2];
goog.events.BrowserEvent.prototype.target = null;
goog.events.BrowserEvent.prototype.currentTarget;
goog.events.BrowserEvent.prototype.relatedTarget = null;
goog.events.BrowserEvent.prototype.offsetX = 0;
goog.events.BrowserEvent.prototype.offsetY = 0;
goog.events.BrowserEvent.prototype.clientX = 0;
goog.events.BrowserEvent.prototype.clientY = 0;
goog.events.BrowserEvent.prototype.screenX = 0;
goog.events.BrowserEvent.prototype.screenY = 0;
goog.events.BrowserEvent.prototype.button = 0;
goog.events.BrowserEvent.prototype.keyCode = 0;
goog.events.BrowserEvent.prototype.charCode = 0;
goog.events.BrowserEvent.prototype.ctrlKey = false;
goog.events.BrowserEvent.prototype.altKey = false;
goog.events.BrowserEvent.prototype.shiftKey = false;
goog.events.BrowserEvent.prototype.metaKey = false;
goog.events.BrowserEvent.prototype.state;
goog.events.BrowserEvent.prototype.platformModifierKey = false;
goog.events.BrowserEvent.prototype.event_ = null;
goog.events.BrowserEvent.prototype.init = function(e, opt_currentTarget) {
  var type = this.type = e.type;
  goog.events.Event.call(this, type);
  this.target = e.target || e.srcElement;
  this.currentTarget = opt_currentTarget;
  var relatedTarget = e.relatedTarget;
  if(relatedTarget) {
    if(goog.userAgent.GECKO) {
      try {
        goog.reflect.sinkValue(relatedTarget.nodeName)
      }catch(err) {
        relatedTarget = null
      }
    }
  }else {
    if(type == goog.events.EventType.MOUSEOVER) {
      relatedTarget = e.fromElement
    }else {
      if(type == goog.events.EventType.MOUSEOUT) {
        relatedTarget = e.toElement
      }
    }
  }
  this.relatedTarget = relatedTarget;
  this.offsetX = e.offsetX !== undefined ? e.offsetX : e.layerX;
  this.offsetY = e.offsetY !== undefined ? e.offsetY : e.layerY;
  this.clientX = e.clientX !== undefined ? e.clientX : e.pageX;
  this.clientY = e.clientY !== undefined ? e.clientY : e.pageY;
  this.screenX = e.screenX || 0;
  this.screenY = e.screenY || 0;
  this.button = e.button;
  this.keyCode = e.keyCode || 0;
  this.charCode = e.charCode || (type == "keypress" ? e.keyCode : 0);
  this.ctrlKey = e.ctrlKey;
  this.altKey = e.altKey;
  this.shiftKey = e.shiftKey;
  this.metaKey = e.metaKey;
  this.platformModifierKey = goog.userAgent.MAC ? e.metaKey : e.ctrlKey;
  this.state = e.state;
  this.event_ = e;
  delete this.returnValue_;
  delete this.propagationStopped_
};
goog.events.BrowserEvent.prototype.isButton = function(button) {
  if(!goog.events.BrowserFeature.HAS_W3C_BUTTON) {
    if(this.type == "click") {
      return button == goog.events.BrowserEvent.MouseButton.LEFT
    }else {
      return!!(this.event_.button & goog.events.BrowserEvent.IEButtonMap[button])
    }
  }else {
    return this.event_.button == button
  }
};
goog.events.BrowserEvent.prototype.isMouseActionButton = function() {
  return this.isButton(goog.events.BrowserEvent.MouseButton.LEFT) && !(goog.userAgent.WEBKIT && goog.userAgent.MAC && this.ctrlKey)
};
goog.events.BrowserEvent.prototype.stopPropagation = function() {
  goog.events.BrowserEvent.superClass_.stopPropagation.call(this);
  if(this.event_.stopPropagation) {
    this.event_.stopPropagation()
  }else {
    this.event_.cancelBubble = true
  }
};
goog.events.BrowserEvent.prototype.preventDefault = function() {
  goog.events.BrowserEvent.superClass_.preventDefault.call(this);
  var be = this.event_;
  if(!be.preventDefault) {
    be.returnValue = false;
    if(goog.events.BrowserFeature.SET_KEY_CODE_TO_PREVENT_DEFAULT) {
      try {
        var VK_F1 = 112;
        var VK_F12 = 123;
        if(be.ctrlKey || be.keyCode >= VK_F1 && be.keyCode <= VK_F12) {
          be.keyCode = -1
        }
      }catch(ex) {
      }
    }
  }else {
    be.preventDefault()
  }
};
goog.events.BrowserEvent.prototype.getBrowserEvent = function() {
  return this.event_
};
goog.events.BrowserEvent.prototype.disposeInternal = function() {
  goog.events.BrowserEvent.superClass_.disposeInternal.call(this);
  this.event_ = null;
  this.target = null;
  this.currentTarget = null;
  this.relatedTarget = null
};
goog.provide("goog.events.EventWrapper");
goog.events.EventWrapper = function() {
};
goog.events.EventWrapper.prototype.listen = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.events.EventWrapper.prototype.unlisten = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.provide("goog.events.Listener");
goog.events.Listener = function() {
};
goog.events.Listener.counter_ = 0;
goog.events.Listener.prototype.isFunctionListener_;
goog.events.Listener.prototype.listener;
goog.events.Listener.prototype.proxy;
goog.events.Listener.prototype.src;
goog.events.Listener.prototype.type;
goog.events.Listener.prototype.capture;
goog.events.Listener.prototype.handler;
goog.events.Listener.prototype.key = 0;
goog.events.Listener.prototype.removed = false;
goog.events.Listener.prototype.callOnce = false;
goog.events.Listener.prototype.init = function(listener, proxy, src, type, capture, opt_handler) {
  if(goog.isFunction(listener)) {
    this.isFunctionListener_ = true
  }else {
    if(listener && listener.handleEvent && goog.isFunction(listener.handleEvent)) {
      this.isFunctionListener_ = false
    }else {
      throw Error("Invalid listener argument");
    }
  }
  this.listener = listener;
  this.proxy = proxy;
  this.src = src;
  this.type = type;
  this.capture = !!capture;
  this.handler = opt_handler;
  this.callOnce = false;
  this.key = ++goog.events.Listener.counter_;
  this.removed = false
};
goog.events.Listener.prototype.handleEvent = function(eventObject) {
  if(this.isFunctionListener_) {
    return this.listener.call(this.handler || this.src, eventObject)
  }
  return this.listener.handleEvent.call(this.listener, eventObject)
};
goog.provide("goog.structs.SimplePool");
goog.require("goog.Disposable");
goog.structs.SimplePool = function(initialCount, maxCount) {
  goog.Disposable.call(this);
  this.maxCount_ = maxCount;
  this.freeQueue_ = [];
  this.createInitial_(initialCount)
};
goog.inherits(goog.structs.SimplePool, goog.Disposable);
goog.structs.SimplePool.prototype.createObjectFn_ = null;
goog.structs.SimplePool.prototype.disposeObjectFn_ = null;
goog.structs.SimplePool.prototype.setCreateObjectFn = function(createObjectFn) {
  this.createObjectFn_ = createObjectFn
};
goog.structs.SimplePool.prototype.setDisposeObjectFn = function(disposeObjectFn) {
  this.disposeObjectFn_ = disposeObjectFn
};
goog.structs.SimplePool.prototype.getObject = function() {
  if(this.freeQueue_.length) {
    return this.freeQueue_.pop()
  }
  return this.createObject()
};
goog.structs.SimplePool.prototype.releaseObject = function(obj) {
  if(this.freeQueue_.length < this.maxCount_) {
    this.freeQueue_.push(obj)
  }else {
    this.disposeObject(obj)
  }
};
goog.structs.SimplePool.prototype.createInitial_ = function(initialCount) {
  if(initialCount > this.maxCount_) {
    throw Error("[goog.structs.SimplePool] Initial cannot be greater than max");
  }
  for(var i = 0;i < initialCount;i++) {
    this.freeQueue_.push(this.createObject())
  }
};
goog.structs.SimplePool.prototype.createObject = function() {
  if(this.createObjectFn_) {
    return this.createObjectFn_()
  }else {
    return{}
  }
};
goog.structs.SimplePool.prototype.disposeObject = function(obj) {
  if(this.disposeObjectFn_) {
    this.disposeObjectFn_(obj)
  }else {
    if(goog.isObject(obj)) {
      if(goog.isFunction(obj.dispose)) {
        obj.dispose()
      }else {
        for(var i in obj) {
          delete obj[i]
        }
      }
    }
  }
};
goog.structs.SimplePool.prototype.disposeInternal = function() {
  goog.structs.SimplePool.superClass_.disposeInternal.call(this);
  var freeQueue = this.freeQueue_;
  while(freeQueue.length) {
    this.disposeObject(freeQueue.pop())
  }
  delete this.freeQueue_
};
goog.provide("goog.events.pools");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.Listener");
goog.require("goog.structs.SimplePool");
goog.require("goog.userAgent.jscript");
goog.events.ASSUME_GOOD_GC = false;
goog.events.pools.getObject;
goog.events.pools.releaseObject;
goog.events.pools.getArray;
goog.events.pools.releaseArray;
goog.events.pools.getProxy;
goog.events.pools.setProxyCallbackFunction;
goog.events.pools.releaseProxy;
goog.events.pools.getListener;
goog.events.pools.releaseListener;
goog.events.pools.getEvent;
goog.events.pools.releaseEvent;
(function() {
  var BAD_GC = !goog.events.ASSUME_GOOD_GC && goog.userAgent.jscript.HAS_JSCRIPT && !goog.userAgent.jscript.isVersion("5.7");
  function getObject() {
    return{count_:0, remaining_:0}
  }
  function getArray() {
    return[]
  }
  var proxyCallbackFunction;
  goog.events.pools.setProxyCallbackFunction = function(cb) {
    proxyCallbackFunction = cb
  };
  function getProxy() {
    var f = function(eventObject) {
      return proxyCallbackFunction.call(f.src, f.key, eventObject)
    };
    return f
  }
  function getListener() {
    return new goog.events.Listener
  }
  function getEvent() {
    return new goog.events.BrowserEvent
  }
  if(!BAD_GC) {
    goog.events.pools.getObject = getObject;
    goog.events.pools.releaseObject = goog.nullFunction;
    goog.events.pools.getArray = getArray;
    goog.events.pools.releaseArray = goog.nullFunction;
    goog.events.pools.getProxy = getProxy;
    goog.events.pools.releaseProxy = goog.nullFunction;
    goog.events.pools.getListener = getListener;
    goog.events.pools.releaseListener = goog.nullFunction;
    goog.events.pools.getEvent = getEvent;
    goog.events.pools.releaseEvent = goog.nullFunction
  }else {
    goog.events.pools.getObject = function() {
      return objectPool.getObject()
    };
    goog.events.pools.releaseObject = function(obj) {
      objectPool.releaseObject(obj)
    };
    goog.events.pools.getArray = function() {
      return arrayPool.getObject()
    };
    goog.events.pools.releaseArray = function(obj) {
      arrayPool.releaseObject(obj)
    };
    goog.events.pools.getProxy = function() {
      return proxyPool.getObject()
    };
    goog.events.pools.releaseProxy = function(obj) {
      proxyPool.releaseObject(getProxy())
    };
    goog.events.pools.getListener = function() {
      return listenerPool.getObject()
    };
    goog.events.pools.releaseListener = function(obj) {
      listenerPool.releaseObject(obj)
    };
    goog.events.pools.getEvent = function() {
      return eventPool.getObject()
    };
    goog.events.pools.releaseEvent = function(obj) {
      eventPool.releaseObject(obj)
    };
    var OBJECT_POOL_INITIAL_COUNT = 0;
    var OBJECT_POOL_MAX_COUNT = 600;
    var objectPool = new goog.structs.SimplePool(OBJECT_POOL_INITIAL_COUNT, OBJECT_POOL_MAX_COUNT);
    objectPool.setCreateObjectFn(getObject);
    var ARRAY_POOL_INITIAL_COUNT = 0;
    var ARRAY_POOL_MAX_COUNT = 600;
    var arrayPool = new goog.structs.SimplePool(ARRAY_POOL_INITIAL_COUNT, ARRAY_POOL_MAX_COUNT);
    arrayPool.setCreateObjectFn(getArray);
    var HANDLE_EVENT_PROXY_POOL_INITIAL_COUNT = 0;
    var HANDLE_EVENT_PROXY_POOL_MAX_COUNT = 600;
    var proxyPool = new goog.structs.SimplePool(HANDLE_EVENT_PROXY_POOL_INITIAL_COUNT, HANDLE_EVENT_PROXY_POOL_MAX_COUNT);
    proxyPool.setCreateObjectFn(getProxy);
    var LISTENER_POOL_INITIAL_COUNT = 0;
    var LISTENER_POOL_MAX_COUNT = 600;
    var listenerPool = new goog.structs.SimplePool(LISTENER_POOL_INITIAL_COUNT, LISTENER_POOL_MAX_COUNT);
    listenerPool.setCreateObjectFn(getListener);
    var EVENT_POOL_INITIAL_COUNT = 0;
    var EVENT_POOL_MAX_COUNT = 600;
    var eventPool = new goog.structs.SimplePool(EVENT_POOL_INITIAL_COUNT, EVENT_POOL_MAX_COUNT);
    eventPool.setCreateObjectFn(getEvent)
  }
})();
goog.provide("goog.events");
goog.require("goog.array");
goog.require("goog.debug.entryPointRegistry");
goog.require("goog.debug.errorHandlerWeakDep");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.Event");
goog.require("goog.events.EventWrapper");
goog.require("goog.events.pools");
goog.require("goog.object");
goog.require("goog.userAgent");
goog.events.listeners_ = {};
goog.events.listenerTree_ = {};
goog.events.sources_ = {};
goog.events.onString_ = "on";
goog.events.onStringMap_ = {};
goog.events.keySeparator_ = "_";
goog.events.requiresSyntheticEventPropagation_;
goog.events.listen = function(src, type, listener, opt_capt, opt_handler) {
  if(!type) {
    throw Error("Invalid event type");
  }else {
    if(goog.isArray(type)) {
      for(var i = 0;i < type.length;i++) {
        goog.events.listen(src, type[i], listener, opt_capt, opt_handler)
      }
      return null
    }else {
      var capture = !!opt_capt;
      var map = goog.events.listenerTree_;
      if(!(type in map)) {
        map[type] = goog.events.pools.getObject()
      }
      map = map[type];
      if(!(capture in map)) {
        map[capture] = goog.events.pools.getObject();
        map.count_++
      }
      map = map[capture];
      var srcUid = goog.getUid(src);
      var listenerArray, listenerObj;
      map.remaining_++;
      if(!map[srcUid]) {
        listenerArray = map[srcUid] = goog.events.pools.getArray();
        map.count_++
      }else {
        listenerArray = map[srcUid];
        for(var i = 0;i < listenerArray.length;i++) {
          listenerObj = listenerArray[i];
          if(listenerObj.listener == listener && listenerObj.handler == opt_handler) {
            if(listenerObj.removed) {
              break
            }
            return listenerArray[i].key
          }
        }
      }
      var proxy = goog.events.pools.getProxy();
      proxy.src = src;
      listenerObj = goog.events.pools.getListener();
      listenerObj.init(listener, proxy, src, type, capture, opt_handler);
      var key = listenerObj.key;
      proxy.key = key;
      listenerArray.push(listenerObj);
      goog.events.listeners_[key] = listenerObj;
      if(!goog.events.sources_[srcUid]) {
        goog.events.sources_[srcUid] = goog.events.pools.getArray()
      }
      goog.events.sources_[srcUid].push(listenerObj);
      if(src.addEventListener) {
        if(src == goog.global || !src.customEvent_) {
          src.addEventListener(type, proxy, capture)
        }
      }else {
        src.attachEvent(goog.events.getOnString_(type), proxy)
      }
      return key
    }
  }
};
goog.events.listenOnce = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.listenOnce(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var key = goog.events.listen(src, type, listener, opt_capt, opt_handler);
  var listenerObj = goog.events.listeners_[key];
  listenerObj.callOnce = true;
  return key
};
goog.events.listenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler)
};
goog.events.unlisten = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.unlisten(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(!listenerArray) {
    return false
  }
  for(var i = 0;i < listenerArray.length;i++) {
    if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
      return goog.events.unlistenByKey(listenerArray[i].key)
    }
  }
  return false
};
goog.events.unlistenByKey = function(key) {
  if(!goog.events.listeners_[key]) {
    return false
  }
  var listener = goog.events.listeners_[key];
  if(listener.removed) {
    return false
  }
  var src = listener.src;
  var type = listener.type;
  var proxy = listener.proxy;
  var capture = listener.capture;
  if(src.removeEventListener) {
    if(src == goog.global || !src.customEvent_) {
      src.removeEventListener(type, proxy, capture)
    }
  }else {
    if(src.detachEvent) {
      src.detachEvent(goog.events.getOnString_(type), proxy)
    }
  }
  var srcUid = goog.getUid(src);
  var listenerArray = goog.events.listenerTree_[type][capture][srcUid];
  if(goog.events.sources_[srcUid]) {
    var sourcesArray = goog.events.sources_[srcUid];
    goog.array.remove(sourcesArray, listener);
    if(sourcesArray.length == 0) {
      delete goog.events.sources_[srcUid]
    }
  }
  listener.removed = true;
  listenerArray.needsCleanup_ = true;
  goog.events.cleanUp_(type, capture, srcUid, listenerArray);
  delete goog.events.listeners_[key];
  return true
};
goog.events.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler)
};
goog.events.cleanUp_ = function(type, capture, srcUid, listenerArray) {
  if(!listenerArray.locked_) {
    if(listenerArray.needsCleanup_) {
      for(var oldIndex = 0, newIndex = 0;oldIndex < listenerArray.length;oldIndex++) {
        if(listenerArray[oldIndex].removed) {
          var proxy = listenerArray[oldIndex].proxy;
          proxy.src = null;
          goog.events.pools.releaseProxy(proxy);
          goog.events.pools.releaseListener(listenerArray[oldIndex]);
          continue
        }
        if(oldIndex != newIndex) {
          listenerArray[newIndex] = listenerArray[oldIndex]
        }
        newIndex++
      }
      listenerArray.length = newIndex;
      listenerArray.needsCleanup_ = false;
      if(newIndex == 0) {
        goog.events.pools.releaseArray(listenerArray);
        delete goog.events.listenerTree_[type][capture][srcUid];
        goog.events.listenerTree_[type][capture].count_--;
        if(goog.events.listenerTree_[type][capture].count_ == 0) {
          goog.events.pools.releaseObject(goog.events.listenerTree_[type][capture]);
          delete goog.events.listenerTree_[type][capture];
          goog.events.listenerTree_[type].count_--
        }
        if(goog.events.listenerTree_[type].count_ == 0) {
          goog.events.pools.releaseObject(goog.events.listenerTree_[type]);
          delete goog.events.listenerTree_[type]
        }
      }
    }
  }
};
goog.events.removeAll = function(opt_obj, opt_type, opt_capt) {
  var count = 0;
  var noObj = opt_obj == null;
  var noType = opt_type == null;
  var noCapt = opt_capt == null;
  opt_capt = !!opt_capt;
  if(!noObj) {
    var srcUid = goog.getUid(opt_obj);
    if(goog.events.sources_[srcUid]) {
      var sourcesArray = goog.events.sources_[srcUid];
      for(var i = sourcesArray.length - 1;i >= 0;i--) {
        var listener = sourcesArray[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    }
  }else {
    goog.object.forEach(goog.events.sources_, function(listeners) {
      for(var i = listeners.length - 1;i >= 0;i--) {
        var listener = listeners[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    })
  }
  return count
};
goog.events.getListeners = function(obj, type, capture) {
  return goog.events.getListeners_(obj, type, capture) || []
};
goog.events.getListeners_ = function(obj, type, capture) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      map = map[capture];
      var objUid = goog.getUid(obj);
      if(map[objUid]) {
        return map[objUid]
      }
    }
  }
  return null
};
goog.events.getListener = function(src, type, listener, opt_capt, opt_handler) {
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(listenerArray) {
    for(var i = 0;i < listenerArray.length;i++) {
      if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
        return listenerArray[i]
      }
    }
  }
  return null
};
goog.events.hasListener = function(obj, opt_type, opt_capture) {
  var objUid = goog.getUid(obj);
  var listeners = goog.events.sources_[objUid];
  if(listeners) {
    var hasType = goog.isDef(opt_type);
    var hasCapture = goog.isDef(opt_capture);
    if(hasType && hasCapture) {
      var map = goog.events.listenerTree_[opt_type];
      return!!map && !!map[opt_capture] && objUid in map[opt_capture]
    }else {
      if(!(hasType || hasCapture)) {
        return true
      }else {
        return goog.array.some(listeners, function(listener) {
          return hasType && listener.type == opt_type || hasCapture && listener.capture == opt_capture
        })
      }
    }
  }
  return false
};
goog.events.expose = function(e) {
  var str = [];
  for(var key in e) {
    if(e[key] && e[key].id) {
      str.push(key + " = " + e[key] + " (" + e[key].id + ")")
    }else {
      str.push(key + " = " + e[key])
    }
  }
  return str.join("\n")
};
goog.events.getOnString_ = function(type) {
  if(type in goog.events.onStringMap_) {
    return goog.events.onStringMap_[type]
  }
  return goog.events.onStringMap_[type] = goog.events.onString_ + type
};
goog.events.fireListeners = function(obj, type, capture, eventObject) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      return goog.events.fireListeners_(map[capture], obj, type, capture, eventObject)
    }
  }
  return true
};
goog.events.fireListeners_ = function(map, obj, type, capture, eventObject) {
  var retval = 1;
  var objUid = goog.getUid(obj);
  if(map[objUid]) {
    map.remaining_--;
    var listenerArray = map[objUid];
    if(!listenerArray.locked_) {
      listenerArray.locked_ = 1
    }else {
      listenerArray.locked_++
    }
    try {
      var length = listenerArray.length;
      for(var i = 0;i < length;i++) {
        var listener = listenerArray[i];
        if(listener && !listener.removed) {
          retval &= goog.events.fireListener(listener, eventObject) !== false
        }
      }
    }finally {
      listenerArray.locked_--;
      goog.events.cleanUp_(type, capture, objUid, listenerArray)
    }
  }
  return Boolean(retval)
};
goog.events.fireListener = function(listener, eventObject) {
  var rv = listener.handleEvent(eventObject);
  if(listener.callOnce) {
    goog.events.unlistenByKey(listener.key)
  }
  return rv
};
goog.events.getTotalListenerCount = function() {
  return goog.object.getCount(goog.events.listeners_)
};
goog.events.dispatchEvent = function(src, e) {
  var type = e.type || e;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  if(goog.isString(e)) {
    e = new goog.events.Event(e, src)
  }else {
    if(!(e instanceof goog.events.Event)) {
      var oldEvent = e;
      e = new goog.events.Event(type, src);
      goog.object.extend(e, oldEvent)
    }else {
      e.target = e.target || src
    }
  }
  var rv = 1, ancestors;
  map = map[type];
  var hasCapture = true in map;
  var targetsMap;
  if(hasCapture) {
    ancestors = [];
    for(var parent = src;parent;parent = parent.getParentEventTarget()) {
      ancestors.push(parent)
    }
    targetsMap = map[true];
    targetsMap.remaining_ = targetsMap.count_;
    for(var i = ancestors.length - 1;!e.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
      e.currentTarget = ancestors[i];
      rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, true, e) && e.returnValue_ != false
    }
  }
  var hasBubble = false in map;
  if(hasBubble) {
    targetsMap = map[false];
    targetsMap.remaining_ = targetsMap.count_;
    if(hasCapture) {
      for(var i = 0;!e.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
        e.currentTarget = ancestors[i];
        rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, false, e) && e.returnValue_ != false
      }
    }else {
      for(var current = src;!e.propagationStopped_ && current && targetsMap.remaining_;current = current.getParentEventTarget()) {
        e.currentTarget = current;
        rv &= goog.events.fireListeners_(targetsMap, current, e.type, false, e) && e.returnValue_ != false
      }
    }
  }
  return Boolean(rv)
};
goog.events.protectBrowserEventEntryPoint = function(errorHandler) {
  goog.events.handleBrowserEvent_ = errorHandler.protectEntryPoint(goog.events.handleBrowserEvent_);
  goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_)
};
goog.events.handleBrowserEvent_ = function(key, opt_evt) {
  if(!goog.events.listeners_[key]) {
    return true
  }
  var listener = goog.events.listeners_[key];
  var type = listener.type;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  map = map[type];
  var retval, targetsMap;
  if(goog.events.synthesizeEventPropagation_()) {
    var ieEvent = opt_evt || goog.getObjectByName("window.event");
    var hasCapture = true in map;
    var hasBubble = false in map;
    if(hasCapture) {
      if(goog.events.isMarkedIeEvent_(ieEvent)) {
        return true
      }
      goog.events.markIeEvent_(ieEvent)
    }
    var evt = goog.events.pools.getEvent();
    evt.init(ieEvent, this);
    retval = true;
    try {
      if(hasCapture) {
        var ancestors = goog.events.pools.getArray();
        for(var parent = evt.currentTarget;parent;parent = parent.parentNode) {
          ancestors.push(parent)
        }
        targetsMap = map[true];
        targetsMap.remaining_ = targetsMap.count_;
        for(var i = ancestors.length - 1;!evt.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
          evt.currentTarget = ancestors[i];
          retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, true, evt)
        }
        if(hasBubble) {
          targetsMap = map[false];
          targetsMap.remaining_ = targetsMap.count_;
          for(var i = 0;!evt.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
            evt.currentTarget = ancestors[i];
            retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, false, evt)
          }
        }
      }else {
        retval = goog.events.fireListener(listener, evt)
      }
    }finally {
      if(ancestors) {
        ancestors.length = 0;
        goog.events.pools.releaseArray(ancestors)
      }
      evt.dispose();
      goog.events.pools.releaseEvent(evt)
    }
    return retval
  }
  var be = new goog.events.BrowserEvent(opt_evt, this);
  try {
    retval = goog.events.fireListener(listener, be)
  }finally {
    be.dispose()
  }
  return retval
};
goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_);
goog.events.markIeEvent_ = function(e) {
  var useReturnValue = false;
  if(e.keyCode == 0) {
    try {
      e.keyCode = -1;
      return
    }catch(ex) {
      useReturnValue = true
    }
  }
  if(useReturnValue || e.returnValue == undefined) {
    e.returnValue = true
  }
};
goog.events.isMarkedIeEvent_ = function(e) {
  return e.keyCode < 0 || e.returnValue != undefined
};
goog.events.uniqueIdCounter_ = 0;
goog.events.getUniqueId = function(identifier) {
  return identifier + "_" + goog.events.uniqueIdCounter_++
};
goog.events.synthesizeEventPropagation_ = function() {
  if(goog.events.requiresSyntheticEventPropagation_ === undefined) {
    goog.events.requiresSyntheticEventPropagation_ = goog.userAgent.IE && !goog.global["addEventListener"]
  }
  return goog.events.requiresSyntheticEventPropagation_
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.events.handleBrowserEvent_ = transformer(goog.events.handleBrowserEvent_);
  goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_)
});
goog.provide("goog.events.EventTarget");
goog.require("goog.Disposable");
goog.require("goog.events");
goog.events.EventTarget = function() {
  goog.Disposable.call(this)
};
goog.inherits(goog.events.EventTarget, goog.Disposable);
goog.events.EventTarget.prototype.customEvent_ = true;
goog.events.EventTarget.prototype.parentEventTarget_ = null;
goog.events.EventTarget.prototype.getParentEventTarget = function() {
  return this.parentEventTarget_
};
goog.events.EventTarget.prototype.setParentEventTarget = function(parent) {
  this.parentEventTarget_ = parent
};
goog.events.EventTarget.prototype.addEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.listen(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.removeEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.unlisten(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.dispatchEvent = function(e) {
  return goog.events.dispatchEvent(this, e)
};
goog.events.EventTarget.prototype.disposeInternal = function() {
  goog.events.EventTarget.superClass_.disposeInternal.call(this);
  goog.events.removeAll(this);
  this.parentEventTarget_ = null
};
goog.provide("clojure.browser.event");
goog.require("cljs.core");
goog.require("goog.events.EventType");
goog.require("goog.events.EventTarget");
goog.require("goog.events");
void 0;
clojure.browser.event.EventType = {};
clojure.browser.event.event_types = function event_types(this$) {
  if(function() {
    var and__3941__auto____6261 = this$;
    if(and__3941__auto____6261) {
      return this$.clojure$browser$event$EventType$event_types$arity$1
    }else {
      return and__3941__auto____6261
    }
  }()) {
    return this$.clojure$browser$event$EventType$event_types$arity$1(this$)
  }else {
    return function() {
      var or__3943__auto____6262 = clojure.browser.event.event_types[goog.typeOf(this$)];
      if(or__3943__auto____6262) {
        return or__3943__auto____6262
      }else {
        var or__3943__auto____6263 = clojure.browser.event.event_types["_"];
        if(or__3943__auto____6263) {
          return or__3943__auto____6263
        }else {
          throw cljs.core.missing_protocol.call(null, "EventType.event-types", this$);
        }
      }
    }().call(null, this$)
  }
};
void 0;
Element.prototype.clojure$browser$event$EventType$ = true;
Element.prototype.clojure$browser$event$EventType$event_types$arity$1 = function(this$) {
  return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, cljs.core.map.call(null, function(p__6264) {
    var vec__6265__6266 = p__6264;
    var k__6267 = cljs.core.nth.call(null, vec__6265__6266, 0, null);
    var v__6268 = cljs.core.nth.call(null, vec__6265__6266, 1, null);
    return cljs.core.PersistentVector.fromArray([cljs.core.keyword.call(null, k__6267.toLowerCase()), v__6268], true)
  }, cljs.core.merge.call(null, cljs.core.js__GT_clj.call(null, goog.events.EventType))))
};
goog.events.EventTarget.prototype.clojure$browser$event$EventType$ = true;
goog.events.EventTarget.prototype.clojure$browser$event$EventType$event_types$arity$1 = function(this$) {
  return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, cljs.core.map.call(null, function(p__6269) {
    var vec__6270__6271 = p__6269;
    var k__6272 = cljs.core.nth.call(null, vec__6270__6271, 0, null);
    var v__6273 = cljs.core.nth.call(null, vec__6270__6271, 1, null);
    return cljs.core.PersistentVector.fromArray([cljs.core.keyword.call(null, k__6272.toLowerCase()), v__6273], true)
  }, cljs.core.merge.call(null, cljs.core.js__GT_clj.call(null, goog.events.EventType))))
};
clojure.browser.event.listen = function() {
  var listen = null;
  var listen__3 = function(src, type, fn) {
    return listen.call(null, src, type, fn, false)
  };
  var listen__4 = function(src, type, fn, capture_QMARK_) {
    return goog.events.listen(src, cljs.core._lookup.call(null, clojure.browser.event.event_types.call(null, src), type, type), fn, capture_QMARK_)
  };
  listen = function(src, type, fn, capture_QMARK_) {
    switch(arguments.length) {
      case 3:
        return listen__3.call(this, src, type, fn);
      case 4:
        return listen__4.call(this, src, type, fn, capture_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  listen.cljs$lang$arity$3 = listen__3;
  listen.cljs$lang$arity$4 = listen__4;
  return listen
}();
clojure.browser.event.listen_once = function() {
  var listen_once = null;
  var listen_once__3 = function(src, type, fn) {
    return listen_once.call(null, src, type, fn, false)
  };
  var listen_once__4 = function(src, type, fn, capture_QMARK_) {
    return goog.events.listenOnce(src, cljs.core._lookup.call(null, clojure.browser.event.event_types.call(null, src), type, type), fn, capture_QMARK_)
  };
  listen_once = function(src, type, fn, capture_QMARK_) {
    switch(arguments.length) {
      case 3:
        return listen_once__3.call(this, src, type, fn);
      case 4:
        return listen_once__4.call(this, src, type, fn, capture_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  listen_once.cljs$lang$arity$3 = listen_once__3;
  listen_once.cljs$lang$arity$4 = listen_once__4;
  return listen_once
}();
clojure.browser.event.unlisten = function() {
  var unlisten = null;
  var unlisten__3 = function(src, type, fn) {
    return unlisten.call(null, src, type, fn, false)
  };
  var unlisten__4 = function(src, type, fn, capture_QMARK_) {
    return goog.events.unlisten(src, cljs.core._lookup.call(null, clojure.browser.event.event_types.call(null, src), type, type), fn, capture_QMARK_)
  };
  unlisten = function(src, type, fn, capture_QMARK_) {
    switch(arguments.length) {
      case 3:
        return unlisten__3.call(this, src, type, fn);
      case 4:
        return unlisten__4.call(this, src, type, fn, capture_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  unlisten.cljs$lang$arity$3 = unlisten__3;
  unlisten.cljs$lang$arity$4 = unlisten__4;
  return unlisten
}();
clojure.browser.event.unlisten_by_key = function unlisten_by_key(key) {
  return goog.events.unlistenByKey(key)
};
clojure.browser.event.dispatch_event = function dispatch_event(src, event) {
  return goog.events.dispatchEvent(src, event)
};
clojure.browser.event.expose = function expose(e) {
  return goog.events.expose(e)
};
clojure.browser.event.fire_listeners = function fire_listeners(obj, type, capture, event) {
  return null
};
clojure.browser.event.total_listener_count = function total_listener_count() {
  return goog.events.getTotalListenerCount()
};
clojure.browser.event.get_listener = function get_listener(src, type, listener, opt_capt, opt_handler) {
  return null
};
clojure.browser.event.all_listeners = function all_listeners(obj, type, capture) {
  return null
};
clojure.browser.event.unique_event_id = function unique_event_id(event_type) {
  return null
};
clojure.browser.event.has_listener = function has_listener(obj, opt_type, opt_capture) {
  return null
};
clojure.browser.event.remove_all = function remove_all(opt_obj, opt_type, opt_capt) {
  return null
};
goog.provide("goog.dom.BrowserFeature");
goog.require("goog.userAgent");
goog.dom.BrowserFeature = {CAN_ADD_NAME_OR_TYPE_ATTRIBUTES:!goog.userAgent.IE || goog.userAgent.isVersion("9"), CAN_USE_CHILDREN_ATTRIBUTE:!goog.userAgent.GECKO && !goog.userAgent.IE || goog.userAgent.IE && goog.userAgent.isVersion("9") || goog.userAgent.GECKO && goog.userAgent.isVersion("1.9.1"), CAN_USE_INNER_TEXT:goog.userAgent.IE && !goog.userAgent.isVersion("9"), INNER_HTML_NEEDS_SCOPED_ELEMENT:goog.userAgent.IE};
goog.provide("goog.dom.TagName");
goog.dom.TagName = {A:"A", ABBR:"ABBR", ACRONYM:"ACRONYM", ADDRESS:"ADDRESS", APPLET:"APPLET", AREA:"AREA", B:"B", BASE:"BASE", BASEFONT:"BASEFONT", BDO:"BDO", BIG:"BIG", BLOCKQUOTE:"BLOCKQUOTE", BODY:"BODY", BR:"BR", BUTTON:"BUTTON", CANVAS:"CANVAS", CAPTION:"CAPTION", CENTER:"CENTER", CITE:"CITE", CODE:"CODE", COL:"COL", COLGROUP:"COLGROUP", DD:"DD", DEL:"DEL", DFN:"DFN", DIR:"DIR", DIV:"DIV", DL:"DL", DT:"DT", EM:"EM", FIELDSET:"FIELDSET", FONT:"FONT", FORM:"FORM", FRAME:"FRAME", FRAMESET:"FRAMESET", 
H1:"H1", H2:"H2", H3:"H3", H4:"H4", H5:"H5", H6:"H6", HEAD:"HEAD", HR:"HR", HTML:"HTML", I:"I", IFRAME:"IFRAME", IMG:"IMG", INPUT:"INPUT", INS:"INS", ISINDEX:"ISINDEX", KBD:"KBD", LABEL:"LABEL", LEGEND:"LEGEND", LI:"LI", LINK:"LINK", MAP:"MAP", MENU:"MENU", META:"META", NOFRAMES:"NOFRAMES", NOSCRIPT:"NOSCRIPT", OBJECT:"OBJECT", OL:"OL", OPTGROUP:"OPTGROUP", OPTION:"OPTION", P:"P", PARAM:"PARAM", PRE:"PRE", Q:"Q", S:"S", SAMP:"SAMP", SCRIPT:"SCRIPT", SELECT:"SELECT", SMALL:"SMALL", SPAN:"SPAN", STRIKE:"STRIKE", 
STRONG:"STRONG", STYLE:"STYLE", SUB:"SUB", SUP:"SUP", TABLE:"TABLE", TBODY:"TBODY", TD:"TD", TEXTAREA:"TEXTAREA", TFOOT:"TFOOT", TH:"TH", THEAD:"THEAD", TITLE:"TITLE", TR:"TR", TT:"TT", U:"U", UL:"UL", VAR:"VAR"};
goog.provide("goog.dom.classes");
goog.require("goog.array");
goog.dom.classes.set = function(element, className) {
  element.className = className
};
goog.dom.classes.get = function(element) {
  var className = element.className;
  return className && typeof className.split == "function" ? className.split(/\s+/) : []
};
goog.dom.classes.add = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.add_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.remove = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.remove_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.add_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < args.length;i++) {
    if(!goog.array.contains(classes, args[i])) {
      classes.push(args[i]);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.remove_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < classes.length;i++) {
    if(goog.array.contains(args, classes[i])) {
      goog.array.splice(classes, i--, 1);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.swap = function(element, fromClass, toClass) {
  var classes = goog.dom.classes.get(element);
  var removed = false;
  for(var i = 0;i < classes.length;i++) {
    if(classes[i] == fromClass) {
      goog.array.splice(classes, i--, 1);
      removed = true
    }
  }
  if(removed) {
    classes.push(toClass);
    element.className = classes.join(" ")
  }
  return removed
};
goog.dom.classes.addRemove = function(element, classesToRemove, classesToAdd) {
  var classes = goog.dom.classes.get(element);
  if(goog.isString(classesToRemove)) {
    goog.array.remove(classes, classesToRemove)
  }else {
    if(goog.isArray(classesToRemove)) {
      goog.dom.classes.remove_(classes, classesToRemove)
    }
  }
  if(goog.isString(classesToAdd) && !goog.array.contains(classes, classesToAdd)) {
    classes.push(classesToAdd)
  }else {
    if(goog.isArray(classesToAdd)) {
      goog.dom.classes.add_(classes, classesToAdd)
    }
  }
  element.className = classes.join(" ")
};
goog.dom.classes.has = function(element, className) {
  return goog.array.contains(goog.dom.classes.get(element), className)
};
goog.dom.classes.enable = function(element, className, enabled) {
  if(enabled) {
    goog.dom.classes.add(element, className)
  }else {
    goog.dom.classes.remove(element, className)
  }
};
goog.dom.classes.toggle = function(element, className) {
  var add = !goog.dom.classes.has(element, className);
  goog.dom.classes.enable(element, className, add);
  return add
};
goog.provide("goog.math.Coordinate");
goog.math.Coordinate = function(opt_x, opt_y) {
  this.x = goog.isDef(opt_x) ? opt_x : 0;
  this.y = goog.isDef(opt_y) ? opt_y : 0
};
goog.math.Coordinate.prototype.clone = function() {
  return new goog.math.Coordinate(this.x, this.y)
};
if(goog.DEBUG) {
  goog.math.Coordinate.prototype.toString = function() {
    return"(" + this.x + ", " + this.y + ")"
  }
}
goog.math.Coordinate.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.x == b.x && a.y == b.y
};
goog.math.Coordinate.distance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy)
};
goog.math.Coordinate.squaredDistance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return dx * dx + dy * dy
};
goog.math.Coordinate.difference = function(a, b) {
  return new goog.math.Coordinate(a.x - b.x, a.y - b.y)
};
goog.math.Coordinate.sum = function(a, b) {
  return new goog.math.Coordinate(a.x + b.x, a.y + b.y)
};
goog.provide("goog.math.Size");
goog.math.Size = function(width, height) {
  this.width = width;
  this.height = height
};
goog.math.Size.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.width == b.width && a.height == b.height
};
goog.math.Size.prototype.clone = function() {
  return new goog.math.Size(this.width, this.height)
};
if(goog.DEBUG) {
  goog.math.Size.prototype.toString = function() {
    return"(" + this.width + " x " + this.height + ")"
  }
}
goog.math.Size.prototype.getLongest = function() {
  return Math.max(this.width, this.height)
};
goog.math.Size.prototype.getShortest = function() {
  return Math.min(this.width, this.height)
};
goog.math.Size.prototype.area = function() {
  return this.width * this.height
};
goog.math.Size.prototype.perimeter = function() {
  return(this.width + this.height) * 2
};
goog.math.Size.prototype.aspectRatio = function() {
  return this.width / this.height
};
goog.math.Size.prototype.isEmpty = function() {
  return!this.area()
};
goog.math.Size.prototype.ceil = function() {
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this
};
goog.math.Size.prototype.fitsInside = function(target) {
  return this.width <= target.width && this.height <= target.height
};
goog.math.Size.prototype.floor = function() {
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this
};
goog.math.Size.prototype.round = function() {
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this
};
goog.math.Size.prototype.scale = function(s) {
  this.width *= s;
  this.height *= s;
  return this
};
goog.math.Size.prototype.scaleToFit = function(target) {
  var s = this.aspectRatio() > target.aspectRatio() ? target.width / this.width : target.height / this.height;
  return this.scale(s)
};
goog.provide("goog.dom");
goog.provide("goog.dom.DomHelper");
goog.provide("goog.dom.NodeType");
goog.require("goog.array");
goog.require("goog.dom.BrowserFeature");
goog.require("goog.dom.TagName");
goog.require("goog.dom.classes");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.dom.ASSUME_QUIRKS_MODE = false;
goog.dom.ASSUME_STANDARDS_MODE = false;
goog.dom.COMPAT_MODE_KNOWN_ = goog.dom.ASSUME_QUIRKS_MODE || goog.dom.ASSUME_STANDARDS_MODE;
goog.dom.NodeType = {ELEMENT:1, ATTRIBUTE:2, TEXT:3, CDATA_SECTION:4, ENTITY_REFERENCE:5, ENTITY:6, PROCESSING_INSTRUCTION:7, COMMENT:8, DOCUMENT:9, DOCUMENT_TYPE:10, DOCUMENT_FRAGMENT:11, NOTATION:12};
goog.dom.getDomHelper = function(opt_element) {
  return opt_element ? new goog.dom.DomHelper(goog.dom.getOwnerDocument(opt_element)) : goog.dom.defaultDomHelper_ || (goog.dom.defaultDomHelper_ = new goog.dom.DomHelper)
};
goog.dom.defaultDomHelper_;
goog.dom.getDocument = function() {
  return document
};
goog.dom.getElement = function(element) {
  return goog.isString(element) ? document.getElementById(element) : element
};
goog.dom.$ = goog.dom.getElement;
goog.dom.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(document, opt_tag, opt_class, opt_el)
};
goog.dom.getElementsByClass = function(className, opt_el) {
  var parent = opt_el || document;
  if(goog.dom.canUseQuerySelector_(parent)) {
    return parent.querySelectorAll("." + className)
  }else {
    if(parent.getElementsByClassName) {
      return parent.getElementsByClassName(className)
    }
  }
  return goog.dom.getElementsByTagNameAndClass_(document, "*", className, opt_el)
};
goog.dom.getElementByClass = function(className, opt_el) {
  var parent = opt_el || document;
  var retVal = null;
  if(goog.dom.canUseQuerySelector_(parent)) {
    retVal = parent.querySelector("." + className)
  }else {
    retVal = goog.dom.getElementsByClass(className, opt_el)[0]
  }
  return retVal || null
};
goog.dom.canUseQuerySelector_ = function(parent) {
  return parent.querySelectorAll && parent.querySelector && (!goog.userAgent.WEBKIT || goog.dom.isCss1CompatMode_(document) || goog.userAgent.isVersion("528"))
};
goog.dom.getElementsByTagNameAndClass_ = function(doc, opt_tag, opt_class, opt_el) {
  var parent = opt_el || doc;
  var tagName = opt_tag && opt_tag != "*" ? opt_tag.toUpperCase() : "";
  if(goog.dom.canUseQuerySelector_(parent) && (tagName || opt_class)) {
    var query = tagName + (opt_class ? "." + opt_class : "");
    return parent.querySelectorAll(query)
  }
  if(opt_class && parent.getElementsByClassName) {
    var els = parent.getElementsByClassName(opt_class);
    if(tagName) {
      var arrayLike = {};
      var len = 0;
      for(var i = 0, el;el = els[i];i++) {
        if(tagName == el.nodeName) {
          arrayLike[len++] = el
        }
      }
      arrayLike.length = len;
      return arrayLike
    }else {
      return els
    }
  }
  var els = parent.getElementsByTagName(tagName || "*");
  if(opt_class) {
    var arrayLike = {};
    var len = 0;
    for(var i = 0, el;el = els[i];i++) {
      var className = el.className;
      if(typeof className.split == "function" && goog.array.contains(className.split(/\s+/), opt_class)) {
        arrayLike[len++] = el
      }
    }
    arrayLike.length = len;
    return arrayLike
  }else {
    return els
  }
};
goog.dom.$$ = goog.dom.getElementsByTagNameAndClass;
goog.dom.setProperties = function(element, properties) {
  goog.object.forEach(properties, function(val, key) {
    if(key == "style") {
      element.style.cssText = val
    }else {
      if(key == "class") {
        element.className = val
      }else {
        if(key == "for") {
          element.htmlFor = val
        }else {
          if(key in goog.dom.DIRECT_ATTRIBUTE_MAP_) {
            element.setAttribute(goog.dom.DIRECT_ATTRIBUTE_MAP_[key], val)
          }else {
            element[key] = val
          }
        }
      }
    }
  })
};
goog.dom.DIRECT_ATTRIBUTE_MAP_ = {"cellpadding":"cellPadding", "cellspacing":"cellSpacing", "colspan":"colSpan", "rowspan":"rowSpan", "valign":"vAlign", "height":"height", "width":"width", "usemap":"useMap", "frameborder":"frameBorder", "maxlength":"maxLength", "type":"type"};
goog.dom.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize_(opt_window || window)
};
goog.dom.getViewportSize_ = function(win) {
  var doc = win.document;
  if(goog.userAgent.WEBKIT && !goog.userAgent.isVersion("500") && !goog.userAgent.MOBILE) {
    if(typeof win.innerHeight == "undefined") {
      win = window
    }
    var innerHeight = win.innerHeight;
    var scrollHeight = win.document.documentElement.scrollHeight;
    if(win == win.top) {
      if(scrollHeight < innerHeight) {
        innerHeight -= 15
      }
    }
    return new goog.math.Size(win.innerWidth, innerHeight)
  }
  var el = goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body;
  return new goog.math.Size(el.clientWidth, el.clientHeight)
};
goog.dom.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(window)
};
goog.dom.getDocumentHeight_ = function(win) {
  var doc = win.document;
  var height = 0;
  if(doc) {
    var vh = goog.dom.getViewportSize_(win).height;
    var body = doc.body;
    var docEl = doc.documentElement;
    if(goog.dom.isCss1CompatMode_(doc) && docEl.scrollHeight) {
      height = docEl.scrollHeight != vh ? docEl.scrollHeight : docEl.offsetHeight
    }else {
      var sh = docEl.scrollHeight;
      var oh = docEl.offsetHeight;
      if(docEl.clientHeight != oh) {
        sh = body.scrollHeight;
        oh = body.offsetHeight
      }
      if(sh > vh) {
        height = sh > oh ? sh : oh
      }else {
        height = sh < oh ? sh : oh
      }
    }
  }
  return height
};
goog.dom.getPageScroll = function(opt_window) {
  var win = opt_window || goog.global || window;
  return goog.dom.getDomHelper(win.document).getDocumentScroll()
};
goog.dom.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(document)
};
goog.dom.getDocumentScroll_ = function(doc) {
  var el = goog.dom.getDocumentScrollElement_(doc);
  var win = goog.dom.getWindow_(doc);
  return new goog.math.Coordinate(win.pageXOffset || el.scrollLeft, win.pageYOffset || el.scrollTop)
};
goog.dom.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(document)
};
goog.dom.getDocumentScrollElement_ = function(doc) {
  return!goog.userAgent.WEBKIT && goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body
};
goog.dom.getWindow = function(opt_doc) {
  return opt_doc ? goog.dom.getWindow_(opt_doc) : window
};
goog.dom.getWindow_ = function(doc) {
  return doc.parentWindow || doc.defaultView
};
goog.dom.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(document, arguments)
};
goog.dom.createDom_ = function(doc, args) {
  var tagName = args[0];
  var attributes = args[1];
  if(!goog.dom.BrowserFeature.CAN_ADD_NAME_OR_TYPE_ATTRIBUTES && attributes && (attributes.name || attributes.type)) {
    var tagNameArr = ["<", tagName];
    if(attributes.name) {
      tagNameArr.push(' name="', goog.string.htmlEscape(attributes.name), '"')
    }
    if(attributes.type) {
      tagNameArr.push(' type="', goog.string.htmlEscape(attributes.type), '"');
      var clone = {};
      goog.object.extend(clone, attributes);
      attributes = clone;
      delete attributes.type
    }
    tagNameArr.push(">");
    tagName = tagNameArr.join("")
  }
  var element = doc.createElement(tagName);
  if(attributes) {
    if(goog.isString(attributes)) {
      element.className = attributes
    }else {
      if(goog.isArray(attributes)) {
        goog.dom.classes.add.apply(null, [element].concat(attributes))
      }else {
        goog.dom.setProperties(element, attributes)
      }
    }
  }
  if(args.length > 2) {
    goog.dom.append_(doc, element, args, 2)
  }
  return element
};
goog.dom.append_ = function(doc, parent, args, startIndex) {
  function childHandler(child) {
    if(child) {
      parent.appendChild(goog.isString(child) ? doc.createTextNode(child) : child)
    }
  }
  for(var i = startIndex;i < args.length;i++) {
    var arg = args[i];
    if(goog.isArrayLike(arg) && !goog.dom.isNodeLike(arg)) {
      goog.array.forEach(goog.dom.isNodeList(arg) ? goog.array.clone(arg) : arg, childHandler)
    }else {
      childHandler(arg)
    }
  }
};
goog.dom.$dom = goog.dom.createDom;
goog.dom.createElement = function(name) {
  return document.createElement(name)
};
goog.dom.createTextNode = function(content) {
  return document.createTextNode(content)
};
goog.dom.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(document, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.createTable_ = function(doc, rows, columns, fillWithNbsp) {
  var rowHtml = ["<tr>"];
  for(var i = 0;i < columns;i++) {
    rowHtml.push(fillWithNbsp ? "<td>&nbsp;</td>" : "<td></td>")
  }
  rowHtml.push("</tr>");
  rowHtml = rowHtml.join("");
  var totalHtml = ["<table>"];
  for(i = 0;i < rows;i++) {
    totalHtml.push(rowHtml)
  }
  totalHtml.push("</table>");
  var elem = doc.createElement(goog.dom.TagName.DIV);
  elem.innerHTML = totalHtml.join("");
  return elem.removeChild(elem.firstChild)
};
goog.dom.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(document, htmlString)
};
goog.dom.htmlToDocumentFragment_ = function(doc, htmlString) {
  var tempDiv = doc.createElement("div");
  if(goog.dom.BrowserFeature.INNER_HTML_NEEDS_SCOPED_ELEMENT) {
    tempDiv.innerHTML = "<br>" + htmlString;
    tempDiv.removeChild(tempDiv.firstChild)
  }else {
    tempDiv.innerHTML = htmlString
  }
  if(tempDiv.childNodes.length == 1) {
    return tempDiv.removeChild(tempDiv.firstChild)
  }else {
    var fragment = doc.createDocumentFragment();
    while(tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild)
    }
    return fragment
  }
};
goog.dom.getCompatMode = function() {
  return goog.dom.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(document)
};
goog.dom.isCss1CompatMode_ = function(doc) {
  if(goog.dom.COMPAT_MODE_KNOWN_) {
    return goog.dom.ASSUME_STANDARDS_MODE
  }
  return doc.compatMode == "CSS1Compat"
};
goog.dom.canHaveChildren = function(node) {
  if(node.nodeType != goog.dom.NodeType.ELEMENT) {
    return false
  }
  switch(node.tagName) {
    case goog.dom.TagName.APPLET:
    ;
    case goog.dom.TagName.AREA:
    ;
    case goog.dom.TagName.BASE:
    ;
    case goog.dom.TagName.BR:
    ;
    case goog.dom.TagName.COL:
    ;
    case goog.dom.TagName.FRAME:
    ;
    case goog.dom.TagName.HR:
    ;
    case goog.dom.TagName.IMG:
    ;
    case goog.dom.TagName.INPUT:
    ;
    case goog.dom.TagName.IFRAME:
    ;
    case goog.dom.TagName.ISINDEX:
    ;
    case goog.dom.TagName.LINK:
    ;
    case goog.dom.TagName.NOFRAMES:
    ;
    case goog.dom.TagName.NOSCRIPT:
    ;
    case goog.dom.TagName.META:
    ;
    case goog.dom.TagName.OBJECT:
    ;
    case goog.dom.TagName.PARAM:
    ;
    case goog.dom.TagName.SCRIPT:
    ;
    case goog.dom.TagName.STYLE:
      return false
  }
  return true
};
goog.dom.appendChild = function(parent, child) {
  parent.appendChild(child)
};
goog.dom.append = function(parent, var_args) {
  goog.dom.append_(goog.dom.getOwnerDocument(parent), parent, arguments, 1)
};
goog.dom.removeChildren = function(node) {
  var child;
  while(child = node.firstChild) {
    node.removeChild(child)
  }
};
goog.dom.insertSiblingBefore = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode)
  }
};
goog.dom.insertSiblingAfter = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode.nextSibling)
  }
};
goog.dom.insertChildAt = function(parent, child, index) {
  parent.insertBefore(child, parent.childNodes[index] || null)
};
goog.dom.removeNode = function(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null
};
goog.dom.replaceNode = function(newNode, oldNode) {
  var parent = oldNode.parentNode;
  if(parent) {
    parent.replaceChild(newNode, oldNode)
  }
};
goog.dom.flattenElement = function(element) {
  var child, parent = element.parentNode;
  if(parent && parent.nodeType != goog.dom.NodeType.DOCUMENT_FRAGMENT) {
    if(element.removeNode) {
      return element.removeNode(false)
    }else {
      while(child = element.firstChild) {
        parent.insertBefore(child, element)
      }
      return goog.dom.removeNode(element)
    }
  }
};
goog.dom.getChildren = function(element) {
  if(goog.dom.BrowserFeature.CAN_USE_CHILDREN_ATTRIBUTE && element.children != undefined) {
    return element.children
  }
  return goog.array.filter(element.childNodes, function(node) {
    return node.nodeType == goog.dom.NodeType.ELEMENT
  })
};
goog.dom.getFirstElementChild = function(node) {
  if(node.firstElementChild != undefined) {
    return node.firstElementChild
  }
  return goog.dom.getNextElementNode_(node.firstChild, true)
};
goog.dom.getLastElementChild = function(node) {
  if(node.lastElementChild != undefined) {
    return node.lastElementChild
  }
  return goog.dom.getNextElementNode_(node.lastChild, false)
};
goog.dom.getNextElementSibling = function(node) {
  if(node.nextElementSibling != undefined) {
    return node.nextElementSibling
  }
  return goog.dom.getNextElementNode_(node.nextSibling, true)
};
goog.dom.getPreviousElementSibling = function(node) {
  if(node.previousElementSibling != undefined) {
    return node.previousElementSibling
  }
  return goog.dom.getNextElementNode_(node.previousSibling, false)
};
goog.dom.getNextElementNode_ = function(node, forward) {
  while(node && node.nodeType != goog.dom.NodeType.ELEMENT) {
    node = forward ? node.nextSibling : node.previousSibling
  }
  return node
};
goog.dom.getNextNode = function(node) {
  if(!node) {
    return null
  }
  if(node.firstChild) {
    return node.firstChild
  }
  while(node && !node.nextSibling) {
    node = node.parentNode
  }
  return node ? node.nextSibling : null
};
goog.dom.getPreviousNode = function(node) {
  if(!node) {
    return null
  }
  if(!node.previousSibling) {
    return node.parentNode
  }
  node = node.previousSibling;
  while(node && node.lastChild) {
    node = node.lastChild
  }
  return node
};
goog.dom.isNodeLike = function(obj) {
  return goog.isObject(obj) && obj.nodeType > 0
};
goog.dom.isWindow = function(obj) {
  return goog.isObject(obj) && obj["window"] == obj
};
goog.dom.contains = function(parent, descendant) {
  if(parent.contains && descendant.nodeType == goog.dom.NodeType.ELEMENT) {
    return parent == descendant || parent.contains(descendant)
  }
  if(typeof parent.compareDocumentPosition != "undefined") {
    return parent == descendant || Boolean(parent.compareDocumentPosition(descendant) & 16)
  }
  while(descendant && parent != descendant) {
    descendant = descendant.parentNode
  }
  return descendant == parent
};
goog.dom.compareNodeOrder = function(node1, node2) {
  if(node1 == node2) {
    return 0
  }
  if(node1.compareDocumentPosition) {
    return node1.compareDocumentPosition(node2) & 2 ? 1 : -1
  }
  if("sourceIndex" in node1 || node1.parentNode && "sourceIndex" in node1.parentNode) {
    var isElement1 = node1.nodeType == goog.dom.NodeType.ELEMENT;
    var isElement2 = node2.nodeType == goog.dom.NodeType.ELEMENT;
    if(isElement1 && isElement2) {
      return node1.sourceIndex - node2.sourceIndex
    }else {
      var parent1 = node1.parentNode;
      var parent2 = node2.parentNode;
      if(parent1 == parent2) {
        return goog.dom.compareSiblingOrder_(node1, node2)
      }
      if(!isElement1 && goog.dom.contains(parent1, node2)) {
        return-1 * goog.dom.compareParentsDescendantNodeIe_(node1, node2)
      }
      if(!isElement2 && goog.dom.contains(parent2, node1)) {
        return goog.dom.compareParentsDescendantNodeIe_(node2, node1)
      }
      return(isElement1 ? node1.sourceIndex : parent1.sourceIndex) - (isElement2 ? node2.sourceIndex : parent2.sourceIndex)
    }
  }
  var doc = goog.dom.getOwnerDocument(node1);
  var range1, range2;
  range1 = doc.createRange();
  range1.selectNode(node1);
  range1.collapse(true);
  range2 = doc.createRange();
  range2.selectNode(node2);
  range2.collapse(true);
  return range1.compareBoundaryPoints(goog.global["Range"].START_TO_END, range2)
};
goog.dom.compareParentsDescendantNodeIe_ = function(textNode, node) {
  var parent = textNode.parentNode;
  if(parent == node) {
    return-1
  }
  var sibling = node;
  while(sibling.parentNode != parent) {
    sibling = sibling.parentNode
  }
  return goog.dom.compareSiblingOrder_(sibling, textNode)
};
goog.dom.compareSiblingOrder_ = function(node1, node2) {
  var s = node2;
  while(s = s.previousSibling) {
    if(s == node1) {
      return-1
    }
  }
  return 1
};
goog.dom.findCommonAncestor = function(var_args) {
  var i, count = arguments.length;
  if(!count) {
    return null
  }else {
    if(count == 1) {
      return arguments[0]
    }
  }
  var paths = [];
  var minLength = Infinity;
  for(i = 0;i < count;i++) {
    var ancestors = [];
    var node = arguments[i];
    while(node) {
      ancestors.unshift(node);
      node = node.parentNode
    }
    paths.push(ancestors);
    minLength = Math.min(minLength, ancestors.length)
  }
  var output = null;
  for(i = 0;i < minLength;i++) {
    var first = paths[0][i];
    for(var j = 1;j < count;j++) {
      if(first != paths[j][i]) {
        return output
      }
    }
    output = first
  }
  return output
};
goog.dom.getOwnerDocument = function(node) {
  return node.nodeType == goog.dom.NodeType.DOCUMENT ? node : node.ownerDocument || node.document
};
goog.dom.getFrameContentDocument = function(frame) {
  var doc;
  if(goog.userAgent.WEBKIT) {
    doc = frame.document || frame.contentWindow.document
  }else {
    doc = frame.contentDocument || frame.contentWindow.document
  }
  return doc
};
goog.dom.getFrameContentWindow = function(frame) {
  return frame.contentWindow || goog.dom.getWindow_(goog.dom.getFrameContentDocument(frame))
};
goog.dom.setTextContent = function(element, text) {
  if("textContent" in element) {
    element.textContent = text
  }else {
    if(element.firstChild && element.firstChild.nodeType == goog.dom.NodeType.TEXT) {
      while(element.lastChild != element.firstChild) {
        element.removeChild(element.lastChild)
      }
      element.firstChild.data = text
    }else {
      goog.dom.removeChildren(element);
      var doc = goog.dom.getOwnerDocument(element);
      element.appendChild(doc.createTextNode(text))
    }
  }
};
goog.dom.getOuterHtml = function(element) {
  if("outerHTML" in element) {
    return element.outerHTML
  }else {
    var doc = goog.dom.getOwnerDocument(element);
    var div = doc.createElement("div");
    div.appendChild(element.cloneNode(true));
    return div.innerHTML
  }
};
goog.dom.findNode = function(root, p) {
  var rv = [];
  var found = goog.dom.findNodes_(root, p, rv, true);
  return found ? rv[0] : undefined
};
goog.dom.findNodes = function(root, p) {
  var rv = [];
  goog.dom.findNodes_(root, p, rv, false);
  return rv
};
goog.dom.findNodes_ = function(root, p, rv, findOne) {
  if(root != null) {
    for(var i = 0, child;child = root.childNodes[i];i++) {
      if(p(child)) {
        rv.push(child);
        if(findOne) {
          return true
        }
      }
      if(goog.dom.findNodes_(child, p, rv, findOne)) {
        return true
      }
    }
  }
  return false
};
goog.dom.TAGS_TO_IGNORE_ = {"SCRIPT":1, "STYLE":1, "HEAD":1, "IFRAME":1, "OBJECT":1};
goog.dom.PREDEFINED_TAG_VALUES_ = {"IMG":" ", "BR":"\n"};
goog.dom.isFocusableTabIndex = function(element) {
  var attrNode = element.getAttributeNode("tabindex");
  if(attrNode && attrNode.specified) {
    var index = element.tabIndex;
    return goog.isNumber(index) && index >= 0
  }
  return false
};
goog.dom.setFocusableTabIndex = function(element, enable) {
  if(enable) {
    element.tabIndex = 0
  }else {
    element.removeAttribute("tabIndex")
  }
};
goog.dom.getTextContent = function(node) {
  var textContent;
  if(goog.dom.BrowserFeature.CAN_USE_INNER_TEXT && "innerText" in node) {
    textContent = goog.string.canonicalizeNewlines(node.innerText)
  }else {
    var buf = [];
    goog.dom.getTextContent_(node, buf, true);
    textContent = buf.join("")
  }
  textContent = textContent.replace(/ \xAD /g, " ").replace(/\xAD/g, "");
  textContent = textContent.replace(/\u200B/g, "");
  if(!goog.userAgent.IE) {
    textContent = textContent.replace(/ +/g, " ")
  }
  if(textContent != " ") {
    textContent = textContent.replace(/^\s*/, "")
  }
  return textContent
};
goog.dom.getRawTextContent = function(node) {
  var buf = [];
  goog.dom.getTextContent_(node, buf, false);
  return buf.join("")
};
goog.dom.getTextContent_ = function(node, buf, normalizeWhitespace) {
  if(node.nodeName in goog.dom.TAGS_TO_IGNORE_) {
  }else {
    if(node.nodeType == goog.dom.NodeType.TEXT) {
      if(normalizeWhitespace) {
        buf.push(String(node.nodeValue).replace(/(\r\n|\r|\n)/g, ""))
      }else {
        buf.push(node.nodeValue)
      }
    }else {
      if(node.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
        buf.push(goog.dom.PREDEFINED_TAG_VALUES_[node.nodeName])
      }else {
        var child = node.firstChild;
        while(child) {
          goog.dom.getTextContent_(child, buf, normalizeWhitespace);
          child = child.nextSibling
        }
      }
    }
  }
};
goog.dom.getNodeTextLength = function(node) {
  return goog.dom.getTextContent(node).length
};
goog.dom.getNodeTextOffset = function(node, opt_offsetParent) {
  var root = opt_offsetParent || goog.dom.getOwnerDocument(node).body;
  var buf = [];
  while(node && node != root) {
    var cur = node;
    while(cur = cur.previousSibling) {
      buf.unshift(goog.dom.getTextContent(cur))
    }
    node = node.parentNode
  }
  return goog.string.trimLeft(buf.join("")).replace(/ +/g, " ").length
};
goog.dom.getNodeAtOffset = function(parent, offset, opt_result) {
  var stack = [parent], pos = 0, cur;
  while(stack.length > 0 && pos < offset) {
    cur = stack.pop();
    if(cur.nodeName in goog.dom.TAGS_TO_IGNORE_) {
    }else {
      if(cur.nodeType == goog.dom.NodeType.TEXT) {
        var text = cur.nodeValue.replace(/(\r\n|\r|\n)/g, "").replace(/ +/g, " ");
        pos += text.length
      }else {
        if(cur.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
          pos += goog.dom.PREDEFINED_TAG_VALUES_[cur.nodeName].length
        }else {
          for(var i = cur.childNodes.length - 1;i >= 0;i--) {
            stack.push(cur.childNodes[i])
          }
        }
      }
    }
  }
  if(goog.isObject(opt_result)) {
    opt_result.remainder = cur ? cur.nodeValue.length + offset - pos - 1 : 0;
    opt_result.node = cur
  }
  return cur
};
goog.dom.isNodeList = function(val) {
  if(val && typeof val.length == "number") {
    if(goog.isObject(val)) {
      return typeof val.item == "function" || typeof val.item == "string"
    }else {
      if(goog.isFunction(val)) {
        return typeof val.item == "function"
      }
    }
  }
  return false
};
goog.dom.getAncestorByTagNameAndClass = function(element, opt_tag, opt_class) {
  var tagName = opt_tag ? opt_tag.toUpperCase() : null;
  return goog.dom.getAncestor(element, function(node) {
    return(!tagName || node.nodeName == tagName) && (!opt_class || goog.dom.classes.has(node, opt_class))
  }, true)
};
goog.dom.getAncestorByClass = function(element, opt_class) {
  return goog.dom.getAncestorByTagNameAndClass(element, null, opt_class)
};
goog.dom.getAncestor = function(element, matcher, opt_includeNode, opt_maxSearchSteps) {
  if(!opt_includeNode) {
    element = element.parentNode
  }
  var ignoreSearchSteps = opt_maxSearchSteps == null;
  var steps = 0;
  while(element && (ignoreSearchSteps || steps <= opt_maxSearchSteps)) {
    if(matcher(element)) {
      return element
    }
    element = element.parentNode;
    steps++
  }
  return null
};
goog.dom.DomHelper = function(opt_document) {
  this.document_ = opt_document || goog.global.document || document
};
goog.dom.DomHelper.prototype.getDomHelper = goog.dom.getDomHelper;
goog.dom.DomHelper.prototype.setDocument = function(document) {
  this.document_ = document
};
goog.dom.DomHelper.prototype.getDocument = function() {
  return this.document_
};
goog.dom.DomHelper.prototype.getElement = function(element) {
  if(goog.isString(element)) {
    return this.document_.getElementById(element)
  }else {
    return element
  }
};
goog.dom.DomHelper.prototype.$ = goog.dom.DomHelper.prototype.getElement;
goog.dom.DomHelper.prototype.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(this.document_, opt_tag, opt_class, opt_el)
};
goog.dom.DomHelper.prototype.getElementsByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementsByClass(className, doc)
};
goog.dom.DomHelper.prototype.getElementByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementByClass(className, doc)
};
goog.dom.DomHelper.prototype.$$ = goog.dom.DomHelper.prototype.getElementsByTagNameAndClass;
goog.dom.DomHelper.prototype.setProperties = goog.dom.setProperties;
goog.dom.DomHelper.prototype.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize(opt_window || this.getWindow())
};
goog.dom.DomHelper.prototype.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(this.getWindow())
};
goog.dom.Appendable;
goog.dom.DomHelper.prototype.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(this.document_, arguments)
};
goog.dom.DomHelper.prototype.$dom = goog.dom.DomHelper.prototype.createDom;
goog.dom.DomHelper.prototype.createElement = function(name) {
  return this.document_.createElement(name)
};
goog.dom.DomHelper.prototype.createTextNode = function(content) {
  return this.document_.createTextNode(content)
};
goog.dom.DomHelper.prototype.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(this.document_, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.DomHelper.prototype.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(this.document_, htmlString)
};
goog.dom.DomHelper.prototype.getCompatMode = function() {
  return this.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.DomHelper.prototype.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(this.document_)
};
goog.dom.DomHelper.prototype.getWindow = function() {
  return goog.dom.getWindow_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(this.document_)
};
goog.dom.DomHelper.prototype.appendChild = goog.dom.appendChild;
goog.dom.DomHelper.prototype.append = goog.dom.append;
goog.dom.DomHelper.prototype.removeChildren = goog.dom.removeChildren;
goog.dom.DomHelper.prototype.insertSiblingBefore = goog.dom.insertSiblingBefore;
goog.dom.DomHelper.prototype.insertSiblingAfter = goog.dom.insertSiblingAfter;
goog.dom.DomHelper.prototype.removeNode = goog.dom.removeNode;
goog.dom.DomHelper.prototype.replaceNode = goog.dom.replaceNode;
goog.dom.DomHelper.prototype.flattenElement = goog.dom.flattenElement;
goog.dom.DomHelper.prototype.getFirstElementChild = goog.dom.getFirstElementChild;
goog.dom.DomHelper.prototype.getLastElementChild = goog.dom.getLastElementChild;
goog.dom.DomHelper.prototype.getNextElementSibling = goog.dom.getNextElementSibling;
goog.dom.DomHelper.prototype.getPreviousElementSibling = goog.dom.getPreviousElementSibling;
goog.dom.DomHelper.prototype.getNextNode = goog.dom.getNextNode;
goog.dom.DomHelper.prototype.getPreviousNode = goog.dom.getPreviousNode;
goog.dom.DomHelper.prototype.isNodeLike = goog.dom.isNodeLike;
goog.dom.DomHelper.prototype.contains = goog.dom.contains;
goog.dom.DomHelper.prototype.getOwnerDocument = goog.dom.getOwnerDocument;
goog.dom.DomHelper.prototype.getFrameContentDocument = goog.dom.getFrameContentDocument;
goog.dom.DomHelper.prototype.getFrameContentWindow = goog.dom.getFrameContentWindow;
goog.dom.DomHelper.prototype.setTextContent = goog.dom.setTextContent;
goog.dom.DomHelper.prototype.findNode = goog.dom.findNode;
goog.dom.DomHelper.prototype.findNodes = goog.dom.findNodes;
goog.dom.DomHelper.prototype.getTextContent = goog.dom.getTextContent;
goog.dom.DomHelper.prototype.getNodeTextLength = goog.dom.getNodeTextLength;
goog.dom.DomHelper.prototype.getNodeTextOffset = goog.dom.getNodeTextOffset;
goog.dom.DomHelper.prototype.getAncestorByTagNameAndClass = goog.dom.getAncestorByTagNameAndClass;
goog.dom.DomHelper.prototype.getAncestor = goog.dom.getAncestor;
goog.provide("domina.support");
goog.require("cljs.core");
goog.require("goog.events");
goog.require("goog.dom");
var div__10422 = document.createElement("div");
var test_html__10423 = "   <link/><table></table><a href='/a' style='top:1px;float:left;opacity:.55;'>a</a><input type='checkbox'/>";
div__10422.innerHTML = test_html__10423;
domina.support.leading_whitespace_QMARK_ = cljs.core._EQ_.call(null, div__10422.firstChild.nodeType, 3);
domina.support.extraneous_tbody_QMARK_ = cljs.core._EQ_.call(null, div__10422.getElementsByTagName("tbody").length, 0);
domina.support.unscoped_html_elements_QMARK_ = cljs.core._EQ_.call(null, div__10422.getElementsByTagName("link").length, 0);
goog.provide("goog.dom.xml");
goog.require("goog.dom");
goog.require("goog.dom.NodeType");
goog.dom.xml.MAX_XML_SIZE_KB = 2 * 1024;
goog.dom.xml.MAX_ELEMENT_DEPTH = 256;
goog.dom.xml.createDocument = function(opt_rootTagName, opt_namespaceUri) {
  if(opt_namespaceUri && !opt_rootTagName) {
    throw Error("Can't create document with namespace and no root tag");
  }
  if(document.implementation && document.implementation.createDocument) {
    return document.implementation.createDocument(opt_namespaceUri || "", opt_rootTagName || "", null)
  }else {
    if(typeof ActiveXObject != "undefined") {
      var doc = goog.dom.xml.createMsXmlDocument_();
      if(doc) {
        if(opt_rootTagName) {
          doc.appendChild(doc.createNode(goog.dom.NodeType.ELEMENT, opt_rootTagName, opt_namespaceUri || ""))
        }
        return doc
      }
    }
  }
  throw Error("Your browser does not support creating new documents");
};
goog.dom.xml.loadXml = function(xml) {
  if(typeof DOMParser != "undefined") {
    return(new DOMParser).parseFromString(xml, "application/xml")
  }else {
    if(typeof ActiveXObject != "undefined") {
      var doc = goog.dom.xml.createMsXmlDocument_();
      doc.loadXML(xml);
      return doc
    }
  }
  throw Error("Your browser does not support loading xml documents");
};
goog.dom.xml.serialize = function(xml) {
  if(typeof XMLSerializer != "undefined") {
    return(new XMLSerializer).serializeToString(xml)
  }
  var text = xml.xml;
  if(text) {
    return text
  }
  throw Error("Your browser does not support serializing XML documents");
};
goog.dom.xml.selectSingleNode = function(node, path) {
  if(typeof node.selectSingleNode != "undefined") {
    var doc = goog.dom.getOwnerDocument(node);
    if(typeof doc.setProperty != "undefined") {
      doc.setProperty("SelectionLanguage", "XPath")
    }
    return node.selectSingleNode(path)
  }else {
    if(document.implementation.hasFeature("XPath", "3.0")) {
      var doc = goog.dom.getOwnerDocument(node);
      var resolver = doc.createNSResolver(doc.documentElement);
      var result = doc.evaluate(path, node, resolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      return result.singleNodeValue
    }
  }
  return null
};
goog.dom.xml.selectNodes = function(node, path) {
  if(typeof node.selectNodes != "undefined") {
    var doc = goog.dom.getOwnerDocument(node);
    if(typeof doc.setProperty != "undefined") {
      doc.setProperty("SelectionLanguage", "XPath")
    }
    return node.selectNodes(path)
  }else {
    if(document.implementation.hasFeature("XPath", "3.0")) {
      var doc = goog.dom.getOwnerDocument(node);
      var resolver = doc.createNSResolver(doc.documentElement);
      var nodes = doc.evaluate(path, node, resolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      var results = [];
      var count = nodes.snapshotLength;
      for(var i = 0;i < count;i++) {
        results.push(nodes.snapshotItem(i))
      }
      return results
    }else {
      return[]
    }
  }
};
goog.dom.xml.createMsXmlDocument_ = function() {
  var doc = new ActiveXObject("MSXML2.DOMDocument");
  if(doc) {
    doc.resolveExternals = false;
    doc.validateOnParse = false;
    try {
      doc.setProperty("ProhibitDTD", true);
      doc.setProperty("MaxXMLSize", goog.dom.xml.MAX_XML_SIZE_KB);
      doc.setProperty("MaxElementDepth", goog.dom.xml.MAX_ELEMENT_DEPTH)
    }catch(e) {
    }
  }
  return doc
};
goog.provide("goog.iter");
goog.provide("goog.iter.Iterator");
goog.provide("goog.iter.StopIteration");
goog.require("goog.array");
goog.require("goog.asserts");
goog.iter.Iterable;
if("StopIteration" in goog.global) {
  goog.iter.StopIteration = goog.global["StopIteration"]
}else {
  goog.iter.StopIteration = Error("StopIteration")
}
goog.iter.Iterator = function() {
};
goog.iter.Iterator.prototype.next = function() {
  throw goog.iter.StopIteration;
};
goog.iter.Iterator.prototype.__iterator__ = function(opt_keys) {
  return this
};
goog.iter.toIterator = function(iterable) {
  if(iterable instanceof goog.iter.Iterator) {
    return iterable
  }
  if(typeof iterable.__iterator__ == "function") {
    return iterable.__iterator__(false)
  }
  if(goog.isArrayLike(iterable)) {
    var i = 0;
    var newIter = new goog.iter.Iterator;
    newIter.next = function() {
      while(true) {
        if(i >= iterable.length) {
          throw goog.iter.StopIteration;
        }
        if(!(i in iterable)) {
          i++;
          continue
        }
        return iterable[i++]
      }
    };
    return newIter
  }
  throw Error("Not implemented");
};
goog.iter.forEach = function(iterable, f, opt_obj) {
  if(goog.isArrayLike(iterable)) {
    try {
      goog.array.forEach(iterable, f, opt_obj)
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }else {
    iterable = goog.iter.toIterator(iterable);
    try {
      while(true) {
        f.call(opt_obj, iterable.next(), undefined, iterable)
      }
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }
};
goog.iter.filter = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      var val = iterable.next();
      if(f.call(opt_obj, val, undefined, iterable)) {
        return val
      }
    }
  };
  return newIter
};
goog.iter.range = function(startOrStop, opt_stop, opt_step) {
  var start = 0;
  var stop = startOrStop;
  var step = opt_step || 1;
  if(arguments.length > 1) {
    start = startOrStop;
    stop = opt_stop
  }
  if(step == 0) {
    throw Error("Range step argument must not be zero");
  }
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    if(step > 0 && start >= stop || step < 0 && start <= stop) {
      throw goog.iter.StopIteration;
    }
    var rv = start;
    start += step;
    return rv
  };
  return newIter
};
goog.iter.join = function(iterable, deliminator) {
  return goog.iter.toArray(iterable).join(deliminator)
};
goog.iter.map = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      var val = iterable.next();
      return f.call(opt_obj, val, undefined, iterable)
    }
  };
  return newIter
};
goog.iter.reduce = function(iterable, f, val, opt_obj) {
  var rval = val;
  goog.iter.forEach(iterable, function(val) {
    rval = f.call(opt_obj, rval, val)
  });
  return rval
};
goog.iter.some = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    while(true) {
      if(f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return true
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return false
};
goog.iter.every = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    while(true) {
      if(!f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return false
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return true
};
goog.iter.chain = function(var_args) {
  var args = arguments;
  var length = args.length;
  var i = 0;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    try {
      if(i >= length) {
        throw goog.iter.StopIteration;
      }
      var current = goog.iter.toIterator(args[i]);
      return current.next()
    }catch(ex) {
      if(ex !== goog.iter.StopIteration || i >= length) {
        throw ex;
      }else {
        i++;
        return this.next()
      }
    }
  };
  return newIter
};
goog.iter.dropWhile = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var dropping = true;
  newIter.next = function() {
    while(true) {
      var val = iterable.next();
      if(dropping && f.call(opt_obj, val, undefined, iterable)) {
        continue
      }else {
        dropping = false
      }
      return val
    }
  };
  return newIter
};
goog.iter.takeWhile = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var taking = true;
  newIter.next = function() {
    while(true) {
      if(taking) {
        var val = iterable.next();
        if(f.call(opt_obj, val, undefined, iterable)) {
          return val
        }else {
          taking = false
        }
      }else {
        throw goog.iter.StopIteration;
      }
    }
  };
  return newIter
};
goog.iter.toArray = function(iterable) {
  if(goog.isArrayLike(iterable)) {
    return goog.array.toArray(iterable)
  }
  iterable = goog.iter.toIterator(iterable);
  var array = [];
  goog.iter.forEach(iterable, function(val) {
    array.push(val)
  });
  return array
};
goog.iter.equals = function(iterable1, iterable2) {
  iterable1 = goog.iter.toIterator(iterable1);
  iterable2 = goog.iter.toIterator(iterable2);
  var b1, b2;
  try {
    while(true) {
      b1 = b2 = false;
      var val1 = iterable1.next();
      b1 = true;
      var val2 = iterable2.next();
      b2 = true;
      if(val1 != val2) {
        return false
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }else {
      if(b1 && !b2) {
        return false
      }
      if(!b2) {
        try {
          val2 = iterable2.next();
          return false
        }catch(ex1) {
          if(ex1 !== goog.iter.StopIteration) {
            throw ex1;
          }
          return true
        }
      }
    }
  }
  return false
};
goog.iter.nextOrValue = function(iterable, defaultValue) {
  try {
    return goog.iter.toIterator(iterable).next()
  }catch(e) {
    if(e != goog.iter.StopIteration) {
      throw e;
    }
    return defaultValue
  }
};
goog.iter.product = function(var_args) {
  var someArrayEmpty = goog.array.some(arguments, function(arr) {
    return!arr.length
  });
  if(someArrayEmpty || !arguments.length) {
    return new goog.iter.Iterator
  }
  var iter = new goog.iter.Iterator;
  var arrays = arguments;
  var indicies = goog.array.repeat(0, arrays.length);
  iter.next = function() {
    if(indicies) {
      var retVal = goog.array.map(indicies, function(valueIndex, arrayIndex) {
        return arrays[arrayIndex][valueIndex]
      });
      for(var i = indicies.length - 1;i >= 0;i--) {
        goog.asserts.assert(indicies);
        if(indicies[i] < arrays[i].length - 1) {
          indicies[i]++;
          break
        }
        if(i == 0) {
          indicies = null;
          break
        }
        indicies[i] = 0
      }
      return retVal
    }
    throw goog.iter.StopIteration;
  };
  return iter
};
goog.provide("goog.structs");
goog.require("goog.array");
goog.require("goog.object");
goog.structs.getCount = function(col) {
  if(typeof col.getCount == "function") {
    return col.getCount()
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return col.length
  }
  return goog.object.getCount(col)
};
goog.structs.getValues = function(col) {
  if(typeof col.getValues == "function") {
    return col.getValues()
  }
  if(goog.isString(col)) {
    return col.split("")
  }
  if(goog.isArrayLike(col)) {
    var rv = [];
    var l = col.length;
    for(var i = 0;i < l;i++) {
      rv.push(col[i])
    }
    return rv
  }
  return goog.object.getValues(col)
};
goog.structs.getKeys = function(col) {
  if(typeof col.getKeys == "function") {
    return col.getKeys()
  }
  if(typeof col.getValues == "function") {
    return undefined
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    var rv = [];
    var l = col.length;
    for(var i = 0;i < l;i++) {
      rv.push(i)
    }
    return rv
  }
  return goog.object.getKeys(col)
};
goog.structs.contains = function(col, val) {
  if(typeof col.contains == "function") {
    return col.contains(val)
  }
  if(typeof col.containsValue == "function") {
    return col.containsValue(val)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.contains(col, val)
  }
  return goog.object.containsValue(col, val)
};
goog.structs.isEmpty = function(col) {
  if(typeof col.isEmpty == "function") {
    return col.isEmpty()
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.isEmpty(col)
  }
  return goog.object.isEmpty(col)
};
goog.structs.clear = function(col) {
  if(typeof col.clear == "function") {
    col.clear()
  }else {
    if(goog.isArrayLike(col)) {
      goog.array.clear(col)
    }else {
      goog.object.clear(col)
    }
  }
};
goog.structs.forEach = function(col, f, opt_obj) {
  if(typeof col.forEach == "function") {
    col.forEach(f, opt_obj)
  }else {
    if(goog.isArrayLike(col) || goog.isString(col)) {
      goog.array.forEach(col, f, opt_obj)
    }else {
      var keys = goog.structs.getKeys(col);
      var values = goog.structs.getValues(col);
      var l = values.length;
      for(var i = 0;i < l;i++) {
        f.call(opt_obj, values[i], keys && keys[i], col)
      }
    }
  }
};
goog.structs.filter = function(col, f, opt_obj) {
  if(typeof col.filter == "function") {
    return col.filter(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.filter(col, f, opt_obj)
  }
  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      if(f.call(opt_obj, values[i], keys[i], col)) {
        rv[keys[i]] = values[i]
      }
    }
  }else {
    rv = [];
    for(var i = 0;i < l;i++) {
      if(f.call(opt_obj, values[i], undefined, col)) {
        rv.push(values[i])
      }
    }
  }
  return rv
};
goog.structs.map = function(col, f, opt_obj) {
  if(typeof col.map == "function") {
    return col.map(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.map(col, f, opt_obj)
  }
  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      rv[keys[i]] = f.call(opt_obj, values[i], keys[i], col)
    }
  }else {
    rv = [];
    for(var i = 0;i < l;i++) {
      rv[i] = f.call(opt_obj, values[i], undefined, col)
    }
  }
  return rv
};
goog.structs.some = function(col, f, opt_obj) {
  if(typeof col.some == "function") {
    return col.some(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.some(col, f, opt_obj)
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    if(f.call(opt_obj, values[i], keys && keys[i], col)) {
      return true
    }
  }
  return false
};
goog.structs.every = function(col, f, opt_obj) {
  if(typeof col.every == "function") {
    return col.every(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.every(col, f, opt_obj)
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    if(!f.call(opt_obj, values[i], keys && keys[i], col)) {
      return false
    }
  }
  return true
};
goog.provide("goog.structs.Map");
goog.require("goog.iter.Iterator");
goog.require("goog.iter.StopIteration");
goog.require("goog.object");
goog.require("goog.structs");
goog.structs.Map = function(opt_map, var_args) {
  this.map_ = {};
  this.keys_ = [];
  var argLength = arguments.length;
  if(argLength > 1) {
    if(argLength % 2) {
      throw Error("Uneven number of arguments");
    }
    for(var i = 0;i < argLength;i += 2) {
      this.set(arguments[i], arguments[i + 1])
    }
  }else {
    if(opt_map) {
      this.addAll(opt_map)
    }
  }
};
goog.structs.Map.prototype.count_ = 0;
goog.structs.Map.prototype.version_ = 0;
goog.structs.Map.prototype.getCount = function() {
  return this.count_
};
goog.structs.Map.prototype.getValues = function() {
  this.cleanupKeysArray_();
  var rv = [];
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    rv.push(this.map_[key])
  }
  return rv
};
goog.structs.Map.prototype.getKeys = function() {
  this.cleanupKeysArray_();
  return this.keys_.concat()
};
goog.structs.Map.prototype.containsKey = function(key) {
  return goog.structs.Map.hasKey_(this.map_, key)
};
goog.structs.Map.prototype.containsValue = function(val) {
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    if(goog.structs.Map.hasKey_(this.map_, key) && this.map_[key] == val) {
      return true
    }
  }
  return false
};
goog.structs.Map.prototype.equals = function(otherMap, opt_equalityFn) {
  if(this === otherMap) {
    return true
  }
  if(this.count_ != otherMap.getCount()) {
    return false
  }
  var equalityFn = opt_equalityFn || goog.structs.Map.defaultEquals;
  this.cleanupKeysArray_();
  for(var key, i = 0;key = this.keys_[i];i++) {
    if(!equalityFn(this.get(key), otherMap.get(key))) {
      return false
    }
  }
  return true
};
goog.structs.Map.defaultEquals = function(a, b) {
  return a === b
};
goog.structs.Map.prototype.isEmpty = function() {
  return this.count_ == 0
};
goog.structs.Map.prototype.clear = function() {
  this.map_ = {};
  this.keys_.length = 0;
  this.count_ = 0;
  this.version_ = 0
};
goog.structs.Map.prototype.remove = function(key) {
  if(goog.structs.Map.hasKey_(this.map_, key)) {
    delete this.map_[key];
    this.count_--;
    this.version_++;
    if(this.keys_.length > 2 * this.count_) {
      this.cleanupKeysArray_()
    }
    return true
  }
  return false
};
goog.structs.Map.prototype.cleanupKeysArray_ = function() {
  if(this.count_ != this.keys_.length) {
    var srcIndex = 0;
    var destIndex = 0;
    while(srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if(goog.structs.Map.hasKey_(this.map_, key)) {
        this.keys_[destIndex++] = key
      }
      srcIndex++
    }
    this.keys_.length = destIndex
  }
  if(this.count_ != this.keys_.length) {
    var seen = {};
    var srcIndex = 0;
    var destIndex = 0;
    while(srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if(!goog.structs.Map.hasKey_(seen, key)) {
        this.keys_[destIndex++] = key;
        seen[key] = 1
      }
      srcIndex++
    }
    this.keys_.length = destIndex
  }
};
goog.structs.Map.prototype.get = function(key, opt_val) {
  if(goog.structs.Map.hasKey_(this.map_, key)) {
    return this.map_[key]
  }
  return opt_val
};
goog.structs.Map.prototype.set = function(key, value) {
  if(!goog.structs.Map.hasKey_(this.map_, key)) {
    this.count_++;
    this.keys_.push(key);
    this.version_++
  }
  this.map_[key] = value
};
goog.structs.Map.prototype.addAll = function(map) {
  var keys, values;
  if(map instanceof goog.structs.Map) {
    keys = map.getKeys();
    values = map.getValues()
  }else {
    keys = goog.object.getKeys(map);
    values = goog.object.getValues(map)
  }
  for(var i = 0;i < keys.length;i++) {
    this.set(keys[i], values[i])
  }
};
goog.structs.Map.prototype.clone = function() {
  return new goog.structs.Map(this)
};
goog.structs.Map.prototype.transpose = function() {
  var transposed = new goog.structs.Map;
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    var value = this.map_[key];
    transposed.set(value, key)
  }
  return transposed
};
goog.structs.Map.prototype.toObject = function() {
  this.cleanupKeysArray_();
  var obj = {};
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    obj[key] = this.map_[key]
  }
  return obj
};
goog.structs.Map.prototype.getKeyIterator = function() {
  return this.__iterator__(true)
};
goog.structs.Map.prototype.getValueIterator = function() {
  return this.__iterator__(false)
};
goog.structs.Map.prototype.__iterator__ = function(opt_keys) {
  this.cleanupKeysArray_();
  var i = 0;
  var keys = this.keys_;
  var map = this.map_;
  var version = this.version_;
  var selfObj = this;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      if(version != selfObj.version_) {
        throw Error("The map has changed since the iterator was created");
      }
      if(i >= keys.length) {
        throw goog.iter.StopIteration;
      }
      var key = keys[i++];
      return opt_keys ? key : map[key]
    }
  };
  return newIter
};
goog.structs.Map.hasKey_ = function(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
};
goog.provide("goog.dom.forms");
goog.require("goog.structs.Map");
goog.dom.forms.getFormDataMap = function(form) {
  var map = new goog.structs.Map;
  goog.dom.forms.getFormDataHelper_(form, map, goog.dom.forms.addFormDataToMap_);
  return map
};
goog.dom.forms.getFormDataString = function(form) {
  var sb = [];
  goog.dom.forms.getFormDataHelper_(form, sb, goog.dom.forms.addFormDataToStringBuffer_);
  return sb.join("&")
};
goog.dom.forms.getFormDataHelper_ = function(form, result, fnAppend) {
  var els = form.elements;
  for(var el, i = 0;el = els[i];i++) {
    if(el.disabled || el.tagName.toLowerCase() == "fieldset") {
      continue
    }
    var name = el.name;
    var type = el.type.toLowerCase();
    switch(type) {
      case "file":
      ;
      case "submit":
      ;
      case "reset":
      ;
      case "button":
        break;
      case "select-multiple":
        var values = goog.dom.forms.getValue(el);
        if(values != null) {
          for(var value, j = 0;value = values[j];j++) {
            fnAppend(result, name, value)
          }
        }
        break;
      default:
        var value = goog.dom.forms.getValue(el);
        if(value != null) {
          fnAppend(result, name, value)
        }
    }
  }
  var inputs = form.getElementsByTagName("input");
  for(var input, i = 0;input = inputs[i];i++) {
    if(input.form == form && input.type.toLowerCase() == "image") {
      name = input.name;
      fnAppend(result, name, input.value);
      fnAppend(result, name + ".x", "0");
      fnAppend(result, name + ".y", "0")
    }
  }
};
goog.dom.forms.addFormDataToMap_ = function(map, name, value) {
  var array = map.get(name);
  if(!array) {
    array = [];
    map.set(name, array)
  }
  array.push(value)
};
goog.dom.forms.addFormDataToStringBuffer_ = function(sb, name, value) {
  sb.push(encodeURIComponent(name) + "=" + encodeURIComponent(value))
};
goog.dom.forms.hasFileInput = function(form) {
  var els = form.elements;
  for(var el, i = 0;el = els[i];i++) {
    if(!el.disabled && el.type && el.type.toLowerCase() == "file") {
      return true
    }
  }
  return false
};
goog.dom.forms.setDisabled = function(el, disabled) {
  if(el.tagName == "FORM") {
    var els = el.elements;
    for(var i = 0;el = els[i];i++) {
      goog.dom.forms.setDisabled(el, disabled)
    }
  }else {
    if(disabled == true) {
      el.blur()
    }
    el.disabled = disabled
  }
};
goog.dom.forms.focusAndSelect = function(el) {
  el.focus();
  if(el.select) {
    el.select()
  }
};
goog.dom.forms.hasValue = function(el) {
  var value = goog.dom.forms.getValue(el);
  return!!value
};
goog.dom.forms.hasValueByName = function(form, name) {
  var value = goog.dom.forms.getValueByName(form, name);
  return!!value
};
goog.dom.forms.getValue = function(el) {
  var type = el.type;
  if(!goog.isDef(type)) {
    return null
  }
  switch(type.toLowerCase()) {
    case "checkbox":
    ;
    case "radio":
      return goog.dom.forms.getInputChecked_(el);
    case "select-one":
      return goog.dom.forms.getSelectSingle_(el);
    case "select-multiple":
      return goog.dom.forms.getSelectMultiple_(el);
    default:
      return goog.isDef(el.value) ? el.value : null
  }
};
goog.dom.$F = goog.dom.forms.getValue;
goog.dom.forms.getValueByName = function(form, name) {
  var els = form.elements[name];
  if(els.type) {
    return goog.dom.forms.getValue(els)
  }else {
    for(var i = 0;i < els.length;i++) {
      var val = goog.dom.forms.getValue(els[i]);
      if(val) {
        return val
      }
    }
    return null
  }
};
goog.dom.forms.getInputChecked_ = function(el) {
  return el.checked ? el.value : null
};
goog.dom.forms.getSelectSingle_ = function(el) {
  var selectedIndex = el.selectedIndex;
  return selectedIndex >= 0 ? el.options[selectedIndex].value : null
};
goog.dom.forms.getSelectMultiple_ = function(el) {
  var values = [];
  for(var option, i = 0;option = el.options[i];i++) {
    if(option.selected) {
      values.push(option.value)
    }
  }
  return values.length ? values : null
};
goog.dom.forms.setValue = function(el, opt_value) {
  var type = el.type;
  if(goog.isDef(type)) {
    switch(type.toLowerCase()) {
      case "checkbox":
      ;
      case "radio":
        goog.dom.forms.setInputChecked_(el, opt_value);
        break;
      case "select-one":
        goog.dom.forms.setSelectSingle_(el, opt_value);
        break;
      case "select-multiple":
        goog.dom.forms.setSelectMultiple_(el, opt_value);
        break;
      default:
        el.value = goog.isDefAndNotNull(opt_value) ? opt_value : ""
    }
  }
};
goog.dom.forms.setInputChecked_ = function(el, opt_value) {
  el.checked = opt_value ? "checked" : null
};
goog.dom.forms.setSelectSingle_ = function(el, opt_value) {
  el.selectedIndex = -1;
  if(goog.isString(opt_value)) {
    for(var option, i = 0;option = el.options[i];i++) {
      if(option.value == opt_value) {
        option.selected = true;
        break
      }
    }
  }
};
goog.dom.forms.setSelectMultiple_ = function(el, opt_value) {
  if(goog.isString(opt_value)) {
    opt_value = [opt_value]
  }
  for(var option, i = 0;option = el.options[i];i++) {
    option.selected = false;
    if(opt_value) {
      for(var value, j = 0;value = opt_value[j];j++) {
        if(option.value == value) {
          option.selected = true
        }
      }
    }
  }
};
goog.provide("clojure.string");
goog.require("cljs.core");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
clojure.string.seq_reverse = function seq_reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
clojure.string.reverse = function reverse(s) {
  return s.split("").reverse().join("")
};
clojure.string.replace = function replace(s, match, replacement) {
  if(cljs.core.string_QMARK_.call(null, match)) {
    return s.replace(new RegExp(goog.string.regExpEscape(match), "g"), replacement)
  }else {
    if(cljs.core.truth_(match.hasOwnProperty("source"))) {
      return s.replace(new RegExp(match.source, "g"), replacement)
    }else {
      if("\ufdd0'else") {
        throw[cljs.core.str("Invalid match arg: "), cljs.core.str(match)].join("");
      }else {
        return null
      }
    }
  }
};
clojure.string.replace_first = function replace_first(s, match, replacement) {
  return s.replace(match, replacement)
};
clojure.string.join = function() {
  var join = null;
  var join__1 = function(coll) {
    return cljs.core.apply.call(null, cljs.core.str, coll)
  };
  var join__2 = function(separator, coll) {
    return cljs.core.apply.call(null, cljs.core.str, cljs.core.interpose.call(null, separator, coll))
  };
  join = function(separator, coll) {
    switch(arguments.length) {
      case 1:
        return join__1.call(this, separator);
      case 2:
        return join__2.call(this, separator, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  join.cljs$lang$arity$1 = join__1;
  join.cljs$lang$arity$2 = join__2;
  return join
}();
clojure.string.upper_case = function upper_case(s) {
  return s.toUpperCase()
};
clojure.string.lower_case = function lower_case(s) {
  return s.toLowerCase()
};
clojure.string.capitalize = function capitalize(s) {
  if(cljs.core.count.call(null, s) < 2) {
    return clojure.string.upper_case.call(null, s)
  }else {
    return[cljs.core.str(clojure.string.upper_case.call(null, cljs.core.subs.call(null, s, 0, 1))), cljs.core.str(clojure.string.lower_case.call(null, cljs.core.subs.call(null, s, 1)))].join("")
  }
};
clojure.string.split = function() {
  var split = null;
  var split__2 = function(s, re) {
    return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
  };
  var split__3 = function(s, re, limit) {
    if(limit < 1) {
      return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
    }else {
      var s__10430 = s;
      var limit__10431 = limit;
      var parts__10432 = cljs.core.PersistentVector.EMPTY;
      while(true) {
        if(cljs.core._EQ_.call(null, limit__10431, 1)) {
          return cljs.core.conj.call(null, parts__10432, s__10430)
        }else {
          var temp__4090__auto____10433 = cljs.core.re_find.call(null, re, s__10430);
          if(cljs.core.truth_(temp__4090__auto____10433)) {
            var m__10434 = temp__4090__auto____10433;
            var index__10435 = s__10430.indexOf(m__10434);
            var G__10436 = s__10430.substring(index__10435 + cljs.core.count.call(null, m__10434));
            var G__10437 = limit__10431 - 1;
            var G__10438 = cljs.core.conj.call(null, parts__10432, s__10430.substring(0, index__10435));
            s__10430 = G__10436;
            limit__10431 = G__10437;
            parts__10432 = G__10438;
            continue
          }else {
            return cljs.core.conj.call(null, parts__10432, s__10430)
          }
        }
        break
      }
    }
  };
  split = function(s, re, limit) {
    switch(arguments.length) {
      case 2:
        return split__2.call(this, s, re);
      case 3:
        return split__3.call(this, s, re, limit)
    }
    throw"Invalid arity: " + arguments.length;
  };
  split.cljs$lang$arity$2 = split__2;
  split.cljs$lang$arity$3 = split__3;
  return split
}();
clojure.string.split_lines = function split_lines(s) {
  return clojure.string.split.call(null, s, /\n|\r\n/)
};
clojure.string.trim = function trim(s) {
  return goog.string.trim(s)
};
clojure.string.triml = function triml(s) {
  return goog.string.trimLeft(s)
};
clojure.string.trimr = function trimr(s) {
  return goog.string.trimRight(s)
};
clojure.string.trim_newline = function trim_newline(s) {
  var index__10442 = s.length;
  while(true) {
    if(index__10442 === 0) {
      return""
    }else {
      var ch__10443 = cljs.core._lookup.call(null, s, index__10442 - 1, null);
      if(function() {
        var or__3943__auto____10444 = cljs.core._EQ_.call(null, ch__10443, "\n");
        if(or__3943__auto____10444) {
          return or__3943__auto____10444
        }else {
          return cljs.core._EQ_.call(null, ch__10443, "\r")
        }
      }()) {
        var G__10445 = index__10442 - 1;
        index__10442 = G__10445;
        continue
      }else {
        return s.substring(0, index__10442)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  var s__10449 = [cljs.core.str(s)].join("");
  if(cljs.core.truth_(function() {
    var or__3943__auto____10450 = cljs.core.not.call(null, s__10449);
    if(or__3943__auto____10450) {
      return or__3943__auto____10450
    }else {
      var or__3943__auto____10451 = cljs.core._EQ_.call(null, "", s__10449);
      if(or__3943__auto____10451) {
        return or__3943__auto____10451
      }else {
        return cljs.core.re_matches.call(null, /\s+/, s__10449)
      }
    }
  }())) {
    return true
  }else {
    return false
  }
};
clojure.string.escape = function escape(s, cmap) {
  var buffer__10458 = new goog.string.StringBuffer;
  var length__10459 = s.length;
  var index__10460 = 0;
  while(true) {
    if(cljs.core._EQ_.call(null, length__10459, index__10460)) {
      return buffer__10458.toString()
    }else {
      var ch__10461 = s.charAt(index__10460);
      var temp__4090__auto____10462 = cljs.core._lookup.call(null, cmap, ch__10461, null);
      if(cljs.core.truth_(temp__4090__auto____10462)) {
        var replacement__10463 = temp__4090__auto____10462;
        buffer__10458.append([cljs.core.str(replacement__10463)].join(""))
      }else {
        buffer__10458.append(ch__10461)
      }
      var G__10464 = index__10460 + 1;
      index__10460 = G__10464;
      continue
    }
    break
  }
};
goog.provide("goog.math.Box");
goog.require("goog.math.Coordinate");
goog.math.Box = function(top, right, bottom, left) {
  this.top = top;
  this.right = right;
  this.bottom = bottom;
  this.left = left
};
goog.math.Box.boundingBox = function(var_args) {
  var box = new goog.math.Box(arguments[0].y, arguments[0].x, arguments[0].y, arguments[0].x);
  for(var i = 1;i < arguments.length;i++) {
    var coord = arguments[i];
    box.top = Math.min(box.top, coord.y);
    box.right = Math.max(box.right, coord.x);
    box.bottom = Math.max(box.bottom, coord.y);
    box.left = Math.min(box.left, coord.x)
  }
  return box
};
goog.math.Box.prototype.clone = function() {
  return new goog.math.Box(this.top, this.right, this.bottom, this.left)
};
if(goog.DEBUG) {
  goog.math.Box.prototype.toString = function() {
    return"(" + this.top + "t, " + this.right + "r, " + this.bottom + "b, " + this.left + "l)"
  }
}
goog.math.Box.prototype.contains = function(other) {
  return goog.math.Box.contains(this, other)
};
goog.math.Box.prototype.expand = function(top, opt_right, opt_bottom, opt_left) {
  if(goog.isObject(top)) {
    this.top -= top.top;
    this.right += top.right;
    this.bottom += top.bottom;
    this.left -= top.left
  }else {
    this.top -= top;
    this.right += opt_right;
    this.bottom += opt_bottom;
    this.left -= opt_left
  }
  return this
};
goog.math.Box.prototype.expandToInclude = function(box) {
  this.left = Math.min(this.left, box.left);
  this.top = Math.min(this.top, box.top);
  this.right = Math.max(this.right, box.right);
  this.bottom = Math.max(this.bottom, box.bottom)
};
goog.math.Box.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.top == b.top && a.right == b.right && a.bottom == b.bottom && a.left == b.left
};
goog.math.Box.contains = function(box, other) {
  if(!box || !other) {
    return false
  }
  if(other instanceof goog.math.Box) {
    return other.left >= box.left && other.right <= box.right && other.top >= box.top && other.bottom <= box.bottom
  }
  return other.x >= box.left && other.x <= box.right && other.y >= box.top && other.y <= box.bottom
};
goog.math.Box.distance = function(box, coord) {
  if(coord.x >= box.left && coord.x <= box.right) {
    if(coord.y >= box.top && coord.y <= box.bottom) {
      return 0
    }
    return coord.y < box.top ? box.top - coord.y : coord.y - box.bottom
  }
  if(coord.y >= box.top && coord.y <= box.bottom) {
    return coord.x < box.left ? box.left - coord.x : coord.x - box.right
  }
  return goog.math.Coordinate.distance(coord, new goog.math.Coordinate(coord.x < box.left ? box.left : box.right, coord.y < box.top ? box.top : box.bottom))
};
goog.math.Box.intersects = function(a, b) {
  return a.left <= b.right && b.left <= a.right && a.top <= b.bottom && b.top <= a.bottom
};
goog.math.Box.intersectsWithPadding = function(a, b, padding) {
  return a.left <= b.right + padding && b.left <= a.right + padding && a.top <= b.bottom + padding && b.top <= a.bottom + padding
};
goog.provide("goog.math.Rect");
goog.require("goog.math.Box");
goog.require("goog.math.Size");
goog.math.Rect = function(x, y, w, h) {
  this.left = x;
  this.top = y;
  this.width = w;
  this.height = h
};
goog.math.Rect.prototype.clone = function() {
  return new goog.math.Rect(this.left, this.top, this.width, this.height)
};
goog.math.Rect.prototype.toBox = function() {
  var right = this.left + this.width;
  var bottom = this.top + this.height;
  return new goog.math.Box(this.top, right, bottom, this.left)
};
goog.math.Rect.createFromBox = function(box) {
  return new goog.math.Rect(box.left, box.top, box.right - box.left, box.bottom - box.top)
};
if(goog.DEBUG) {
  goog.math.Rect.prototype.toString = function() {
    return"(" + this.left + ", " + this.top + " - " + this.width + "w x " + this.height + "h)"
  }
}
goog.math.Rect.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.left == b.left && a.width == b.width && a.top == b.top && a.height == b.height
};
goog.math.Rect.prototype.intersection = function(rect) {
  var x0 = Math.max(this.left, rect.left);
  var x1 = Math.min(this.left + this.width, rect.left + rect.width);
  if(x0 <= x1) {
    var y0 = Math.max(this.top, rect.top);
    var y1 = Math.min(this.top + this.height, rect.top + rect.height);
    if(y0 <= y1) {
      this.left = x0;
      this.top = y0;
      this.width = x1 - x0;
      this.height = y1 - y0;
      return true
    }
  }
  return false
};
goog.math.Rect.intersection = function(a, b) {
  var x0 = Math.max(a.left, b.left);
  var x1 = Math.min(a.left + a.width, b.left + b.width);
  if(x0 <= x1) {
    var y0 = Math.max(a.top, b.top);
    var y1 = Math.min(a.top + a.height, b.top + b.height);
    if(y0 <= y1) {
      return new goog.math.Rect(x0, y0, x1 - x0, y1 - y0)
    }
  }
  return null
};
goog.math.Rect.intersects = function(a, b) {
  return a.left <= b.left + b.width && b.left <= a.left + a.width && a.top <= b.top + b.height && b.top <= a.top + a.height
};
goog.math.Rect.prototype.intersects = function(rect) {
  return goog.math.Rect.intersects(this, rect)
};
goog.math.Rect.difference = function(a, b) {
  var intersection = goog.math.Rect.intersection(a, b);
  if(!intersection || !intersection.height || !intersection.width) {
    return[a.clone()]
  }
  var result = [];
  var top = a.top;
  var height = a.height;
  var ar = a.left + a.width;
  var ab = a.top + a.height;
  var br = b.left + b.width;
  var bb = b.top + b.height;
  if(b.top > a.top) {
    result.push(new goog.math.Rect(a.left, a.top, a.width, b.top - a.top));
    top = b.top;
    height -= b.top - a.top
  }
  if(bb < ab) {
    result.push(new goog.math.Rect(a.left, bb, a.width, ab - bb));
    height = bb - top
  }
  if(b.left > a.left) {
    result.push(new goog.math.Rect(a.left, top, b.left - a.left, height))
  }
  if(br < ar) {
    result.push(new goog.math.Rect(br, top, ar - br, height))
  }
  return result
};
goog.math.Rect.prototype.difference = function(rect) {
  return goog.math.Rect.difference(this, rect)
};
goog.math.Rect.prototype.boundingRect = function(rect) {
  var right = Math.max(this.left + this.width, rect.left + rect.width);
  var bottom = Math.max(this.top + this.height, rect.top + rect.height);
  this.left = Math.min(this.left, rect.left);
  this.top = Math.min(this.top, rect.top);
  this.width = right - this.left;
  this.height = bottom - this.top
};
goog.math.Rect.boundingRect = function(a, b) {
  if(!a || !b) {
    return null
  }
  var clone = a.clone();
  clone.boundingRect(b);
  return clone
};
goog.math.Rect.prototype.contains = function(another) {
  if(another instanceof goog.math.Rect) {
    return this.left <= another.left && this.left + this.width >= another.left + another.width && this.top <= another.top && this.top + this.height >= another.top + another.height
  }else {
    return another.x >= this.left && another.x <= this.left + this.width && another.y >= this.top && another.y <= this.top + this.height
  }
};
goog.math.Rect.prototype.getSize = function() {
  return new goog.math.Size(this.width, this.height)
};
goog.provide("goog.style");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.math.Box");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Rect");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.style.setStyle = function(element, style, opt_value) {
  if(goog.isString(style)) {
    goog.style.setStyle_(element, opt_value, style)
  }else {
    goog.object.forEach(style, goog.partial(goog.style.setStyle_, element))
  }
};
goog.style.setStyle_ = function(element, value, style) {
  element.style[goog.string.toCamelCase(style)] = value
};
goog.style.getStyle = function(element, property) {
  return element.style[goog.string.toCamelCase(property)] || ""
};
goog.style.getComputedStyle = function(element, property) {
  var doc = goog.dom.getOwnerDocument(element);
  if(doc.defaultView && doc.defaultView.getComputedStyle) {
    var styles = doc.defaultView.getComputedStyle(element, null);
    if(styles) {
      return styles[property] || styles.getPropertyValue(property)
    }
  }
  return""
};
goog.style.getCascadedStyle = function(element, style) {
  return element.currentStyle ? element.currentStyle[style] : null
};
goog.style.getStyle_ = function(element, style) {
  return goog.style.getComputedStyle(element, style) || goog.style.getCascadedStyle(element, style) || element.style[style]
};
goog.style.getComputedPosition = function(element) {
  return goog.style.getStyle_(element, "position")
};
goog.style.getBackgroundColor = function(element) {
  return goog.style.getStyle_(element, "backgroundColor")
};
goog.style.getComputedOverflowX = function(element) {
  return goog.style.getStyle_(element, "overflowX")
};
goog.style.getComputedOverflowY = function(element) {
  return goog.style.getStyle_(element, "overflowY")
};
goog.style.getComputedZIndex = function(element) {
  return goog.style.getStyle_(element, "zIndex")
};
goog.style.getComputedTextAlign = function(element) {
  return goog.style.getStyle_(element, "textAlign")
};
goog.style.getComputedCursor = function(element) {
  return goog.style.getStyle_(element, "cursor")
};
goog.style.setPosition = function(el, arg1, opt_arg2) {
  var x, y;
  var buggyGeckoSubPixelPos = goog.userAgent.GECKO && (goog.userAgent.MAC || goog.userAgent.X11) && goog.userAgent.isVersion("1.9");
  if(arg1 instanceof goog.math.Coordinate) {
    x = arg1.x;
    y = arg1.y
  }else {
    x = arg1;
    y = opt_arg2
  }
  el.style.left = goog.style.getPixelStyleValue_(x, buggyGeckoSubPixelPos);
  el.style.top = goog.style.getPixelStyleValue_(y, buggyGeckoSubPixelPos)
};
goog.style.getPosition = function(element) {
  return new goog.math.Coordinate(element.offsetLeft, element.offsetTop)
};
goog.style.getClientViewportElement = function(opt_node) {
  var doc;
  if(opt_node) {
    if(opt_node.nodeType == goog.dom.NodeType.DOCUMENT) {
      doc = opt_node
    }else {
      doc = goog.dom.getOwnerDocument(opt_node)
    }
  }else {
    doc = goog.dom.getDocument()
  }
  if(goog.userAgent.IE && !goog.userAgent.isVersion(9) && !goog.dom.getDomHelper(doc).isCss1CompatMode()) {
    return doc.body
  }
  return doc.documentElement
};
goog.style.getBoundingClientRect_ = function(el) {
  var rect = el.getBoundingClientRect();
  if(goog.userAgent.IE) {
    var doc = el.ownerDocument;
    rect.left -= doc.documentElement.clientLeft + doc.body.clientLeft;
    rect.top -= doc.documentElement.clientTop + doc.body.clientTop
  }
  return rect
};
goog.style.getOffsetParent = function(element) {
  if(goog.userAgent.IE) {
    return element.offsetParent
  }
  var doc = goog.dom.getOwnerDocument(element);
  var positionStyle = goog.style.getStyle_(element, "position");
  var skipStatic = positionStyle == "fixed" || positionStyle == "absolute";
  for(var parent = element.parentNode;parent && parent != doc;parent = parent.parentNode) {
    positionStyle = goog.style.getStyle_(parent, "position");
    skipStatic = skipStatic && positionStyle == "static" && parent != doc.documentElement && parent != doc.body;
    if(!skipStatic && (parent.scrollWidth > parent.clientWidth || parent.scrollHeight > parent.clientHeight || positionStyle == "fixed" || positionStyle == "absolute")) {
      return parent
    }
  }
  return null
};
goog.style.getVisibleRectForElement = function(element) {
  var visibleRect = new goog.math.Box(0, Infinity, Infinity, 0);
  var dom = goog.dom.getDomHelper(element);
  var body = dom.getDocument().body;
  var scrollEl = dom.getDocumentScrollElement();
  var inContainer;
  for(var el = element;el = goog.style.getOffsetParent(el);) {
    if((!goog.userAgent.IE || el.clientWidth != 0) && (!goog.userAgent.WEBKIT || el.clientHeight != 0 || el != body) && (el.scrollWidth != el.clientWidth || el.scrollHeight != el.clientHeight) && goog.style.getStyle_(el, "overflow") != "visible") {
      var pos = goog.style.getPageOffset(el);
      var client = goog.style.getClientLeftTop(el);
      pos.x += client.x;
      pos.y += client.y;
      visibleRect.top = Math.max(visibleRect.top, pos.y);
      visibleRect.right = Math.min(visibleRect.right, pos.x + el.clientWidth);
      visibleRect.bottom = Math.min(visibleRect.bottom, pos.y + el.clientHeight);
      visibleRect.left = Math.max(visibleRect.left, pos.x);
      inContainer = inContainer || el != scrollEl
    }
  }
  var scrollX = scrollEl.scrollLeft, scrollY = scrollEl.scrollTop;
  if(goog.userAgent.WEBKIT) {
    visibleRect.left += scrollX;
    visibleRect.top += scrollY
  }else {
    visibleRect.left = Math.max(visibleRect.left, scrollX);
    visibleRect.top = Math.max(visibleRect.top, scrollY)
  }
  if(!inContainer || goog.userAgent.WEBKIT) {
    visibleRect.right += scrollX;
    visibleRect.bottom += scrollY
  }
  var winSize = dom.getViewportSize();
  visibleRect.right = Math.min(visibleRect.right, scrollX + winSize.width);
  visibleRect.bottom = Math.min(visibleRect.bottom, scrollY + winSize.height);
  return visibleRect.top >= 0 && visibleRect.left >= 0 && visibleRect.bottom > visibleRect.top && visibleRect.right > visibleRect.left ? visibleRect : null
};
goog.style.scrollIntoContainerView = function(element, container, opt_center) {
  var elementPos = goog.style.getPageOffset(element);
  var containerPos = goog.style.getPageOffset(container);
  var containerBorder = goog.style.getBorderBox(container);
  var relX = elementPos.x - containerPos.x - containerBorder.left;
  var relY = elementPos.y - containerPos.y - containerBorder.top;
  var spaceX = container.clientWidth - element.offsetWidth;
  var spaceY = container.clientHeight - element.offsetHeight;
  if(opt_center) {
    container.scrollLeft += relX - spaceX / 2;
    container.scrollTop += relY - spaceY / 2
  }else {
    container.scrollLeft += Math.min(relX, Math.max(relX - spaceX, 0));
    container.scrollTop += Math.min(relY, Math.max(relY - spaceY, 0))
  }
};
goog.style.getClientLeftTop = function(el) {
  if(goog.userAgent.GECKO && !goog.userAgent.isVersion("1.9")) {
    var left = parseFloat(goog.style.getComputedStyle(el, "borderLeftWidth"));
    if(goog.style.isRightToLeft(el)) {
      var scrollbarWidth = el.offsetWidth - el.clientWidth - left - parseFloat(goog.style.getComputedStyle(el, "borderRightWidth"));
      left += scrollbarWidth
    }
    return new goog.math.Coordinate(left, parseFloat(goog.style.getComputedStyle(el, "borderTopWidth")))
  }
  return new goog.math.Coordinate(el.clientLeft, el.clientTop)
};
goog.style.getPageOffset = function(el) {
  var box, doc = goog.dom.getOwnerDocument(el);
  var positionStyle = goog.style.getStyle_(el, "position");
  var BUGGY_GECKO_BOX_OBJECT = goog.userAgent.GECKO && doc.getBoxObjectFor && !el.getBoundingClientRect && positionStyle == "absolute" && (box = doc.getBoxObjectFor(el)) && (box.screenX < 0 || box.screenY < 0);
  var pos = new goog.math.Coordinate(0, 0);
  var viewportElement = goog.style.getClientViewportElement(doc);
  if(el == viewportElement) {
    return pos
  }
  if(el.getBoundingClientRect) {
    box = goog.style.getBoundingClientRect_(el);
    var scrollCoord = goog.dom.getDomHelper(doc).getDocumentScroll();
    pos.x = box.left + scrollCoord.x;
    pos.y = box.top + scrollCoord.y
  }else {
    if(doc.getBoxObjectFor && !BUGGY_GECKO_BOX_OBJECT) {
      box = doc.getBoxObjectFor(el);
      var vpBox = doc.getBoxObjectFor(viewportElement);
      pos.x = box.screenX - vpBox.screenX;
      pos.y = box.screenY - vpBox.screenY
    }else {
      var parent = el;
      do {
        pos.x += parent.offsetLeft;
        pos.y += parent.offsetTop;
        if(parent != el) {
          pos.x += parent.clientLeft || 0;
          pos.y += parent.clientTop || 0
        }
        if(goog.userAgent.WEBKIT && goog.style.getComputedPosition(parent) == "fixed") {
          pos.x += doc.body.scrollLeft;
          pos.y += doc.body.scrollTop;
          break
        }
        parent = parent.offsetParent
      }while(parent && parent != el);
      if(goog.userAgent.OPERA || goog.userAgent.WEBKIT && positionStyle == "absolute") {
        pos.y -= doc.body.offsetTop
      }
      for(parent = el;(parent = goog.style.getOffsetParent(parent)) && parent != doc.body && parent != viewportElement;) {
        pos.x -= parent.scrollLeft;
        if(!goog.userAgent.OPERA || parent.tagName != "TR") {
          pos.y -= parent.scrollTop
        }
      }
    }
  }
  return pos
};
goog.style.getPageOffsetLeft = function(el) {
  return goog.style.getPageOffset(el).x
};
goog.style.getPageOffsetTop = function(el) {
  return goog.style.getPageOffset(el).y
};
goog.style.getFramedPageOffset = function(el, relativeWin) {
  var position = new goog.math.Coordinate(0, 0);
  var currentWin = goog.dom.getWindow(goog.dom.getOwnerDocument(el));
  var currentEl = el;
  do {
    var offset = currentWin == relativeWin ? goog.style.getPageOffset(currentEl) : goog.style.getClientPosition(currentEl);
    position.x += offset.x;
    position.y += offset.y
  }while(currentWin && currentWin != relativeWin && (currentEl = currentWin.frameElement) && (currentWin = currentWin.parent));
  return position
};
goog.style.translateRectForAnotherFrame = function(rect, origBase, newBase) {
  if(origBase.getDocument() != newBase.getDocument()) {
    var body = origBase.getDocument().body;
    var pos = goog.style.getFramedPageOffset(body, newBase.getWindow());
    pos = goog.math.Coordinate.difference(pos, goog.style.getPageOffset(body));
    if(goog.userAgent.IE && !origBase.isCss1CompatMode()) {
      pos = goog.math.Coordinate.difference(pos, origBase.getDocumentScroll())
    }
    rect.left += pos.x;
    rect.top += pos.y
  }
};
goog.style.getRelativePosition = function(a, b) {
  var ap = goog.style.getClientPosition(a);
  var bp = goog.style.getClientPosition(b);
  return new goog.math.Coordinate(ap.x - bp.x, ap.y - bp.y)
};
goog.style.getClientPosition = function(el) {
  var pos = new goog.math.Coordinate;
  if(el.nodeType == goog.dom.NodeType.ELEMENT) {
    if(el.getBoundingClientRect) {
      var box = goog.style.getBoundingClientRect_(el);
      pos.x = box.left;
      pos.y = box.top
    }else {
      var scrollCoord = goog.dom.getDomHelper(el).getDocumentScroll();
      var pageCoord = goog.style.getPageOffset(el);
      pos.x = pageCoord.x - scrollCoord.x;
      pos.y = pageCoord.y - scrollCoord.y
    }
  }else {
    var isAbstractedEvent = goog.isFunction(el.getBrowserEvent);
    var targetEvent = el;
    if(el.targetTouches) {
      targetEvent = el.targetTouches[0]
    }else {
      if(isAbstractedEvent && el.getBrowserEvent().targetTouches) {
        targetEvent = el.getBrowserEvent().targetTouches[0]
      }
    }
    pos.x = targetEvent.clientX;
    pos.y = targetEvent.clientY
  }
  return pos
};
goog.style.setPageOffset = function(el, x, opt_y) {
  var cur = goog.style.getPageOffset(el);
  if(x instanceof goog.math.Coordinate) {
    opt_y = x.y;
    x = x.x
  }
  var dx = x - cur.x;
  var dy = opt_y - cur.y;
  goog.style.setPosition(el, el.offsetLeft + dx, el.offsetTop + dy)
};
goog.style.setSize = function(element, w, opt_h) {
  var h;
  if(w instanceof goog.math.Size) {
    h = w.height;
    w = w.width
  }else {
    if(opt_h == undefined) {
      throw Error("missing height argument");
    }
    h = opt_h
  }
  goog.style.setWidth(element, w);
  goog.style.setHeight(element, h)
};
goog.style.getPixelStyleValue_ = function(value, round) {
  if(typeof value == "number") {
    value = (round ? Math.round(value) : value) + "px"
  }
  return value
};
goog.style.setHeight = function(element, height) {
  element.style.height = goog.style.getPixelStyleValue_(height, true)
};
goog.style.setWidth = function(element, width) {
  element.style.width = goog.style.getPixelStyleValue_(width, true)
};
goog.style.getSize = function(element) {
  if(goog.style.getStyle_(element, "display") != "none") {
    return new goog.math.Size(element.offsetWidth, element.offsetHeight)
  }
  var style = element.style;
  var originalDisplay = style.display;
  var originalVisibility = style.visibility;
  var originalPosition = style.position;
  style.visibility = "hidden";
  style.position = "absolute";
  style.display = "inline";
  var originalWidth = element.offsetWidth;
  var originalHeight = element.offsetHeight;
  style.display = originalDisplay;
  style.position = originalPosition;
  style.visibility = originalVisibility;
  return new goog.math.Size(originalWidth, originalHeight)
};
goog.style.getBounds = function(element) {
  var o = goog.style.getPageOffset(element);
  var s = goog.style.getSize(element);
  return new goog.math.Rect(o.x, o.y, s.width, s.height)
};
goog.style.toCamelCase = function(selector) {
  return goog.string.toCamelCase(String(selector))
};
goog.style.toSelectorCase = function(selector) {
  return goog.string.toSelectorCase(selector)
};
goog.style.getOpacity = function(el) {
  var style = el.style;
  var result = "";
  if("opacity" in style) {
    result = style.opacity
  }else {
    if("MozOpacity" in style) {
      result = style.MozOpacity
    }else {
      if("filter" in style) {
        var match = style.filter.match(/alpha\(opacity=([\d.]+)\)/);
        if(match) {
          result = String(match[1] / 100)
        }
      }
    }
  }
  return result == "" ? result : Number(result)
};
goog.style.setOpacity = function(el, alpha) {
  var style = el.style;
  if("opacity" in style) {
    style.opacity = alpha
  }else {
    if("MozOpacity" in style) {
      style.MozOpacity = alpha
    }else {
      if("filter" in style) {
        if(alpha === "") {
          style.filter = ""
        }else {
          style.filter = "alpha(opacity=" + alpha * 100 + ")"
        }
      }
    }
  }
};
goog.style.setTransparentBackgroundImage = function(el, src) {
  var style = el.style;
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(" + 'src="' + src + '", sizingMethod="crop")'
  }else {
    style.backgroundImage = "url(" + src + ")";
    style.backgroundPosition = "top left";
    style.backgroundRepeat = "no-repeat"
  }
};
goog.style.clearTransparentBackgroundImage = function(el) {
  var style = el.style;
  if("filter" in style) {
    style.filter = ""
  }else {
    style.backgroundImage = "none"
  }
};
goog.style.showElement = function(el, display) {
  el.style.display = display ? "" : "none"
};
goog.style.isElementShown = function(el) {
  return el.style.display != "none"
};
goog.style.installStyles = function(stylesString, opt_node) {
  var dh = goog.dom.getDomHelper(opt_node);
  var styleSheet = null;
  if(goog.userAgent.IE) {
    styleSheet = dh.getDocument().createStyleSheet();
    goog.style.setStyles(styleSheet, stylesString)
  }else {
    var head = dh.getElementsByTagNameAndClass("head")[0];
    if(!head) {
      var body = dh.getElementsByTagNameAndClass("body")[0];
      head = dh.createDom("head");
      body.parentNode.insertBefore(head, body)
    }
    styleSheet = dh.createDom("style");
    goog.style.setStyles(styleSheet, stylesString);
    dh.appendChild(head, styleSheet)
  }
  return styleSheet
};
goog.style.uninstallStyles = function(styleSheet) {
  var node = styleSheet.ownerNode || styleSheet.owningElement || styleSheet;
  goog.dom.removeNode(node)
};
goog.style.setStyles = function(element, stylesString) {
  if(goog.userAgent.IE) {
    element.cssText = stylesString
  }else {
    var propToSet = goog.userAgent.WEBKIT ? "innerText" : "innerHTML";
    element[propToSet] = stylesString
  }
};
goog.style.setPreWrap = function(el) {
  var style = el.style;
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.whiteSpace = "pre";
    style.wordWrap = "break-word"
  }else {
    if(goog.userAgent.GECKO) {
      style.whiteSpace = "-moz-pre-wrap"
    }else {
      style.whiteSpace = "pre-wrap"
    }
  }
};
goog.style.setInlineBlock = function(el) {
  var style = el.style;
  style.position = "relative";
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.zoom = "1";
    style.display = "inline"
  }else {
    if(goog.userAgent.GECKO) {
      style.display = goog.userAgent.isVersion("1.9a") ? "inline-block" : "-moz-inline-box"
    }else {
      style.display = "inline-block"
    }
  }
};
goog.style.isRightToLeft = function(el) {
  return"rtl" == goog.style.getStyle_(el, "direction")
};
goog.style.unselectableStyle_ = goog.userAgent.GECKO ? "MozUserSelect" : goog.userAgent.WEBKIT ? "WebkitUserSelect" : null;
goog.style.isUnselectable = function(el) {
  if(goog.style.unselectableStyle_) {
    return el.style[goog.style.unselectableStyle_].toLowerCase() == "none"
  }else {
    if(goog.userAgent.IE || goog.userAgent.OPERA) {
      return el.getAttribute("unselectable") == "on"
    }
  }
  return false
};
goog.style.setUnselectable = function(el, unselectable, opt_noRecurse) {
  var descendants = !opt_noRecurse ? el.getElementsByTagName("*") : null;
  var name = goog.style.unselectableStyle_;
  if(name) {
    var value = unselectable ? "none" : "";
    el.style[name] = value;
    if(descendants) {
      for(var i = 0, descendant;descendant = descendants[i];i++) {
        descendant.style[name] = value
      }
    }
  }else {
    if(goog.userAgent.IE || goog.userAgent.OPERA) {
      var value = unselectable ? "on" : "";
      el.setAttribute("unselectable", value);
      if(descendants) {
        for(var i = 0, descendant;descendant = descendants[i];i++) {
          descendant.setAttribute("unselectable", value)
        }
      }
    }
  }
};
goog.style.getBorderBoxSize = function(element) {
  return new goog.math.Size(element.offsetWidth, element.offsetHeight)
};
goog.style.setBorderBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if(goog.userAgent.IE && (!isCss1CompatMode || !goog.userAgent.isVersion("8"))) {
    var style = element.style;
    if(isCss1CompatMode) {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width - borderBox.left - paddingBox.left - paddingBox.right - borderBox.right;
      style.pixelHeight = size.height - borderBox.top - paddingBox.top - paddingBox.bottom - borderBox.bottom
    }else {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height
    }
  }else {
    goog.style.setBoxSizingSize_(element, size, "border-box")
  }
};
goog.style.getContentBoxSize = function(element) {
  var doc = goog.dom.getOwnerDocument(element);
  var ieCurrentStyle = goog.userAgent.IE && element.currentStyle;
  if(ieCurrentStyle && goog.dom.getDomHelper(doc).isCss1CompatMode() && ieCurrentStyle.width != "auto" && ieCurrentStyle.height != "auto" && !ieCurrentStyle.boxSizing) {
    var width = goog.style.getIePixelValue_(element, ieCurrentStyle.width, "width", "pixelWidth");
    var height = goog.style.getIePixelValue_(element, ieCurrentStyle.height, "height", "pixelHeight");
    return new goog.math.Size(width, height)
  }else {
    var borderBoxSize = goog.style.getBorderBoxSize(element);
    var paddingBox = goog.style.getPaddingBox(element);
    var borderBox = goog.style.getBorderBox(element);
    return new goog.math.Size(borderBoxSize.width - borderBox.left - paddingBox.left - paddingBox.right - borderBox.right, borderBoxSize.height - borderBox.top - paddingBox.top - paddingBox.bottom - borderBox.bottom)
  }
};
goog.style.setContentBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if(goog.userAgent.IE && (!isCss1CompatMode || !goog.userAgent.isVersion("8"))) {
    var style = element.style;
    if(isCss1CompatMode) {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height
    }else {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width + borderBox.left + paddingBox.left + paddingBox.right + borderBox.right;
      style.pixelHeight = size.height + borderBox.top + paddingBox.top + paddingBox.bottom + borderBox.bottom
    }
  }else {
    goog.style.setBoxSizingSize_(element, size, "content-box")
  }
};
goog.style.setBoxSizingSize_ = function(element, size, boxSizing) {
  var style = element.style;
  if(goog.userAgent.GECKO) {
    style.MozBoxSizing = boxSizing
  }else {
    if(goog.userAgent.WEBKIT) {
      style.WebkitBoxSizing = boxSizing
    }else {
      style.boxSizing = boxSizing
    }
  }
  style.width = size.width + "px";
  style.height = size.height + "px"
};
goog.style.getIePixelValue_ = function(element, value, name, pixelName) {
  if(/^\d+px?$/.test(value)) {
    return parseInt(value, 10)
  }else {
    var oldStyleValue = element.style[name];
    var oldRuntimeValue = element.runtimeStyle[name];
    element.runtimeStyle[name] = element.currentStyle[name];
    element.style[name] = value;
    var pixelValue = element.style[pixelName];
    element.style[name] = oldStyleValue;
    element.runtimeStyle[name] = oldRuntimeValue;
    return pixelValue
  }
};
goog.style.getIePixelDistance_ = function(element, propName) {
  return goog.style.getIePixelValue_(element, goog.style.getCascadedStyle(element, propName), "left", "pixelLeft")
};
goog.style.getBox_ = function(element, stylePrefix) {
  if(goog.userAgent.IE) {
    var left = goog.style.getIePixelDistance_(element, stylePrefix + "Left");
    var right = goog.style.getIePixelDistance_(element, stylePrefix + "Right");
    var top = goog.style.getIePixelDistance_(element, stylePrefix + "Top");
    var bottom = goog.style.getIePixelDistance_(element, stylePrefix + "Bottom");
    return new goog.math.Box(top, right, bottom, left)
  }else {
    var left = goog.style.getComputedStyle(element, stylePrefix + "Left");
    var right = goog.style.getComputedStyle(element, stylePrefix + "Right");
    var top = goog.style.getComputedStyle(element, stylePrefix + "Top");
    var bottom = goog.style.getComputedStyle(element, stylePrefix + "Bottom");
    return new goog.math.Box(parseFloat(top), parseFloat(right), parseFloat(bottom), parseFloat(left))
  }
};
goog.style.getPaddingBox = function(element) {
  return goog.style.getBox_(element, "padding")
};
goog.style.getMarginBox = function(element) {
  return goog.style.getBox_(element, "margin")
};
goog.style.ieBorderWidthKeywords_ = {"thin":2, "medium":4, "thick":6};
goog.style.getIePixelBorder_ = function(element, prop) {
  if(goog.style.getCascadedStyle(element, prop + "Style") == "none") {
    return 0
  }
  var width = goog.style.getCascadedStyle(element, prop + "Width");
  if(width in goog.style.ieBorderWidthKeywords_) {
    return goog.style.ieBorderWidthKeywords_[width]
  }
  return goog.style.getIePixelValue_(element, width, "left", "pixelLeft")
};
goog.style.getBorderBox = function(element) {
  if(goog.userAgent.IE) {
    var left = goog.style.getIePixelBorder_(element, "borderLeft");
    var right = goog.style.getIePixelBorder_(element, "borderRight");
    var top = goog.style.getIePixelBorder_(element, "borderTop");
    var bottom = goog.style.getIePixelBorder_(element, "borderBottom");
    return new goog.math.Box(top, right, bottom, left)
  }else {
    var left = goog.style.getComputedStyle(element, "borderLeftWidth");
    var right = goog.style.getComputedStyle(element, "borderRightWidth");
    var top = goog.style.getComputedStyle(element, "borderTopWidth");
    var bottom = goog.style.getComputedStyle(element, "borderBottomWidth");
    return new goog.math.Box(parseFloat(top), parseFloat(right), parseFloat(bottom), parseFloat(left))
  }
};
goog.style.getFontFamily = function(el) {
  var doc = goog.dom.getOwnerDocument(el);
  var font = "";
  if(doc.body.createTextRange) {
    var range = doc.body.createTextRange();
    range.moveToElementText(el);
    try {
      font = range.queryCommandValue("FontName")
    }catch(e) {
      font = ""
    }
  }
  if(!font) {
    font = goog.style.getStyle_(el, "fontFamily")
  }
  var fontsArray = font.split(",");
  if(fontsArray.length > 1) {
    font = fontsArray[0]
  }
  return goog.string.stripQuotes(font, "\"'")
};
goog.style.lengthUnitRegex_ = /[^\d]+$/;
goog.style.getLengthUnits = function(value) {
  var units = value.match(goog.style.lengthUnitRegex_);
  return units && units[0] || null
};
goog.style.ABSOLUTE_CSS_LENGTH_UNITS_ = {"cm":1, "in":1, "mm":1, "pc":1, "pt":1};
goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_ = {"em":1, "ex":1};
goog.style.getFontSize = function(el) {
  var fontSize = goog.style.getStyle_(el, "fontSize");
  var sizeUnits = goog.style.getLengthUnits(fontSize);
  if(fontSize && "px" == sizeUnits) {
    return parseInt(fontSize, 10)
  }
  if(goog.userAgent.IE) {
    if(sizeUnits in goog.style.ABSOLUTE_CSS_LENGTH_UNITS_) {
      return goog.style.getIePixelValue_(el, fontSize, "left", "pixelLeft")
    }else {
      if(el.parentNode && el.parentNode.nodeType == goog.dom.NodeType.ELEMENT && sizeUnits in goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_) {
        var parentElement = el.parentNode;
        var parentSize = goog.style.getStyle_(parentElement, "fontSize");
        return goog.style.getIePixelValue_(parentElement, fontSize == parentSize ? "1em" : fontSize, "left", "pixelLeft")
      }
    }
  }
  var sizeElement = goog.dom.createDom("span", {"style":"visibility:hidden;position:absolute;" + "line-height:0;padding:0;margin:0;border:0;height:1em;"});
  goog.dom.appendChild(el, sizeElement);
  fontSize = sizeElement.offsetHeight;
  goog.dom.removeNode(sizeElement);
  return fontSize
};
goog.style.parseStyleAttribute = function(value) {
  var result = {};
  goog.array.forEach(value.split(/\s*;\s*/), function(pair) {
    var keyValue = pair.split(/\s*:\s*/);
    if(keyValue.length == 2) {
      result[goog.string.toCamelCase(keyValue[0].toLowerCase())] = keyValue[1]
    }
  });
  return result
};
goog.style.toStyleAttribute = function(obj) {
  var buffer = [];
  goog.object.forEach(obj, function(value, key) {
    buffer.push(goog.string.toSelectorCase(key), ":", value, ";")
  });
  return buffer.join("")
};
goog.style.setFloat = function(el, value) {
  el.style[goog.userAgent.IE ? "styleFloat" : "cssFloat"] = value
};
goog.style.getFloat = function(el) {
  return el.style[goog.userAgent.IE ? "styleFloat" : "cssFloat"] || ""
};
goog.style.getScrollbarWidth = function() {
  var mockElement = goog.dom.createElement("div");
  mockElement.style.cssText = "visibility:hidden;overflow:scroll;" + "position:absolute;top:0;width:100px;height:100px";
  goog.dom.appendChild(goog.dom.getDocument().body, mockElement);
  var width = mockElement.offsetWidth - mockElement.clientWidth;
  goog.dom.removeNode(mockElement);
  return width
};
goog.provide("domina");
goog.require("cljs.core");
goog.require("domina.support");
goog.require("goog.dom.classes");
goog.require("goog.events");
goog.require("goog.dom.xml");
goog.require("goog.dom.forms");
goog.require("goog.dom");
goog.require("goog.string");
goog.require("clojure.string");
goog.require("goog.style");
goog.require("cljs.core");
domina.re_html = /<|&#?\w+;/;
domina.re_leading_whitespace = /^\s+/;
domina.re_xhtml_tag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/i;
domina.re_tag_name = /<([\w:]+)/;
domina.re_no_inner_html = /<(?:script|style)/i;
domina.re_tbody = /<tbody/i;
var opt_wrapper__10019 = cljs.core.PersistentVector.fromArray([1, "<select multiple='multiple'>", "</select>"], true);
var table_section_wrapper__10020 = cljs.core.PersistentVector.fromArray([1, "<table>", "</table>"], true);
var cell_wrapper__10021 = cljs.core.PersistentVector.fromArray([3, "<table><tbody><tr>", "</tr></tbody></table>"], true);
domina.wrap_map = cljs.core.ObjMap.fromObject(["col", "\ufdd0'default", "tfoot", "caption", "optgroup", "legend", "area", "td", "thead", "th", "option", "tbody", "tr", "colgroup"], {"col":cljs.core.PersistentVector.fromArray([2, "<table><tbody></tbody><colgroup>", "</colgroup></table>"], true), "\ufdd0'default":cljs.core.PersistentVector.fromArray([0, "", ""], true), "tfoot":table_section_wrapper__10020, "caption":table_section_wrapper__10020, "optgroup":opt_wrapper__10019, "legend":cljs.core.PersistentVector.fromArray([1, 
"<fieldset>", "</fieldset>"], true), "area":cljs.core.PersistentVector.fromArray([1, "<map>", "</map>"], true), "td":cell_wrapper__10021, "thead":table_section_wrapper__10020, "th":cell_wrapper__10021, "option":opt_wrapper__10019, "tbody":table_section_wrapper__10020, "tr":cljs.core.PersistentVector.fromArray([2, "<table><tbody>", "</tbody></table>"], true), "colgroup":table_section_wrapper__10020});
domina.remove_extraneous_tbody_BANG_ = function remove_extraneous_tbody_BANG_(div, html) {
  var no_tbody_QMARK___10034 = cljs.core.not.call(null, cljs.core.re_find.call(null, domina.re_tbody, html));
  var tbody__10038 = function() {
    var and__3941__auto____10035 = cljs.core._EQ_.call(null, domina.tag_name, "table");
    if(and__3941__auto____10035) {
      return no_tbody_QMARK___10034
    }else {
      return and__3941__auto____10035
    }
  }() ? function() {
    var and__3941__auto____10036 = div.firstChild;
    if(cljs.core.truth_(and__3941__auto____10036)) {
      return div.firstChild.childNodes
    }else {
      return and__3941__auto____10036
    }
  }() : function() {
    var and__3941__auto____10037 = cljs.core._EQ_.call(null, domina.start_wrap, "<table>");
    if(and__3941__auto____10037) {
      return no_tbody_QMARK___10034
    }else {
      return and__3941__auto____10037
    }
  }() ? divchildNodes : cljs.core.PersistentVector.EMPTY;
  var G__10039__10040 = cljs.core.seq.call(null, tbody__10038);
  if(G__10039__10040) {
    var child__10041 = cljs.core.first.call(null, G__10039__10040);
    var G__10039__10042 = G__10039__10040;
    while(true) {
      if(function() {
        var and__3941__auto____10043 = cljs.core._EQ_.call(null, child__10041.nodeName, "tbody");
        if(and__3941__auto____10043) {
          return cljs.core._EQ_.call(null, child__10041.childNodes.length, 0)
        }else {
          return and__3941__auto____10043
        }
      }()) {
        child__10041.parentNode.removeChild(child__10041)
      }else {
      }
      var temp__4092__auto____10044 = cljs.core.next.call(null, G__10039__10042);
      if(temp__4092__auto____10044) {
        var G__10039__10045 = temp__4092__auto____10044;
        var G__10046 = cljs.core.first.call(null, G__10039__10045);
        var G__10047 = G__10039__10045;
        child__10041 = G__10046;
        G__10039__10042 = G__10047;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
domina.restore_leading_whitespace_BANG_ = function restore_leading_whitespace_BANG_(div, html) {
  return div.insertBefore(document.createTextNode(cljs.core.first.call(null, cljs.core.re_find.call(null, domina.re_leading_whitespace, html))), div.firstChild)
};
domina.html_to_dom = function html_to_dom(html) {
  var html__10061 = clojure.string.replace.call(null, html, domina.re_xhtml_tag, "<$1></$2>");
  var tag_name__10062 = [cljs.core.str(cljs.core.second.call(null, cljs.core.re_find.call(null, domina.re_tag_name, html__10061)))].join("").toLowerCase();
  var vec__10060__10063 = cljs.core._lookup.call(null, domina.wrap_map, tag_name__10062, (new cljs.core.Keyword("\ufdd0'default")).call(null, domina.wrap_map));
  var depth__10064 = cljs.core.nth.call(null, vec__10060__10063, 0, null);
  var start_wrap__10065 = cljs.core.nth.call(null, vec__10060__10063, 1, null);
  var end_wrap__10066 = cljs.core.nth.call(null, vec__10060__10063, 2, null);
  var div__10070 = function() {
    var wrapper__10068 = function() {
      var div__10067 = document.createElement("div");
      div__10067.innerHTML = [cljs.core.str(start_wrap__10065), cljs.core.str(html__10061), cljs.core.str(end_wrap__10066)].join("");
      return div__10067
    }();
    var level__10069 = depth__10064;
    while(true) {
      if(level__10069 > 0) {
        var G__10072 = wrapper__10068.lastChild;
        var G__10073 = level__10069 - 1;
        wrapper__10068 = G__10072;
        level__10069 = G__10073;
        continue
      }else {
        return wrapper__10068
      }
      break
    }
  }();
  if(cljs.core.truth_(domina.support.extraneous_tbody_QMARK_)) {
    domina.remove_extraneous_tbody_BANG_.call(null, div__10070, html__10061)
  }else {
  }
  if(cljs.core.truth_(function() {
    var and__3941__auto____10071 = cljs.core.not.call(null, domina.support.leading_whitespace_QMARK_);
    if(and__3941__auto____10071) {
      return cljs.core.re_find.call(null, domina.re_leading_whitespace, html__10061)
    }else {
      return and__3941__auto____10071
    }
  }())) {
    domina.restore_leading_whitespace_BANG_.call(null, div__10070, html__10061)
  }else {
  }
  return div__10070.childNodes
};
domina.string_to_dom = function string_to_dom(s) {
  if(cljs.core.truth_(cljs.core.re_find.call(null, domina.re_html, s))) {
    return domina.html_to_dom.call(null, s)
  }else {
    return document.createTextNode(s)
  }
};
void 0;
domina.DomContent = {};
domina.nodes = function nodes(content) {
  if(function() {
    var and__3941__auto____10077 = content;
    if(and__3941__auto____10077) {
      return content.domina$DomContent$nodes$arity$1
    }else {
      return and__3941__auto____10077
    }
  }()) {
    return content.domina$DomContent$nodes$arity$1(content)
  }else {
    return function() {
      var or__3943__auto____10078 = domina.nodes[goog.typeOf(content)];
      if(or__3943__auto____10078) {
        return or__3943__auto____10078
      }else {
        var or__3943__auto____10079 = domina.nodes["_"];
        if(or__3943__auto____10079) {
          return or__3943__auto____10079
        }else {
          throw cljs.core.missing_protocol.call(null, "DomContent.nodes", content);
        }
      }
    }().call(null, content)
  }
};
domina.single_node = function single_node(nodeseq) {
  if(function() {
    var and__3941__auto____10083 = nodeseq;
    if(and__3941__auto____10083) {
      return nodeseq.domina$DomContent$single_node$arity$1
    }else {
      return and__3941__auto____10083
    }
  }()) {
    return nodeseq.domina$DomContent$single_node$arity$1(nodeseq)
  }else {
    return function() {
      var or__3943__auto____10084 = domina.single_node[goog.typeOf(nodeseq)];
      if(or__3943__auto____10084) {
        return or__3943__auto____10084
      }else {
        var or__3943__auto____10085 = domina.single_node["_"];
        if(or__3943__auto____10085) {
          return or__3943__auto____10085
        }else {
          throw cljs.core.missing_protocol.call(null, "DomContent.single-node", nodeseq);
        }
      }
    }().call(null, nodeseq)
  }
};
void 0;
domina._STAR_debug_STAR_ = true;
domina.log_debug = function() {
  var log_debug__delegate = function(mesg) {
    if(cljs.core.truth_(function() {
      var and__3941__auto____10087 = domina._STAR_debug_STAR_;
      if(cljs.core.truth_(and__3941__auto____10087)) {
        return!cljs.core._EQ_.call(null, window.console, undefined)
      }else {
        return and__3941__auto____10087
      }
    }())) {
      return console.log(cljs.core.apply.call(null, cljs.core.str, mesg))
    }else {
      return null
    }
  };
  var log_debug = function(var_args) {
    var mesg = null;
    if(goog.isDef(var_args)) {
      mesg = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return log_debug__delegate.call(this, mesg)
  };
  log_debug.cljs$lang$maxFixedArity = 0;
  log_debug.cljs$lang$applyTo = function(arglist__10088) {
    var mesg = cljs.core.seq(arglist__10088);
    return log_debug__delegate(mesg)
  };
  log_debug.cljs$lang$arity$variadic = log_debug__delegate;
  return log_debug
}();
domina.log = function() {
  var log__delegate = function(mesg) {
    if(cljs.core.truth_(window.console)) {
      return console.log(cljs.core.apply.call(null, cljs.core.str, mesg))
    }else {
      return null
    }
  };
  var log = function(var_args) {
    var mesg = null;
    if(goog.isDef(var_args)) {
      mesg = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return log__delegate.call(this, mesg)
  };
  log.cljs$lang$maxFixedArity = 0;
  log.cljs$lang$applyTo = function(arglist__10089) {
    var mesg = cljs.core.seq(arglist__10089);
    return log__delegate(mesg)
  };
  log.cljs$lang$arity$variadic = log__delegate;
  return log
}();
domina.by_id = function by_id(id) {
  return goog.dom.getElement(cljs.core.name.call(null, id))
};
void 0;
domina.by_class = function by_class(class_name) {
  if(void 0 === domina.t10097) {
    domina.t10097 = function(class_name, by_class, meta10098) {
      this.class_name = class_name;
      this.by_class = by_class;
      this.meta10098 = meta10098;
      this.cljs$lang$protocol_mask$partition1$ = 0;
      this.cljs$lang$protocol_mask$partition0$ = 393216
    };
    domina.t10097.cljs$lang$type = true;
    domina.t10097.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
      return cljs.core.list.call(null, "domina/t10097")
    };
    domina.t10097.prototype.domina$DomContent$ = true;
    domina.t10097.prototype.domina$DomContent$nodes$arity$1 = function(_) {
      var this__10100 = this;
      return domina.normalize_seq.call(null, goog.dom.getElementsByClass(cljs.core.name.call(null, this__10100.class_name)))
    };
    domina.t10097.prototype.domina$DomContent$single_node$arity$1 = function(_) {
      var this__10101 = this;
      return domina.normalize_seq.call(null, goog.dom.getElementByClass(cljs.core.name.call(null, this__10101.class_name)))
    };
    domina.t10097.prototype.cljs$core$IMeta$_meta$arity$1 = function(_10099) {
      var this__10102 = this;
      return this__10102.meta10098
    };
    domina.t10097.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(_10099, meta10098) {
      var this__10103 = this;
      return new domina.t10097(this__10103.class_name, this__10103.by_class, meta10098)
    };
    domina.t10097
  }else {
  }
  return new domina.t10097(class_name, by_class, null)
};
domina.children = function children(content) {
  return cljs.core.doall.call(null, cljs.core.mapcat.call(null, goog.dom.getChildren, domina.nodes.call(null, content)))
};
domina.clone = function clone(content) {
  return cljs.core.map.call(null, function(p1__10104_SHARP_) {
    return p1__10104_SHARP_.cloneNode(true)
  }, domina.nodes.call(null, content))
};
void 0;
domina.append_BANG_ = function append_BANG_(parent_content, child_content) {
  domina.apply_with_cloning.call(null, goog.dom.appendChild, parent_content, child_content);
  return parent_content
};
domina.insert_BANG_ = function insert_BANG_(parent_content, child_content, idx) {
  domina.apply_with_cloning.call(null, function(p1__10105_SHARP_, p2__10106_SHARP_) {
    return goog.dom.insertChildAt(p1__10105_SHARP_, p2__10106_SHARP_, idx)
  }, parent_content, child_content);
  return parent_content
};
domina.prepend_BANG_ = function prepend_BANG_(parent_content, child_content) {
  domina.insert_BANG_.call(null, parent_content, child_content, 0);
  return parent_content
};
domina.insert_before_BANG_ = function insert_before_BANG_(content, new_content) {
  domina.apply_with_cloning.call(null, function(p1__10108_SHARP_, p2__10107_SHARP_) {
    return goog.dom.insertSiblingBefore(p2__10107_SHARP_, p1__10108_SHARP_)
  }, content, new_content);
  return content
};
domina.insert_after_BANG_ = function insert_after_BANG_(content, new_content) {
  domina.apply_with_cloning.call(null, function(p1__10110_SHARP_, p2__10109_SHARP_) {
    return goog.dom.insertSiblingAfter(p2__10109_SHARP_, p1__10110_SHARP_)
  }, content, new_content);
  return content
};
domina.swap_content_BANG_ = function swap_content_BANG_(old_content, new_content) {
  domina.apply_with_cloning.call(null, function(p1__10112_SHARP_, p2__10111_SHARP_) {
    return goog.dom.replaceNode(p2__10111_SHARP_, p1__10112_SHARP_)
  }, old_content, new_content);
  return old_content
};
domina.detach_BANG_ = function detach_BANG_(content) {
  return cljs.core.doall.call(null, cljs.core.map.call(null, goog.dom.removeNode, domina.nodes.call(null, content)))
};
domina.destroy_BANG_ = function destroy_BANG_(content) {
  return cljs.core.dorun.call(null, cljs.core.map.call(null, goog.dom.removeNode, domina.nodes.call(null, content)))
};
domina.destroy_children_BANG_ = function destroy_children_BANG_(content) {
  cljs.core.dorun.call(null, cljs.core.map.call(null, goog.dom.removeChildren, domina.nodes.call(null, content)));
  return content
};
domina.style = function style(content, name) {
  var s__10114 = goog.style.getStyle(domina.single_node.call(null, content), cljs.core.name.call(null, name));
  if(cljs.core.truth_(clojure.string.blank_QMARK_.call(null, s__10114))) {
    return null
  }else {
    return s__10114
  }
};
domina.attr = function attr(content, name) {
  return domina.single_node.call(null, content).getAttribute(cljs.core.name.call(null, name))
};
domina.set_style_BANG_ = function() {
  var set_style_BANG___delegate = function(content, name, value) {
    var G__10121__10122 = cljs.core.seq.call(null, domina.nodes.call(null, content));
    if(G__10121__10122) {
      var n__10123 = cljs.core.first.call(null, G__10121__10122);
      var G__10121__10124 = G__10121__10122;
      while(true) {
        goog.style.setStyle(n__10123, cljs.core.name.call(null, name), cljs.core.apply.call(null, cljs.core.str, value));
        var temp__4092__auto____10125 = cljs.core.next.call(null, G__10121__10124);
        if(temp__4092__auto____10125) {
          var G__10121__10126 = temp__4092__auto____10125;
          var G__10127 = cljs.core.first.call(null, G__10121__10126);
          var G__10128 = G__10121__10126;
          n__10123 = G__10127;
          G__10121__10124 = G__10128;
          continue
        }else {
        }
        break
      }
    }else {
    }
    return content
  };
  var set_style_BANG_ = function(content, name, var_args) {
    var value = null;
    if(goog.isDef(var_args)) {
      value = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return set_style_BANG___delegate.call(this, content, name, value)
  };
  set_style_BANG_.cljs$lang$maxFixedArity = 2;
  set_style_BANG_.cljs$lang$applyTo = function(arglist__10129) {
    var content = cljs.core.first(arglist__10129);
    var name = cljs.core.first(cljs.core.next(arglist__10129));
    var value = cljs.core.rest(cljs.core.next(arglist__10129));
    return set_style_BANG___delegate(content, name, value)
  };
  set_style_BANG_.cljs$lang$arity$variadic = set_style_BANG___delegate;
  return set_style_BANG_
}();
domina.set_attr_BANG_ = function() {
  var set_attr_BANG___delegate = function(content, name, value) {
    var G__10136__10137 = cljs.core.seq.call(null, domina.nodes.call(null, content));
    if(G__10136__10137) {
      var n__10138 = cljs.core.first.call(null, G__10136__10137);
      var G__10136__10139 = G__10136__10137;
      while(true) {
        n__10138.setAttribute(cljs.core.name.call(null, name), cljs.core.apply.call(null, cljs.core.str, value));
        var temp__4092__auto____10140 = cljs.core.next.call(null, G__10136__10139);
        if(temp__4092__auto____10140) {
          var G__10136__10141 = temp__4092__auto____10140;
          var G__10142 = cljs.core.first.call(null, G__10136__10141);
          var G__10143 = G__10136__10141;
          n__10138 = G__10142;
          G__10136__10139 = G__10143;
          continue
        }else {
        }
        break
      }
    }else {
    }
    return content
  };
  var set_attr_BANG_ = function(content, name, var_args) {
    var value = null;
    if(goog.isDef(var_args)) {
      value = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return set_attr_BANG___delegate.call(this, content, name, value)
  };
  set_attr_BANG_.cljs$lang$maxFixedArity = 2;
  set_attr_BANG_.cljs$lang$applyTo = function(arglist__10144) {
    var content = cljs.core.first(arglist__10144);
    var name = cljs.core.first(cljs.core.next(arglist__10144));
    var value = cljs.core.rest(cljs.core.next(arglist__10144));
    return set_attr_BANG___delegate(content, name, value)
  };
  set_attr_BANG_.cljs$lang$arity$variadic = set_attr_BANG___delegate;
  return set_attr_BANG_
}();
domina.remove_attr_BANG_ = function remove_attr_BANG_(content, name) {
  var G__10151__10152 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(G__10151__10152) {
    var n__10153 = cljs.core.first.call(null, G__10151__10152);
    var G__10151__10154 = G__10151__10152;
    while(true) {
      n__10153.removeAttribute(cljs.core.name.call(null, name));
      var temp__4092__auto____10155 = cljs.core.next.call(null, G__10151__10154);
      if(temp__4092__auto____10155) {
        var G__10151__10156 = temp__4092__auto____10155;
        var G__10157 = cljs.core.first.call(null, G__10151__10156);
        var G__10158 = G__10151__10156;
        n__10153 = G__10157;
        G__10151__10154 = G__10158;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.parse_style_attributes = function parse_style_attributes(style) {
  return cljs.core.reduce.call(null, function(acc, pair) {
    var vec__10164__10165 = pair.split(/\s*:\s*/);
    var k__10166 = cljs.core.nth.call(null, vec__10164__10165, 0, null);
    var v__10167 = cljs.core.nth.call(null, vec__10164__10165, 1, null);
    if(cljs.core.truth_(function() {
      var and__3941__auto____10168 = k__10166;
      if(cljs.core.truth_(and__3941__auto____10168)) {
        return v__10167
      }else {
        return and__3941__auto____10168
      }
    }())) {
      return cljs.core.assoc.call(null, acc, cljs.core.keyword.call(null, k__10166.toLowerCase()), v__10167)
    }else {
      return acc
    }
  }, cljs.core.ObjMap.EMPTY, style.split(/\s*;\s*/))
};
domina.styles = function styles(content) {
  var style__10171 = domina.attr.call(null, content, "style");
  if(cljs.core.string_QMARK_.call(null, style__10171)) {
    return domina.parse_style_attributes.call(null, style__10171)
  }else {
    if(cljs.core.truth_(style__10171.cssText)) {
      return domina.parse_style_attributes.call(null, style__10171.cssText)
    }else {
      return null
    }
  }
};
domina.attrs = function attrs(content) {
  var node__10177 = domina.single_node.call(null, content);
  var attrs__10178 = node__10177.attributes;
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.filter.call(null, cljs.core.complement.call(null, cljs.core.nil_QMARK_), cljs.core.map.call(null, function(p1__10169_SHARP_) {
    var attr__10179 = attrs__10178.item(p1__10169_SHARP_);
    var value__10180 = attr__10179.nodeValue;
    if(function() {
      var and__3941__auto____10181 = cljs.core.not_EQ_.call(null, null, value__10180);
      if(and__3941__auto____10181) {
        return cljs.core.not_EQ_.call(null, "", value__10180)
      }else {
        return and__3941__auto____10181
      }
    }()) {
      return cljs.core.PersistentArrayMap.fromArrays([cljs.core.keyword.call(null, attr__10179.nodeName.toLowerCase())], [attr__10179.nodeValue])
    }else {
      return null
    }
  }, cljs.core.range.call(null, attrs__10178.length))))
};
domina.set_styles_BANG_ = function set_styles_BANG_(content, styles) {
  var G__10201__10202 = cljs.core.seq.call(null, styles);
  if(G__10201__10202) {
    var G__10204__10206 = cljs.core.first.call(null, G__10201__10202);
    var vec__10205__10207 = G__10204__10206;
    var name__10208 = cljs.core.nth.call(null, vec__10205__10207, 0, null);
    var value__10209 = cljs.core.nth.call(null, vec__10205__10207, 1, null);
    var G__10201__10210 = G__10201__10202;
    var G__10204__10211 = G__10204__10206;
    var G__10201__10212 = G__10201__10210;
    while(true) {
      var vec__10213__10214 = G__10204__10211;
      var name__10215 = cljs.core.nth.call(null, vec__10213__10214, 0, null);
      var value__10216 = cljs.core.nth.call(null, vec__10213__10214, 1, null);
      var G__10201__10217 = G__10201__10212;
      domina.set_style_BANG_.call(null, content, name__10215, value__10216);
      var temp__4092__auto____10218 = cljs.core.next.call(null, G__10201__10217);
      if(temp__4092__auto____10218) {
        var G__10201__10219 = temp__4092__auto____10218;
        var G__10220 = cljs.core.first.call(null, G__10201__10219);
        var G__10221 = G__10201__10219;
        G__10204__10211 = G__10220;
        G__10201__10212 = G__10221;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.set_attrs_BANG_ = function set_attrs_BANG_(content, attrs) {
  var G__10241__10242 = cljs.core.seq.call(null, attrs);
  if(G__10241__10242) {
    var G__10244__10246 = cljs.core.first.call(null, G__10241__10242);
    var vec__10245__10247 = G__10244__10246;
    var name__10248 = cljs.core.nth.call(null, vec__10245__10247, 0, null);
    var value__10249 = cljs.core.nth.call(null, vec__10245__10247, 1, null);
    var G__10241__10250 = G__10241__10242;
    var G__10244__10251 = G__10244__10246;
    var G__10241__10252 = G__10241__10250;
    while(true) {
      var vec__10253__10254 = G__10244__10251;
      var name__10255 = cljs.core.nth.call(null, vec__10253__10254, 0, null);
      var value__10256 = cljs.core.nth.call(null, vec__10253__10254, 1, null);
      var G__10241__10257 = G__10241__10252;
      domina.set_attr_BANG_.call(null, content, name__10255, value__10256);
      var temp__4092__auto____10258 = cljs.core.next.call(null, G__10241__10257);
      if(temp__4092__auto____10258) {
        var G__10241__10259 = temp__4092__auto____10258;
        var G__10260 = cljs.core.first.call(null, G__10241__10259);
        var G__10261 = G__10241__10259;
        G__10244__10251 = G__10260;
        G__10241__10252 = G__10261;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.has_class_QMARK_ = function has_class_QMARK_(content, class$) {
  return goog.dom.classes.has(domina.single_node.call(null, content), class$)
};
domina.add_class_BANG_ = function add_class_BANG_(content, class$) {
  var G__10268__10269 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(G__10268__10269) {
    var node__10270 = cljs.core.first.call(null, G__10268__10269);
    var G__10268__10271 = G__10268__10269;
    while(true) {
      goog.dom.classes.add(node__10270, class$);
      var temp__4092__auto____10272 = cljs.core.next.call(null, G__10268__10271);
      if(temp__4092__auto____10272) {
        var G__10268__10273 = temp__4092__auto____10272;
        var G__10274 = cljs.core.first.call(null, G__10268__10273);
        var G__10275 = G__10268__10273;
        node__10270 = G__10274;
        G__10268__10271 = G__10275;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.remove_class_BANG_ = function remove_class_BANG_(content, class$) {
  var G__10282__10283 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(G__10282__10283) {
    var node__10284 = cljs.core.first.call(null, G__10282__10283);
    var G__10282__10285 = G__10282__10283;
    while(true) {
      goog.dom.classes.remove(node__10284, class$);
      var temp__4092__auto____10286 = cljs.core.next.call(null, G__10282__10285);
      if(temp__4092__auto____10286) {
        var G__10282__10287 = temp__4092__auto____10286;
        var G__10288 = cljs.core.first.call(null, G__10282__10287);
        var G__10289 = G__10282__10287;
        node__10284 = G__10288;
        G__10282__10285 = G__10289;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.classes = function classes(content) {
  return cljs.core.seq.call(null, goog.dom.classes.get(domina.single_node.call(null, content)))
};
domina.set_classes_BANG_ = function set_classes_BANG_(content, classes) {
  var classes__10297 = cljs.core.coll_QMARK_.call(null, classes) ? clojure.string.join.call(null, " ", classes) : classes;
  var G__10298__10299 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(G__10298__10299) {
    var node__10300 = cljs.core.first.call(null, G__10298__10299);
    var G__10298__10301 = G__10298__10299;
    while(true) {
      goog.dom.classes.set(node__10300, classes__10297);
      var temp__4092__auto____10302 = cljs.core.next.call(null, G__10298__10301);
      if(temp__4092__auto____10302) {
        var G__10298__10303 = temp__4092__auto____10302;
        var G__10304 = cljs.core.first.call(null, G__10298__10303);
        var G__10305 = G__10298__10303;
        node__10300 = G__10304;
        G__10298__10301 = G__10305;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.text = function text(content) {
  return goog.string.trim(goog.dom.getTextContent(domina.single_node.call(null, content)))
};
domina.set_text_BANG_ = function set_text_BANG_(content, value) {
  var G__10312__10313 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(G__10312__10313) {
    var node__10314 = cljs.core.first.call(null, G__10312__10313);
    var G__10312__10315 = G__10312__10313;
    while(true) {
      goog.dom.setTextContent(node__10314, value);
      var temp__4092__auto____10316 = cljs.core.next.call(null, G__10312__10315);
      if(temp__4092__auto____10316) {
        var G__10312__10317 = temp__4092__auto____10316;
        var G__10318 = cljs.core.first.call(null, G__10312__10317);
        var G__10319 = G__10312__10317;
        node__10314 = G__10318;
        G__10312__10315 = G__10319;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.value = function value(content) {
  return goog.dom.forms.getValue(domina.single_node.call(null, content))
};
domina.set_value_BANG_ = function set_value_BANG_(content, value) {
  var G__10326__10327 = cljs.core.seq.call(null, domina.nodes.call(null, content));
  if(G__10326__10327) {
    var node__10328 = cljs.core.first.call(null, G__10326__10327);
    var G__10326__10329 = G__10326__10327;
    while(true) {
      goog.dom.forms.setValue(node__10328, value);
      var temp__4092__auto____10330 = cljs.core.next.call(null, G__10326__10329);
      if(temp__4092__auto____10330) {
        var G__10326__10331 = temp__4092__auto____10330;
        var G__10332 = cljs.core.first.call(null, G__10326__10331);
        var G__10333 = G__10326__10331;
        node__10328 = G__10332;
        G__10326__10329 = G__10333;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return content
};
domina.html = function html(content) {
  return domina.single_node.call(null, content).innerHTML
};
domina.replace_children_BANG_ = function replace_children_BANG_(content, inner_content) {
  return domina.append_BANG_.call(null, domina.destroy_children_BANG_.call(null, content), inner_content)
};
domina.set_inner_html_BANG_ = function set_inner_html_BANG_(content, html_string) {
  var allows_inner_html_QMARK___10350 = cljs.core.not.call(null, cljs.core.re_find.call(null, domina.re_no_inner_html, html_string));
  var leading_whitespace_QMARK___10351 = cljs.core.re_find.call(null, domina.re_leading_whitespace, html_string);
  var tag_name__10352 = [cljs.core.str(cljs.core.second.call(null, cljs.core.re_find.call(null, domina.re_tag_name, html_string)))].join("").toLowerCase();
  var special_tag_QMARK___10353 = cljs.core.contains_QMARK_.call(null, domina.wrap_map, tag_name__10352);
  if(cljs.core.truth_(function() {
    var and__3941__auto____10354 = allows_inner_html_QMARK___10350;
    if(and__3941__auto____10354) {
      var and__3941__auto____10356 = function() {
        var or__3943__auto____10355 = domina.support.leading_whitespace_QMARK_;
        if(cljs.core.truth_(or__3943__auto____10355)) {
          return or__3943__auto____10355
        }else {
          return cljs.core.not.call(null, leading_whitespace_QMARK___10351)
        }
      }();
      if(cljs.core.truth_(and__3941__auto____10356)) {
        return!special_tag_QMARK___10353
      }else {
        return and__3941__auto____10356
      }
    }else {
      return and__3941__auto____10354
    }
  }())) {
    var value__10357 = clojure.string.replace.call(null, html_string, domina.re_xhtml_tag, "<$1></$2>");
    try {
      var G__10360__10361 = cljs.core.seq.call(null, domina.nodes.call(null, content));
      if(G__10360__10361) {
        var node__10362 = cljs.core.first.call(null, G__10360__10361);
        var G__10360__10363 = G__10360__10361;
        while(true) {
          goog.events.removeAll(node__10362);
          node__10362.innerHTML = value__10357;
          var temp__4092__auto____10364 = cljs.core.next.call(null, G__10360__10363);
          if(temp__4092__auto____10364) {
            var G__10360__10365 = temp__4092__auto____10364;
            var G__10366 = cljs.core.first.call(null, G__10360__10365);
            var G__10367 = G__10360__10365;
            node__10362 = G__10366;
            G__10360__10363 = G__10367;
            continue
          }else {
          }
          break
        }
      }else {
      }
    }catch(e10358) {
      if(cljs.core.instance_QMARK_.call(null, domina.Exception, e10358)) {
        var e__10359 = e10358;
        domina.replace_children_BANG_.call(null, content, value__10357)
      }else {
        if("\ufdd0'else") {
          throw e10358;
        }else {
        }
      }
    }
  }else {
    domina.replace_children_BANG_.call(null, content, html_string)
  }
  return content
};
domina.set_html_BANG_ = function set_html_BANG_(content, inner_content) {
  if(cljs.core.string_QMARK_.call(null, inner_content)) {
    return domina.set_inner_html_BANG_.call(null, content, inner_content)
  }else {
    return domina.replace_children_BANG_.call(null, content, inner_content)
  }
};
domina.get_data = function() {
  var get_data = null;
  var get_data__2 = function(node, key) {
    return get_data.call(null, node, key, false)
  };
  var get_data__3 = function(node, key, bubble) {
    var m__10373 = domina.single_node.call(null, node).__domina_data;
    var value__10374 = cljs.core.truth_(m__10373) ? cljs.core._lookup.call(null, m__10373, key, null) : null;
    if(cljs.core.truth_(function() {
      var and__3941__auto____10375 = bubble;
      if(cljs.core.truth_(and__3941__auto____10375)) {
        return value__10374 == null
      }else {
        return and__3941__auto____10375
      }
    }())) {
      var temp__4092__auto____10376 = domina.single_node.call(null, node).parentNode;
      if(cljs.core.truth_(temp__4092__auto____10376)) {
        var parent__10377 = temp__4092__auto____10376;
        return get_data.call(null, parent__10377, key, true)
      }else {
        return null
      }
    }else {
      return value__10374
    }
  };
  get_data = function(node, key, bubble) {
    switch(arguments.length) {
      case 2:
        return get_data__2.call(this, node, key);
      case 3:
        return get_data__3.call(this, node, key, bubble)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_data.cljs$lang$arity$2 = get_data__2;
  get_data.cljs$lang$arity$3 = get_data__3;
  return get_data
}();
domina.set_data_BANG_ = function set_data_BANG_(node, key, value) {
  var m__10383 = function() {
    var or__3943__auto____10382 = domina.single_node.call(null, node).__domina_data;
    if(cljs.core.truth_(or__3943__auto____10382)) {
      return or__3943__auto____10382
    }else {
      return cljs.core.ObjMap.EMPTY
    }
  }();
  return domina.single_node.call(null, node).__domina_data = cljs.core.assoc.call(null, m__10383, key, value)
};
domina.apply_with_cloning = function apply_with_cloning(f, parent_content, child_content) {
  var parents__10395 = domina.nodes.call(null, parent_content);
  var children__10396 = domina.nodes.call(null, child_content);
  var first_child__10404 = function() {
    var frag__10397 = document.createDocumentFragment();
    var G__10398__10399 = cljs.core.seq.call(null, children__10396);
    if(G__10398__10399) {
      var child__10400 = cljs.core.first.call(null, G__10398__10399);
      var G__10398__10401 = G__10398__10399;
      while(true) {
        frag__10397.appendChild(child__10400);
        var temp__4092__auto____10402 = cljs.core.next.call(null, G__10398__10401);
        if(temp__4092__auto____10402) {
          var G__10398__10403 = temp__4092__auto____10402;
          var G__10406 = cljs.core.first.call(null, G__10398__10403);
          var G__10407 = G__10398__10403;
          child__10400 = G__10406;
          G__10398__10401 = G__10407;
          continue
        }else {
        }
        break
      }
    }else {
    }
    return frag__10397
  }();
  var other_children__10405 = cljs.core.doall.call(null, cljs.core.repeatedly.call(null, cljs.core.count.call(null, parents__10395) - 1, function() {
    return first_child__10404.cloneNode(true)
  }));
  if(cljs.core.seq.call(null, parents__10395)) {
    f.call(null, cljs.core.first.call(null, parents__10395), first_child__10404);
    return cljs.core.doall.call(null, cljs.core.map.call(null, function(p1__10378_SHARP_, p2__10379_SHARP_) {
      return f.call(null, p1__10378_SHARP_, p2__10379_SHARP_)
    }, cljs.core.rest.call(null, parents__10395), other_children__10405))
  }else {
    return null
  }
};
domina.lazy_nl_via_item = function() {
  var lazy_nl_via_item = null;
  var lazy_nl_via_item__1 = function(nl) {
    return lazy_nl_via_item.call(null, nl, 0)
  };
  var lazy_nl_via_item__2 = function(nl, n) {
    if(n < nl.length) {
      return new cljs.core.LazySeq(null, false, function() {
        return cljs.core.cons.call(null, nl.item(n), lazy_nl_via_item.call(null, nl, n + 1))
      }, null)
    }else {
      return null
    }
  };
  lazy_nl_via_item = function(nl, n) {
    switch(arguments.length) {
      case 1:
        return lazy_nl_via_item__1.call(this, nl);
      case 2:
        return lazy_nl_via_item__2.call(this, nl, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  lazy_nl_via_item.cljs$lang$arity$1 = lazy_nl_via_item__1;
  lazy_nl_via_item.cljs$lang$arity$2 = lazy_nl_via_item__2;
  return lazy_nl_via_item
}();
domina.lazy_nl_via_array_ref = function() {
  var lazy_nl_via_array_ref = null;
  var lazy_nl_via_array_ref__1 = function(nl) {
    return lazy_nl_via_array_ref.call(null, nl, 0)
  };
  var lazy_nl_via_array_ref__2 = function(nl, n) {
    if(n < nl.length) {
      return new cljs.core.LazySeq(null, false, function() {
        return cljs.core.cons.call(null, nl[n], lazy_nl_via_array_ref.call(null, nl, n + 1))
      }, null)
    }else {
      return null
    }
  };
  lazy_nl_via_array_ref = function(nl, n) {
    switch(arguments.length) {
      case 1:
        return lazy_nl_via_array_ref__1.call(this, nl);
      case 2:
        return lazy_nl_via_array_ref__2.call(this, nl, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  lazy_nl_via_array_ref.cljs$lang$arity$1 = lazy_nl_via_array_ref__1;
  lazy_nl_via_array_ref.cljs$lang$arity$2 = lazy_nl_via_array_ref__2;
  return lazy_nl_via_array_ref
}();
domina.lazy_nodelist = function lazy_nodelist(nl) {
  if(cljs.core.truth_(nl.item)) {
    return domina.lazy_nl_via_item.call(null, nl)
  }else {
    return domina.lazy_nl_via_array_ref.call(null, nl)
  }
};
domina.array_like_QMARK_ = function array_like_QMARK_(obj) {
  var and__3941__auto____10409 = obj;
  if(cljs.core.truth_(and__3941__auto____10409)) {
    return obj.length
  }else {
    return and__3941__auto____10409
  }
};
domina.normalize_seq = function normalize_seq(list_thing) {
  if(list_thing == null) {
    return cljs.core.List.EMPTY
  }else {
    if(function() {
      var G__10413__10414 = list_thing;
      if(G__10413__10414) {
        if(function() {
          var or__3943__auto____10415 = G__10413__10414.cljs$lang$protocol_mask$partition0$ & 8388608;
          if(or__3943__auto____10415) {
            return or__3943__auto____10415
          }else {
            return G__10413__10414.cljs$core$ISeqable$
          }
        }()) {
          return true
        }else {
          if(!G__10413__10414.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__10413__10414)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__10413__10414)
      }
    }()) {
      return cljs.core.seq.call(null, list_thing)
    }else {
      if(cljs.core.truth_(domina.array_like_QMARK_.call(null, list_thing))) {
        return domina.lazy_nodelist.call(null, list_thing)
      }else {
        if("\ufdd0'default") {
          return cljs.core.seq.call(null, cljs.core.PersistentVector.fromArray([list_thing], true))
        }else {
          return null
        }
      }
    }
  }
};
domina.DomContent["_"] = true;
domina.nodes["_"] = function(content) {
  if(content == null) {
    return cljs.core.List.EMPTY
  }else {
    if(function() {
      var G__10416__10417 = content;
      if(G__10416__10417) {
        if(function() {
          var or__3943__auto____10418 = G__10416__10417.cljs$lang$protocol_mask$partition0$ & 8388608;
          if(or__3943__auto____10418) {
            return or__3943__auto____10418
          }else {
            return G__10416__10417.cljs$core$ISeqable$
          }
        }()) {
          return true
        }else {
          if(!G__10416__10417.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__10416__10417)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__10416__10417)
      }
    }()) {
      return cljs.core.seq.call(null, content)
    }else {
      if(cljs.core.truth_(domina.array_like_QMARK_.call(null, content))) {
        return domina.lazy_nodelist.call(null, content)
      }else {
        if("\ufdd0'default") {
          return cljs.core.seq.call(null, cljs.core.PersistentVector.fromArray([content], true))
        }else {
          return null
        }
      }
    }
  }
};
domina.single_node["_"] = function(content) {
  if(content == null) {
    return null
  }else {
    if(function() {
      var G__10419__10420 = content;
      if(G__10419__10420) {
        if(function() {
          var or__3943__auto____10421 = G__10419__10420.cljs$lang$protocol_mask$partition0$ & 8388608;
          if(or__3943__auto____10421) {
            return or__3943__auto____10421
          }else {
            return G__10419__10420.cljs$core$ISeqable$
          }
        }()) {
          return true
        }else {
          if(!G__10419__10420.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__10419__10420)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__10419__10420)
      }
    }()) {
      return cljs.core.first.call(null, content)
    }else {
      if(cljs.core.truth_(domina.array_like_QMARK_.call(null, content))) {
        return content.item(0)
      }else {
        if("\ufdd0'default") {
          return content
        }else {
          return null
        }
      }
    }
  }
};
domina.DomContent["string"] = true;
domina.nodes["string"] = function(s) {
  return cljs.core.doall.call(null, domina.nodes.call(null, domina.string_to_dom.call(null, s)))
};
domina.single_node["string"] = function(s) {
  return domina.single_node.call(null, domina.string_to_dom.call(null, s))
};
if(cljs.core.truth_(typeof NodeList != "undefined")) {
  NodeList.prototype.cljs$core$ISeqable$ = true;
  NodeList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(nodelist) {
    return domina.lazy_nodelist.call(null, nodelist)
  };
  NodeList.prototype.cljs$core$IIndexed$ = true;
  NodeList.prototype.cljs$core$IIndexed$_nth$arity$2 = function(nodelist, n) {
    return nodelist.item(n)
  };
  NodeList.prototype.cljs$core$IIndexed$_nth$arity$3 = function(nodelist, n, not_found) {
    if(nodelist.length <= n) {
      return not_found
    }else {
      return cljs.core.nth.call(null, nodelist, n)
    }
  };
  NodeList.prototype.cljs$core$ICounted$ = true;
  NodeList.prototype.cljs$core$ICounted$_count$arity$1 = function(nodelist) {
    return nodelist.length
  }
}else {
}
if(cljs.core.truth_(typeof StaticNodeList != "undefined")) {
  StaticNodeList.prototype.cljs$core$ISeqable$ = true;
  StaticNodeList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(nodelist) {
    return domina.lazy_nodelist.call(null, nodelist)
  };
  StaticNodeList.prototype.cljs$core$IIndexed$ = true;
  StaticNodeList.prototype.cljs$core$IIndexed$_nth$arity$2 = function(nodelist, n) {
    return nodelist.item(n)
  };
  StaticNodeList.prototype.cljs$core$IIndexed$_nth$arity$3 = function(nodelist, n, not_found) {
    if(nodelist.length <= n) {
      return not_found
    }else {
      return cljs.core.nth.call(null, nodelist, n)
    }
  };
  StaticNodeList.prototype.cljs$core$ICounted$ = true;
  StaticNodeList.prototype.cljs$core$ICounted$_count$arity$1 = function(nodelist) {
    return nodelist.length
  }
}else {
}
if(cljs.core.truth_(typeof HTMLCollection != "undefined")) {
  HTMLCollection.prototype.cljs$core$ISeqable$ = true;
  HTMLCollection.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
    return domina.lazy_nodelist.call(null, coll)
  };
  HTMLCollection.prototype.cljs$core$IIndexed$ = true;
  HTMLCollection.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
    return coll.item(n)
  };
  HTMLCollection.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
    if(coll.length <= n) {
      return not_found
    }else {
      return cljs.core.nth.call(null, coll, n)
    }
  };
  HTMLCollection.prototype.cljs$core$ICounted$ = true;
  HTMLCollection.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
    return coll.length
  }
}else {
}
;goog.provide("goog.functions");
goog.functions.constant = function(retValue) {
  return function() {
    return retValue
  }
};
goog.functions.FALSE = goog.functions.constant(false);
goog.functions.TRUE = goog.functions.constant(true);
goog.functions.NULL = goog.functions.constant(null);
goog.functions.identity = function(opt_returnValue, var_args) {
  return opt_returnValue
};
goog.functions.error = function(message) {
  return function() {
    throw Error(message);
  }
};
goog.functions.lock = function(f) {
  return function() {
    return f.call(this)
  }
};
goog.functions.withReturnValue = function(f, retValue) {
  return goog.functions.sequence(f, goog.functions.constant(retValue))
};
goog.functions.compose = function(var_args) {
  var functions = arguments;
  var length = functions.length;
  return function() {
    var result;
    if(length) {
      result = functions[length - 1].apply(this, arguments)
    }
    for(var i = length - 2;i >= 0;i--) {
      result = functions[i].call(this, result)
    }
    return result
  }
};
goog.functions.sequence = function(var_args) {
  var functions = arguments;
  var length = functions.length;
  return function() {
    var result;
    for(var i = 0;i < length;i++) {
      result = functions[i].apply(this, arguments)
    }
    return result
  }
};
goog.functions.and = function(var_args) {
  var functions = arguments;
  var length = functions.length;
  return function() {
    for(var i = 0;i < length;i++) {
      if(!functions[i].apply(this, arguments)) {
        return false
      }
    }
    return true
  }
};
goog.functions.or = function(var_args) {
  var functions = arguments;
  var length = functions.length;
  return function() {
    for(var i = 0;i < length;i++) {
      if(functions[i].apply(this, arguments)) {
        return true
      }
    }
    return false
  }
};
goog.functions.not = function(f) {
  return function() {
    return!f.apply(this, arguments)
  }
};
goog.functions.create = function(constructor, var_args) {
  var temp = function() {
  };
  temp.prototype = constructor.prototype;
  var obj = new temp;
  constructor.apply(obj, Array.prototype.slice.call(arguments, 1));
  return obj
};
/*
 Portions of this code are from the Dojo Toolkit, received by
 The Closure Library Authors under the BSD license. All other code is
 Copyright 2005-2009 The Closure Library Authors. All Rights Reserved.

The "New" BSD License:

Copyright (c) 2005-2009, The Dojo Foundation
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

 Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
 Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation
    and/or other materials provided with the distribution.
 Neither the name of the Dojo Foundation nor the names of its contributors
    may be used to endorse or promote products derived from this software
    without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
goog.provide("goog.dom.query");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.functions");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.dom.query = function() {
  var cssCaseBug = goog.userAgent.WEBKIT && goog.dom.getDocument().compatMode == "BackCompat";
  var childNodesName = !!goog.dom.getDocument().firstChild["children"] ? "children" : "childNodes";
  var specials = ">~+";
  var caseSensitive = false;
  var getQueryParts = function(query) {
    if(specials.indexOf(query.slice(-1)) >= 0) {
      query += " * "
    }else {
      query += " "
    }
    var ts = function(s, e) {
      return goog.string.trim(query.slice(s, e))
    };
    var queryParts = [];
    var inBrackets = -1, inParens = -1, inMatchFor = -1, inPseudo = -1, inClass = -1, inId = -1, inTag = -1, lc = "", cc = "", pStart;
    var x = 0, ql = query.length, currentPart = null, cp = null;
    var endTag = function() {
      if(inTag >= 0) {
        var tv = inTag == x ? null : ts(inTag, x);
        if(specials.indexOf(tv) < 0) {
          currentPart.tag = tv
        }else {
          currentPart.oper = tv
        }
        inTag = -1
      }
    };
    var endId = function() {
      if(inId >= 0) {
        currentPart.id = ts(inId, x).replace(/\\/g, "");
        inId = -1
      }
    };
    var endClass = function() {
      if(inClass >= 0) {
        currentPart.classes.push(ts(inClass + 1, x).replace(/\\/g, ""));
        inClass = -1
      }
    };
    var endAll = function() {
      endId();
      endTag();
      endClass()
    };
    var endPart = function() {
      endAll();
      if(inPseudo >= 0) {
        currentPart.pseudos.push({name:ts(inPseudo + 1, x)})
      }
      currentPart.loops = currentPart.pseudos.length || currentPart.attrs.length || currentPart.classes.length;
      currentPart.oquery = currentPart.query = ts(pStart, x);
      currentPart.otag = currentPart.tag = currentPart.oper ? null : currentPart.tag || "*";
      if(currentPart.tag) {
        currentPart.tag = currentPart.tag.toUpperCase()
      }
      if(queryParts.length && queryParts[queryParts.length - 1].oper) {
        currentPart.infixOper = queryParts.pop();
        currentPart.query = currentPart.infixOper.query + " " + currentPart.query
      }
      queryParts.push(currentPart);
      currentPart = null
    };
    for(;lc = cc, cc = query.charAt(x), x < ql;x++) {
      if(lc == "\\") {
        continue
      }
      if(!currentPart) {
        pStart = x;
        currentPart = {query:null, pseudos:[], attrs:[], classes:[], tag:null, oper:null, id:null, getTag:function() {
          return caseSensitive ? this.otag : this.tag
        }};
        inTag = x
      }
      if(inBrackets >= 0) {
        if(cc == "]") {
          if(!cp.attr) {
            cp.attr = ts(inBrackets + 1, x)
          }else {
            cp.matchFor = ts(inMatchFor || inBrackets + 1, x)
          }
          var cmf = cp.matchFor;
          if(cmf) {
            if(cmf.charAt(0) == '"' || cmf.charAt(0) == "'") {
              cp.matchFor = cmf.slice(1, -1)
            }
          }
          currentPart.attrs.push(cp);
          cp = null;
          inBrackets = inMatchFor = -1
        }else {
          if(cc == "=") {
            var addToCc = "|~^$*".indexOf(lc) >= 0 ? lc : "";
            cp.type = addToCc + cc;
            cp.attr = ts(inBrackets + 1, x - addToCc.length);
            inMatchFor = x + 1
          }
        }
      }else {
        if(inParens >= 0) {
          if(cc == ")") {
            if(inPseudo >= 0) {
              cp.value = ts(inParens + 1, x)
            }
            inPseudo = inParens = -1
          }
        }else {
          if(cc == "#") {
            endAll();
            inId = x + 1
          }else {
            if(cc == ".") {
              endAll();
              inClass = x
            }else {
              if(cc == ":") {
                endAll();
                inPseudo = x
              }else {
                if(cc == "[") {
                  endAll();
                  inBrackets = x;
                  cp = {}
                }else {
                  if(cc == "(") {
                    if(inPseudo >= 0) {
                      cp = {name:ts(inPseudo + 1, x), value:null};
                      currentPart.pseudos.push(cp)
                    }
                    inParens = x
                  }else {
                    if(cc == " " && lc != cc) {
                      endPart()
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return queryParts
  };
  var agree = function(first, second) {
    if(!first) {
      return second
    }
    if(!second) {
      return first
    }
    return function() {
      return first.apply(window, arguments) && second.apply(window, arguments)
    }
  };
  function getArr(i, opt_arr) {
    var r = opt_arr || [];
    if(i) {
      r.push(i)
    }
    return r
  }
  var isElement = function(n) {
    return 1 == n.nodeType
  };
  var blank = "";
  var getAttr = function(elem, attr) {
    if(!elem) {
      return blank
    }
    if(attr == "class") {
      return elem.className || blank
    }
    if(attr == "for") {
      return elem.htmlFor || blank
    }
    if(attr == "style") {
      return elem.style.cssText || blank
    }
    return(caseSensitive ? elem.getAttribute(attr) : elem.getAttribute(attr, 2)) || blank
  };
  var attrs = {"*=":function(attr, value) {
    return function(elem) {
      return getAttr(elem, attr).indexOf(value) >= 0
    }
  }, "^=":function(attr, value) {
    return function(elem) {
      return getAttr(elem, attr).indexOf(value) == 0
    }
  }, "$=":function(attr, value) {
    var tval = " " + value;
    return function(elem) {
      var ea = " " + getAttr(elem, attr);
      return ea.lastIndexOf(value) == ea.length - value.length
    }
  }, "~=":function(attr, value) {
    var tval = " " + value + " ";
    return function(elem) {
      var ea = " " + getAttr(elem, attr) + " ";
      return ea.indexOf(tval) >= 0
    }
  }, "|=":function(attr, value) {
    value = " " + value;
    return function(elem) {
      var ea = " " + getAttr(elem, attr);
      return ea == value || ea.indexOf(value + "-") == 0
    }
  }, "=":function(attr, value) {
    return function(elem) {
      return getAttr(elem, attr) == value
    }
  }};
  var noNextElementSibling = typeof goog.dom.getDocument().firstChild.nextElementSibling == "undefined";
  var nSibling = !noNextElementSibling ? "nextElementSibling" : "nextSibling";
  var pSibling = !noNextElementSibling ? "previousElementSibling" : "previousSibling";
  var simpleNodeTest = noNextElementSibling ? isElement : goog.functions.TRUE;
  var _lookLeft = function(node) {
    while(node = node[pSibling]) {
      if(simpleNodeTest(node)) {
        return false
      }
    }
    return true
  };
  var _lookRight = function(node) {
    while(node = node[nSibling]) {
      if(simpleNodeTest(node)) {
        return false
      }
    }
    return true
  };
  var getNodeIndex = function(node) {
    var root = node.parentNode;
    var i = 0, tret = root[childNodesName], ci = node["_i"] || -1, cl = root["_l"] || -1;
    if(!tret) {
      return-1
    }
    var l = tret.length;
    if(cl == l && ci >= 0 && cl >= 0) {
      return ci
    }
    root["_l"] = l;
    ci = -1;
    var te = root["firstElementChild"] || root["firstChild"];
    for(;te;te = te[nSibling]) {
      if(simpleNodeTest(te)) {
        te["_i"] = ++i;
        if(node === te) {
          ci = i
        }
      }
    }
    return ci
  };
  var isEven = function(elem) {
    return!(getNodeIndex(elem) % 2)
  };
  var isOdd = function(elem) {
    return getNodeIndex(elem) % 2
  };
  var pseudos = {"checked":function(name, condition) {
    return function(elem) {
      return elem.checked || elem.attributes["checked"]
    }
  }, "first-child":function() {
    return _lookLeft
  }, "last-child":function() {
    return _lookRight
  }, "only-child":function(name, condition) {
    return function(node) {
      if(!_lookLeft(node)) {
        return false
      }
      if(!_lookRight(node)) {
        return false
      }
      return true
    }
  }, "empty":function(name, condition) {
    return function(elem) {
      var cn = elem.childNodes;
      var cnl = elem.childNodes.length;
      for(var x = cnl - 1;x >= 0;x--) {
        var nt = cn[x].nodeType;
        if(nt === 1 || nt == 3) {
          return false
        }
      }
      return true
    }
  }, "contains":function(name, condition) {
    var cz = condition.charAt(0);
    if(cz == '"' || cz == "'") {
      condition = condition.slice(1, -1)
    }
    return function(elem) {
      return elem.innerHTML.indexOf(condition) >= 0
    }
  }, "not":function(name, condition) {
    var p = getQueryParts(condition)[0];
    var ignores = {el:1};
    if(p.tag != "*") {
      ignores.tag = 1
    }
    if(!p.classes.length) {
      ignores.classes = 1
    }
    var ntf = getSimpleFilterFunc(p, ignores);
    return function(elem) {
      return!ntf(elem)
    }
  }, "nth-child":function(name, condition) {
    function pi(n) {
      return parseInt(n, 10)
    }
    if(condition == "odd") {
      return isOdd
    }else {
      if(condition == "even") {
        return isEven
      }
    }
    if(condition.indexOf("n") != -1) {
      var tparts = condition.split("n", 2);
      var pred = tparts[0] ? tparts[0] == "-" ? -1 : pi(tparts[0]) : 1;
      var idx = tparts[1] ? pi(tparts[1]) : 0;
      var lb = 0, ub = -1;
      if(pred > 0) {
        if(idx < 0) {
          idx = idx % pred && pred + idx % pred
        }else {
          if(idx > 0) {
            if(idx >= pred) {
              lb = idx - idx % pred
            }
            idx = idx % pred
          }
        }
      }else {
        if(pred < 0) {
          pred *= -1;
          if(idx > 0) {
            ub = idx;
            idx = idx % pred
          }
        }
      }
      if(pred > 0) {
        return function(elem) {
          var i = getNodeIndex(elem);
          return i >= lb && (ub < 0 || i <= ub) && i % pred == idx
        }
      }else {
        condition = idx
      }
    }
    var ncount = pi(condition);
    return function(elem) {
      return getNodeIndex(elem) == ncount
    }
  }};
  var defaultGetter = goog.userAgent.IE ? function(cond) {
    var clc = cond.toLowerCase();
    if(clc == "class") {
      cond = "className"
    }
    return function(elem) {
      return caseSensitive ? elem.getAttribute(cond) : elem[cond] || elem[clc]
    }
  } : function(cond) {
    return function(elem) {
      return elem && elem.getAttribute && elem.hasAttribute(cond)
    }
  };
  var getSimpleFilterFunc = function(query, ignores) {
    if(!query) {
      return goog.functions.TRUE
    }
    ignores = ignores || {};
    var ff = null;
    if(!ignores.el) {
      ff = agree(ff, isElement)
    }
    if(!ignores.tag) {
      if(query.tag != "*") {
        ff = agree(ff, function(elem) {
          return elem && elem.tagName == query.getTag()
        })
      }
    }
    if(!ignores.classes) {
      goog.array.forEach(query.classes, function(cname, idx, arr) {
        var re = new RegExp("(?:^|\\s)" + cname + "(?:\\s|$)");
        ff = agree(ff, function(elem) {
          return re.test(elem.className)
        });
        ff.count = idx
      })
    }
    if(!ignores.pseudos) {
      goog.array.forEach(query.pseudos, function(pseudo) {
        var pn = pseudo.name;
        if(pseudos[pn]) {
          ff = agree(ff, pseudos[pn](pn, pseudo.value))
        }
      })
    }
    if(!ignores.attrs) {
      goog.array.forEach(query.attrs, function(attr) {
        var matcher;
        var a = attr.attr;
        if(attr.type && attrs[attr.type]) {
          matcher = attrs[attr.type](a, attr.matchFor)
        }else {
          if(a.length) {
            matcher = defaultGetter(a)
          }
        }
        if(matcher) {
          ff = agree(ff, matcher)
        }
      })
    }
    if(!ignores.id) {
      if(query.id) {
        ff = agree(ff, function(elem) {
          return!!elem && elem.id == query.id
        })
      }
    }
    if(!ff) {
      if(!("default" in ignores)) {
        ff = goog.functions.TRUE
      }
    }
    return ff
  };
  var nextSiblingIterator = function(filterFunc) {
    return function(node, ret, bag) {
      while(node = node[nSibling]) {
        if(noNextElementSibling && !isElement(node)) {
          continue
        }
        if((!bag || _isUnique(node, bag)) && filterFunc(node)) {
          ret.push(node)
        }
        break
      }
      return ret
    }
  };
  var nextSiblingsIterator = function(filterFunc) {
    return function(root, ret, bag) {
      var te = root[nSibling];
      while(te) {
        if(simpleNodeTest(te)) {
          if(bag && !_isUnique(te, bag)) {
            break
          }
          if(filterFunc(te)) {
            ret.push(te)
          }
        }
        te = te[nSibling]
      }
      return ret
    }
  };
  var _childElements = function(filterFunc) {
    filterFunc = filterFunc || goog.functions.TRUE;
    return function(root, ret, bag) {
      var te, x = 0, tret = root[childNodesName];
      while(te = tret[x++]) {
        if(simpleNodeTest(te) && (!bag || _isUnique(te, bag)) && filterFunc(te, x)) {
          ret.push(te)
        }
      }
      return ret
    }
  };
  var _isDescendant = function(node, root) {
    var pn = node.parentNode;
    while(pn) {
      if(pn == root) {
        break
      }
      pn = pn.parentNode
    }
    return!!pn
  };
  var _getElementsFuncCache = {};
  var getElementsFunc = function(query) {
    var retFunc = _getElementsFuncCache[query.query];
    if(retFunc) {
      return retFunc
    }
    var io = query.infixOper;
    var oper = io ? io.oper : "";
    var filterFunc = getSimpleFilterFunc(query, {el:1});
    var qt = query.tag;
    var wildcardTag = "*" == qt;
    var ecs = goog.dom.getDocument()["getElementsByClassName"];
    if(!oper) {
      if(query.id) {
        filterFunc = !query.loops && wildcardTag ? goog.functions.TRUE : getSimpleFilterFunc(query, {el:1, id:1});
        retFunc = function(root, arr) {
          var te = goog.dom.getDomHelper(root).getElement(query.id);
          if(!te || !filterFunc(te)) {
            return
          }
          if(9 == root.nodeType) {
            return getArr(te, arr)
          }else {
            if(_isDescendant(te, root)) {
              return getArr(te, arr)
            }
          }
        }
      }else {
        if(ecs && /\{\s*\[native code\]\s*\}/.test(String(ecs)) && query.classes.length && !cssCaseBug) {
          filterFunc = getSimpleFilterFunc(query, {el:1, classes:1, id:1});
          var classesString = query.classes.join(" ");
          retFunc = function(root, arr) {
            var ret = getArr(0, arr), te, x = 0;
            var tret = root.getElementsByClassName(classesString);
            while(te = tret[x++]) {
              if(filterFunc(te, root)) {
                ret.push(te)
              }
            }
            return ret
          }
        }else {
          if(!wildcardTag && !query.loops) {
            retFunc = function(root, arr) {
              var ret = getArr(0, arr), te, x = 0;
              var tret = root.getElementsByTagName(query.getTag());
              while(te = tret[x++]) {
                ret.push(te)
              }
              return ret
            }
          }else {
            filterFunc = getSimpleFilterFunc(query, {el:1, tag:1, id:1});
            retFunc = function(root, arr) {
              var ret = getArr(0, arr), te, x = 0;
              var tret = root.getElementsByTagName(query.getTag());
              while(te = tret[x++]) {
                if(filterFunc(te, root)) {
                  ret.push(te)
                }
              }
              return ret
            }
          }
        }
      }
    }else {
      var skipFilters = {el:1};
      if(wildcardTag) {
        skipFilters.tag = 1
      }
      filterFunc = getSimpleFilterFunc(query, skipFilters);
      if("+" == oper) {
        retFunc = nextSiblingIterator(filterFunc)
      }else {
        if("~" == oper) {
          retFunc = nextSiblingsIterator(filterFunc)
        }else {
          if(">" == oper) {
            retFunc = _childElements(filterFunc)
          }
        }
      }
    }
    return _getElementsFuncCache[query.query] = retFunc
  };
  var filterDown = function(root, queryParts) {
    var candidates = getArr(root), qp, x, te, qpl = queryParts.length, bag, ret;
    for(var i = 0;i < qpl;i++) {
      ret = [];
      qp = queryParts[i];
      x = candidates.length - 1;
      if(x > 0) {
        bag = {};
        ret.nozip = true
      }
      var gef = getElementsFunc(qp);
      for(var j = 0;te = candidates[j];j++) {
        gef(te, ret, bag)
      }
      if(!ret.length) {
        break
      }
      candidates = ret
    }
    return ret
  };
  var _queryFuncCacheDOM = {}, _queryFuncCacheQSA = {};
  var getStepQueryFunc = function(query) {
    var qparts = getQueryParts(goog.string.trim(query));
    if(qparts.length == 1) {
      var tef = getElementsFunc(qparts[0]);
      return function(root) {
        var r = tef(root, []);
        if(r) {
          r.nozip = true
        }
        return r
      }
    }
    return function(root) {
      return filterDown(root, qparts)
    }
  };
  var qsa = "querySelectorAll";
  var qsaAvail = !!goog.dom.getDocument()[qsa] && (!goog.userAgent.WEBKIT || goog.userAgent.isVersion("526"));
  var getQueryFunc = function(query, opt_forceDOM) {
    if(qsaAvail) {
      var qsaCached = _queryFuncCacheQSA[query];
      if(qsaCached && !opt_forceDOM) {
        return qsaCached
      }
    }
    var domCached = _queryFuncCacheDOM[query];
    if(domCached) {
      return domCached
    }
    var qcz = query.charAt(0);
    var nospace = -1 == query.indexOf(" ");
    if(query.indexOf("#") >= 0 && nospace) {
      opt_forceDOM = true
    }
    var useQSA = qsaAvail && !opt_forceDOM && specials.indexOf(qcz) == -1 && (!goog.userAgent.IE || query.indexOf(":") == -1) && !(cssCaseBug && query.indexOf(".") >= 0) && query.indexOf(":contains") == -1 && query.indexOf("|=") == -1;
    if(useQSA) {
      var tq = specials.indexOf(query.charAt(query.length - 1)) >= 0 ? query + " *" : query;
      return _queryFuncCacheQSA[query] = function(root) {
        try {
          if(!(9 == root.nodeType || nospace)) {
            throw"";
          }
          var r = root[qsa](tq);
          if(goog.userAgent.IE) {
            r.commentStrip = true
          }else {
            r.nozip = true
          }
          return r
        }catch(e) {
          return getQueryFunc(query, true)(root)
        }
      }
    }else {
      var parts = query.split(/\s*,\s*/);
      return _queryFuncCacheDOM[query] = parts.length < 2 ? getStepQueryFunc(query) : function(root) {
        var pindex = 0, ret = [], tp;
        while(tp = parts[pindex++]) {
          ret = ret.concat(getStepQueryFunc(tp)(root))
        }
        return ret
      }
    }
  };
  var _zipIdx = 0;
  var _nodeUID = goog.userAgent.IE ? function(node) {
    if(caseSensitive) {
      return node.getAttribute("_uid") || node.setAttribute("_uid", ++_zipIdx) || _zipIdx
    }else {
      return node.uniqueID
    }
  } : function(node) {
    return node["_uid"] || (node["_uid"] = ++_zipIdx)
  };
  var _isUnique = function(node, bag) {
    if(!bag) {
      return 1
    }
    var id = _nodeUID(node);
    if(!bag[id]) {
      return bag[id] = 1
    }
    return 0
  };
  var _zipIdxName = "_zipIdx";
  var _zip = function(arr) {
    if(arr && arr.nozip) {
      return arr
    }
    var ret = [];
    if(!arr || !arr.length) {
      return ret
    }
    if(arr[0]) {
      ret.push(arr[0])
    }
    if(arr.length < 2) {
      return ret
    }
    _zipIdx++;
    if(goog.userAgent.IE && caseSensitive) {
      var szidx = _zipIdx + "";
      arr[0].setAttribute(_zipIdxName, szidx);
      for(var x = 1, te;te = arr[x];x++) {
        if(arr[x].getAttribute(_zipIdxName) != szidx) {
          ret.push(te)
        }
        te.setAttribute(_zipIdxName, szidx)
      }
    }else {
      if(goog.userAgent.IE && arr.commentStrip) {
        try {
          for(var x = 1, te;te = arr[x];x++) {
            if(isElement(te)) {
              ret.push(te)
            }
          }
        }catch(e) {
        }
      }else {
        if(arr[0]) {
          arr[0][_zipIdxName] = _zipIdx
        }
        for(var x = 1, te;te = arr[x];x++) {
          if(arr[x][_zipIdxName] != _zipIdx) {
            ret.push(te)
          }
          te[_zipIdxName] = _zipIdx
        }
      }
    }
    return ret
  };
  var query = function(query, root) {
    if(!query) {
      return[]
    }
    if(query.constructor == Array) {
      return query
    }
    if(!goog.isString(query)) {
      return[query]
    }
    if(goog.isString(root)) {
      root = goog.dom.getElement(root);
      if(!root) {
        return[]
      }
    }
    root = root || goog.dom.getDocument();
    var od = root.ownerDocument || root.documentElement;
    caseSensitive = root.contentType && root.contentType == "application/xml" || goog.userAgent.OPERA && (root.doctype || od.toString() == "[object XMLDocument]") || !!od && (goog.userAgent.IE ? od.xml : root.xmlVersion || od.xmlVersion);
    var r = getQueryFunc(query)(root);
    if(r && r.nozip) {
      return r
    }
    return _zip(r)
  };
  query.pseudos = pseudos;
  return query
}();
goog.exportSymbol("goog.dom.query", goog.dom.query);
goog.exportSymbol("goog.dom.query.pseudos", goog.dom.query.pseudos);
goog.provide("domina.css");
goog.require("cljs.core");
goog.require("goog.dom.query");
goog.require("goog.dom");
goog.require("domina");
domina.css.root_element = function root_element() {
  return goog.dom.getElementsByTagNameAndClass("html")[0]
};
domina.css.sel = function() {
  var sel = null;
  var sel__1 = function(expr) {
    return sel.call(null, domina.css.root_element.call(null), expr)
  };
  var sel__2 = function(base, expr) {
    if(void 0 === domina.css.t44523) {
      domina.css.t44523 = function(expr, base, sel, meta44524) {
        this.expr = expr;
        this.base = base;
        this.sel = sel;
        this.meta44524 = meta44524;
        this.cljs$lang$protocol_mask$partition1$ = 0;
        this.cljs$lang$protocol_mask$partition0$ = 393216
      };
      domina.css.t44523.cljs$lang$type = true;
      domina.css.t44523.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
        return cljs.core.list.call(null, "domina.css/t44523")
      };
      domina.css.t44523.prototype.domina$DomContent$ = true;
      domina.css.t44523.prototype.domina$DomContent$nodes$arity$1 = function(_) {
        var this__44526 = this;
        return cljs.core.mapcat.call(null, function(p1__44514_SHARP_) {
          return domina.normalize_seq.call(null, goog.dom.query(this__44526.expr, p1__44514_SHARP_))
        }, domina.nodes.call(null, this__44526.base))
      };
      domina.css.t44523.prototype.domina$DomContent$single_node$arity$1 = function(_) {
        var this__44527 = this;
        return cljs.core.first.call(null, cljs.core.filter.call(null, cljs.core.complement.call(null, cljs.core.nil_QMARK_), cljs.core.mapcat.call(null, function(p1__44515_SHARP_) {
          return domina.normalize_seq.call(null, goog.dom.query(this__44527.expr, p1__44515_SHARP_))
        }, domina.nodes.call(null, this__44527.base))))
      };
      domina.css.t44523.prototype.cljs$core$IMeta$_meta$arity$1 = function(_44525) {
        var this__44528 = this;
        return this__44528.meta44524
      };
      domina.css.t44523.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(_44525, meta44524) {
        var this__44529 = this;
        return new domina.css.t44523(this__44529.expr, this__44529.base, this__44529.sel, meta44524)
      };
      domina.css.t44523
    }else {
    }
    return new domina.css.t44523(expr, base, sel, null)
  };
  sel = function(base, expr) {
    switch(arguments.length) {
      case 1:
        return sel__1.call(this, base);
      case 2:
        return sel__2.call(this, base, expr)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sel.cljs$lang$arity$1 = sel__1;
  sel.cljs$lang$arity$2 = sel__2;
  return sel
}();
goog.provide("foray_progress.update");
goog.require("cljs.core");
goog.require("clojure.browser.event");
goog.require("domina.css");
goog.require("domina");
foray_progress.update.update_button = domina.by_id.call(null, "update");
foray_progress.update.selected_progress = function selected_progress() {
  return cljs.core.first.call(null, cljs.core.map.call(null, domina.value, domina.nodes.call(null, domina.css.sel.call(null, "[name=progress]:checked"))))
};
clojure.browser.event.listen.call(null, foray_progress.update.update_button, "click", function(evt) {
  return alert(foray_progress.update.selected_progress.call(null))
});
