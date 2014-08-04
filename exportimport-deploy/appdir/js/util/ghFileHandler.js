/**
 * If you have any handlebar helpers can place them here
 * @author samueldoyle
 */
define(function (require) {
    var $ = require("jquery"),
        _ = require("underscore"),
        SessionStorage = require("model/sessionStorage"),
        cp = require("model/commonProperties"),
        errors = require("model/errorMappings"),
        cu = require("util/appDirCommon"),
        eventBus = require("util/appCommonEB");

    function getGHFileRawData (model, options) {
        cp.get("responseDataControl").addClass("hidden"); // hide the response in case it is open from prev request
        var requestOpts = _.extend({}, {
            reset: false, // if this model has retrieved its data already skip
            success: function (model, response, jqXHR) {
                cu.log("!! Empty success callback encountered !!");
            },
            error: function (model, error, jqXHR) {
                cu.log("Failed: getting data from GH");
                uiUtils.updateFormDisplay({
                    rdcClass: ALERT_ERROR_CLASSES,
                    rdMsgVal: "Failed to get data from GitHub. " + JSON.stringify({
                        name: model.get("path"),
                        code: jqXHR.status,
                        error: error
                    }) + " " + errors.get("ERRORS").import
                });
            }
        }, options);

        // another bind before fetch
        requestOpts.success = _.bind(requestOpts.success, this);

        // Fetch the rawData for the file we want from GitHub
        model.fetch(requestOpts);
    }

    return {
        getGHFileRawData:function(model, options) {
            return getGHFileRawData(model, options);
        }
    }

});