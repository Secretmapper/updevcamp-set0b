(function() {
  'use strict';

  var globals = typeof window === 'undefined' ? global : window;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};
  var has = ({}).hasOwnProperty;

  var aliases = {};

  var endsWith = function(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  };

  var unalias = function(alias, loaderPath) {
    var start = 0;
    if (loaderPath) {
      if (loaderPath.indexOf('components/' === 0)) {
        start = 'components/'.length;
      }
      if (loaderPath.indexOf('/', start) > 0) {
        loaderPath = loaderPath.substring(start, loaderPath.indexOf('/', start));
      }
    }
    var result = aliases[alias + '/index.js'] || aliases[loaderPath + '/deps/' + alias + '/index.js'];
    if (result) {
      return 'components/' + result.substring(0, result.length - '.js'.length);
    }
    return alias;
  };

  var expand = (function() {
    var reg = /^\.\.?(\/|$)/;
    return function(root, name) {
      var results = [], parts, part;
      parts = (reg.test(name) ? root + '/' + name : name).split('/');
      for (var i = 0, length = parts.length; i < length; i++) {
        part = parts[i];
        if (part === '..') {
          results.pop();
        } else if (part !== '.' && part !== '') {
          results.push(part);
        }
      }
      return results.join('/');
    };
  })();
  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function(name) {
      var absolute = expand(dirname(path), name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var module = {id: name, exports: {}};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var require = function(name, loaderPath) {
    var path = expand(name, '.');
    if (loaderPath == null) loaderPath = '/';
    path = unalias(name, loaderPath);

    if (has.call(cache, path)) return cache[path].exports;
    if (has.call(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has.call(cache, dirIndex)) return cache[dirIndex].exports;
    if (has.call(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);

    throw new Error('Cannot find module "' + name + '" from '+ '"' + loaderPath + '"');
  };

  require.alias = function(from, to) {
    aliases[to] = from;
  };

  require.register = require.define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has.call(bundle, key)) {
          modules[key] = bundle[key];
        }
      }
    } else {
      modules[bundle] = fn;
    }
  };

  require.list = function() {
    var result = [];
    for (var item in modules) {
      if (has.call(modules, item)) {
        result.push(item);
      }
    }
    return result;
  };

  require.brunch = true;
  globals.require = require;
})();
!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.jade=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

/**
 * Merge two attribute objects giving precedence
 * to values in object `b`. Classes are special-cased
 * allowing for arrays and merging/joining appropriately
 * resulting in a string.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object} a
 * @api private
 */

exports.merge = function merge(a, b) {
  if (arguments.length === 1) {
    var attrs = a[0];
    for (var i = 1; i < a.length; i++) {
      attrs = merge(attrs, a[i]);
    }
    return attrs;
  }
  var ac = a['class'];
  var bc = b['class'];

  if (ac || bc) {
    ac = ac || [];
    bc = bc || [];
    if (!Array.isArray(ac)) ac = [ac];
    if (!Array.isArray(bc)) bc = [bc];
    a['class'] = ac.concat(bc).filter(nulls);
  }

  for (var key in b) {
    if (key != 'class') {
      a[key] = b[key];
    }
  }

  return a;
};

/**
 * Filter null `val`s.
 *
 * @param {*} val
 * @return {Boolean}
 * @api private
 */

function nulls(val) {
  return val != null && val !== '';
}

/**
 * join array as classes.
 *
 * @param {*} val
 * @return {String}
 */
exports.joinClasses = joinClasses;
function joinClasses(val) {
  return Array.isArray(val) ? val.map(joinClasses).filter(nulls).join(' ') : val;
}

/**
 * Render the given classes.
 *
 * @param {Array} classes
 * @param {Array.<Boolean>} escaped
 * @return {String}
 */
exports.cls = function cls(classes, escaped) {
  var buf = [];
  for (var i = 0; i < classes.length; i++) {
    if (escaped && escaped[i]) {
      buf.push(exports.escape(joinClasses([classes[i]])));
    } else {
      buf.push(joinClasses(classes[i]));
    }
  }
  var text = joinClasses(buf);
  if (text.length) {
    return ' class="' + text + '"';
  } else {
    return '';
  }
};

/**
 * Render the given attribute.
 *
 * @param {String} key
 * @param {String} val
 * @param {Boolean} escaped
 * @param {Boolean} terse
 * @return {String}
 */
exports.attr = function attr(key, val, escaped, terse) {
  if ('boolean' == typeof val || null == val) {
    if (val) {
      return ' ' + (terse ? key : key + '="' + key + '"');
    } else {
      return '';
    }
  } else if (0 == key.indexOf('data') && 'string' != typeof val) {
    return ' ' + key + "='" + JSON.stringify(val).replace(/'/g, '&apos;') + "'";
  } else if (escaped) {
    return ' ' + key + '="' + exports.escape(val) + '"';
  } else {
    return ' ' + key + '="' + val + '"';
  }
};

/**
 * Render the given attributes object.
 *
 * @param {Object} obj
 * @param {Object} escaped
 * @return {String}
 */
exports.attrs = function attrs(obj, terse){
  var buf = [];

  var keys = Object.keys(obj);

  if (keys.length) {
    for (var i = 0; i < keys.length; ++i) {
      var key = keys[i]
        , val = obj[key];

      if ('class' == key) {
        if (val = joinClasses(val)) {
          buf.push(' ' + key + '="' + val + '"');
        }
      } else {
        buf.push(exports.attr(key, val, false, terse));
      }
    }
  }

  return buf.join('');
};

/**
 * Escape the given string of `html`.
 *
 * @param {String} html
 * @return {String}
 * @api private
 */

exports.escape = function escape(html){
  var result = String(html)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  if (result === '' + html) return html;
  else return result;
};

/**
 * Re-throw the given `err` in context to the
 * the jade in `filename` at the given `lineno`.
 *
 * @param {Error} err
 * @param {String} filename
 * @param {String} lineno
 * @api private
 */

exports.rethrow = function rethrow(err, filename, lineno, str){
  if (!(err instanceof Error)) throw err;
  if ((typeof window != 'undefined' || !filename) && !str) {
    err.message += ' on line ' + lineno;
    throw err;
  }
  try {
    str =  str || require('fs').readFileSync(filename, 'utf8')
  } catch (ex) {
    rethrow(err, null, lineno)
  }
  var context = 3
    , lines = str.split('\n')
    , start = Math.max(lineno - context, 0)
    , end = Math.min(lines.length, lineno + context);

  // Error context
  var context = lines.slice(start, end).map(function(line, i){
    var curr = i + start + 1;
    return (curr == lineno ? '  > ' : '    ')
      + curr
      + '| '
      + line;
  }).join('\n');

  // Alter exception message
  err.path = filename;
  err.message = (filename || 'Jade') + ':' + lineno
    + '\n' + context + '\n\n' + err.message;
  throw err;
};

},{"fs":2}],2:[function(require,module,exports){

},{}]},{},[1])
(1)
});
require.register("index", function(exports, require, module) {
var __templateData = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

buf.push("<!DOCTYPE html><html lang=\"en\"><link rel=\"stylesheet\" href=\"/app.css\"><link rel=\"stylesheet\" type=\"text/css\" href=\"https://fonts.googleapis.com/css?family=Raleway:400,700\"><link rel=\"stylesheet\" href=\"https://maxcdn.bootstrapcdn.com/font-awesome/4.4.0/css/font-awesome.min.css\"><head><title>The Startup Product</title></head><body><header><h1>The Startup Product</h1><p>This is some text to describe why the startup is unique. Commonly starts with a tagline.</p><div class=\"cta\"><a href=\"\" class=\"btn\">Buy our Product</a></div></header><div class=\"product-description\"><h3>This is a short sentence to describe my startup's product.</h3><p>This is more flavour text to get you to buy the product. It's really the most awesome product ever. Really. You should just click buy now and like, I don't know, love it. If you don't love it, then you're probably stupid. You're not stupid are you? So buy now!</p></div><div class=\"features\"><h3>Full of features, full of fun</h3><div class=\"feature-row row\"><div class=\"feature col-sm-6\"><span class=\"fa-stack fa-lg\"><i class=\"fa fa-circle fa-stack-2x\"></i><i class=\"fa fa-bell fa-stack-1x fa-inverse\"></i></span><p>We'll send you annoying notifications just so you'll buy our product. Want to unsubscribe? Good luck clicking through our obscured page!</p></div><div class=\"feature col-sm-6\"><span class=\"fa-stack fa-lg\"><i class=\"fa fa-circle fa-stack-2x\"></i><i class=\"fa fa-bug fa-stack-1x fa-inverse\"></i></span><p>Our product is riddled with bugs! Our developers call them features!</p></div></div><div class=\"feature-row row\"><div class=\"feature col-sm-6\"><span class=\"fa-stack fa-lg\"><i class=\"fa fa-circle fa-stack-2x\"></i><i class=\"fa fa-gears fa-stack-1x fa-inverse\"></i></span><p>With millions of settings, you can customize the product to cater to your specific needs!</p></div><div class=\"feature col-sm-6\"><span class=\"fa-stack fa-lg\"><i class=\"fa fa-circle fa-stack-2x\"></i><i class=\"fa fa-thumbs-o-up fa-stack-1x fa-inverse\"></i></span><p>Thousands of people like the startup's product! Be a part of the bandwagon!</p></div></div><div class=\"cta\"><a href=\"\" class=\"btn\">See a demo</a></div></div><div class=\"testimonials\"><h3>Don't take our word for it</h3><p class=\"small\">Thousands of customers have told us how much they love our product!</p><div class=\"testimonial-row row\"><blockquote class=\"testimonial col-sm-4\"><div class=\"wrapper\"><p>It's awesome! I love every minute using it! I use it every day!</p></div><cite title=\"Bisfree\">Bisfree</cite></blockquote><blockquote class=\"testimonial col-sm-4\"><div class=\"wrapper\"><p>I don't know man, they said just say some awesome stuff about the startup's product and they'll give me money! Free money!</p></div><cite title=\"Adalberto\">Adalberto</cite></blockquote><blockquote class=\"testimonial col-sm-4\"><div class=\"wrapper\"><p>I think startup's product is inventive, creative, and inherently unique. I think it is the next big thing.</p></div><cite title=\"Raziela\">Raziela</cite></blockquote></div></div><div class=\"plans\"><h1>Ridiculous plans. Expensive and impractical</h1><div class=\"plans-row row\"><div class=\"col-sm-4\"><div class=\"plan\"><h1>9$<small>/MO</small></h1><p>Plenty of power for personal projects. Perfect for small timers.</p><ul><li>10 monthly requests</li><li>No technical support</li><li>Limited API Access</li></ul><a href=\"\" class=\"btn\">Register for Personal Plan</a></div></div><div class=\"col-sm-4\"><div class=\"plan\"><h1>49$<small>/MO</small></h1><p>The perfect plan for small businesses starting up.</p><ul><li>100 monthly requests</li><li>9am-5pm technical support</li><li>Public API Access</li></ul><a href=\"\" class=\"btn\">Register for Small Business Plan</a></div></div><div class=\"col-sm-4\"><div class=\"plan\"><h1>999$<small>/MO</small></h1><p>This plan will scale infinitely as your business grows!</p><ul><li>Unlimited monthly requests</li><li>24/7 technical support</li><li>Public API Access</li></ul><a href=\"\" class=\"btn\">Register for Unlimited Plan</a></div></div></div></div><footer><div class=\"section row\"><div class=\"col-sm-6\"><h4>ABOUT</h4><p>This is a sample landing page made for UP CSI DevCamp's Web Track. All rights reserved and stuff.</p></div><div class=\"col-sm-2\"><h4>COMPANY</h4><ul><li><a href=\"\">About</a></li><li><a href=\"\">Careers</a></li><li><a href=\"\">People</a></li></ul></div><div class=\"col-sm-2\"><h4>FOLLOW</h4><ul><li><a href=\"\">Join Us</a></li><li><a href=\"\">Twitter</a></li><li><a href=\"\">Google Plus</a></li></ul></div><div class=\"col-sm-2\"><h4>LEGAL</h4><ul><li><a href=\"\">Terms</a></li><li><a href=\"\">Privacy</a></li><li><a href=\"\">License</a></li></ul></div></div></footer></body></html>");;return buf.join("");
};
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return __templateData;
  });
} else if (typeof module === 'object' && module && module.exports) {
  module.exports = __templateData;
} else {
  __templateData;
}
});

;
//# sourceMappingURL=app.js.map