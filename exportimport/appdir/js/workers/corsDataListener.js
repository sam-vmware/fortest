/**
 * Listens for requests from cross origin containing window to fetch data from
 * require wrapper around pm functionality
 * @author samueldoyle
 */
//define(["jquery", "underscore", "jqPlugins/postmessage", "util/appDirCommon"], function ($, _, pm, cu) {
define(["jquery", "underscore", "util/appDirCommon"], function ($, _, cu) {

    var defaultOptions = {
        origin: "*",
        messageType:null,
        handlerfunction:null
    };

    function CorsDataListener(options) {
        this.opts = _.extend({}, defaultOptions, options);
        if (_.isNull(this.opts, "messageType")) {
            throw new Error("Required messageType missing")
        }
        if (_.isNull(this.opts, "handlerfunction")) {
            throw new Error("Required handlerFunction missing")
        }
    }

    CorsDataListener.prototype.startListening = function () {
        if (this.opts.origin == "*") {
            pm.bind(this.opts.messageType, this.opts.handlerfunction)
        } else {
            // will only process messages from this origin only
            pm.bind(this.opts.messageType, this.opts.handlerfunction, this.opts.origin);
        }
        cu.log("CorsDataListener started listening for messageType: " + this.opts.messageType + " origin: " + this.opts.origin);
        return this;
    };

    CorsDataListener.prototype.stopListening = function () {
        pm.unbind(this.opts.messageType);
        cu.log("CorsDataListener stopped listening for messageType: " + this.opts.messageType + " origin: " + this.opts.origin);
        return this;
    };

    return CorsDataListener;
});