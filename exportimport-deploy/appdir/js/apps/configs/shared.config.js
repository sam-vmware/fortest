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
        "jqPlugins/jquery-ui-1.9.1.custom":["jquery"],
        "jqPlugins/spin.min":["jquery"],
        "jqPlugins/jquery.validate.min":["jquery"],
        "../../twitter-bootstrap/js/bootstrap.min":["jquery"],
        "thirdparty/crypto-min":{},
        "thirdparty/encoding":{},
        "thirdparty/marked":{
            exports:"marked"
        },
        "thirdparty/jsonpath-0.8.0":{
            exports:"jsonPath"
        },
        handlebars: {
            exports:"Handlebars"
        }
    },
    deps:["jquery", "jqPlugins/jquery.validate.min"], callback:function ($) {

        // Add a domain specifier check to the validator
        $.validator.addMethod("hostOrIP", function (value, element) {
            return this.optional(element) || /((^\s*((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))\s*$)|(^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$))|(^\s*((?=.{1,255}$)(?=.*[A-Za-z].*)[0-9A-Za-z](?:(?:[0-9A-Za-z]|\b-){0,61}[0-9A-Za-z])?(?:\.[0-9A-Za-z](?:(?:[0-9A-Za-z]|\b-){0,61}[0-9A-Za-z])?)*)\s*$)/.test(value);
        });
        $.extend($.validator.messages, {hostOrIP:"Not a valid hostname or ip address."});

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
