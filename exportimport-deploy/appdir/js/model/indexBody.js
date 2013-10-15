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
            mainHeader:"A blueprint is a visual model for deployment topology. This page has an import utility that allows you to automatically render the selected application blueprint into vFabric Application Director 5.x",
            importHeader:"Import Application",
            readMeHeader:"Description:",
            advancedOptionsHeader:"Options",
            conflictResolutionLabel:"Conflict Resolution",
            overwriteLabel:"Overwrite",
            skipLabel:"Skip",
            newLabel:"New",
            importAsNewLabel:"Import As New Suffix",
            contactEnabled:false,
            contactText:"Contact",
            contactName:"Partner Support",
            contactEmail:"app-mgmt-partner-support@vmware.com",
            contactEmailLink:undefined,
            appDDSLink:'<a href="http://www.vmware.com/files/pdf/vfabric/VMware-vFabric-Application-Director-Datasheet.pdf">Application Director</a>',
            infoBulletPoints: []
        },

        initialize:function () {
            var that=this;

            this.set("contactEmailLink", uiUtils.generateEmailTemplate({
                emailToAddress:that.get("contactEmail"),
                emailToName:that.get("contactName")
            }));

            var bulletValues = [
                {msg: 'Your ' + that.get("appDDSLink") + ' instance needs to be network accessible for the import utility to work'},
                {msg: 'You need to have Catalog Admin and Application Architect roles to use import the blueprint into your instance of ' + that.get("appDDSLink")},
                {msg: 'If you do not have an instance of ' + that.get("appDDSLink") + ' , contact us at ' + that.get("contactEmailLink")}
            ];

            _.each(bulletValues, function (bullet) {
                this.get("infoBulletPoints").push(bullet);
            }, this);

            Backbone.Model.prototype.initialize.apply(this, arguments);
        }
    });

    return new IndexBodyModel();
});
