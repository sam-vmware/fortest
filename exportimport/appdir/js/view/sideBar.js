/**
 * A this an app for handling sidebar
 * @author samueldoyle
 */
define(["underscore", "backbone", "util/appDirCommon", "model/linkCollection", "model/link",
    "view/listItem", "view/ghViewDataModal"],
    function (_, Backbone, cu, LinkCollection, Link, ListItemView, GHViewDataModal) {

    // Extend and provide eventHandler for the click in this case.
    var CustomHandlerLink = Link.extend({
        initialize:function(options) {
            this.eventHandler = options.eventHandler;
        }
    });

   var defaults = {
       requestOptions: {
           beforeSend:function (xhr) {
               xhr.setRequestHeader("Accept", "application/vnd.github.raw");
           },
           success:function (model, response, jqXHR) {
               cu.log("Item clicked: path: " + model.get("path"));
               new GHViewDataModal().showModal(model.get("path"), model.get("rawData"));
           },
           error:function (model, error, jqXHR) {
               alert("Unable to retrieve readme file data");
           }
       }
   };

    var SideBarView = Backbone.View.extend({
        initialize:function (options) {
            this.myData = _.extend({}, defaults, options);
            var isReadMeSet = !_.isUndefined(this.myData.readMe);
            var readMePath = "unset";
            if (isReadMeSet) {
                readMePath = "Readme " + this.myData.readMe.get("path").split("\.")[0];
            }
            cu.log("readme: " + readMePath);
            this.$el.empty(); // anything in the sidebar before goes, el provided by main app

            var that = this;
            // TODO this should probably come from somewhere else and the SideBarView should not
            // be coupled to GH specifics like it is here, refactor the LinkCollection into the main app
            // and pass it to the view.
            this.links = new LinkCollection([
                new CustomHandlerLink({url:"#", title:readMePath, eventHandler: function(e) {
                    e.preventDefault();
                    if (!isReadMeSet) {
                        alert("Unable to retrieve readme file data");
                        return;
                    }

                    var model = that.myData.readMe;
                    // See if we have been already initialized.
                    if (!_.isUndefined(model.get("rawData"))) {
                        new GHViewDataModal().showModal(model.get("path"), model.get("rawData"));
                        return;
                    }
                     // Fetch the rawData for the file we want from GitHub, the readMe is an instance of GitHubFile
                    model.fetch(that.myData.requestOptions);
                }})
            ]);

            this.listOfLinks = new ListItemView({collection: this.links});
            this.render();
        },
        render:function () {
            this.listOfLinks.render();
            this.$el.append(this.listOfLinks.el);
        }
    });

    return SideBarView;
});