/**
 * Main requirejs app module for driving import
 * This version of the application resides entirely in GitHub and doesn't use HTML5 postmessage.
 * Data retrieved is still sent to AppDirector via CORS
 * @author samueldoyle
 */
define(["jquery", "underscore", "backbone", "util/appDirCommon", "workers/dataPoster", "model/gitHubFileCollection",
    "hb!template/viewFileModal.part.hbs", "hb!template/importForm.hbs", "model/importForm", "view/sideBar", "view/ghViewDataModal"],
    function ($, _, Backbone, cu, dataPoster, GitHubFileCollection, viewFileModal, compiledImportFormTmpl,
              ImportFormModel, SideBarView, GHViewDataModal) {

        // Constructor
        function ImportExportApp() {
            // Any loading buttons make sure they are loading
            $("button[data-loading-text]").each(function () {
                $(this).button("loading");
            });

            this.myData = {
                queryParams:$.url().param(),
                /*queryParams:{
                    uname:undefined, //mandatory name of the github user that owns the repo
                    repo:undefined, //mandatory the name of the repository where the exported services are stored
                    targetFile:undefined, //mandatory the name of the exported service file that is stored in the repo.
                    descr:undefined //optional Will be set on the header so Import + this value if set
                },*/
                targetFileMeta:undefined, // instance of GitHubFile taken from collection that matches the import file we want
                readMeFile:undefined,
                importFormModel:new ImportFormModel() // some standard values for handlebar templates+partials
            };

            // Compile and insert template
            var content = compiledImportFormTmpl(this.myData.importFormModel.toJSON());
            $("#importFormWrapper").html(content);

            // Check for anything missing that is required on the URL that redirected to our page
            var missingValues = [];
            if (_.isUndefined(this.myData.queryParams.uname)) missingValues.push("uname");
            if (_.isUndefined(this.myData.queryParams.repo)) missingValues.push("repo");
            if (_.isUndefined(this.myData.queryParams.targetFile)) missingValues.push("targetFile");

            if (missingValues.length > 0) {
                var missingValuesString = missingValues.join(", ");
                updateFormDisplay({
                    rdcClass:ALERT_ERROR_CLASSES,
                    rdMsgVal:"ImportExportApp Missing <b>" + missingValuesString + "</b> query params can't continue."
                });
                return;
            }

            // Set the readme file, making assumpting the convention is the targetFile + .readme
            this.myData.readMeFile = this.myData.queryParams.targetFile + ".readme";
            cu.log("cImportExportApp Target file to lookup: " + this.myData.queryParams.targetFile);

            this.initData();
        }

        // Initialize data values required for app, includes fetching what is needed from GH
        ImportExportApp.prototype.initData = function () {
            var that = this;
            var dataId, dataValue;
            $("#eximData > span[type='data']").each(function (index) {
                dataId = $(this).attr("id");
                dataValue = $(this).data("value");
                console.log("dataId: " + dataId + " dataValue: " + dataValue);
                that.myData[dataId] = dataValue;
            });

            this.eventsHandler = {};
            _.extend(this.eventsHandler, Backbone.Events);
            this.eventsHandler.on("updateProgressBar", _.bind(function (data) {
                cu.log("Updating progress bar with value: " + data.value);
                switch (data.value) {
                    case "0%":
                        $("#progressWrapper").addClass("active"); // reset so make sure this is hidden
                        break;
                    case "100%":
                        $("#progressWrapper").removeClass("active"); // reset so make sure this is hidden
                        break;
                }
                $("#progressGroup").removeClass("hidden");
                $("#progressBadge").text(data.value);
                $("#progressBar").css("width", data.value);
            }, this));

            this.myData.gitHubFileCollection =
                new GitHubFileCollection({userName:this.myData.queryParams.uname, repoName:this.myData.queryParams.repo});

            // Fetch the tree collection from GitHub
            this.myData.gitHubFileCollection.fetch({
                parse:false,
                success:function (collection, response) {
                    cu.log("%cImportExportApp received tree data: ", "color:yellow; background-color:blue");

                    // Try to locate both the importfile and the corresponding readme file in the github results
                    var readMeFileName = that.myData.queryParams.targetFile + ".readme";
                    _.each(collection.models, function (model, index) {
                        cu.log("tree entry: " + JSON.stringify(model));
                        switch(model.get("path")) {
                            case that.myData.queryParams.targetFile:
                                that.myData.targetFileMeta = model;
                                cu.log("found target file meta entry at index: " + index);
                                break;
                            case readMeFileName:
                                that.myData.readMeFile = model;
                                cu.log("found target file readme at index: " + index);
                                break;
                        }
                    });
                    // If the server data doesn't contain a match for the targetFile we can't continue
                    if (_.isUndefined(that.myData.targetFileMeta)) {
                        updateFormDisplay({
                            rdcClass:ALERT_ERROR_CLASSES,
                            rdMsgVal:"ImportExportApp server did not contain targetFile: " + that.myData.queryParams.targetFile
                        });
                        return;
                    }
                    if (_.isUndefined(that.myData.readMeFile)) {
                        cu.log("%cImportExportApp unable to locate readmefile: " + readMeFileName, "color:red; background-color:blue");
                    }
                     // Construct sidebar
                    this.sidebar = new SideBarView({el:$("#sidebar"), readMe:that.myData.readMeFile});
                    // Construct the modal for viewing the importfile on the view file click
                    this.viewDataModal =
                        new GHViewDataModal({model:that.myData.targetFileMeta, clickTarget:"#viewImportFileButton"});
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
                url:this.myData.postParams.appdhost + this.myData.postParams.appdeximep,
                data:postData,
                contentType:"application/xml",
                dataType:"json",
                beforeSend:this.myData.postParams.beforeSend,
                xhrFields:this.myData.postParams.xhrFields
            })).done(function (data, textStatus, jqXHR) {
                var msgClass = ALERT_SUCCESS_CLASSES;
                var msgVal = "";
                if (!_.isBoolean(data.success) || data.success == false) {
                    msgClass = ALERT_ERROR_CLASSES;
                    msgVal = "Application Director reported non-success in importing the application. Please review the logs for result.";
                } else {
                    that.eventsHandler.trigger("updateProgressBar", {value:"100%"});
                }
                updateFormDisplay({
                    rdcClass:msgClass,
                    rdMsgVal:msgVal
                });
                var url = that.myData.postParams.appdhost + "/darwin/#applicationOverviewPage:" + data.applicationId;
                cu.log("ImportExportApp opening new application location: " + url);
                window.open(url);
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
            $("#responseDataControl").removeClass("hidden");
            $("#responseDataControl").removeAttr("class").addClass(options.rdcClass);
            var msg;

            // Small enough not to place in template
            if (_.isEqual(options.rdcClass, ALERT_SUCCESS_CLASSES)) {
                msg = "<h4>Success</h4>" + options.rdMsgVal;
            } else if (_.isEqual(options.rdcClass, ALERT_ERROR_CLASSES)) {
                msg = "<h4>Error</h4>" + options.rdMsgVal;
            }
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
                    that.eventsHandler.trigger("updateProgressBar", {value:"50%"});
                    cu.log("%cImportExportApp sending import data to app dir, user: "
                        + that.myData.postParams.uname + " app dir host: " + that.myData.postParams.appdhost, "color:yellow; background-color:blue");
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

            var fName = this.myData.targetFileMeta.get("path");
            var header = !_.isUndefined(this.myData.queryParams.descr) ? this.myData.queryParams.descr : fName.split("\.")[0];
            $("#bpExportFN").attr("placeholder", fName);
            $("#importHeader").empty().text("Import " + header);

            $("#importForm").validate({
                submitHandler:_.bind(function (form, e) {
                    e.preventDefault();
                    var uname = $("#appDirUserName").val();
                    var password = $("#appDirPassword").val();
                    var bytes =
                        Crypto.charenc.Binary.stringToBytes(uname + ":" + password);
                    var authToken = Crypto.util.bytesToBase64(bytes);

                    // On import these are the params used to push our data to appdir
                    this.myData.postParams = {
                        uname:uname,
                        password:password,
                        appdhost:$("#appDirHost").val(),
                        appdeximep:this.myData.eximep,
                        beforeSend:function (xhr) {
                            xhr.setRequestHeader("Authorization", "Basic " + authToken);
                        },
                        xhrFields:{
                            withCredentials:true // required for CORS check
                        }
                    };
                    this.eventsHandler.trigger("updateProgressBar", {value:"0%"});
                    cu.log("ImportExportApp form submitted");
                    this.getImportFileRawData(this.myData.targetFileMeta);
                }, this)
            });
            return this;
        };

        return ImportExportApp;
    }
);
