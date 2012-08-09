/**
 * Main requirejs app module for driving import
 * This version of the application resides entirely in GitHub and doesn't use HTML5 postmessage.
 * Data retrieved is still sent to AppDirector via CORS
 * @author samueldoyle
 */
define(["jquery", "underscore", "backbone", "util/appDirCommon", "workers/dataPoster", "model/gitHubFileCollection",
    "hb!template/viewFileModal.part.hbs", "hb!template/importForm.hbs", "model/importForm", "view/sideBar", "view/ghViewDataModal",
    "view/progressBar"],
    function ($, _, Backbone, cu, dataPoster, GitHubFileCollection, viewFileModal, compiledImportFormTmpl,
              ImportFormModel, SideBarView, GHViewDataModal, ProgressBarView) {

        var activityValues = {el:"document",segments: 12, width: 5.5, space: 6, length: 13, color: '#252525', outside:false, speed: 1.5};
        // Constructor, with requirejs this should not do anything dom dependant call init to do so use this
        // to define some attributes
        function ImportExportApp() {
            // attributes
            this.queryParams = $.url().param();
            /*queryParams:{
                uname:undefined, //mandatory name of the github user that owns the repo
                repo:undefined, //mandatory the name of the repository where the exported services are stored
                targetFile:undefined, //mandatory the name of the exported service file that is stored in the repo.
                descr:undefined //optional Will be set on the header so Import + this value if set
            },*/
            this.targetFileMeta = undefined;
            this.readMeFile = undefined;
            this.importFormModel = undefined;
            this.progressBarEL = undefined;
            this.progressBar = undefined;
            this.sideBarEL = undefined;
            this.sidebar = undefined;
            this.importButtonEL = undefined;
            this.viewDataModal = undefined;
            this.gitHubFileCollection = undefined;
            this.postParams = undefined;
        }

        ImportExportApp.prototype.postConstruct = function() {
            this.importFormModel = new ImportFormModel(); // some standard values for handlebar templates+partials

            // Compile and insert template, do this first in case something depends on DOM entry later.
            var content = compiledImportFormTmpl(this.importFormModel.toJSON());
            $("#importFormWrapper").html(content);

           // Any loading buttons make sure they are loading
            $("button[data-loading-text]").each(function () {
                $(this).button("loading");
            });
            this.queryParams = $.url().param();
            this.progressBarEL = "#progressGroup";
            this.progressBar = new ProgressBarView({el:this.progressBarEL});
            this.sideBarEL = "#sidebar";
            this.importButtonEL = "#viewImportFileButton";
            this.eximep = "/darwin/api/service/action/importexport";

            // Check for anything missing that is required on the URL that redirected to our page
            var missingValues = [];
            if (_.isUndefined(this.queryParams.uname)) missingValues.push("uname");
            if (_.isUndefined(this.queryParams.repo)) missingValues.push("repo");
            if (_.isUndefined(this.queryParams.targetFile)) missingValues.push("targetFile");

            if (missingValues.length > 0) {
                var missingValuesString = missingValues.join(", ");
                updateFormDisplay({
                    rdcClass:ALERT_ERROR_CLASSES,
                    rdMsgVal:"ImportExportApp Missing <b>" + missingValuesString + "</b> query params can't continue."
                });
                return;
            }

            // Set the readme file, making assumpting the convention is the targetFile + .readme
            this.readMeFile = this.queryParams.targetFile + ".readme";
            cu.log("cImportExportApp Target file to lookup: " + this.queryParams.targetFile);

            var spinner;
            $(document).ajaxStart(function() {
                spinner = new Spinner().spin($("#center")[0]);
            }).ajaxStop(function(){
                spinner.stop();
            });

            this.initData();
        };

        // Initialize data values required for app, includes fetching what is needed from GH
        ImportExportApp.prototype.initData = function () {
            var that = this;
            var dataId, dataValue;
            $("#eximData > span[type='data']").each(function (index) {
                dataId = $(this).attr("id");
                dataValue = $(this).data("value");
                console.log("dataId: " + dataId + " dataValue: " + dataValue);
                that[dataId] = dataValue;
            });

            this.gitHubFileCollection =
                new GitHubFileCollection({userName:this.queryParams.uname, repoName:this.queryParams.repo});

            // Fetch the tree collection from GitHub
            this.gitHubFileCollection.fetch({
                parse:false,
                success:function (collection, response) {
                    cu.log("%cImportExportApp received tree data: ", "color:yellow; background-color:blue");

                    // Try to locate both the importfile and the corresponding readme file in the github results
                    var readMeFileName = that.queryParams.targetFile + ".readme";
                    _.each(collection.models, function (model, index) {
                        cu.log("tree entry: " + JSON.stringify(model));
                        switch(model.get("path")) {
                            case that.queryParams.targetFile:
                                that.targetFileMeta = model;
                                cu.log("found target file meta entry at index: " + index);
                                break;
                            case readMeFileName:
                                that.readMeFile = model;
                                cu.log("found target file readme at index: " + index);
                                break;
                        }
                    });
                    // If the server data doesn't contain a match for the targetFile we can't continue
                    if (_.isUndefined(that.targetFileMeta)) {
                        updateFormDisplay({
                            rdcClass:ALERT_ERROR_CLASSES,
                            rdMsgVal:"ImportExportApp server did not contain targetFile: " + that.queryParams.targetFile
                        });
                        return;
                    }
                    if (_.isUndefined(that.readMeFile)) {
                        cu.log("%cImportExportApp unable to locate readmefile: " + readMeFileName, "color:red; background-color:blue");
                    }
                     // Construct sidebar
                    this.sidebar = new SideBarView({el:that.sideBarEL, readMe:that.readMeFile});
                    // Construct the modal for viewing the importfile on the view file click
                    this.viewDataModal =
                        new GHViewDataModal({model:that.targetFileMeta, clickTarget:that.importButtonEL});


                    that.getImportFileRawData(that.readMeFile, {
                        beforeSend:function (xhr) {
                            xhr.setRequestHeader("Accept", "application/vnd.github.raw");
                        },
                        success:function (model, response, jqXHR) {
                            this.$("#readme-content").empty().append(_.escape(response)); // insert our data into the modal
                        },
                        error:function (model, error, jqXHR) {
                            alert("Unable to retrieve readme file data");
                        }
                    });

                    that.bindImportForm(); // ok to allow input on the form now that we have all our data
                },
                error:function (collection, response) {
                    cu.log("%cImportExportApp failed to get tree: " + response, "color:red; background-color:blue");
                    updateFormDisplay({
                        rdcClass:ALERT_ERROR_CLASSES,
                        rdMsgVal:"Failed to get tree data from GitHub. " + response
                    });
                }
            });

            return this;
        };

        // Post this data to app dir, done once we have the data
        ImportExportApp.prototype.importData = function (postData) {
            var that = this;
            $.when(dataPoster({
                url:this.postParams.appdhost + this.postParams.appdeximep,
                data:postData,
                contentType:"application/xml",
                dataType:"json",
                beforeSend:this.postParams.beforeSend,
                xhrFields:this.postParams.xhrFields
            })).done(function (data, textStatus, jqXHR) {
                var msgClass = ALERT_SUCCESS_CLASSES;
                var msgVal = "";
                if (!_.isBoolean(data.success) || data.success == false) {
                    msgClass = ALERT_ERROR_CLASSES;
                    msgVal = "Application Director reported non-success in importing the application. Please review the logs for result.";
                } else {
                    that.progressBar.update({value:"100%",text:"Complete!"});
                }
                updateFormDisplay({
                    rdcClass:msgClass,
                    rdMsgVal:msgVal
                });
//                var url = that.postParams.appdhost + "/darwin/#false:applicationOverviewPage:" + data.applicationId;
                var baseURL = that.postParams.appdhost + "/darwin/#";
                var encodedSegment = cu.strToBase64("false:applicationOverviewPage:" + data.applicationId);
                var base64URL = baseURL + encodedSegment;
                cu.log("ImportExportApp opening new application location: " + base64URL);
                window.open(base64URL);
            }).fail(function (jqXHR, textStatus, errorThrown) {
                cu.log("%cImportExportApp post to app dir returned status: " + jqXHR.status, "color:red; background-color:blue");
                updateFormDisplay({
                    rdcClass:ALERT_ERROR_CLASSES,
                    rdMsgVal:"An error occurred during import. " + errorThrown
                });
            });
        };

        // TODO convert to backbone view
        function updateFormDisplay(options) {
            // TODO validation
            var msg,clazz;

            // Small enough not to place in template
            if (_.isEqual(options.rdcClass, ALERT_SUCCESS_CLASSES)) {
                msg = "Success " + options.rdMsgVal;
                clazz = "success main-state-deploy-success"
            } else if (_.isEqual(options.rdcClass, ALERT_ERROR_CLASSES)) {
                msg = "Error " + options.rdMsgVal;
                clazz = "notification-bulb-error"
            }
            $("#responseDataControl").removeClass("hidden");
            $("#responseDataControl").removeAttr("class").addClass(clazz);
            $("#responseData").empty().html(msg);
        }

        // We only have meta data in the collection getting all the file data potentially could take a lot of time
        // this can be used in a lazy init manner to get the raw full data for a file from GH
        // each property can be overridden in the options success,error etc. the defaults are as you see.
        ImportExportApp.prototype.getImportFileRawData = function (model, options) {
            $("#responseDataControl").addClass("hidden"); // hide the response in case it is open from prev request
            var that = this;

            var requestOpts = _.extend({}, {
                reset:true,
                beforeSend:function (xhr) {
                    xhr.setRequestHeader("Accept", "application/vnd.github.raw");
                },
                success:function (model, response, jqXHR) {
                    that.progressBar.update({value:"50%"});
                    cu.log("%cImportExportApp sending import data to app dir, user: "
                        + that.postParams.uname + " app dir host: " + that.postParams.appdhost, "color:yellow; background-color:blue");
                    that.importData(model.get("rawData"));
                },
                error:function (model, error, jqXHR) {
                    cu.log("Failed: getting data from GH");
                    updateFormDisplay({
                        rdcClass:ALERT_ERROR_CLASSES,
                        rdMsgVal:"An error occurred during import. " + JSON.stringify({
                            name:model.get("path"),
                            code:jqXHR.status,
                            error:error
                        })
                    });
                }
            }, options);

            // Fetch the rawData for the file we want from GitHub
            model.fetch(requestOpts);
        };

        ImportExportApp.prototype.bindImportForm = function () {
            // Any loading buttons make sure they are complete
            $("*[data-loading-text]").each(function () {
                $(this).button("complete");
            });

            var fName = this.targetFileMeta.get("path");
            var header = !_.isUndefined(this.queryParams.descr) ? this.queryParams.descr : fName.split("\.")[0];
            $("#bpExportFN").attr("placeholder", fName);
            $("#importHeader").empty().text("Import " + header);

               $("#importButton").bind("click", _.bind(function () {
                    var uname = $("#appDirUserName").val();
                    var password = $("#appDirPassword").val();
                    var bytes =
                        Crypto.charenc.Binary.stringToBytes(uname + ":" + password);
                    var authToken = Crypto.util.bytesToBase64(bytes);

                    // On import these are the params used to push our data to appdir
                    this.postParams = {
                        uname:uname,
                        password:password,
                        appdhost:$("#appDirHost").val(),
                        appdeximep:this.eximep,
                        beforeSend:function (xhr) {
                            xhr.setRequestHeader("Authorization", "Basic " + authToken);
                        },
                        xhrFields:{
                            withCredentials:true // required for CORS check
                        }
                    };
                    this.progressBar.show().update({value:"0%",text:"Importing..."});
                    cu.log("ImportExportApp form submitted");
                    this.getImportFileRawData(this.targetFileMeta);
                }, this));
            return this;
        };

        return new ImportExportApp();
    }
);
