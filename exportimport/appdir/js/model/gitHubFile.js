/**
 * @author samueldoyle
 */
define(["underscore", "backbone", "util/appDirCommon"], function (_, Backbone, cu) {
    var GitHubFile = Backbone.Model.extend({
        defaults:{
            sha:null,
            path:null,
            theURL:null
        },

        initialize:function () {
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
        }
    });
    return GitHubFile;
});
