/**
 * Placeholder for error related
 * Created by samueldoyle on 10/14/13.
 */
define(function(require) {
    var $ = require("jquery"),
        _ = require("underscore"),
        Backbone = require("backbone"),
        indexBody = require("model/indexBody"),
        uiUtils = require("util/uiUtils");

    var ErrorMappings = Backbone.Model.extend({
        defaults:{
            ERRORS: {
                connect: 'Could not connect to Application Director – check your Application Director IP address, Network access to Application Director and instance availability',
                authenticate: 'Could not authenticate user – check your login credentials to Application Director and your access levels (Catalog Admin, Application Architect)',
                import:undefined
            }
        },

        initialize:function () {
            var emailHTML= uiUtils.generateEmailTemplate({
                    emailToAddress:indexBody.get("contactEmail"),
                    emailToName:indexBody.get("contactName")
                });
            var errorsHash = this.get("ERRORS");
            errorsHash.import='Could not import – please send an email to ' + emailHTML + ' your blueprint name to get the error resolved';
            Backbone.Model.prototype.initialize.apply(this, arguments);
        },

        get:function (attr) {
            if (_.isFunction(this[attr])) {
                return this[attr]();
            }
            return Backbone.Model.prototype.get.call(this, attr);
        }

    });

    return new ErrorMappings();
});
