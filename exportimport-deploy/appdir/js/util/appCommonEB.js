/**
 * A central point to register and listen to events
 * TODO: Flush out later
 * @author samueldoyle
 */
define(function (require) {
    var $ = require("jquery"),
        _ = require("underscore"),
        Backbone = require("backbone");

    var EVENT_BUS = {
        events: {
            VMW_JSON_LOADED:"file:get:success:vmwareJSONFileLoaded"
        }
    };
    _.extend(EVENT_BUS, Backbone.Events);

    function validateRegParam(event, callback, context) {
        if (_.isUndefined(event)) throw new Error("Target event required");
        if (_.isUndefined(callback)) throw new Error("Target callback required");
        if (_.isUndefined(context)) throw new Error("Target context required");
        if (_.indexOf(_.values(EVENT_BUS.events), event) == -1) throw new Error("Event: " + event + " is not a recognized event");
    }

    /**
     * Register for a recognized event, callback always invoked with event first, then context and last is data
     * this can be used for verification or whatever
     * @param event - the event as listed in the recognized events
     * @param callback - a callback to invoke
     * @param listener - the listener the callback is invoked on
     */
    function registerForEvent(event, callback, context) {
        validateRegParam(event, callback, context);
        EVENT_BUS.on(event, function(eventData) {
            callback(event, context, eventData);
        }, context);
    }

    /**
     * Same signature as register, used to stop listen/dereg.
     * @param event - the event as listed in the recognized events
     * @param callback - a callback to invoke
     * @param listener - the listener the callback is invoked on
     */
    function deregisterForEvent(event, callback, context) {
        validateRegParam(event, callback, context);
        EVENT_BUS.off(event, function(eventData) {
            callback(event, context, eventData);
        }, context);
    }

    /**
     * Triggers a recognized event with optional eventData
     * @param event - the recognized event to trigger
     * @param eventData - eventData
     */
    function triggerEvent(event, eventData) {
        if (_.indexOf(_.values(EVENT_BUS.events), event) == -1) throw new Error("Event: " + event + " is not a recognized event");
        EVENT_BUS.trigger(event, eventData);
    }

    return {
        registerForEvent:function(event, callback, listener) {
            return registerForEvent(event, callback, listener);
        },
        deregisterForEvent:function(event, callback, listener) {
            return deregisterForEvent(event, callback, listener);
        },
        triggerEvent:function(event, eventData) {
            return triggerEvent(event, eventData);
        },
        getEvents:function() {
            return EVENT_BUS.events;
        }
    }
});