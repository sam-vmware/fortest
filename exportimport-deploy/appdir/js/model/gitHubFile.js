/**
 * Storage of metadata representing a GitHubFile, the rawData is lazy loaded on demand through calling
 * fetch on this model.
 * @author samueldoyle
 */
define(["underscore", "backbone", "util/appDirCommon"], function (_, Backbone, cu) {
    var GitHubFile = Backbone.Model.extend({
        idAttribute:"path",
        defaults:{
            contentType:"application/xml",
            sha:undefined,
            path:undefined,
            theURL:undefined,
            rawData:undefined,
            inMemLinkHolder:undefined // Don't use this directly, call get("inMemLink") to lazy init it or return if set
        },

        get:function (attr) {
            if (_.isFunction(this[attr])) {
                return this[attr]();
            }
            return Backbone.Model.prototype.get.call(this, attr);
        },

        // Get on inMemLink check to see if we allocated one already otherwise create it based on our raw data
        inMemLink:function () {
            if (this.has("inMemLinkHolder")) return this.get("inMemLinkHolder");

            // Init and store inmem link
            var link = cu.getLinkForData(this.get("rawData"), this.get("contentType"));
            cu.log("GitHubFile setting inMemLinkHolder: " + link[0]);
            this.set("inMemLinkHolder", link[0]);
            return this.get("inMemLinkHolder");
        },

        initialize:function (arguments) {
            Backbone.Model.prototype.initialize.apply(this, arguments);
            var error = this.validate(this.attributes);
            if (error) {
                this.trigger("error", this, error);
            }
        },

        url:function () {
            return this.get("theURL");
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
            if (!_.isUndefined(this.get("rawData")) && !options.reset) {
                // only sync if data not set.
                return;
            }
            var params = _.extend({
                type:"GET",
                timeout:30000,
                processData:true,
                url:this.url(),
                context:this,
                beforeSend:function (xhr) {
                    xhr.setRequestHeader("Accept", "application/vnd.github.raw");
                },
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

        parse:function (response, options) { // fetch should only ever be called in lazy init for rawdata
            if (options.reset === false) {
                this.set("rawData", response);
                return;
            }
            return {
               "sha": response.sha,
                "path": response.path,
                "theURL": response.url
            };
        }
    });
    return GitHubFile;
});
