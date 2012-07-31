/**
 * A Backbone view for handling Link Items
 * model: model/link
 * template: template/linkItemTemplate
 * @author samueldoyle
 * rn
 */
define(["underscore", "backbone", "util/appDirCommon", "hb!template/linkItemTmpl.hbs"],
    function (_, Backbone, cu, compiledLinkItemTmpl) {

    var LinkItemView = Backbone.View.extend({
        tagName:"li",
        initialize:function () {
            _.bindAll(this, "render", "clicked");
        },
        events:{
            "click a":"clicked"
        },
        clicked:function (e) {
            if (_.isUndefined(this.model.eventHandler)) {
                alert("EventHander is not defined");
                return;
            }
            this.model.eventHandler(e); // delegate to custom event handler in the model
        },
        render:function () {
                var content = compiledLinkItemTmpl(this.model.toJSON());
                this.$el.append(content);
            }
        });

    return LinkItemView;
});
