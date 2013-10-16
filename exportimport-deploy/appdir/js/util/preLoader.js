/**
 * A bundler to force loading of jquery plugins and other shim defined modules as well as some other config
 * @author samueldoyle
 */
define(["jquery", "underscore", "backbone", "Handlebars", "jqPlugins/jquery.url", "jqPlugins/jquery-ui-1.9.1.custom",
    "jqPlugins/jquery.validate.min", "twitterjs", "thirdparty/crypto-min", "thirdparty/marked",
    "thirdparty/jsonpath-0.8.0"],
    function () {
        return {
            load:function() {}
        }
    }
);