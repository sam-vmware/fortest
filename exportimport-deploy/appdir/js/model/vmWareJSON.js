/**
 * Stores the values consumed from the vmware.json file
 * @author samueldoyle
 */
define(function(require) {
        var _ = require("underscore"),
            Backbone = require("backbone"),
            jp = require("thirdparty/jsonpath-0.8.0");

        var VMWareProperties = Backbone.Model.extend({
            defaults:{
                requiredJSONPath:{ // http://goessner.net/articles/JsonPath/
                    "$.vmware.config.version":"configVersion",
                    "$.vmware.applications.applicationDirectorWebImport.exportFileName":"exportFileName",
                    "$.vmware.applications.applicationDirectorWebImport.exportedFileReadme":"exportedFileReadme",                    
                    "$.vmware.applications.applicationDirectorWebImport.exportedWithAppDVersion":"exportedWithAppDVersion",
                    "$.vmware.applications.applicationDirectorWebImport.importSectionHeader":"importSectionHeader"
                },
                /* The optional content could be whatever but would contain the following if nextSteps were provided as an
                 example:
                 "optional":{
                    "nextSteps":"weblogic12c-cluster-dukebank-1.0.0.xml.nextsteps.markdown",
                    "$.vmware.applications.applicationDirectorWebImport.exportedFileErrorReadme":"exportedFileErrorReadme",
                    "enableConsoleLogging":true
                 }
                 */
                optionalJSONPath:"$.vmware.applications.applicationDirectorWebImport.optional"
            },

            get:function (attr) {
                if (_.isFunction(this[attr])) {
                    return this[attr]();
                }
                return Backbone.Model.prototype.get.call(this, attr);
            },

            optional:function () {
                return this.optionalValues;
            },

            // Validate the vmware.json file contains the required properties, as validating set the
            // property on this. Backbone doesn't support deep nesting in constructor so we will flatten it while validating.
            validateJSON:function (jsonObj) {
                var validateAndSetList = _.pairs(this.get("requiredJSONPath")),
                    pair, key, propValue,
                    opts = {};
                for (var i = 0; i < validateAndSetList.length; i++) {
                    pair = validateAndSetList[i];
                    if (!(propValue = jp(jsonObj, pair[0]))) {
                        return pair[0];
                    }
                    opts[pair[1]] = propValue[0];
                }
                this.set(opts);
                return undefined;
            },

            initialize:function (attrs) {
                var configJSON = JSON.parse(attrs.rawJSON);
                var notValid = this.validateJSON(configJSON);
                if (!_.isUndefined(notValid)) {
                    throw new Error("Validation failed! Missing required property: " + notValid);
                }
                // Just store basic JSON for optional, will need to be introspected on a case by case basis
                this.optionalValues = jp(configJSON, this.get("optionalJSONPath"));
                this.optionalValues = this.optionalValues ? this.optionalValues[0] : undefined;
            }
        });

        return VMWareProperties;
    });

