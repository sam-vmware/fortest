/**
 * Placeholder for email properties
 * Created by samueldoyle on 10/15/13.
 */
define(function (require) {
    var $ = require("jquery"),
        _ = require("underscore"),
        Backbone = require("backbone");

    var EmailProperties = Backbone.Model.extend({
        defaults:{
            emailToAddress:undefined,
            emailToName:undefined,
            repoUname:undefined,
            repoName:undefined,
            repoBranch:undefined,
            subject:"Application Marketplace Assistance Request"
        },

        initialize:function () {
            Backbone.Model.prototype.initialize.apply(this, arguments);
        },

        get:function (attr) {
            if (_.isFunction(this[attr])) {
                return this[attr]();
            }
            return Backbone.Model.prototype.get.call(this, attr);
        },

        validate:function (attrs) {
            if (!_.isString(attrs.emailToAddress) || !_.isString(attrs.emailToName) ||!_.isString(attrs.repoUname)
                || !_.isString(attrs.repoName) || !_.isString(attrs.repoBranch) || !_.isString(attrs.subject)) {
                return "Invalid attribute set."
            }
        }
    });

    return EmailProperties;
});
