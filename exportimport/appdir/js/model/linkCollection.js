/**
 * A collection of links
 * @author samueldoyle
 */
define(["underscore", "backbone", "model/link"], function (_, Backbone, Link) {
    var LinkCollection = Backbone.Collection.extend({
        model:Link
    });
    return LinkCollection;
});
