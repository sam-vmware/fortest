/**
 * Storage of metadata representing a businessGroup collected from login
 * @author samueldoyle
 */
define(["underscore", "backbone", "util/appDirCommon"], function (_, Backbone, cu) {
    var GitHubFile = Backbone.Model.extend({
        idAttribute:"tenantId",
        defaults:{
            tenantId:null,
            name:null,
            tenant:null
        },

        get:function (attr) {
            if (_.isFunction(this[attr])) {
                return this[attr]();
            }
            return Backbone.Model.prototype.get.call(this, attr);
        },

        initialize:function (arguments) {
            Backbone.Model.prototype.initialize.apply(this, arguments);
            var error = this.validate(this.attributes);
            if (error) {
                this.trigger("error", this, error);
            }
        },

        validate:function (attrs) {
            if (!_.isNumber(attrs.tenantId) || !_.isString(attrs.name) || !_.isObject(attrs.tenant)) {
                return "Business Group missing or invalid tenantId, name and/or tenant"
            }
        }
    });
    return GitHubFile;
});
