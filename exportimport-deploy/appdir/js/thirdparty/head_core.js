/**
    Head JS     The only script in your <HEAD>
    Copyright   Tero Piirainen (tipiirai)
    License     MIT / http://bit.ly/mit-license
    Version     Modified: v0.96

    https://github.com/itechnology/headjs
*/

(function(win, undefined) {
    var doc = win.document, nav = win.navigator, loc = win.location, html = doc.documentElement, klass = [], conf = {
        width: [ 240, 320, 480, 640, 768, 800, 1024, 1280, 1440, 1680, 1920 ],
        height: [ 240, 320, 480, 600, 768, 800, 900, 1050, 1080 ],
        section: "section-",
        page: "page-",
        head: "head"
    };
    if (win.head_conf) for (var item in win.head_conf) win.head_conf[item] !== undefined && (conf[item] = win.head_conf[item]);
    function pushClass(name) {
        klass[klass.length] = name;
    }
    function removeClass(name) {
        var re = new RegExp("\\b" + name + "\\b");
        html.className = html.className.replace(re, "");
    }
    function each(arr, fn) {
        for (var i = 0, l = arr.length; i < l; i++) fn.call(arr, arr[i], i);
    }
    var api = win[conf.head] = function() {
        api.ready.apply(null, arguments);
    };
    api.features = {}, api.feature = function(key, enabled, queue) {
        if (!key) return html.className += " " + klass.join(" "), klass = [], api;
        Object.prototype.toString.call(enabled) === "[object Function]" && (enabled = enabled.call());
        var cssKey = key.replace(/([A-Z])/g, function($1) {
            return "-" + $1.toLowerCase();
        });
        return pushClass(cssKey + "-" + enabled), api.features[key] = !!enabled, queue || (removeClass(cssKey + "-false"), removeClass(cssKey + "-true"), api.feature()), api;
    }, api.feature("js", !0, !0);
    var ua = nav.userAgent.toLowerCase(), mobile = /mobile|midp/.test(ua);
    api.feature("mobile", mobile, !0), api.feature("desktop", !mobile, !0), api.feature("touch", "ontouchstart" in win, !0), ua = /(chrome|firefox)[ \/]([\w.]+)/.exec(ua) || /(iphone|ipad|ipod)(?:.*version)?[ \/]([\w.]+)/.exec(ua) || /(android)(?:.*version)?[ \/]([\w.]+)/.exec(ua) || /(webkit|opera)(?:.*version)?[ \/]([\w.]+)/.exec(ua) || /(msie) ([\w.]+)/.exec(ua) || [];
    var browser = ua[1], version = parseFloat(ua[2]), start = 0, stop = 0;
    switch (browser) {
      case "msie":
        browser = "ie", version = doc.documentMode || version, start = 6, stop = 10;
        break;
      case "chrome":
        start = 8, stop = 25;
        break;
      case "firefox":
        browser = "ff", start = 3, stop = 17;
        break;
      case "ipod":
      case "ipad":
      case "iphone":
        browser = "ios", start = 3, stop = 6;
        break;
      case "android":
        start = 2, stop = 4;
        break;
      case "webkit":
        browser = "safari", start = 9, stop = 12;
        break;
      case "opera":
        start = 9, stop = 12;
    }
    api.browser = {
        name: browser,
        version: version
    }, api.browser[browser] = !0;
    var supported = [ "ie", "chrome", "ff", "ios", "android", "safari", "opera" ];
    each(supported, function(name) {
        name === browser ? (pushClass(name), pushClass(name + "-true")) : pushClass(name + "-false");
    });
    for (var v = start; v <= stop; v++) version > v ? (pushClass(browser + "-gt" + v), pushClass(browser + "-gte" + v)) : version < v ? (pushClass(browser + "-lt" + v), pushClass(browser + "-lte" + v)) : version === v && (pushClass(browser + "-lte" + v), pushClass(browser + "-eq" + v), pushClass(browser + "-gte" + v));
    browser === "ie" && version < 9 && each("abbr|article|aside|audio|canvas|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video".split("|"), function(el) {
        doc.createElement(el);
    }), each(loc.pathname.split("/"), function(el, i) {
        if (this.length > 2 && this[i + 1] !== undefined) i && pushClass(conf.section + this.slice(1, i + 1).join("-").toLowerCase()); else {
            var id = el || "index", index = id.indexOf(".");
            index > 0 && (id = id.substring(0, index)), html.id = conf.page + id.toLowerCase(), i || pushClass(conf.section + "root");
        }
    }), api.screen = {
        height: win.screen.height,
        width: win.screen.width
    };
    function screenSize() {
        html.className = html.className.replace(/ (w|w-eq|w-gt|w-gte|w-lt|w-lte|h|h-eq|h-gt|h-gte|h-lt|h-lte)\d+/g, "");
        var iw = win.innerWidth || html.clientWidth, ow = win.outerWidth || win.screen.width;
        api.screen.innerWidth = iw, api.screen.outerWidth = ow, pushClass("w" + iw), each(conf.width, function(width) {
            iw > width ? (pushClass("w-gt" + width), pushClass("w-gte" + width)) : iw < width ? (pushClass("w-lt" + width), pushClass("w-lte" + width)) : iw === width && (pushClass("w-lte" + width), pushClass("w-eq" + width), pushClass("w-gte" + width));
        });
        var ih = win.innerHeight || html.clientHeight, oh = win.outerHeight || win.screen.height;
        api.screen.innerHeight = ih, api.screen.outerHeight = oh, pushClass("h" + ih), each(conf.height, function(height) {
            ih > height ? (pushClass("h-gt" + height), pushClass("h-gte" + height)) : ih < height ? (pushClass("h-lt" + height), pushClass("h-lte" + height)) : ih === height && (pushClass("h-lte" + height), pushClass("h-eq" + height), pushClass("h-gte" + height));
        }), api.feature("portrait", ih > iw), api.feature("landscape", ih < iw);
    }
    screenSize();
    var resizeId = 0;
    function onResize() {
        win.clearTimeout(resizeId), resizeId = win.setTimeout(screenSize, 100);
    }
    win.addEventListener ? win.addEventListener("resize", onResize, !1) : win.attachEvent("onresize", onResize);
})(window);