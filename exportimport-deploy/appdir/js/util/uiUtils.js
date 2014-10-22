/**
 * A module defining some common ui utils
 * @author samueldoyle
 */
define(function (require) {
    var $ = require("jquery"),
        _ = require("underscore"),
        compiledNoticeTemplate = require("hbs!template/notice"),
        compiledEmailPartnerSupportTemplate = require("hbs!template/emailPartnerSupport"),
        cu = require("util/appDirCommon"),
        cp = require("model/commonProperties"),
        email = require("model/email"),
        jqURL = require("jqURL"),
        jqUI = require("jqUI");

    function noticeModal(templateValues) {
        var content = compiledNoticeTemplate(templateValues);
        cp.get("noticeModalWrapper").html(content);
        cp.get("noticeModal").modal();
    }

    function getBase() {
        return $(document.documentElement).length > 0 ? $(document.documentElement) : $(document.body);
    }

    function generateEmailTemplate(options) {
        options || {};
        var queryParams = $.url().param();
        var emailProperties = new email(_.extend({
            repoUname: queryParams.uname,
            repoName: queryParams.repo,
            repoBranch: queryParams.branch
        }, options));

        if (!emailProperties.isValid()) {
            cu.log("emailProperties invalid: " + JSON.stringify(emailProperties));
            return;
        }

        return compiledEmailPartnerSupportTemplate(emailProperties.toJSON());
    }

    // Updates the banner with success or error messages
    function updateFormDisplay(options) {
        var msg, clazz;

        // Small enough not to place in template
        if (_.isEqual(options.rdcClass, ALERT_SUCCESS_CLASSES)) {
            msg = "Success " + options.rdMsgVal;
            clazz = "success main-state-deploy-success"
        } else if (_.isEqual(options.rdcClass, ALERT_ERROR_CLASSES)) {
            msg = "Error! " + options.rdMsgVal;
            clazz = "notification-bulb-error"
        }
        cp.get("responseDataControl").removeClass("hidden").removeAttr("class").addClass(clazz);
        cp.get("responseData").empty().html(msg);
        cu.log("error: " + JSON.stringify(options));
    }

    // Will return a promise which is resolved or rejected depending on if the window has been open or blocked
    function openWindow(url, windowName) {
        var openOperation = $.Deferred(),
            checkInterval = 1500,
            isBlocked = function (width, height) {
                var target = getBase();
                width = width ? width : 1;
                height = height ? height : 1;
                return (_.isUndefined(target.clientWidth) || _.isUndefined(target.clientHeight) || target.clientWidth >= width || target.clientHeight >= height);
            },
            checkWindowBlocked = function () {
                if (isBlocked()) {
                    cu.log("Window blocked so rejecting");
                    openOperation.reject();
                } else {
                    cu.log("newWindow innerWidth: " + newWindow.innerWidth + " resolving");
                    openOperation.resolve();
                }
            };

        var newWindow = window.open(url, windowName);
        if (!newWindow && cp.get("page-index").hasClass("ff-true")) {
            // This works with Firefox
            cu.log("Window open returned undefined so rejecting");
            openOperation.reject();
        } else if (cp.get("page-index").hasClass("chrome-true")) {
            // Sort of hacky workaround for Chrome
            setTimeout(checkWindowBlocked, checkInterval);
        } else {
            cu.log("Window open returned fine so resolving");
            openOperation.resolve();
        }

        return openOperation;
    }

    /*
     * Additional iframe options
     * iframeOptions.name
     * iframeOptions.id
     * iframeOptions.cssObj - cssObject of style properties represented as key:value pairs
     * *** New to HTML5 ***
     * iframeOptions.seamless - only works on chrome
     * iframeOptions.srcdoc - not yet supported
     * iframeOptions.sandbox - don't use this if you have links extra secure, only works on chrome
     *
     * Iframe will be checked for or created with an id and name of iframeOptions.id + _iframe
     */
    function displayIframe(iframeOptions) {
        assert(iframeOptions, "No iFrame options provided");
        assert(iframeOptions.id, "No target id to append iFrame to provided");
        assert(iframeOptions.src, "No iFrame url provided");

        var $targetIframe,
            $target = $("#" + iframeOptions.id),
            iframeId = iframeOptions.id + "_iframe",
            iframeName = iframeOptions.name ? (iframeOptions.name + "_iframe") : iframeId;

        // If iframe element exists reuse it.
        var jqiframeId = "#" + iframeId;
        if ($(jqiframeId).is("iframe")) {
            cu.log("Found existing iframeid removing.");
            $(jqiframeId).remove();
            return;
        }

        // Setup the iframe properties
        var realIframeOptions = _.extend({}, {
            id: iframeId,
            name: iframeName,
            css: iframeOptions.cssObj ? iframeOptions.cssObj : ""
        }, _.pick(iframeOptions, "src", "seamless", "srcdoc", "sandbox"));

        cu.log("Creating iframe with the following attributes: " + JSON.stringify(realIframeOptions));
        $targetIframe = $("<iframe />", realIframeOptions).hide();
        $targetIframe.appendTo($target).show("highlight", 1000);
    }

    // For changes needed to tenant related elements on appd version change, this should be tied to a custom event
    // but the validation rules make it a bit trickier since it is coupled to the validation plugin
    function appdVersionChangeUpdateTenant(options) {
        var version = parseFloat(options.appdVersion);
        if (version >= 6.1) {
            cp.get("appDirTenantGroup").show();
            cp.get("continueButton").hide();
            cp.get("loginButton").show();
            cp.get("authPromptInfo").show();
            $("input[name='tenant']").rules("add", {
                required: true,
                tenant: true
            });
        } else {
            cp.get("appDirTenantGroup").hide();
            cp.get("continueButton").show();
            cp.get("loginButton").hide();
            cp.get("authPromptInfo").hide();
            $("input[name='tenant']").rules("remove");
        }
    }

    return {
        noticeModal: function (values) {
            return noticeModal(values);
        },
        openWindow: function (url) {
            return openWindow(url);
        },
        updateFormDisplay: function (options) {
            return updateFormDisplay(options);
        },
        displayIframe: function (iframeOptions) {
            return displayIframe(iframeOptions);
        },
        getBase: function () {
            return getBase();
        },
        generateEmailTemplate: function (options) {
            return generateEmailTemplate(options);
        },
        appdVersionChangeUpdateTenant: function (options) {
            return appdVersionChangeUpdateTenant(options);
        }
    }

})
;