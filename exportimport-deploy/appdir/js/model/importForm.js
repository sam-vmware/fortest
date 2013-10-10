/**
 * Model backing for view/importForm.hbs template
 * @author samueldoyle
 */
define(["underscore", "backbone"], function (_, Backbone) {
    var ImportFormModel = Backbone.Model.extend({
        defaults:{
            hostLabel:"Application Director Host:",
            hostValue:"http://localhost:8080",
            userLabel:"Application Director Username:",
            userValue:"admin",
            passwordLabel:"Application Director Password:",
            passwordValue:"somerandompassword",
            importFileLabel:"File:",
            progressBarText:"Importing...",
            importButtonText:"Import",
            viewFileButtonText:"View File",
            buttonLoadingText:"loading...",
            importEP:"/darwin/api/service/action/importexport"
        }
    });

    return ImportFormModel;
});
