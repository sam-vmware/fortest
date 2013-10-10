/**
 * @author samueldoyle
 * Shared common config used among pages if not all this needed make another
 */
TESTING = true;

ALERT_ERROR_CLASSES = "alert alert-error";
ALERT_SUCCESS_CLASSES = "alert alert-success";

requirejs.config({
    baseUrl:"../js",
    waitSeconds:15,
    paths:{
        jquery:"jquery/jquery-1.8.2.min",
        jqPlugins:"jquery/plugins",
        underscore:"thirdparty/underscore-1.4.1-amd",
        backbone:"thirdparty/backbone-0.9.2-amd",
        handlebars:"thirdparty/require/handlebars-1.0.rc.1",
        hbs:"thirdparty/require/hbs-0.4.0",
        text:"thirdparty/require/plugins/text-2.0.3",
        i18nprecompile:"thirdparty/require/plugins/i18nprecompile",
        json2:"thirdparty/require/plugins/json2",
        twitterjs:"../../twitter-bootstrap/js/bootstrap.min"
    },
    locale:"en_us",
    // default plugin settings, listing here just as a reference
    hbs:{
        templateExtension:"hbs",
        // if disableI18n is `true` it won't load locales and the i18n helper
        // won't work as well.
        disableI18n:true
    },
    shim:{
        "jqPlugins/jquery.url":["jquery"],
        "jqPlugins/jquery-ui-1.9.1.custom.js":["jquery"],
        "jqPlugins/spin.min":["jquery"],
        "../../twitter-bootstrap/js/bootstrap.min":["jquery"],
        "thirdparty/crypto-min":{},
        "thirdparty/encoding":{},
        "thirdparty/marked":{
            exports:"marked"
        },
        "thirdparty/jsonpath-0.8.0":{
            exports:"jsonPath"
        }
    },
    deps:["jquery"], callback:function ($) {

        // Assertion from: http://aymanh.com/9-javascript-tips-you-may-not-know#assertion
        function AssertException(message) {
            this.message = message;
        }

        AssertException.prototype.toString = function () {
            return 'AssertException: ' + this.message;
        };

        window.assert = function assert(exp, message) {
            if (!exp) {
                throw new AssertException(message);
            }
        }
    }
});
