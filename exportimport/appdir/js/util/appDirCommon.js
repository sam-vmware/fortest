/**
 * A module defining some common data and functions
 * @author samueldoyle
 */

define(["jquery", "underscore"], function ($, _) {
    // TESTING defined in shared.config
    var logEnabled = _.isBoolean(TESTING);
    var separator = "->";
    var activityDefaults = {el:"#spinnerEl",segments:8, steps:3, opacity:0.3, space:0,
        width:3, length:4, color:"white", speed:1.5};

     // Following 2 utility methods taken from here:
    // http://stackoverflow.com/questions/6965107/converting-between-strings-and-arraybuffers
    function ab2str(buf) {
      return String.fromCharCode.apply(null, new Uint16Array(buf));
    }

    function str2ab(str) {
      var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
      var bufView = new Uint16Array(buf);
      for (var i=0, strLen=str.length; i<strLen; i++) {
        bufView[i] = str.charCodeAt(i);
      }
      return buf;
    }

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
            if (logEnabled && _.isString(message)) {
                _.isUndefined(style) ? console.debug(message) : console.debug(message, style);
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
        getLinkForData:function(data, type) {
            window.URL = window.URL || window.webkitURL;
            type = type || "text/plain"; // if no type defined default to text
            var byteArray = str2ab(data); // here we assuming string data
            var blob = new Blob([byteArray], {type: type});
            return window.URL.createObjectURL(blob);
        }
    };
});
