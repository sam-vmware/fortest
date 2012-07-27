/**
 * Storage of metadata representing a GitHubFile, the rawData is lazy loaded on demand through calling
 * fetch on this model.
 * @author samueldoyle
 */
define(["underscore", "backbone", "util/appDirCommon"], function (_, Backbone, cu) {
    var GitHubFile = Backbone.Model.extend({
        defaults:{
            sha:null,
            path:null,
            theURL:null,
            rawData:null
        },

        initialize:function (arguments) {
            Backbone.Model.prototype.initialize.apply(this, arguments);
            var error = this.validate(this.attributes);
            if (error) {
                this.trigger("error", this, error);
            }
        },

        validate:function (attrs) {
            if (!_.isString(attrs.sha) || !_.isString(attrs.path) || !_.isString(attrs.theURL)) {
                return "Invalid attribute set."
            }
        },

        save:function () {
            cu.log("GitHubFile: save called");
            this.trigger("error", this, error);
        },

        destroy:function () {
            cu.log("GitHubFile: destroy called");
            this.trigger("error", this, error);
        },

        sync:function (method, model, options) {
            if (!_.isEqual("read", method)) {
                cu.log("GitHubFile sync called with non-read method: " + method);
                this.trigger("error", this, error);
                return;
            }
            if (!_.isNull(this.get("rawData"))) {
                // only sync if data not set.
                return;
            }
            var params = _.extend({
                type:"GET",
                timeout:30000,
                processData:true,
                url:this.theURL,
                context:this,
                complete:function (data) {
                },
                success:function (data) {
                    cu.log("success: " + data);
                },
                error:function (data) {
                    cu.log("error: " + data);
                },
                dataType:"html"
            }, options);

            return $.ajax(params);
        },

        parse:function (response) { // fetch should only ever be called in lazy init for rawdata
           this.set("rawData", response);
        }
    });
    return GitHubFile;
});
