/**
 * Use local storage for content across pages
 * @author samueldoyle
 */
define(["underscore", "backbone", "localstorage"], function (_, Backbone, localstorage) {
    var SessionStorage = Backbone.Model.extend({
        localStorage:new Backbone.LocalStorage("APPD_SessionStorage"),
        defaults: {
            id:"DEFAULT",
            targetHost:undefined,
            tenantId:undefined,
            businessGroupCollection:undefined
        },

        initialize: function (arguments) {
            Backbone.Model.prototype.initialize.apply(this, arguments);
            var error = this.validate(this.attributes);
            if (error) {
                this.trigger("error", this, error);
            }
        },

        validate:function (attrs) {
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
