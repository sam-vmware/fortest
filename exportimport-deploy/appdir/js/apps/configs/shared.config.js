/**
 * @author samueldoyle
 * Shared common config used among pages if not all this needed make another
 */
TESTING = true;

ALERT_ERROR_CLASSES = "alert alert-error";
ALERT_SUCCESS_CLASSES = "alert alert-success";

requirejs.config({

//    out: "../../../../../exportimport-deploy/appdir/js/apps/main.js",
    baseUrl: "../js",
    waitSeconds: 15,
    paths: {
        apps: "apps",
        jquery: "jquery/jquery-1.8.2.min",
        jqPlugins: "jquery/plugins",
        underscore: "thirdparty/underscore-1.4.1-amd",
        backbone: "thirdparty/backbone-0.9.2-amd",
        Handlebars: "thirdparty/require/handlebars",
        text: "thirdparty/require/text",
        hbars: "thirdparty/require/hbars",
        i18nprecompile: "thirdparty/require/plugins/i18nprecompile",
        json2: "thirdparty/require/plugins/json2",
        twitterjs: "../../twitter-bootstrap/js/bootstrap.min"
    },
    locale: "en_us",
    // default plugin settings, listing here just as a reference
    hbars: {
        extension: '.hbs',
        // if disableI18n is `true` it won't load locales and the i18n helper
        // won't work as well.
        disableI18n: true
    },
    shim: {
        "jqPlugins/jquery.url": ["jquery"],
        "jqPlugins/jquery-ui-1.9.1.custom": ["jquery"],
        "jqPlugins/jquery.validate.min": ["jquery"],
        "../../twitter-bootstrap/js/bootstrap.min": ["jquery"],
        "thirdparty/crypto-min": {},
        "thirdparty/marked": {
            exports: "marked"
        },
        "thirdparty/jsonpath-0.8.0": {
            exports: "jsonPath"
        },
        Handlebars: {
            exports: "Handlebars"
        },
        backbone: {
            deps: ["underscore", "jquery"],
            exports: "Backbone"
        },
        underscore: {
            exports: "_"
        }
    }
});

/*requirejs(["jquery", "apps/importExportApp.nopm"],
    function ($, preLoader, importApp) {
        $(document).ready(function () {
            importApp.postConstruct();
        });
    });*/
//requirejs(["apps/main"]);
requirejs(["jquery",  "jqPlugins/jquery.url", "jqPlugins/jquery-ui-1.9.1.custom", "jqPlugins/jquery.validate.min",
    "twitterjs", "thirdparty/crypto-min", "thirdparty/marked", "thirdparty/jsonpath-0.8.0", "underscore", "backbone", "Handlebars",
    "apps/main"]);
