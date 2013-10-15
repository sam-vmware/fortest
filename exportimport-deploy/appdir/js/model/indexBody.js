/**
 * Model backing for view/importForm.hbs template
 * @author samueldoyle
 */
define(["underscore", "backbone"], function (_, Backbone) {
    var IndexBodyModel = Backbone.Model.extend({
        defaults:{
            importHeader:"Import Application",
            readMeHeader:"Description:",
            advancedOptionsHeader:"Advanced Options",
            conflictResolutionLabel:"Conflict Resolution",
            overwriteLabel:"Overwrite",
            skipLabel:"Skip",
            newLabel:"New",
            importAsNewLabel:"Import As New Suffix",
            contactEnabled:false,
            contactText:"Contact",
            infoBulletPoints: [
                {msg: "You need to have Catalog Admin and Application Architect roles to use import the blueprint into your instance of Application Director"},
                {msg: "Your Application Director instance needs to be network accessible for the import utility to work"},
                {msg: "If you do not have an instance of Application Director, contact us at app-mgmt-partner-support@vmware.com"}
            ]
        }
    });

    return IndexBodyModel;
});
