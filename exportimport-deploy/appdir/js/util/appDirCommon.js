/**
 * A module defining some common data and functions
 * @author samueldoyle
 */

define(["jquery", "underscore"], function ($, _) {
    // TESTING defined in shared.config
    var separator = "->";
    var activityDefaults = {el:"#spinnerEl",segments:8, steps:3, opacity:0.3, space:0,
        width:3, length:4, color:"white", speed:1.5};

    return {
        MsgTypes:{
            PARENT:"PARENT",
            GH_IFRAME:"GH_IFRAME",
            ACK:"ACK"
        },
        getFromToId:function (uid) {
            if (!_.isString(uid)) return null;
            var idarray = uid.split(separator);
            if (idarray.length != 2) return null;
            var toandid = idarray[1].split("_");
            return {
                from:idarray[0],
                to:toandid[0],
                uidnum:toandid[1]
            }
        },
        getUid:function (from, to) {
            return _.uniqueId(from + separator + to + "_");
        },
        log:function (message, style) {
            // if style assume we are stylin
            if (TESTING && _.isString(message)) {
                _.isUndefined(style) ? console.log(message) : console.log(message, style);
            }
        },
        activity:function(state, options) {
            // this relies on the jquery.activity-indicator plugin
            var activityOptions = _.extend({}, options, activityDefaults);
            state ? $(activityOptions.el).activity(activityOptions) : $(activityOptions.el).activity(false);
        },
        getDeepProperty:function (o, s) {
            s = s.replace(/\[(\w+)\]/g, '.$1');
            s = s.replace(/^\./, '');
            var a = s.split('.');
            while (a.length) {
                var n = a.shift();
                if (n in o) {
                    o = o[n];
                } else {
                    return;
                }
            }
            return o;
        },
        // Given data object return a href to be used to access it, used when data stored in dom for example
        // Based on proposed string encoding spec coming in HTML5 http://code.google.com/p/stringencoding/
        getLinkForData:function(data, type) {
            var URL = window.URL || window.webkitURL;
            type = type || "text/plain"; // if no type defined default to text
            if (window.toStaticHTML) data = window.toStaticHTML(data);
            var blob = new Blob([data], {type: type});
            return  [URL.createObjectURL(blob), blob];
        },
        strToBase64:function(str) {
            var bytes =
                Crypto.charenc.Binary.stringToBytes(str);
            var base64Value  = Crypto.util.bytesToBase64(bytes);
            return base64Value;
        }
    };
});
