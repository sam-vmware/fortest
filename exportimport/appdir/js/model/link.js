/**
 * Simple model for storing links
 * @author samueldoyle
 */
define(["underscore", "backbone", "util/appDirCommon"], function (_, Backbone, cu) {
    var Link = Backbone.Model.extend({
        defaults:{
            url:undefined,
            text:undefined
        }
    });
    return Link;
});