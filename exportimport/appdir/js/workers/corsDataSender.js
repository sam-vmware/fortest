/**
 * Sends data to a target iframe and message topic
 * require wrapper around pm functionality
 * @author samueldoyle
 */
define(["jquery", "underscore", "jqPlugins/postmessage", "util/appDirCommon"], function ($, _, pm, cu) {
    var PM_REQUIRED = ["target", "type", "data", "data.uid"];
    return {
        // See http://postmessage.freebaseapps.com API section at end for optional fields
        sendMsg:function (options) {
            options = options || {};
            $.each(PM_REQUIRED, function (index, value) {
                if (!cu.getDeepProperty(options, value))
                    throw new Error("corsDataSender.sendMsg: target: " + value + " not provided");
            });
            cu.log("CorsDataSender sending message of type: " + options.type);
            pm(options);
        }
    };
});
