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
        }
    };
});
