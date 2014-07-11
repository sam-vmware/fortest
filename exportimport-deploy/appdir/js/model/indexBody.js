/**
 * Model backing for view/importForm.hbs template
 * @author samueldoyle
 */
define(function (require) {
    var $ = require("jquery"),
        _ = require("underscore"),
        Backbone = require("backbone"),
        uiUtils = require("util/uiUtils");

    var IndexBodyModel = Backbone.Model.extend({
    defaults:{
            mainHeader:"A blueprint is a visual model for deployment topology. This page has an import utility that allows you to automatically render the selected application blueprint into vCloud Automation Center 6.0",
            importHeader:"Import Application",
            readMeHeader:"Description",
            advancedOptionsHeader:"Import Options",
            conflictResolutionLabel:"Conflict Resolution",
            overwriteLabel:"Overwrite",
            overwriteTT:"Overwrite the repository contents with the package contents if there is a conflict between them.",
            skipLabel:"Skip",
            skipTT:"Skip importing the package contents if they conflict with the repository; reuse the repository contents.",
            newLabel:"New",
            newTT:"All package contents that conflict with the repository contents will be imported into the repository as new content, with a timestamp used to identify them.",
            importGroupLabel:"Group Name",
            importGroupTT:"The import group name to use.",
            importAsNewLabel:"Import As New Suffix",
            importAsNewTT:"Provide a suffix used for renaming entities which conflict.",
            importSuffixTT:"The suffix value to use.",
            sharedLabel:"Shared",
            sharedTT:"If specified the artifacts will be shared to public, otherwise by default they will be in private group.\nNOTE! Only applies to v6.0+",
            contactEnabled:false,
            importEnabled:false,
            contactText:"Contact",
            contactName:"Marketplace Support",
            contactEmail:"app-mgmt-partner-support@vmware.com",
            contactEmailLink:undefined,
            appDDSLink:'<a href="http://www.vmware.com/files/pdf/vfabric/VMware-vFabric-Application-Director-Datasheet.pdf">vCloud Automation Center</a>',
            infoBulletPoints: []
        },

        initialize:function () {
            var that=this;

            this.set("contactEmailLink", uiUtils.generateEmailTemplate({
                emailToAddress:that.get("contactEmail"),
                emailToName:that.get("contactName")
            }));

            var bulletValues = [

                {msg: 'A blueprint is a visual model for deployment topology. This page has an import utility that allows you to automatically render the selected application blueprint into ' + that.get("appDDSLink") + ' 6.0'},
                {msg: 'Your Application Director instance needs to be network accessible for the import utility to work'},
                {msg: 'You need to have Catalog Admin and Application Architect roles to use import the blueprint into your instance of Application Director'},
                {msg: 'If you do not have an instance of Application Director, contact us at ' + that.get("contactEmailLink")}
            ];

            _.each(bulletValues, function (bullet) {
                this.get("infoBulletPoints").push(bullet);
            }, this);

            Backbone.Model.prototype.initialize.apply(this, arguments);
        }
    });

    return new IndexBodyModel();
});
