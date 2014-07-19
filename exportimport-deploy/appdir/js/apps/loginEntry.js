define(function (require) {
        var $ = require("jquery"),
            _ = require("underscore"),
            jqValidate = require("jqValidate"),
            cp = require("model/commonProperties"),
            indexBody = require("model/indexBody"),
            compiledLoginFormTmpl = require("hbs!template/loginForm"),
            loginFormModel = require("model/loginForm"),
            compiledIndexBody = require("hbs!template/loginBody"),
            loginPage = require("apps/loginPage"),
            cu = require("util/appDirCommon"),
            eventBus = require("util/appCommonEB");

        $.validator.addMethod("hostOrIP", function (value, element) {
            return this.optional(element) || /((^\s*((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))\s*$)|(^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$))|(^\s*((?=.{1,255}$)(?=.*[A-Za-z].*)[0-9A-Za-z](?:(?:[0-9A-Za-z]|\b-){0,61}[0-9A-Za-z])?(?:\.[0-9A-Za-z](?:(?:[0-9A-Za-z]|\b-){0,61}[0-9A-Za-z])?)*)\s*$)/.test(value);
        });
        $.validator.addMethod("tenant", function (value, element) {
            return this.optional(element) || /^\w+$/.test(value);
        });
        $.extend($.validator.messages, {hostOrIP: "Not a valid hostname or ip address."});
        $.extend($.validator.messages, {tenant: "Not a valid tenant."});

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
        };

        var EB_OBJ = {};
        var jsonFileLoadedCB = function (event, listener, vmwareJSONFile) {
            if (event != eventBus.getEvents().VMW_JSON_LOADED) throw new Error("Unexpected event received: " + event);
            if (listener != EB_OBJ) throw new Error("Wrong listener received: " + listener);

            // Stop listening
            eventBus.deregisterForEvent(eventBus.getEvents().VMW_JSON_LOADED, jsonFileLoadedCB, EB_OBJ);

            // If there is a descriptor file, and there should be, check for the bullet optional field and use it
            // instead of default.
            if (vmwareJSONFile) {
                var optional = vmwareJSONFile.get("optional");
                if (optional && optional.headerBulletPoints) {
                    cu.log("jsonFileLoadedCB: found optional header bullet points in json descriptor");
                    var overrideHeaderBulletPoints = [];
                    _.each(optional.headerBulletPoints, function (bullet) {
                        overrideHeaderBulletPoints.push(bullet);
                    });
                    indexBody.set("infoBulletPoints", overrideHeaderBulletPoints);
                } else {
                    cu.log("jsonFileLoadedCB: no optional header bullet points found in json descriptor");
                }
                if (optional && optional.appdVersions) {
                    cu.log("AppD Supported Versions: " + JSON.stringify(optional.appdVersions));
                    var supportedVersions = [];
                    _.each(optional.appdVersions, function (version) {
                        supportedVersions.push(version);
                    });
                    loginFormModel.set("appDVersionCollection", supportedVersions);
                    loginFormModel.set("appdVersionGroupDisplay", "inherit");
                } else if (optional.appdVersions) {
                    cu.log("No appd versions provided no tenant/group information will be handled");
                }
            }

            // populate content
            var content = compiledIndexBody(indexBody.toJSON());
            cp.get("indexBodyWrapper").html(content);
            var content = compiledLoginFormTmpl(loginFormModel.toJSON());
            cp.get("loginFormWrapper").html(content);

            // init any tooltips
            $("[data-toggle='tooltip']").tooltip();

            // Permit form input
            loginPage.allowInput();
        };

        // Register for the descriptor file loaded event
        eventBus.registerForEvent(eventBus.getEvents().VMW_JSON_LOADED, jsonFileLoadedCB, EB_OBJ);

        // populate content via injected markup
        cp.get("indexBodyWrapper").html(compiledIndexBody(indexBody.toJSON()));
        cp.get("loginFormWrapper").html(compiledLoginFormTmpl(loginFormModel.toJSON()));

        // launch app
        if (loginPage) loginPage.postConstruct();
    }
);
