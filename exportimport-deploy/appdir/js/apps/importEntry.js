define(function (require) {
        var $ = require("jquery"),
            _ = require("underscore"),
            SessionStore = require("model/sessionStorage"),
            jqValidate = require("jqValidate"),
            cp = require("model/commonProperties"),
            indexBody = require("model/indexBody"),
            compiledImportFormTmpl = require("hbs!template/importForm"),
            importFormModel = require("model/importForm"),
            compiledIndexBody = require("hbs!template/importBody"),
            importApp = require("apps/importPage"),
            cu = require("util/appDirCommon"),
            eventBus = require("util/appCommonEB"),
            theSessionStorage = undefined;


        $.validator.addMethod("hostOrIP", function (value, element) {
            return this.optional(element) || /((^\s*((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))\s*$)|(^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$))|(^\s*((?=.{1,255}$)(?=.*[A-Za-z].*)[0-9A-Za-z](?:(?:[0-9A-Za-z]|\b-){0,61}[0-9A-Za-z])?(?:\.[0-9A-Za-z](?:(?:[0-9A-Za-z]|\b-){0,61}[0-9A-Za-z])?)*)\s*$)/.test(value);
        });
        $.extend($.validator.messages, {hostOrIP: "Not a valid hostname or ip address."});

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
            }

            // populate content

            // Retrieve localstorage from index/login page
            this.theSessionStorage = new SessionStore({id: "DEFAULT"});
            this.theSessionStorage.fetch();
            cu.log("targetHost: " + this.theSessionStorage.get("targetHost"));
            cu.log("tenant: " + this.theSessionStorage.get("tenantId"));
            _.each(this.theSessionStorage.attributes.businessGroupCollection, function (bg) {
                cu.log("bg id: " + bg.tenantId);
                cu.log("bg name: " + bg.name);
                cu.log("bg tenant: " + JSON.stringify(bg.tenant));
            });

            // set our values retrieved from localstorage set on login
            importFormModel.set("appDirHost", this.theSessionStorage.get("targetHost"));
            importFormModel.set("appDirTenant", this.theSessionStorage.get("tenantId"));
            importFormModel.set("businessGroupCollection", this.theSessionStorage.get("businessGroupCollection"));

            // Inject our generated markup
            cp.get("indexBodyWrapper").html(compiledIndexBody(indexBody.toJSON()));
            cp.get("importFormWrapper").html(compiledImportFormTmpl(importFormModel.toJSON()));

            var appdVersion = this.theSessionStorage.get("appdVersion");
            appdVersion = appdVersion && parseFloat(appdVersion);
            if (!appdVersion || appdVersion < 6.1)
                $("#bgGroup").hide();

            // init any tooltips
            $("[data-toggle='tooltip']").tooltip();

            // Permit form input
            importApp.allowInput();
        };

        // Register for the descriptor file loaded event
        eventBus.registerForEvent(eventBus.getEvents().VMW_JSON_LOADED, jsonFileLoadedCB, EB_OBJ);

        // populate content
        var content = compiledIndexBody(indexBody.toJSON());
        cp.get("indexBodyWrapper").html(content);
        var content = compiledImportFormTmpl(importFormModel.toJSON());
        cp.get("importFormWrapper").html(content);

        // launch app
        if (importApp) importApp.postConstruct();
    }
);
