import d3 from "d3";
import "sumo/js/libs/d3.layout.min";
import "jquery-ui/ui/widgets/sortable";
import "jquery-ui/ui/widgets/slider";

var Rickshaw = {

	namespace: function(namespace, obj) {

		var parts = namespace.split('.');

		var parent = Rickshaw;

		for(var i = 1, length = parts.length; i < length; i++) {
			var currentPart = parts[i];
			parent[currentPart] = parent[currentPart] || {};
			parent = parent[currentPart];
		}
		return parent;
	},

	keys: function(obj) {
		var keys = [];
		for (var key in obj) keys.push(key);
		return keys;
	},

	extend: function(destination, source) {

		for (var property in source) {
			destination[property] = source[property];
		}
		return destination;
	}
};

export default Rickshaw;

/* Adapted from https://github.com/Jakobo/PTClass */

/*
Copyright (c) 2005-2010 Sam Stephenson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
/* Based on Alex Arnell's inheritance implementation. */
/** section: Language
 * class Class
 *
 *  Manages Prototype's class-based OOP system.
 *
 *  Refer to Prototype's web site for a [tutorial on classes and
 *  inheritance](http://prototypejs.org/learn/class-inheritance).
**/
(function(globalContext) {
/* ------------------------------------ */
/* Import from object.js                */
/* ------------------------------------ */
var _toString = Object.prototype.toString,
    NULL_TYPE = 'Null',
    UNDEFINED_TYPE = 'Undefined',
    BOOLEAN_TYPE = 'Boolean',
    NUMBER_TYPE = 'Number',
    STRING_TYPE = 'String',
    OBJECT_TYPE = 'Object',
    FUNCTION_CLASS = '[object Function]';
function isFunction(object) {
  return _toString.call(object) === FUNCTION_CLASS;
}
function extend(destination, source) {
  for (var property in source) if (source.hasOwnProperty(property)) // modify protect primitive slaughter
    destination[property] = source[property];
  return destination;
}
function keys(object) {
  if (Type(object) !== OBJECT_TYPE) { throw new TypeError(); }
  var results = [];
  for (var property in object) {
    if (object.hasOwnProperty(property)) {
      results.push(property);
    }
  }
  return results;
}
function Type(o) {
  switch(o) {
    case null: return NULL_TYPE;
    case (void 0): return UNDEFINED_TYPE;
  }
  var type = typeof o;
  switch(type) {
    case 'boolean': return BOOLEAN_TYPE;
    case 'number':  return NUMBER_TYPE;
    case 'string':  return STRING_TYPE;
  }
  return OBJECT_TYPE;
}
function isUndefined(object) {
  return typeof object === "undefined";
}
/* ------------------------------------ */
/* Import from Function.js              */
/* ------------------------------------ */
var slice = Array.prototype.slice;
function argumentNames(fn) {
  var names = fn.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1]
    .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
    .replace(/\s+/g, '').split(',');
  return names.length == 1 && !names[0] ? [] : names;
}
function wrap(fn, wrapper) {
  var __method = fn;
  return function() {
    var a = update([bind(__method, this)], arguments);
    return wrapper.apply(this, a);
  }
}
function update(array, args) {
  var arrayLength = array.length, length = args.length;
  while (length--) array[arrayLength + length] = args[length];
  return array;
}
function merge(array, args) {
  array = slice.call(array, 0);
  return update(array, args);
}
function bind(fn, context) {
  if (arguments.length < 2 && isUndefined(arguments[0])) return this;
  var __method = fn, args = slice.call(arguments, 2);
  return function() {
    var a = merge(args, arguments);
    return __method.apply(context, a);
  }
}

/* ------------------------------------ */
/* Import from Prototype.js             */
/* ------------------------------------ */
var emptyFunction = function(){};

var Class = (function() {

  // Some versions of JScript fail to enumerate over properties, names of which
  // correspond to non-enumerable properties in the prototype chain
  var IS_DONTENUM_BUGGY = (function(){
    for (var p in { toString: 1 }) {
      // check actual property name, so that it works with augmented Object.prototype
      if (p === 'toString') return false;
    }
    return true;
  })();

  function subclass() {};
  function create() {
    var parent = null, properties = [].slice.apply(arguments);
    if (isFunction(properties[0]))
      parent = properties.shift();

    function klass() {
      this.initialize.apply(this, arguments);
    }

    extend(klass, Class.Methods);
    klass.superclass = parent;
    klass.subclasses = [];

    if (parent) {
      subclass.prototype = parent.prototype;
      klass.prototype = new subclass;
      try { parent.subclasses.push(klass) } catch(e) {}
    }

    for (var i = 0, length = properties.length; i < length; i++)
      klass.addMethods(properties[i]);

    if (!klass.prototype.initialize)
      klass.prototype.initialize = emptyFunction;

    klass.prototype.constructor = klass;
    return klass;
  }

  function addMethods(source) {
    var ancestor   = this.superclass && this.superclass.prototype,
        properties = keys(source);

    // IE6 doesn't enumerate `toString` and `valueOf` (among other built-in `Object.prototype`) properties,
    // Force copy if they're not Object.prototype ones.
    // Do not copy other Object.prototype.* for performance reasons
    if (IS_DONTENUM_BUGGY) {
      if (source.toString != Object.prototype.toString)
        properties.push("toString");
      if (source.valueOf != Object.prototype.valueOf)
        properties.push("valueOf");
    }

    for (var i = 0, length = properties.length; i < length; i++) {
      var property = properties[i], value = source[property];
      if (ancestor && isFunction(value) &&
          argumentNames(value)[0] == "$super") {
        var method = value;
        value = wrap((function(m) {
          return function() { return ancestor[m].apply(this, arguments); };
        })(property), method);

        value.valueOf = bind(method.valueOf, method);
        value.toString = bind(method.toString, method);
      }
      this.prototype[property] = value;
    }

    return this;
  }

  return {
    create: create,
    Methods: {
      addMethods: addMethods
    }
  };
})();

if (globalContext.exports) {
  globalContext.exports.Class = Class;
}
else {
  globalContext.Class = Class;
}
})(Rickshaw);
Rickshaw.namespace('Rickshaw.Compat.ClassList');

Rickshaw.Compat.ClassList = function() {

	/* adapted from http://purl.eligrey.com/github/classList.js/blob/master/classList.js */

	if (typeof document !== "undefined" && !("classList" in document.createElement("a"))) {

	(function (view) {

	"use strict";

	var
		  classListProp = "classList"
		, protoProp = "prototype"
		, elemCtrProto = (view.HTMLElement || view.Element)[protoProp]
		, objCtr = Object
		, strTrim = String[protoProp].trim || function () {
			return this.replace(/^\s+|\s+$/g, "");
		}
		, arrIndexOf = Array[protoProp].indexOf || function (item) {
			var
				  i = 0
				, len = this.length
			;
			for (; i < len; i++) {
				if (i in this && this[i] === item) {
					return i;
				}
			}
			return -1;
		}
		// Vendors: please allow content code to instantiate DOMExceptions
		, DOMEx = function (type, message) {
			this.name = type;
			this.code = DOMException[type];
			this.message = message;
		}
		, checkTokenAndGetIndex = function (classList, token) {
			if (token === "") {
				throw new DOMEx(
					  "SYNTAX_ERR"
					, "An invalid or illegal string was specified"
				);
			}
			if (/\s/.test(token)) {
				throw new DOMEx(
					  "INVALID_CHARACTER_ERR"
					, "String contains an invalid character"
				);
			}
			return arrIndexOf.call(classList, token);
		}
		, ClassList = function (elem) {
			var
				  trimmedClasses = strTrim.call(elem.className)
				, classes = trimmedClasses ? trimmedClasses.split(/\s+/) : []
				, i = 0
				, len = classes.length
			;
			for (; i < len; i++) {
				this.push(classes[i]);
			}
			this._updateClassName = function () {
				elem.className = this.toString();
			};
		}
		, classListProto = ClassList[protoProp] = []
		, classListGetter = function () {
			return new ClassList(this);
		}
	;
	// Most DOMException implementations don't allow calling DOMException's toString()
	// on non-DOMExceptions. Error's toString() is sufficient here.
	DOMEx[protoProp] = Error[protoProp];
	classListProto.item = function (i) {
		return this[i] || null;
	};
	classListProto.contains = function (token) {
		token += "";
		return checkTokenAndGetIndex(this, token) !== -1;
	};
	classListProto.add = function (token) {
		token += "";
		if (checkTokenAndGetIndex(this, token) === -1) {
			this.push(token);
			this._updateClassName();
		}
	};
	classListProto.remove = function (token) {
		token += "";
		var index = checkTokenAndGetIndex(this, token);
		if (index !== -1) {
			this.splice(index, 1);
			this._updateClassName();
		}
	};
	classListProto.toggle = function (token) {
		token += "";
		if (checkTokenAndGetIndex(this, token) === -1) {
			this.add(token);
		} else {
			this.remove(token);
		}
	};
	classListProto.toString = function () {
		return this.join(" ");
	};

	if (objCtr.defineProperty) {
		var classListPropDesc = {
			  get: classListGetter
			, enumerable: true
			, configurable: true
		};
		try {
			objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
		} catch (ex) { // IE 8 doesn't support enumerable:true
			if (ex.number === -0x7FF5EC54) {
				classListPropDesc.enumerable = false;
				objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
			}
		}
	} else if (objCtr[protoProp].__defineGetter__) {
		elemCtrProto.__defineGetter__(classListProp, classListGetter);
	}

	}(window));

	}
};

if ( (typeof RICKSHAW_NO_COMPAT !== "undefined" && !RICKSHAW_NO_COMPAT) || typeof RICKSHAW_NO_COMPAT === "undefined") {
	new Rickshaw.Compat.ClassList();
}
Rickshaw.namespace('Rickshaw.Graph');

Rickshaw.Graph = function(args) {

	if (!args.element) throw "Rickshaw.Graph needs a reference to an element";

	this.element = args.element;
	this.series = args.series;

	this.defaults = {
		interpolation: 'cardinal',
		offset: 'zero',
		min: undefined,
		max: undefined
	};

	Rickshaw.keys(this.defaults).forEach( function(k) {
		this[k] = args[k] || this.defaults[k];
	}, this );

	this.window = {};

	this.updateCallbacks = [];

	var self = this;

	this.initialize = function(args) {

		this.validateSeries(args.series);

		this.series.active = function() { return self.series.filter( function(s) { return !s.disabled } ) };

		this.setSize({ width: args.width, height: args.height });

		this.element.classList.add('rickshaw_graph');
		this.vis = d3.select(this.element)
			.append("svg:svg")
			.attr('width', this.width)
			.attr('height', this.height);

		var renderers = [
			Rickshaw.Graph.Renderer.Stack,
			Rickshaw.Graph.Renderer.Line,
			Rickshaw.Graph.Renderer.Bar,
			Rickshaw.Graph.Renderer.Area,
			Rickshaw.Graph.Renderer.ScatterPlot
		];

		renderers.forEach( function(r) {
			if (!r) return;
			self.registerRenderer(new r( { graph: self } ));
		} );

		this.setRenderer(args.renderer || 'stack', args);
		this.discoverRange();
	};

	this.validateSeries = function(series) {

		if (!(series instanceof Array) && !(series instanceof Rickshaw.Series)) {
			var seriesSignature = Object.prototype.toString.apply(series);
			throw "series is not an array: " + seriesSignature;
		}

		var pointsCount;

		series.forEach( function(s) {

			if (!(s instanceof Object)) {
				throw "series element is not an object: " + s;
			}
			if (!(s.data)) {
				throw "series has no data: " + JSON.stringify(s);
			}
			if (!(s.data instanceof Array)) {
				throw "series data is not an array: " + JSON.stringify(s.data);
			}

			var x = s.data[0].x;
			var y = s.data[0].y;

			if (typeof x != 'number' || ( typeof y != 'number' && y !== null ) ) {
				throw "x and y properties of points should be numbers instead of " +
					(typeof x) + " and " + (typeof y)
			}

		}, this );
	};

	this.dataDomain = function() {

		// take from the first series
		var data = this.series[0].data;

		return [ data[0].x, data.slice(-1).shift().x ];

	};

	this.discoverRange = function() {

		var domain = this.renderer.domain();

		this.x = d3.scale.linear().domain(domain.x).range([0, this.width]);

		this.y = d3.scale.linear().domain(domain.y).range([this.height, 0]);

		this.y.magnitude = d3.scale.linear()
			.domain([domain.y[0] - domain.y[0], domain.y[1] - domain.y[0]])
			.range([0, this.height]);
	};

	this.render = function() {

		var stackedData = this.stackData();
		this.discoverRange();

		this.renderer.render();

		this.updateCallbacks.forEach( function(callback) {
			callback();
		} );
	};

	this.update = this.render;

	this.stackData = function() {

		var data = this.series.active()
			.map( function(d) { return d.data } )
			.map( function(d) { return d.filter( function(d) { return this._slice(d) }, this ) }, this);

		this.stackData.hooks.data.forEach( function(entry) {
			data = entry.f.apply(self, [data]);
		} );

		var stackedData;

		if (!this.renderer.unstack) {

			this._validateStackable();

			var layout = d3.layout.stack();
			layout.offset( self.offset );
			stackedData = layout(data);
		}

		stackedData = stackedData || data;

		this.stackData.hooks.after.forEach( function(entry) {
			stackedData = entry.f.apply(self, [data]);
		} );

		var i = 0;
		this.series.forEach( function(series) {
			if (series.disabled) return;
			series.stack = stackedData[i++];
		} );

		this.stackedData = stackedData;
		return stackedData;
	};

	this._validateStackable = function() {

		var series = this.series;
		var pointsCount;

		series.forEach( function(s) {

			pointsCount = pointsCount || s.data.length;

			if (pointsCount && s.data.length != pointsCount) {
				throw "stacked series cannot have differing numbers of points: " +
					pointsCount + " vs " + s.data.length + "; see Rickshaw.Series.fill()";
			}

		}, this );
	};

	this.stackData.hooks = { data: [], after: [] };

	this._slice = function(d) {

		if (this.window.xMin || this.window.xMax) {

			var isInRange = true;

			if (this.window.xMin && d.x < this.window.xMin) isInRange = false;
			if (this.window.xMax && d.x > this.window.xMax) isInRange = false;

			return isInRange;
		}

		return true;
	};

	this.onUpdate = function(callback) {
		this.updateCallbacks.push(callback);
	};

	this.registerRenderer = function(renderer) {
		this._renderers = this._renderers || {};
		this._renderers[renderer.name] = renderer;
	};

	this.configure = function(args) {

		if (args.width || args.height) {
			this.setSize(args);
		}

		Rickshaw.keys(this.defaults).forEach( function(k) {
			this[k] = k in args ? args[k]
				: k in this ? this[k]
				: this.defaults[k];
		}, this );

		this.setRenderer(args.renderer || this.renderer.name, args);
	};

	this.setRenderer = function(name, args) {

		if (!this._renderers[name]) {
			throw "couldn't find renderer " + name;
		}
		this.renderer = this._renderers[name];

		if (typeof args == 'object') {
			this.renderer.configure(args);
		}
	};

	this.setSize = function(args) {

		args = args || {};

		if (typeof window !== undefined) {
			var style = window.getComputedStyle(this.element, null);
			var elementWidth = parseInt(style.getPropertyValue('width'));
			var elementHeight = parseInt(style.getPropertyValue('height'));
		}

		this.width = args.width || elementWidth || 400;
		this.height = args.height || elementHeight || 250;

		this.vis && this.vis
			.attr('width', this.width)
			.attr('height', this.height);
	}

	this.initialize(args);
};
Rickshaw.namespace('Rickshaw.Fixtures.Color');

Rickshaw.Fixtures.Color = function() {

	this.schemes = {};

	this.schemes.spectrum14 = [
		'#ecb796',
		'#dc8f70',
		'#b2a470',
		'#92875a',
		'#716c49',
		'#d2ed82',
		'#bbe468',
		'#a1d05d',
		'#e7cbe6',
		'#d8aad6',
		'#a888c2',
		'#9dc2d3',
		'#649eb9',
		'#387aa3'
	].reverse();

	this.schemes.spectrum2000 = [
		'#57306f',
		'#514c76',
		'#646583',
		'#738394',
		'#6b9c7d',
		'#84b665',
		'#a7ca50',
		'#bfe746',
		'#e2f528',
		'#fff726',
		'#ecdd00',
		'#d4b11d',
		'#de8800',
		'#de4800',
		'#c91515',
		'#9a0000',
		'#7b0429',
		'#580839',
		'#31082b'
	];

	this.schemes.spectrum2001 = [
		'#2f243f',
		'#3c2c55',
		'#4a3768',
		'#565270',
		'#6b6b7c',
		'#72957f',
		'#86ad6e',
		'#a1bc5e',
		'#b8d954',
		'#d3e04e',
		'#ccad2a',
		'#cc8412',
		'#c1521d',
		'#ad3821',
		'#8a1010',
		'#681717',
		'#531e1e',
		'#3d1818',
		'#320a1b'
	];

	this.schemes.classic9 = [
		'#423d4f',
		'#4a6860',
		'#848f39',
		'#a2b73c',
		'#ddcb53',
		'#c5a32f',
		'#7d5836',
		'#963b20',
		'#7c2626',
		'#491d37',
		'#2f254a'
	].reverse();

	this.schemes.httpStatus = {
		503: '#ea5029',
		502: '#d23f14',
		500: '#bf3613',
		410: '#efacea',
		409: '#e291dc',
		403: '#f457e8',
		408: '#e121d2',
		401: '#b92dae',
		405: '#f47ceb',
		404: '#a82a9f',
		400: '#b263c6',
		301: '#6fa024',
		302: '#87c32b',
		307: '#a0d84c',
		304: '#28b55c',
		200: '#1a4f74',
		206: '#27839f',
		201: '#52adc9',
		202: '#7c979f',
		203: '#a5b8bd',
		204: '#c1cdd1'
	};

	this.schemes.colorwheel = [
		'#b5b6a9',
		'#858772',
		'#785f43',
		'#96557e',
		'#4682b4',
		'#65b9ac',
		'#73c03a',
		'#cb513a'
	].reverse();

	this.schemes.cool = [
		'#5e9d2f',
		'#73c03a',
		'#4682b4',
		'#7bc3b8',
		'#a9884e',
		'#c1b266',
		'#a47493',
		'#c09fb5'
	];

	this.schemes.munin = [
		'#00cc00',
		'#0066b3',
		'#ff8000',
		'#ffcc00',
		'#330099',
		'#990099',
		'#ccff00',
		'#ff0000',
		'#808080',
		'#008f00',
		'#00487d',
		'#b35a00',
		'#b38f00',
		'#6b006b',
		'#8fb300',
		'#b30000',
		'#bebebe',
		'#80ff80',
		'#80c9ff',
		'#ffc080',
		'#ffe680',
		'#aa80ff',
		'#ee00cc',
		'#ff8080',
		'#666600',
		'#ffbfff',
		'#00ffcc',
		'#cc6699',
		'#999900'
	];
};
Rickshaw.namespace('Rickshaw.Fixtures.RandomData');

Rickshaw.Fixtures.RandomData = function(timeInterval) {

	var addData;
	timeInterval = timeInterval || 1;

	var lastRandomValue = 200;

	var timeBase = Math.floor(new Date().getTime() / 1000);

	this.addData = function(data) {

		var randomValue = Math.random() * 100 + 15 + lastRandomValue;
		var index = data[0].length;

		var counter = 1;

		data.forEach( function(series) {
			var randomVariance = Math.random() * 20;
			var v = randomValue / 25  + counter++
				+ (Math.cos((index * counter * 11) / 960) + 2) * 15
				+ (Math.cos(index / 7) + 2) * 7
				+ (Math.cos(index / 17) + 2) * 1;

			series.push( { x: (index * timeInterval) + timeBase, y: v + randomVariance } );
		} );

		lastRandomValue = randomValue * .85;
	}
};

Rickshaw.namespace('Rickshaw.Fixtures.Time');

Rickshaw.Fixtures.Time = function() {

	var tzOffset = new Date().getTimezoneOffset() * 60;

	var self = this;

	this.months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

	this.units = [
		{
			name: 'decade',
			seconds: 86400 * 365.25 * 10,
			formatter: function(d) { return (parseInt(d.getUTCFullYear() / 10) * 10) }
		}, {
			name: 'year',
			seconds: 86400 * 365.25,
			formatter: function(d) { return d.getUTCFullYear() }
		}, {
			name: 'month',
			seconds: 86400 * 30.5,
			formatter: function(d) { return self.months[d.getUTCMonth()] }
		}, {
			name: 'week',
			seconds: 86400 * 7,
			formatter: function(d) { return self.formatDate(d) }
		}, {
			name: 'day',
			seconds: 86400,
			formatter: function(d) { return d.getUTCDate() }
		}, {
			name: '6 hour',
			seconds: 3600 * 6,
			formatter: function(d) { return self.formatTime(d) }
		}, {
			name: 'hour',
			seconds: 3600,
			formatter: function(d) { return self.formatTime(d) }
		}, {
			name: '15 minute',
			seconds: 60 * 15,
			formatter: function(d) { return self.formatTime(d) }
		}, {
			name: 'minute',
			seconds: 60,
			formatter: function(d) { return d.getUTCMinutes() }
		}, {
			name: '15 second',
			seconds: 15,
			formatter: function(d) { return d.getUTCSeconds() + 's' }
		}, {
			name: 'second',
			seconds: 1,
			formatter: function(d) { return d.getUTCSeconds() + 's' }
		}
	];

	this.unit = function(unitName) {
		return this.units.filter( function(unit) { return unitName == unit.name } ).shift();
	};

	this.formatDate = function(d) {
		return d.toUTCString().match(/, (\w+ \w+ \w+)/)[1];
	};

	this.formatTime = function(d) {
		return d.toUTCString().match(/(\d+:\d+):/)[1];
	};

	this.ceil = function(time, unit) {

		if (unit.name == 'month') {

			var nearFuture = new Date((time + unit.seconds - 1) * 1000);

			var rounded = new Date(0);
			rounded.setUTCFullYear(nearFuture.getUTCFullYear());
			rounded.setUTCMonth(nearFuture.getUTCMonth());
			rounded.setUTCDate(1);
			rounded.setUTCHours(0);
			rounded.setUTCMinutes(0);
			rounded.setUTCSeconds(0);
			rounded.setUTCMilliseconds(0);

			return rounded.getTime() / 1000;
		}

		if (unit.name == 'year') {

			var nearFuture = new Date((time + unit.seconds - 1) * 1000);

			var rounded = new Date(0);
			rounded.setUTCFullYear(nearFuture.getUTCFullYear());
			rounded.setUTCMonth(0);
			rounded.setUTCDate(1);
			rounded.setUTCHours(0);
			rounded.setUTCMinutes(0);
			rounded.setUTCSeconds(0);
			rounded.setUTCMilliseconds(0);

			return rounded.getTime() / 1000;
		}

		return Math.ceil(time / unit.seconds) * unit.seconds;
	};
};
Rickshaw.namespace('Rickshaw.Fixtures.Number');

Rickshaw.Fixtures.Number.formatKMBT = function(y) {
	let abs_y = Math.abs(y);
	if (abs_y >= 1000000000000)   { return y / 1000000000000 + "T" }
	else if (abs_y >= 1000000000) { return y / 1000000000 + "B" }
	else if (abs_y >= 1000000)    { return y / 1000000 + "M" }
	else if (abs_y >= 1000)       { return y / 1000 + "K" }
	else if (abs_y < 1 && y > 0)  { return y.toFixed(2) }
	else if (abs_y == 0)          { return '' }
	else                      { return y }
};

Rickshaw.Fixtures.Number.formatBase1024KMGTP = function(y) {
    let abs_y = Math.abs(y);
    if (abs_y >= 1125899906842624)  { return y / 1125899906842624 + "P" }
    else if (abs_y >= 1099511627776){ return y / 1099511627776 + "T" }
    else if (abs_y >= 1073741824)   { return y / 1073741824 + "G" }
    else if (abs_y >= 1048576)      { return y / 1048576 + "M" }
    else if (abs_y >= 1024)         { return y / 1024 + "K" }
    else if (abs_y < 1 && y > 0)    { return y.toFixed(2) }
    else if (abs_y == 0)            { return '' }
    else                        { return y }
};
Rickshaw.namespace("Rickshaw.Color.Palette");

Rickshaw.Color.Palette = function(args) {

	var color = new Rickshaw.Fixtures.Color();

	args = args || {};
	this.schemes = {};

	this.scheme = color.schemes[args.scheme] || args.scheme || color.schemes.colorwheel;
	this.runningIndex = 0;
	this.generatorIndex = 0;

	if (args.interpolatedStopCount) {
		var schemeCount = this.scheme.length - 1;
		var i, j, scheme = [];
		for (i = 0; i < schemeCount; i++) {
			scheme.push(this.scheme[i]);
			var generator = d3.interpolateHsl(this.scheme[i], this.scheme[i + 1]);
			for (j = 1; j < args.interpolatedStopCount; j++) {
				scheme.push(generator((1 / args.interpolatedStopCount) * j));
			}
		}
		scheme.push(this.scheme[this.scheme.length - 1]);
		this.scheme = scheme;
	}
	this.rotateCount = this.scheme.length;

	this.color = function(key) {
		return this.scheme[key] || this.scheme[this.runningIndex++] || this.interpolateColor() || '#808080';
	};

	this.interpolateColor = function() {
		if (!Array.isArray(this.scheme)) return;
		var color;
		if (this.generatorIndex == this.rotateCount * 2 - 1) {
			color = d3.interpolateHsl(this.scheme[this.generatorIndex], this.scheme[0])(0.5);
			this.generatorIndex = 0;
			this.rotateCount *= 2;
		} else {
			color = d3.interpolateHsl(this.scheme[this.generatorIndex], this.scheme[this.generatorIndex + 1])(0.5);
			this.generatorIndex++;
		}
		this.scheme.push(color);
		return color;
	};

};
Rickshaw.namespace('Rickshaw.Graph.Ajax');

Rickshaw.Graph.Ajax = Rickshaw.Class.create( {

	initialize: function(args) {

		this.dataURL = args.dataURL;

		this.onData = args.onData || function(d) { return d };
		this.onComplete = args.onComplete || function() {};
		this.onError = args.onError || function() {};

		this.args = args; // pass through to Rickshaw.Graph

		this.request();
	},

	request: function() {

		$.ajax( {
			url: this.dataURL,
			dataType: 'json',
			success: this.success.bind(this),
			error: this.error.bind(this)
		} );
	},

	error: function() {

		console.log("error loading dataURL: " + this.dataURL);
		this.onError(this);
	},

	success: function(data, status) {

		data = this.onData(data);
		this.args.series = this._splice({ data: data, series: this.args.series });

		this.graph = this.graph || new Rickshaw.Graph(this.args);
		this.graph.render();

		this.onComplete(this);
	},

	_splice: function(args) {

		var data = args.data;
		var series = args.series;

		if (!args.series) return data;

		series.forEach( function(s) {

			var seriesKey = s.key || s.name;
			if (!seriesKey) throw "series needs a key or a name";

			data.forEach( function(d) {

				var dataKey = d.key || d.name;
				if (!dataKey) throw "data needs a key or a name";

				if (seriesKey == dataKey) {
					var properties = ['color', 'name', 'data'];
					properties.forEach( function(p) {
						if (d[p]) s[p] = d[p];
					} );
				}
			} );
		} );

		return series;
	}
} );

Rickshaw.namespace('Rickshaw.Graph.Annotate');

Rickshaw.Graph.Annotate = function(args) {

	var graph = this.graph = args.graph;
	this.elements = { timeline: args.element };

	var self = this;

	this.data = {};

	this.elements.timeline.classList.add('rickshaw_annotation_timeline');

	this.add = function(time, content, end_time) {
		self.data[time] = self.data[time] || {'boxes': []};
		self.data[time].boxes.push({content: content, end: end_time});
	};

	this.update = function() {

		Rickshaw.keys(self.data).forEach( function(time) {

			var annotation = self.data[time];
			var left = self.graph.x(time);

			if (left < 0 || left > self.graph.x.range()[1]) {
				if (annotation.element) {
					annotation.line.classList.add('offscreen');
					annotation.element.style.display = 'none';
				}

				annotation.boxes.forEach( function(box) {
					if ( box.rangeElement ) box.rangeElement.classList.add('offscreen');
				});

				return;
			}

			if (!annotation.element) {
				var element = annotation.element = document.createElement('div');
				element.classList.add('annotation');
				this.elements.timeline.appendChild(element);
				element.addEventListener('click', function(e) {
					element.classList.toggle('active');
					annotation.line.classList.toggle('active');
					annotation.boxes.forEach( function(box) {
						if ( box.rangeElement ) box.rangeElement.classList.toggle('active');
					});
				}, false);

			}

			annotation.element.style.left = left + 'px';
			annotation.element.style.display = 'block';

			annotation.boxes.forEach( function(box) {


				var element = box.element;

				if (!element) {
					element = box.element = document.createElement('div');
					element.classList.add('content');
					element.innerHTML = box.content;
					annotation.element.appendChild(element);

					annotation.line = document.createElement('div');
					annotation.line.classList.add('annotation_line');
					self.graph.element.appendChild(annotation.line);

					if ( box.end ) {
						box.rangeElement = document.createElement('div');
						box.rangeElement.classList.add('annotation_range');
						self.graph.element.appendChild(box.rangeElement);
					}

				}

				if ( box.end ) {

					var annotationRangeStart = left;
					var annotationRangeEnd   = Math.min( self.graph.x(box.end), self.graph.x.range()[1] );

					// annotation makes more sense at end
					if ( annotationRangeStart > annotationRangeEnd ) {
						annotationRangeEnd   = left;
						annotationRangeStart = Math.max( self.graph.x(box.end), self.graph.x.range()[0] );
					}

					var annotationRangeWidth = annotationRangeEnd - annotationRangeStart;

					box.rangeElement.style.left  = annotationRangeStart + 'px';
					box.rangeElement.style.width = annotationRangeWidth + 'px'

					box.rangeElement.classList.remove('offscreen');
				}

				annotation.line.classList.remove('offscreen');
				annotation.line.style.left = left + 'px';
			} );
		}, this );
	};

	this.graph.onUpdate( function() { self.update() } );
};
Rickshaw.namespace('Rickshaw.Graph.Axis.Time');

Rickshaw.Graph.Axis.Time = function(args) {

	var self = this;

	this.graph = args.graph;
	this.elements = [];
	this.ticksTreatment = args.ticksTreatment || 'plain';
	this.fixedTimeUnit = args.timeUnit;

	var time = new Rickshaw.Fixtures.Time();

	this.appropriateTimeUnit = function() {

		var unit;
		var units = time.units;

		var domain = this.graph.x.domain();
		var rangeSeconds = domain[1] - domain[0];

		units.forEach( function(u) {
			if (Math.floor(rangeSeconds / u.seconds) >= 2) {
				unit = unit || u;
			}
		} );

		return (unit || time.units[time.units.length - 1]);
	};

	this.tickOffsets = function() {

		var domain = this.graph.x.domain();

		var unit = this.fixedTimeUnit || this.appropriateTimeUnit();
		var count = Math.ceil((domain[1] - domain[0]) / unit.seconds);

		var runningTick = domain[0];

		var offsets = [];

		for (var i = 0; i < count; i++) {

			var tickValue = time.ceil(runningTick, unit);
			runningTick = tickValue + unit.seconds / 2;

			offsets.push( { value: tickValue, unit: unit } );
		}

		return offsets;
	};

	this.render = function() {

		this.elements.forEach( function(e) {
			e.parentNode.removeChild(e);
		} );

		this.elements = [];

		var offsets = this.tickOffsets();

		offsets.forEach( function(o) {

			if (self.graph.x(o.value) > self.graph.x.range()[1]) return;

			var element = document.createElement('div');
			element.style.left = self.graph.x(o.value) + 'px';
			element.classList.add('x_tick');
			element.classList.add(self.ticksTreatment);

			var title = document.createElement('div');
			title.classList.add('title');
			title.innerHTML = o.unit.formatter(new Date(o.value * 1000));
			element.appendChild(title);

			self.graph.element.appendChild(element);
			self.elements.push(element);

		} );
	};

	this.graph.onUpdate( function() { self.render() } );
};

Rickshaw.namespace('Rickshaw.Graph.Axis.X');

Rickshaw.Graph.Axis.X = function(args) {

	var self = this;
	var berthRate = 0.10;

	this.initialize = function(args) {

		this.graph = args.graph;
		this.orientation = args.orientation || 'top';

		var pixelsPerTick = args.pixelsPerTick || 75;
		this.ticks = args.ticks || Math.floor(this.graph.width / pixelsPerTick);
		this.tickSize = args.tickSize || 4;
		this.ticksTreatment = args.ticksTreatment || 'plain';

		if (args.element) {

			this.element = args.element;
			this._discoverSize(args.element, args);

			this.vis = d3.select(args.element)
				.append("svg:svg")
				.attr('height', this.height)
				.attr('width', this.width)
				.attr('class', 'rickshaw_graph x_axis_d3');

			this.element = this.vis[0][0];
			this.element.style.position = 'relative';

			this.setSize({ width: args.width, height: args.height });

		} else {
			this.vis = this.graph.vis;
		}

		this.graph.onUpdate( function() { self.render() } );
	};

	this.setSize = function(args) {

		args = args || {};
		if (!this.element) return;

		this._discoverSize(this.element.parentNode, args);

		this.vis
			.attr('height', this.height)
			.attr('width', this.width * (1 + berthRate));

		var berth = Math.floor(this.width * berthRate / 2);
		this.element.style.left = -1 * berth + 'px';
	};

	this.render = function() {

		if (this.graph.width !== this._renderWidth) this.setSize({ auto: true });

		var axis = d3.svg.axis().scale(this.graph.x).orient(this.orientation);
		axis.tickFormat( args.tickFormat || function(x) { return x } );

		var berth = Math.floor(this.width * berthRate / 2) || 0;

		if (this.orientation == 'top') {
			var yOffset = this.height || this.graph.height;
			var transform = 'translate(' + berth + ',' + yOffset + ')';
		} else {
			var transform = 'translate(' + berth + ', 0)';
		}

		if (this.element) {
			this.vis.selectAll('*').remove();
		}

		this.vis
			.append("svg:g")
			.attr("class", ["x_ticks_d3", this.ticksTreatment].join(" "))
			.attr("transform", transform)
			.call(axis.ticks(this.ticks).tickSubdivide(0).tickSize(this.tickSize));

		var gridSize = (this.orientation == 'bottom' ? 1 : -1) * this.graph.height;

		this.graph.vis
			.append("svg:g")
			.attr("class", "x_grid_d3")
			.call(axis.ticks(this.ticks).tickSubdivide(0).tickSize(gridSize));

		this._renderHeight = this.graph.height;
	};

	this._discoverSize = function(element, args) {

		if (typeof window !== 'undefined') {

			var style = window.getComputedStyle(element, null);
			var elementHeight = parseInt(style.getPropertyValue('height'));

			if (!args.auto) {
				var elementWidth = parseInt(style.getPropertyValue('width'));
			}
		}

		this.width = (args.width || elementWidth || this.graph.width) * (1 + berthRate);
		this.height = args.height || elementHeight || 40;
	};

	this.initialize(args);
};

Rickshaw.namespace('Rickshaw.Graph.Axis.Y');

Rickshaw.Graph.Axis.Y = function(args) {

	var self = this;
	var berthRate = 0.10;

	this.initialize = function(args) {

		this.graph = args.graph;
		this.orientation = args.orientation || 'right';

		var pixelsPerTick = args.pixelsPerTick || 75;
		this.ticks = args.ticks || Math.floor(this.graph.height / pixelsPerTick);
		this.tickSize = args.tickSize || 4;
		this.ticksTreatment = args.ticksTreatment || 'plain';

		if (args.element) {

			this.element = args.element;
			this.vis = d3.select(args.element)
				.append("svg:svg")
				.attr('class', 'rickshaw_graph y_axis');

			this.element = this.vis[0][0];
			this.element.style.position = 'relative';

			this.setSize({ width: args.width, height: args.height });

		} else {
			this.vis = this.graph.vis;
		}

		this.graph.onUpdate( function() { self.render() } );
	};

	this.setSize = function(args) {

		args = args || {};

		if (!this.element) return;

		if (typeof window !== 'undefined') {

			var style = window.getComputedStyle(this.element.parentNode, null);
			var elementWidth = parseInt(style.getPropertyValue('width'));

			if (!args.auto) {
				var elementHeight = parseInt(style.getPropertyValue('height'));
			}
		}

		this.width = args.width || elementWidth || this.graph.width * berthRate;
		this.height = args.height || elementHeight || this.graph.height;

		this.vis
			.attr('width', this.width)
			.attr('height', this.height * (1 + berthRate));

		var berth = this.height * berthRate;
		this.element.style.top = -1 * berth + 'px';
	};

	this.render = function() {

		if (this.graph.height !== this._renderHeight) this.setSize({ auto: true });

		var axis = d3.svg.axis().scale(this.graph.y).orient(this.orientation);
		axis.tickFormat( args.tickFormat || function(y) { return y } );

		if (this.orientation == 'left') {
			var berth = this.height * berthRate;
			var transform = 'translate(' + this.width + ', ' + berth + ')';
		}

		if (this.element) {
			this.vis.selectAll('*').remove();
		}

		this.vis
			.append("svg:g")
			.attr("class", ["y_ticks", this.ticksTreatment].join(" "))
			.attr("transform", transform)
			.call(axis.ticks(this.ticks).tickSubdivide(0).tickSize(this.tickSize))

		var gridSize = (this.orientation == 'right' ? 1 : -1) * this.graph.width;

		this.graph.vis
			.append("svg:g")
			.attr("class", "y_grid")
			.call(axis.ticks(this.ticks).tickSubdivide(0).tickSize(gridSize));

		this._renderHeight = this.graph.height;
	};

	this.initialize(args);
};

Rickshaw.namespace('Rickshaw.Graph.Behavior.Series.Highlight');

Rickshaw.Graph.Behavior.Series.Highlight = function(args) {

	this.graph = args.graph;
	this.legend = args.legend;

	var self = this;

	var colorSafe = {};
	var activeLine = null;

	this.addHighlightEvents = function (l) {

		l.element.addEventListener( 'mouseover', function(e) {

			if (activeLine) return;
			else activeLine = l;

			self.legend.lines.forEach( function(line, index) {

				if (l === line) {

					// if we're not in a stacked renderer bring active line to the top
					if (index > 0 && self.graph.renderer.unstack) {

						var seriesIndex = self.graph.series.length - index - 1;
						line.originalIndex = seriesIndex;

						var series = self.graph.series.splice(seriesIndex, 1)[0];
						self.graph.series.push(series);
					}
					return;
				}

				colorSafe[line.series.name] = colorSafe[line.series.name] || line.series.color;
				line.series.color = d3.interpolateRgb(line.series.color, d3.rgb('#d8d8d8'))(0.8).toString();
			} );

			self.graph.update();

		}, false );

		l.element.addEventListener( 'mouseout', function(e) {

			if (!activeLine) return;
			else activeLine = null;

			self.legend.lines.forEach( function(line) {

				// return reordered series to its original place
				if (l === line && line.hasOwnProperty('originalIndex')) {

					var series = self.graph.series.pop();
					self.graph.series.splice(line.originalIndex, 0, series);
					delete line['originalIndex'];
				}

				if (colorSafe[line.series.name]) {
					line.series.color = colorSafe[line.series.name];
				}
			} );

			self.graph.update();

		}, false );
	};

	if (this.legend) {
		this.legend.lines.forEach( function(l) {
			self.addHighlightEvents(l);
		} );
	}

};
Rickshaw.namespace('Rickshaw.Graph.Behavior.Series.Order');

Rickshaw.Graph.Behavior.Series.Order = function(args) {

	this.graph = args.graph;
	this.legend = args.legend;

	var self = this;

	$(function() {
		$(self.legend.list).sortable( {
			containment: 'parent',
			tolerance: 'pointer',
			update: function( event, ui ) {
				var series = [];
				$(self.legend.list).find('li').each( function(index, item) {
					if (!item.series) return;
					series.push(item.series);
				} );

				for (var i = self.graph.series.length - 1; i >= 0; i--) {
					self.graph.series[i] = series.shift();
				}

				self.graph.update();
			}
		} );
		$(self.legend.list).disableSelection();
	});

	//hack to make jquery-ui sortable behave
	this.graph.onUpdate( function() {
		var h = window.getComputedStyle(self.legend.element).height;
		self.legend.element.style.height = h;
	} );
};
Rickshaw.namespace('Rickshaw.Graph.Behavior.Series.Toggle');

Rickshaw.Graph.Behavior.Series.Toggle = function(args) {

	this.graph = args.graph;
	this.legend = args.legend;

	var self = this;

	this.addAnchor = function(line) {
		var anchor = document.createElement('a');
		anchor.innerHTML = '&#10004;';
		anchor.classList.add('action');
		line.element.insertBefore(anchor, line.element.firstChild);

		anchor.onclick = function(e) {
			if (line.series.disabled) {
				line.series.enable();
				line.element.classList.remove('disabled');
			} else {
				line.series.disable();
				line.element.classList.add('disabled');
			}
		}

                var label = line.element.getElementsByTagName('span')[0];
                label.onclick = function(e){

                        var disableAllOtherLines = line.series.disabled;
                        if ( ! disableAllOtherLines ) {
                                for ( var i = 0; i < self.legend.lines.length; i++ ) {
                                        var l = self.legend.lines[i];
                                        if ( line.series === l.series ) {
                                                // noop
                                        } else if ( l.series.disabled ) {
                                                // noop
                                        } else {
                                                disableAllOtherLines = true;
                                                break;
                                        }
                                }
                        }

                        // show all or none
                        if ( disableAllOtherLines ) {

                                // these must happen first or else we try ( and probably fail ) to make a no line graph
                                line.series.enable();
                                line.element.classList.remove('disabled');

                                self.legend.lines.forEach(function(l){
                                        if ( line.series === l.series ) {
                                                // noop
                                        } else {
                                                l.series.disable();
                                                l.element.classList.add('disabled');
                                        }
                                });

                        } else {

                                self.legend.lines.forEach(function(l){
                                        l.series.enable();
                                        l.element.classList.remove('disabled');
                                });

                        }

                };

	};

	if (this.legend) {

                $(this.legend.list).sortable( {
                        start: function(event, ui) {
                                ui.item.bind('no.onclick',
                                        function(event) {
                                                event.preventDefault();
                                        }
                                );
                        },
                        stop: function(event, ui) {
                                setTimeout(function(){
                                        ui.item.unbind('no.onclick');
                                }, 250);
                        }
                })

		this.legend.lines.forEach( function(l) {
			self.addAnchor(l);
		} );
	}

	this._addBehavior = function() {

		this.graph.series.forEach( function(s) {

			s.disable = function() {

				if (self.graph.series.length <= 1) {
					throw('only one series left');
				}

				s.disabled = true;
				self.graph.update();
			};

			s.enable = function() {
				s.disabled = false;
				self.graph.update();
			};
		} );
	};
	this._addBehavior();

	this.updateBehaviour = function () { this._addBehavior() };

};
Rickshaw.namespace('Rickshaw.Graph.HoverDetail');

Rickshaw.Graph.HoverDetail = Rickshaw.Class.create({

	initialize: function(args) {

		var graph = this.graph = args.graph;

		this.xFormatter = args.xFormatter || function(x) {
			return new Date( x * 1000 ).toUTCString();
		};

		this.yFormatter = args.yFormatter || function(y) {
			return y === null ? y : y.toFixed(2);
		};

		var element = this.element = document.createElement('div');
		element.className = 'detail';

		this.visible = true;
		graph.element.appendChild(element);

		this.lastEvent = null;
		this._addListeners();

		this.onShow = args.onShow;
		this.onHide = args.onHide;
		this.onRender = args.onRender;

		this.formatter = args.formatter || this.formatter;

	},

	formatter: function(series, x, y, formattedX, formattedY, d) {
		return series.name + ':&nbsp;' + formattedY;
	},

	update: function(e) {

		e = e || this.lastEvent;
		if (!e) return;
		this.lastEvent = e;

		if (!e.target.nodeName.match(/^(path|svg|rect)$/)) return;

		var graph = this.graph;

		var eventX = e.offsetX || e.layerX;
		var eventY = e.offsetY || e.layerY;

		var j = 0;
		var points = [];
		var nearestPoint;

		this.graph.series.active().forEach( function(series) {

			var data = this.graph.stackedData[j++];

			var domainX = graph.x.invert(eventX);

			var domainIndexScale = d3.scale.linear()
				.domain([data[0].x, data.slice(-1)[0].x])
				.range([0, data.length - 1]);

			var approximateIndex = Math.round(domainIndexScale(domainX));
			var dataIndex = Math.min(approximateIndex || 0, data.length - 1);

			for (var i = approximateIndex; i < data.length - 1;) {

				if (!data[i] || !data[i + 1]) break;
				if (data[i].x <= domainX && data[i + 1].x > domainX) { dataIndex = i; break }

				if (data[i + 1].x <= domainX) { i++ } else { i-- }
			}

			if (dataIndex < 0) dataIndex = 0;
			var value = data[dataIndex];

			var distance = Math.sqrt(
				Math.pow(Math.abs(graph.x(value.x) - eventX), 2) +
				Math.pow(Math.abs(graph.y(value.y + value.y0) - eventY), 2)
			);

			var xFormatter = series.xFormatter || this.xFormatter;
			var yFormatter = series.yFormatter || this.yFormatter;

			var point = {
				formattedXValue: xFormatter(value.x),
				formattedYValue: yFormatter(value.y),
				series: series,
				value: value,
				distance: distance,
				order: j,
				name: series.name
			};

			if (!nearestPoint || distance < nearestPoint.distance) {
				nearestPoint = point;
			}

			points.push(point);

		}, this );


		nearestPoint.active = true;

		var domainX = nearestPoint.value.x;
		var formattedXValue = nearestPoint.formattedXValue;

		this.element.innerHTML = '';
		this.element.style.left = graph.x(domainX) + 'px';

		this.visible && this.render( {
			points: points,
			detail: points, // for backwards compatibility
			mouseX: eventX,
			mouseY: eventY,
			formattedXValue: formattedXValue,
			domainX: domainX
		} );
	},

	hide: function() {
		this.visible = false;
		this.element.classList.add('inactive');

		if (typeof this.onHide == 'function') {
			this.onHide();
		}
	},

	show: function() {
		this.visible = true;
		this.element.classList.remove('inactive');

		if (typeof this.onShow == 'function') {
			this.onShow();
		}
	},

	render: function(args) {

		var graph = this.graph;
		var points = args.points;
		var point = points.filter( function(p) { return p.active } ).shift();

		if (point.value.y === null) return;

		var formattedXValue = this.xFormatter(point.value.x);
		var formattedYValue = this.yFormatter(point.value.y);

		this.element.innerHTML = '';
		this.element.style.left = graph.x(point.value.x) + 'px';

		var xLabel = document.createElement('div');

		xLabel.className = 'x_label';
		xLabel.innerHTML = formattedXValue;
		this.element.appendChild(xLabel);

		var item = document.createElement('div');

		item.className = 'item';
		item.innerHTML = this.formatter(point.series, point.value.x, point.value.y, formattedXValue, formattedYValue, point);
		item.style.top = this.graph.y(point.value.y0 + point.value.y) + 'px';

		this.element.appendChild(item);

		var dot = document.createElement('div');

		dot.className = 'dot';
		dot.style.top = item.style.top;
		dot.style.borderColor = point.series.color;

		this.element.appendChild(dot);

		if (point.active) {
			item.className = 'item active';
			dot.className = 'dot active';
		}

		this.show();

		if (typeof this.onRender == 'function') {
			this.onRender(args);
		}
	},

	_addListeners: function() {

		this.graph.element.addEventListener(
			'mousemove',
			function(e) {
				this.visible = true;
				this.update(e)
			}.bind(this),
			false
		);

		this.graph.onUpdate( function() { this.update() }.bind(this) );

		this.graph.element.addEventListener(
			'mouseout',
			function(e) {
				if (e.relatedTarget && !(e.relatedTarget.compareDocumentPosition(this.graph.element) & Node.DOCUMENT_POSITION_CONTAINS)) {
					this.hide();
				}
			 }.bind(this),
			false
		);
	}
});

Rickshaw.namespace('Rickshaw.Graph.JSONP');

Rickshaw.Graph.JSONP = Rickshaw.Class.create( Rickshaw.Graph.Ajax, {

	request: function() {

		$.ajax( {
			url: this.dataURL,
			dataType: 'jsonp',
			success: this.success.bind(this),
			error: this.error.bind(this)
		} );
	}
} );
Rickshaw.namespace('Rickshaw.Graph.Legend');

Rickshaw.Graph.Legend = function(args) {

	var element = this.element = args.element;
	var graph = this.graph = args.graph;

	var self = this;

	element.classList.add('rickshaw_legend');

	var list = this.list = document.createElement('ul');
	element.appendChild(list);

	var series = graph.series
		.map( function(s) { return s } )

	if (!args.naturalOrder) {
		series = series.reverse();
	}

	this.lines = [];

	this.addLine = function (series) {
		var line = document.createElement('li');
		line.className = 'line';
		if (series.disabled) {
			line.className += ' disabled';
		}

		var swatch = document.createElement('div');
		swatch.className = 'swatch';
		swatch.style.backgroundColor = series.color;

		line.appendChild(swatch);

		var label = document.createElement('span');
		label.className = 'label';
		label.innerHTML = series.name;

		line.appendChild(label);
		list.appendChild(line);

		line.series = series;

		if (series.noLegend) {
			line.style.display = 'none';
		}

		var _line = { element: line, series: series };
		if (self.shelving) {
			self.shelving.addAnchor(_line);
			self.shelving.updateBehaviour();
		}
		if (self.highlighter) {
			self.highlighter.addHighlightEvents(_line);
		}
		self.lines.push(_line);
	};

	series.forEach( function(s) {
		self.addLine(s);
	} );

	graph.onUpdate( function() {} );
};
Rickshaw.namespace('Rickshaw.Graph.RangeSlider');

Rickshaw.Graph.RangeSlider = function(args) {

	var element = this.element = args.element;
	var graph = this.graph = args.graph;

	$( function() {
		$(element).slider( {

			range: true,
			min: graph.dataDomain()[0],
			max: graph.dataDomain()[1],
			values: [
				graph.dataDomain()[0],
				graph.dataDomain()[1]
			],
			slide: function( event, ui ) {

				graph.window.xMin = ui.values[0];
				graph.window.xMax = ui.values[1];
				graph.update();

				// if we're at an extreme, stick there
				if (graph.dataDomain()[0] == ui.values[0]) {
					graph.window.xMin = undefined;
				}
				if (graph.dataDomain()[1] == ui.values[1]) {
					graph.window.xMax = undefined;
				}
			}
		} );
	} );

	element[0].style.width = graph.width + 'px';

	graph.onUpdate( function() {

		var values = $(element).slider('option', 'values');

		$(element).slider('option', 'min', graph.dataDomain()[0]);
		$(element).slider('option', 'max', graph.dataDomain()[1]);

		if (graph.window.xMin == undefined) {
			values[0] = graph.dataDomain()[0];
		}
		if (graph.window.xMax == undefined) {
			values[1] = graph.dataDomain()[1];
		}

		$(element).slider('option', 'values', values);

	} );
};

Rickshaw.namespace("Rickshaw.Graph.Renderer");

Rickshaw.Graph.Renderer = Rickshaw.Class.create( {

	initialize: function(args) {
		this.graph = args.graph;
		this.tension = args.tension || this.tension;
		this.graph.unstacker = this.graph.unstacker || new Rickshaw.Graph.Unstacker( { graph: this.graph } );
		this.configure(args);
	},

	seriesPathFactory: function() {
		//implement in subclass
	},

	seriesStrokeFactory: function() {
		// implement in subclass
	},

	defaults: function() {
		return {
			tension: 0.8,
			strokeWidth: 2,
			unstack: true,
			padding: { top: 0.01, right: 0, bottom: 0.01, left: 0 },
			stroke: false,
			fill: false
		};
	},

	domain: function() {

		var values = { xMin: [], xMax: [], y: [] };

		var stackedData = this.graph.stackedData || this.graph.stackData();
		var firstPoint = stackedData[0][0];

		var xMin = firstPoint.x;
		var xMax = firstPoint.x

		var yMin = firstPoint.y + firstPoint.y0;
		var yMax = firstPoint.y + firstPoint.y0;

		stackedData.forEach( function(series) {

			series.forEach( function(d) {

				if (d.y == undefined) return;

				var y = d.y + d.y0;

				if (y < yMin) yMin = y;
				if (y > yMax) yMax = y;
			} );

			if (series[0].x < xMin) xMin = series[0].x;
			if (series[series.length - 1].x > xMax) xMax = series[series.length - 1].x;
		} );

		xMin -= (xMax - xMin) * this.padding.left;
		xMax += (xMax - xMin) * this.padding.right;

		yMin = this.graph.min === 'auto' ? yMin : this.graph.min || 0;
		yMax = this.graph.max === undefined ? yMax : this.graph.max;

		if (this.graph.min === 'auto' || yMin < 0) {
			yMin -= (yMax - yMin) * this.padding.bottom;
		}

		if (this.graph.max === undefined) {
			yMax += (yMax - yMin) * this.padding.top;
		}

		return { x: [xMin, xMax], y: [yMin, yMax] };
	},

	render: function() {

		var graph = this.graph;

		graph.vis.selectAll('*').remove();

		var nodes = graph.vis.selectAll("path")
			.data(this.graph.stackedData)
			.enter().append("svg:path")
			.attr("d", this.seriesPathFactory());

		var i = 0;
		graph.series.forEach( function(series) {
			if (series.disabled) return;
			series.path = nodes[0][i++];
			this._styleSeries(series);
		}, this );
	},

	_styleSeries: function(series) {

		var fill = this.fill ? series.color : 'none';
		var stroke = this.stroke ? series.color : 'none';

		series.path.setAttribute('fill', fill);
		series.path.setAttribute('stroke', stroke);
		series.path.setAttribute('stroke-width', this.strokeWidth);
		series.path.setAttribute('class', series.className);
	},

	configure: function(args) {

		args = args || {};

		Rickshaw.keys(this.defaults()).forEach( function(key) {

			if (!args.hasOwnProperty(key)) {
				this[key] = this[key] || this.graph[key] || this.defaults()[key];
				return;
			}

			if (typeof this.defaults()[key] == 'object') {

				Rickshaw.keys(this.defaults()[key]).forEach( function(k) {

					this[key][k] =
						args[key][k] !== undefined ? args[key][k] :
						this[key][k] !== undefined ? this[key][k] :
						this.defaults()[key][k];
				}, this );

			} else {
				this[key] =
					args[key] !== undefined ? args[key] :
					this[key] !== undefined ? this[key] :
					this.graph[key] !== undefined ? this.graph[key] :
					this.defaults()[key];
			}

		}, this );
	},

	setStrokeWidth: function(strokeWidth) {
		if (strokeWidth !== undefined) {
			this.strokeWidth = strokeWidth;
		}
	},

	setTension: function(tension) {
		if (tension !== undefined) {
			this.tension = tension;
		}
	}
} );

Rickshaw.namespace('Rickshaw.Graph.Renderer.Line');

Rickshaw.Graph.Renderer.Line = Rickshaw.Class.create( Rickshaw.Graph.Renderer, {

	name: 'line',

	defaults: function($super) {

		return Rickshaw.extend( $super(), {
			unstack: true,
			fill: false,
			stroke: true
		} );
	},

	seriesPathFactory: function() {

		var graph = this.graph;

		var factory = d3.svg.line()
			.x( function(d) { return graph.x(d.x) } )
			.y( function(d) { return graph.y(d.y) } )
			.interpolate(this.graph.interpolation).tension(this.tension)

		factory.defined && factory.defined( function(d) { return d.y !== null } );
		return factory;
	}
} );

Rickshaw.namespace('Rickshaw.Graph.Renderer.Stack');

Rickshaw.Graph.Renderer.Stack = Rickshaw.Class.create( Rickshaw.Graph.Renderer, {

	name: 'stack',

	defaults: function($super) {

		return Rickshaw.extend( $super(), {
			fill: true,
			stroke: false,
			unstack: false
		} );
	},

	seriesPathFactory: function() {

		var graph = this.graph;

		var factory = d3.svg.area()
			.x( function(d) { return graph.x(d.x) } )
			.y0( function(d) { return graph.y(d.y0) } )
			.y1( function(d) { return graph.y(d.y + d.y0) } )
			.interpolate(this.graph.interpolation).tension(this.tension);

		factory.defined && factory.defined( function(d) { return d.y !== null } );
		return factory;
	}
} );

Rickshaw.namespace('Rickshaw.Graph.Renderer.Bar');

Rickshaw.Graph.Renderer.Bar = Rickshaw.Class.create( Rickshaw.Graph.Renderer, {

	name: 'bar',

	defaults: function($super) {

		var defaults = Rickshaw.extend( $super(), {
			gapSize: 0.05,
			unstack: false
		} );

		delete defaults.tension;
		return defaults;
	},

	initialize: function($super, args) {
		args = args || {};
		this.gapSize = args.gapSize || this.gapSize;
		$super(args);
	},

	domain: function($super) {

		var domain = $super();

		var frequentInterval = this._frequentInterval();
		domain.x[1] += parseInt(frequentInterval.magnitude);

		return domain;
	},

	barWidth: function() {

		var stackedData = this.graph.stackedData || this.graph.stackData();
		var data = stackedData.slice(-1).shift();

		var frequentInterval = this._frequentInterval();
		var barWidth = this.graph.x(data[0].x + frequentInterval.magnitude * (1 - this.gapSize));

		return barWidth;
	},

	render: function() {

		var graph = this.graph;

		graph.vis.selectAll('*').remove();

		var barWidth = this.barWidth();
		var barXOffset = 0;

		var activeSeriesCount = graph.series.filter( function(s) { return !s.disabled; } ).length;
		var seriesBarWidth = this.unstack ? barWidth / activeSeriesCount : barWidth;

		var transform = function(d) {
			// add a matrix transform for negative values
			var matrix = [ 1, 0, 0, (d.y < 0 ? -1 : 1), 0, (d.y < 0 ? graph.y.magnitude(Math.abs(d.y)) * 2 : 0) ];
			return "matrix(" + matrix.join(',') + ")";
		};

		graph.series.forEach( function(series) {

			if (series.disabled) return;

			var nodes = graph.vis.selectAll("path")
				.data(series.stack.filter( function(d) { return d.y !== null } ))
				.enter().append("svg:rect")
				.attr("x", function(d) { return graph.x(d.x) + barXOffset })
				.attr("y", function(d) { return (graph.y(d.y0 + Math.abs(d.y))) * (d.y < 0 ? -1 : 1 ) })
				.attr("width", seriesBarWidth)
				.attr("height", function(d) { return graph.y.magnitude(Math.abs(d.y)) })
				.attr("transform", transform);

			Array.prototype.forEach.call(nodes[0], function(n) {
				n.setAttribute('fill', series.color);
			} );

			if (this.unstack) barXOffset += seriesBarWidth;

		}, this );
	},

	_frequentInterval: function() {

		var stackedData = this.graph.stackedData || this.graph.stackData();
		var data = stackedData.slice(-1).shift();

		var intervalCounts = {};

		for (var i = 0; i < data.length - 1; i++) {
			var interval = data[i + 1].x - data[i].x;
			intervalCounts[interval] = intervalCounts[interval] || 0;
			intervalCounts[interval]++;
		}

		var frequentInterval = { count: 0 };

		Rickshaw.keys(intervalCounts).forEach( function(i) {
			if (frequentInterval.count < intervalCounts[i]) {

				frequentInterval = {
					count: intervalCounts[i],
					magnitude: i
				};
			}
		} );

		//this._frequentInterval = function() { return frequentInterval };

		return frequentInterval;
	}
} );

Rickshaw.namespace('Rickshaw.Graph.Renderer.Area');

Rickshaw.Graph.Renderer.Area = Rickshaw.Class.create( Rickshaw.Graph.Renderer, {

	name: 'area',

	defaults: function($super) {

		return Rickshaw.extend( $super(), {
			unstack: false,
			fill: false,
			stroke: false
		} );
	},

	seriesPathFactory: function() {

		var graph = this.graph;

		var factory = d3.svg.area()
			.x( function(d) { return graph.x(d.x) } )
			.y0( function(d) { return graph.y(d.y0) } )
			.y1( function(d) { return graph.y(d.y + d.y0) } )
			.interpolate(graph.interpolation).tension(this.tension)

		factory.defined && factory.defined( function(d) { return d.y !== null } );
		return factory;
	},

	seriesStrokeFactory: function() {

		var graph = this.graph;

		var factory = d3.svg.line()
			.x( function(d) { return graph.x(d.x) } )
			.y( function(d) { return graph.y(d.y + d.y0) } )
			.interpolate(graph.interpolation).tension(this.tension)

		factory.defined && factory.defined( function(d) { return d.y !== null } );
		return factory;
	},

	render: function() {

		var graph = this.graph;

		graph.vis.selectAll('*').remove();

		// insert or stacked areas so strokes lay on top of areas
		var method = this.unstack ? 'append' : 'insert';

		var nodes = graph.vis.selectAll("path")
			.data(this.graph.stackedData)
			.enter()[method]("svg:g", 'g');

		nodes.append("svg:path")
			.attr("d", this.seriesPathFactory())
			.attr("class", 'area');

		if (this.stroke) {
			nodes.append("svg:path")
				.attr("d", this.seriesStrokeFactory())
				.attr("class", 'line');
		}

		var i = 0;
		graph.series.forEach( function(series) {
			if (series.disabled) return;
			series.path = nodes[0][i++];
			this._styleSeries(series);
		}, this );
	},

	_styleSeries: function(series) {

		if (!series.path) return;

		d3.select(series.path).select('.area')
			.attr('fill', series.color);

		if (this.stroke) {
			d3.select(series.path).select('.line')
				.attr('fill', 'none')
				.attr('stroke', series.stroke || d3.interpolateRgb(series.color, 'black')(0.125))
				.attr('stroke-width', this.strokeWidth);
		}

		if (series.className) {
			series.path.setAttribute('class', series.className);
		}
	}
} );

Rickshaw.namespace('Rickshaw.Graph.Renderer.ScatterPlot');

Rickshaw.Graph.Renderer.ScatterPlot = Rickshaw.Class.create( Rickshaw.Graph.Renderer, {

	name: 'scatterplot',

	defaults: function($super) {

		return Rickshaw.extend( $super(), {
			unstack: true,
			fill: true,
			stroke: false,
			padding:{ top: 0.01, right: 0.01, bottom: 0.01, left: 0.01 },
			dotSize: 4
		} );
	},

	initialize: function($super, args) {
		$super(args);
	},

	render: function() {

		var graph = this.graph;

		graph.vis.selectAll('*').remove();

		graph.series.forEach( function(series) {

			if (series.disabled) return;

			var nodes = graph.vis.selectAll("path")
				.data(series.stack.filter( function(d) { return d.y !== null } ))
				.enter().append("svg:circle")
				.attr("cx", function(d) { return graph.x(d.x) })
				.attr("cy", function(d) { return graph.y(d.y) })
				.attr("r", function(d) { return ("r" in d) ? d.r : graph.renderer.dotSize});

			Array.prototype.forEach.call(nodes[0], function(n) {
				n.setAttribute('fill', series.color);
			} );

		}, this );
	}
} );
Rickshaw.namespace('Rickshaw.Graph.Smoother');

Rickshaw.Graph.Smoother = function(args) {

	this.graph = args.graph;
	this.element = args.element;

	var self = this;

	this.aggregationScale = 1;

	if (this.element) {

		$( function() {
			$(self.element).slider( {
				min: 1,
				max: 100,
				slide: function( event, ui ) {
					self.setScale(ui.value);
					self.graph.update();
				}
			} );
		} );
	}

	self.graph.stackData.hooks.data.push( {
		name: 'smoother',
		orderPosition: 50,
		f: function(data) {

			if (self.aggregationScale == 1) return data;

			var aggregatedData = [];

			data.forEach( function(seriesData) {

				var aggregatedSeriesData = [];

				while (seriesData.length) {

					var avgX = 0, avgY = 0;
					var slice = seriesData.splice(0, self.aggregationScale);

					slice.forEach( function(d) {
						avgX += d.x / slice.length;
						avgY += d.y / slice.length;
					} );

					aggregatedSeriesData.push( { x: avgX, y: avgY } );
				}

				aggregatedData.push(aggregatedSeriesData);
			} );

			return aggregatedData;
		}
	} );

	this.setScale = function(scale) {

		if (scale < 1) {
			throw "scale out of range: " + scale;
		}

		this.aggregationScale = scale;
		this.graph.update();
	}
};

Rickshaw.namespace('Rickshaw.Graph.Unstacker');

Rickshaw.Graph.Unstacker = function(args) {

	this.graph = args.graph;
	var self = this;

	this.graph.stackData.hooks.after.push( {
		name: 'unstacker',
		f: function(data) {

			if (!self.graph.renderer.unstack) return data;

			data.forEach( function(seriesData) {
				seriesData.forEach( function(d) {
					d.y0 = 0;
				} );
			} );

			return data;
		}
	} );
};

Rickshaw.namespace('Rickshaw.Series');

Rickshaw.Series = Rickshaw.Class.create( Array, {

	initialize: function (data, palette, options) {

		options = options || {}

		this.palette = new Rickshaw.Color.Palette(palette);

		this.timeBase = typeof(options.timeBase) === 'undefined' ?
			Math.floor(new Date().getTime() / 1000) :
			options.timeBase;

		var timeInterval = typeof(options.timeInterval) == 'undefined' ?
			1000 :
			options.timeInterval;

		this.setTimeInterval(timeInterval);

		if (data && (typeof(data) == "object") && (data instanceof Array)) {
			data.forEach( function(item) { this.addItem(item) }, this );
		}
	},

	addItem: function(item) {

		if (typeof(item.name) === 'undefined') {
			throw('addItem() needs a name');
		}

		item.color = (item.color || this.palette.color(item.name));
		item.data = (item.data || []);

		// backfill, if necessary
		if ((item.data.length == 0) && this.length && (this.getIndex() > 0)) {
			this[0].data.forEach( function(plot) {
				item.data.push({ x: plot.x, y: 0 });
			} );
		} else if (item.data.length == 0) {
			item.data.push({ x: this.timeBase - (this.timeInterval || 0), y: 0 });
		}

		this.push(item);

		if (this.legend) {
			this.legend.addLine(this.itemByName(item.name));
		}
	},

	addData: function(data) {

		var index = this.getIndex();

		Rickshaw.keys(data).forEach( function(name) {
			if (! this.itemByName(name)) {
				this.addItem({ name: name });
			}
		}, this );

		this.forEach( function(item) {
			item.data.push({
				x: (index * this.timeInterval || 1) + this.timeBase,
				y: (data[item.name] || 0)
			});
		}, this );
	},

	getIndex: function () {
		return (this[0] && this[0].data && this[0].data.length) ? this[0].data.length : 0;
	},

	itemByName: function(name) {

		for (var i = 0; i < this.length; i++) {
			if (this[i].name == name)
				return this[i];
		}
	},

	setTimeInterval: function(iv) {
		this.timeInterval = iv / 1000;
	},

	setTimeBase: function (t) {
		this.timeBase = t;
	},

	dump: function() {

		var data = {
			timeBase: this.timeBase,
			timeInterval: this.timeInterval,
			items: []
		};

		this.forEach( function(item) {

			var newItem = {
				color: item.color,
				name: item.name,
				data: []
			};

			item.data.forEach( function(plot) {
				newItem.data.push({ x: plot.x, y: plot.y });
			} );

			data.items.push(newItem);
		} );

		return data;
	},

	load: function(data) {

		if (data.timeInterval) {
			this.timeInterval = data.timeInterval;
		}

		if (data.timeBase) {
			this.timeBase = data.timeBase;
		}

		if (data.items) {
			data.items.forEach( function(item) {
				this.push(item);
				if (this.legend) {
					this.legend.addLine(this.itemByName(item.name));
				}

			}, this );
		}
	}
} );

Rickshaw.Series.zeroFill = function(series) {
	Rickshaw.Series.fill(series, 0);
};

Rickshaw.Series.fill = function(series, fill) {

	var x;
	var i = 0;

	var data = series.map( function(s) { return s.data } );

	while ( i < Math.max.apply(null, data.map( function(d) { return d.length } )) ) {

		x = Math.min.apply( null,
			data
				.filter(function(d) { return d[i] })
				.map(function(d) { return d[i].x })
		);

		data.forEach( function(d) {
			if (!d[i] || d[i].x != x) {
				d.splice(i, 0, { x: x, y: fill });
			}
		} );

		i++;
	}
};

Rickshaw.namespace('Rickshaw.Series.FixedDuration');

Rickshaw.Series.FixedDuration = Rickshaw.Class.create(Rickshaw.Series, {

	initialize: function (data, palette, options) {

		var options = options || {}

		if (typeof(options.timeInterval) === 'undefined') {
			throw new Error('FixedDuration series requires timeInterval');
		}

		if (typeof(options.maxDataPoints) === 'undefined') {
			throw new Error('FixedDuration series requires maxDataPoints');
		}

		this.palette = new Rickshaw.Color.Palette(palette);
		this.timeBase = typeof(options.timeBase) === 'undefined' ? Math.floor(new Date().getTime() / 1000) : options.timeBase;
		this.setTimeInterval(options.timeInterval);

		if (this[0] && this[0].data && this[0].data.length) {
			this.currentSize = this[0].data.length;
			this.currentIndex = this[0].data.length;
		} else {
			this.currentSize  = 0;
			this.currentIndex = 0;
		}

		this.maxDataPoints = options.maxDataPoints;


		if (data && (typeof(data) == "object") && (data instanceof Array)) {
			data.forEach( function (item) { this.addItem(item) }, this );
			this.currentSize  += 1;
			this.currentIndex += 1;
		}

		// reset timeBase for zero-filled values if needed
		this.timeBase -= (this.maxDataPoints - this.currentSize) * this.timeInterval;

		// zero-fill up to maxDataPoints size if we don't have that much data yet
		if ((typeof(this.maxDataPoints) !== 'undefined') && (this.currentSize < this.maxDataPoints)) {
			for (var i = this.maxDataPoints - this.currentSize - 1; i > 0; i--) {
				this.currentSize  += 1;
				this.currentIndex += 1;
				this.forEach( function (item) {
					item.data.unshift({ x: ((i-1) * this.timeInterval || 1) + this.timeBase, y: 0, i: i });
				}, this );
			}
		}
	},

	addData: function($super, data) {

		$super(data)

		this.currentSize += 1;
		this.currentIndex += 1;

		if (this.maxDataPoints !== undefined) {
			while (this.currentSize > this.maxDataPoints) {
				this.dropData();
			}
		}
	},

	dropData: function() {

		this.forEach(function(item) {
			item.data.splice(0, 1);
		} );

		this.currentSize -= 1;
	},

	getIndex: function () {
		return this.currentIndex;
	}
} );
