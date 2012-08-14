/**
 * @author samueldoyle
 * Shared common config used among pages if not all this needed make another
 */
TESTING = true;
if (typeof window.postMessage === "undefined") {
    alert("postMessage not supported in this browser");
}

ALERT_ERROR_CLASSES = "alert alert-error";
ALERT_SUCCESS_CLASSES = "alert alert-success";

requirejs.config({
    baseUrl:"../js", // relative to docs
//    enforceDefine:true,
    waitSeconds: 15,
    paths:{
        jquery:"jquery/jquery-1.7.2.min",
        jqPlugins:"jquery/plugins",
        twitterjs:"../../twitterbootstrap/docs/assets/js",
        underscore:"thirdparty/underscore-min",
        backbone:"thirdparty/backbone-min",
        handlebars:"thirdparty/handlebars",
        hb:'thirdparty/require/plugins/hbtemplate',
        text:'thirdparty/require/plugins/text',
        json:'thirdparty/require/plugins/json',
        domReady:"thirdparty/require/plugins/domReady"
    },
    shim:{
        "jqPlugins/jquery.activity-indicator":["jquery"],
        "jqPlugins/jquery.validate":["jquery"],
        "jqPlugins/jquery.validate.bootstrap":["jquery", "jqPlugins/jquery.validate"],
        "jqPlugins/postmessage":{
            deps:["jquery"],
            exports:function ($) {
                return this.pm;
            }
        },
        "thirdparty/crypto-min":{},
        "underscore":{
            exports:"_"
        },
        "backbone":{
            deps:["underscore", "jquery"],
            exports:"Backbone"
        },
        "twitterjs/bootstrap-transition":["jquery"],
        "twitterjs/bootstrap-button":["jquery"],
        "twitterjs/bootstrap-collapse":["jquery"],
        "twitterjs/bootstrap-modal":["jquery"]
    },
    deps:["jquery", "util/appDirCommon", "jqPlugins/jquery.validate", "jqPlugins/jquery.validate.bootstrap", "jqPlugins/postmessage", "jqPlugins/jquery.activity-indicator",
        "jqPlugins/jquery.url", "thirdparty/crypto-min", "twitterjs/bootstrap-transition", "twitterjs/bootstrap-button", "twitterjs/bootstrap-collapse", "twitterjs/bootstrap-modal"], // force some to load since they aren't directly referenced
    callback:function ($, cu) {
        // Add a domain specifier check to the validator
        $.validator.addMethod("dn", function (value, element) {
            return this.optional(element) || /^(https?:\/\/)?([0-9A-Za-z]+\.?)+([A-Za-z]{2,3})?(:\d+)?$/i.test(value);
        });
        $.extend($.validator.messages, {dn:"is not a valid domain name."});
    }
});
