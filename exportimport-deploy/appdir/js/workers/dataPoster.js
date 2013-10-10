/**
 * @author samueldoyle
 * Simple wrappper around post but allows for other options
 */

define(["jquery"], function ($) {

    var postDefaultOptions = {
        type:"POST",
        dataType:"html",
        timeout:120000, // 2 minutes on timeout
        cache:true,
        beforeSend:function (xhr) {
        },
        xhrFields:{}
        
    };

    return function (options) {
        var theOptions = _.extend({}, postDefaultOptions, options);
        if (!theOptions.url) throw new Error("Missing required url field");
        if (!theOptions.data) throw new Error("Missinger required data field");
        return $.ajax(theOptions);
    }
});

