/**
 * Model backing for view/importForm.hbs template
 * @author samueldoyle
 */
define(["underscore", "backbone"], function (_, Backbone) {
    var ImportFormModel = Backbone.Model.extend({
        defaults:{
            conflictResolutionLabel: "Import Options (Conflict Resolution)",
            overwriteLabel: "Overwrite",
            overwriteTT: "Overwrite the repository contents with the package contents if there is a conflict between them.",
            skipLabel: "Skip",
            skipTT: "Skip importing the package contents if they conflict with the repository; reuse the repository contents.",
            newLabel: "New",
            newTT: "All package contents that conflict with the repository contents will be imported into the repository as new content, with a timestamp used to identify them.",
            importGroupLabel: "Group Name",
            importGroupTT: "The import group name to use.",
            importAsNewLabel: "Import As New Suffix",
            importAsNewTT: "Provide a suffix used for renaming entities which conflict.",
            importSuffixTT: "The suffix value to use.",
            sharedLabel: "Shared",
            sharedTT: "If specified the artifacts will be shared to public, otherwise by default they will be in private group.\nNOTE! Only applies to v6.0+",
            businessGroupLabel:"Group",
            importFileLabel:"File:",
            progressBarText:"Importing...",
            importButtonText:"Import",
            downloadButtonText:"Download File",
            fileLabel:"Application Import Repository Filename",
            authPromptText:"After selecting import, authentication credentials will be prompted for by your browser's native control.",
            buttonLoadingText:"loading...",
            importEP:"/darwin/api/service/action/importexport",
            businessGroupCollection:"undefined"
        }
    });

    return new ImportFormModel();
});
