/**
 * The collection of metadata returned by GitHub API and stored in GitHubFile instances
 * @author samueldoyle
 */
define(["underscore", "backbone", "model/gitHubFile", "util/appDirCommon"], function (_, Backbone, GitHubFile, cu) {
    var GitHubFileCollection = Backbone.Collection.extend({
        model:GitHubFile,
        myOptions:{
            userName:null,
            repoName:null,
            sha:"master",
            url:null
        },

        initialize:function (options) {
            options = options || {};
            if (!_.isString(options.userName) || !_.isString(options.repoName) || !_.isString(options.sha)) {
                throw new Error("Can't fetch data missing userName, repoName or branch");
            }
            _.extend(this.myOptions, options);
            this.myOptions.url = _.template("https://api.github.com/repos/<%= userName %>/<%= repoName %>/git/trees/<%= sha %>")(this.myOptions);
        },

        sync:function (method, model, options) {
            var params = _.extend({
                type:"GET", // force get backbone likes using post for new/save
                timeout:30000,
                processData:true,
                url:this.myOptions.url,
                context:this,
                complete:function (data) {
                },
                success:function (data) {
                    cu.log("success: " + data);
                },
                error:function (data) {
                    cu.log("error: " + data);
                },
                dataType:"json"
            }, options);

            return $.ajax(params);
        },

        // Parse out the collection of response objects
        parse:function (response) {
            if (response.tree) {
                return response.tree;
            }
            return response;
        }
    });

    return GitHubFileCollection;
});

