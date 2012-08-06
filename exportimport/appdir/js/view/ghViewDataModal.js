/**
 * A modal for displaying fileData from GH
 * @author samueldoyle
 */
define(["underscore", "backbone", "util/appDirCommon", "model/gitHubFile"],
    function (_, Backbone, cu, GitHubFile) {

    // we are expecting a modal to bet set and to be GitHubFile
    var GHViewDataModal = Backbone.View.extend({
        el:"#viewFileModal",
        initialize:function (options) {
            _.bindAll(this, "handleViewEvent", "showModal");
            if (_.isUndefined(this.model)) {
                // simply return here after binding since whatever called is dealing
                // with the data retrieval and will just use use stricly for show.
                return;
            }
            if (!this.model instanceof GitHubFile) {
                alert("GHViewDataModal requires a GitHubFile instance");
            }
            var that = this;
            this.options = _.extend({}, {
                requestOptions: {
                    reset:false,
                    beforeSend:function (xhr) {
                        xhr.setRequestHeader("Accept", "application/vnd.github.raw");
                    },
                    success:function (model, response, jqXHR) {
                        cu.log("GHViewDataModal Retrieved data successfully");
                        that.showModal(model.get("path"), model.get("rawData"));
                    },
                    error:function (model, error, jqXHR) {
                        cu.log("GHViewDataModal Failed getting data from GH");
                    }
                }
            }, options);
            // If provided with a clicktarget then bind to it for displaying the
            // data in our model
            if (!_.isUndefined(this.options.clickTarget)) {
                $(this.options.clickTarget).bind("click", _.bind(function(e) {
                    this.handleViewEvent(e);
                }, this));
            }
        },
        handleViewEvent:function (e) {
            e.preventDefault();
            var rawData = this.model.get("rawData");
            if (_.isUndefined(rawData)) {
                this.model.fetch(this.options.requestOptions);
                return;
            }
            this.showModal(this.model.get("path"), this.model.get("rawData"))
        },
        showModal:function(header, data) {
            this.$("#model-content").empty().append(_.escape(data)); // insert our data into the modal
            this.$("h3").empty().text(header);

            // get a link referencing the inmemory data and set it on our download button
            var url = this.model.get("inMemLink");
            this.$("a[download]", ".modal-footer").attr("href", url).attr("download", header).attr("target", "_blank");
            this.$el.modal({
               backdrop:true,
               keyboard:true
            })
        }
    });

    return GHViewDataModal;
});
