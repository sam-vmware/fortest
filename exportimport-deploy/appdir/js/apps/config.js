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
        loginEntry:"apps/loginEntry",
        importEntry:"apps/importEntry",
        jquery: "jquery/jquery-1.8.2.min",
        underscore: "thirdparty/underscore",
        backbone: "thirdparty/backbone",
        localstorage: "thirdparty/backbone.localStorage",
        Handlebars: "thirdparty/require/handlebars",
        text: "thirdparty/require/text",
        i18nprecompile: "thirdparty/require/plugins/i18nprecompile",
        domReady: "thirdparty/require/plugins/domReady",
        json2: "thirdparty/require/plugins/json2",
        hbs: "thirdparty/require/hbs",
        twitterjs: "../../twitter-bootstrap/js/bootstrap.min",
        "jqActivity":"jquery/plugins/jquery.activity-indicator",
        "jqURL":"jquery/plugins/jquery.url",
        "jqValidate":"jquery/plugins/jquery.validate.min",
        "jqUI":"jquery/plugins/jquery-ui-1.9.1.custom",
        "jqScale":"jquery/plugins/jquery-image-scale.min",
        "Crypto":"thirdparty/crypto-min",
        "spin":"thirdparty/spin.min",
        "marked":"thirdparty/marked",
        "jsonPath":"thirdparty/jsonpath",
        "has":"thirdparty/jsonpath"
    },
    locale: "en_us",
    // default plugin settings, listing here just as a reference
    hbs: {
        extension: '.hbs',
        // if disableI18n is `true` it won't load locales and the i18n helper
        // won't work as well.
        disableI18n: true
    },
    shim: {
        "jqActivity":  ["jquery"],
        "jqURL":  ["jquery"],
        "jqValidate":  ["jquery"],
        "jqUI":  ["jquery"],
        "jqScale":  ["jquery"],
        underscore: { exports: "_" },
        backbone: {
            deps: ["underscore", "jquery"],
            exports: "Backbone"
        },
        Handlebars: { exports: "Handlebars" },
        "Crypto": { exports: "Crypto" },
        "spin": { exports: "spin" },
        "marked": { exports: "marked" },
        "jsonPath": { exports: "jsonPath" },
        "i18nprecompile": { exports: "i18nprecompile" },
        "domReady": { exports: "domReady" },
        "json2": { exports: "json2" },
        "twitterjs": { exports: "twitterjs" },
        "has": { exports: "has" }
    }
});

