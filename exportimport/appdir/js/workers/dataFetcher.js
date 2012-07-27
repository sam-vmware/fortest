/**
 * @author samueldoyle
 * Simple wrappper around get but allows for other options
 */

define(["jquery"], function ($) {

    var getDefaultOptions = {
        type:"GET",
        dataType:"html",
        timeout:120000, // 2 minutes on timeout
        cache:true,
        beforeSend:function (xhr) {
        },
        xhrFields:{}
    };

    return function (options) {
        var theOptions = _.extend({}, getDefaultOptions, options);
        if (!theOptions.url) throw new Error("Missing required url field");
        return $.ajax(theOptions);
    }
});

