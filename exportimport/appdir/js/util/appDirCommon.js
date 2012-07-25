/**
 * A module defining some common data and functions
 * @author samueldoyle
 */

define(["jquery", "underscore"], function ($, _) {
    // TESTING defined in shared.config
    var logEnabled = _.isBoolean(TESTING);
    var separator = "->";
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
        }
    };
});
