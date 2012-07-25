/**
 * Wrapper for an iFrame with postMessage setup with remote src
 * @author samueldoyle
 */
define("PostableCSIframe", ["jquery", "jqPlugins/postmessage"], function ($, pm) {

    /**
     * Required: options.id, options.src and options.loadFunction for the iframe
     *           options.pmFunction - the function for postMessage to bind with
     * Optional: appendToElem defaults to body, name defaults to id
     *           loadFunction, the loadFunction for the iFrame defaults to empty
     * @param options
     * @constructor
     */
    function PostableCSIframe(options) {
        this.myOptions = $.extend({
            appendToElem:'body',
            loadFunction:function() {
                // NOOP
            }
        }, options);

        if (!myOptions.id || !myOptions.src || !myOptions.pmFunction) throw new Error("Invalid Arguments");
        myOptions.name = myOptions.name || myOptions.id;

        this.iframe =
            $('<iframe />', {
                id:myOptions.id,
                name:myOptions.name,
                src:myOptions.src
            }).load(myOptions.loadFunction).appendTo($(myOptions.appendToElem));

        pm.bind(myOptions.name, myOptions.pmFunction);
    }

    // Construct iframes
    return function PostableCSIframe(options) {
        if (!myOptions.id) throw new Error("No identifier was provided");
        if (!myOptions.src) throw new Error("No src identifier was provided");
    }
});
