/**
 * Model backing for view/importForm.hbs template
 * @author samueldoyle
 */
define(["underscore", "backbone"], function (_, Backbone) {
    var ImportForm = Backbone.Model.extend({
        defaults:{
            appDirHostLabel:"Application Director Host:",
            appDirHostValue:"http://localhost:8080",
            appDirUserNameLabel:"Application Director Username:",
            appDirUserNameValue:"admin",
            appDirUserPasswordLabel:"Application Director Password:",
            appDirUserPasswordValue:"somerandompassword",
            appDirImportFileLabel:"File:",
            appDirProgressBarText:"Importing...",
            appDirImportButtonText:"Loading...",
            rIFrameLocation:"http://samsapp.org/AppDirExternalmport/appdir/docs/retrievalDelegate.html",
            importEP:"/darwin/api/service/action/importexport"
        }
    });
    return ImportForm;
});
