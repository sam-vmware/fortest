/**
 * Use local storage for content across pages
 * @author samueldoyle
 */
define(function (require) {
    var _ = require("underscore"),
        Backbone = require("backbone"),
        localstorage = require("localstorage"),
        cu = require("util/appDirCommon");

    var SessionStorage = Backbone.Model.extend({
        localStorage: new Backbone.LocalStorage("APPD_SessionStorage"),
        defaults: {
            id: "DEFAULT",
            user: undefined,
            authToken: undefined,
            targetHost: undefined,
            tenantId: undefined,
            appdVersion:undefined,
            businessGroupCollection: undefined
        },

        initialize: function (arguments) {
            Backbone.Model.prototype.initialize.apply(this, arguments);
            var error = this.validate(this.attributes);
            if (error) {
                this.trigger("error", this, error);
            }
        },

        validate: function (attrs) {
            if (!_.isString(attrs.targetHost) || !_.isString(attrs.tenantId) || !_.isObject(attrs.businessGroupCollection)) {
                return "Invalidd targetHost, tenantId or businessGroupCollection"
            }
        }

        /* save: function(attributes, options) {
         this.get("businessGroupCollection").each(function (bg) {
         bg.save();
         });
         Backbone.Model.prototype.save.call(this, attributes, options);
         }*/
    });

    return SessionStorage;
});
