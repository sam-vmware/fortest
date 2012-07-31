/**
 * A Backbone view for handling list items
 * collection: model/linkCollection
 * @author samueldoyle
 * TODO atm we pass a linkitem, should be passed some factory instead to determine what type of item needs to be created
 * since there can be different types of list items
 */
define(["underscore", "backbone", "util/appDirCommon", "view/linkItem"],
    function (_, Backbone, cu, LinkItemView) {

    var ListItemView = Backbone.View.extend({
        tagName:"ul",
        initialize:function () {
            _.bindAll(this, "render", "renderItem");
        },
        renderItem:function (model) {
            var itemView = new LinkItemView({model:model});
            itemView.render();
            var content = itemView.el;
            this.$el.append(content);
        },
        render:function () {
            this.collection.each(this.renderItem);
        }
    });

    return ListItemView;
});