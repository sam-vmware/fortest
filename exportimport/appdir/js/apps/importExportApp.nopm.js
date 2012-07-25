/**
 * Main requirejs app module for driving import
 * @author samueldoyle
 */

define(["jquery", "underscore", "backbone", "util/appDirCommon", "workers/dataFetcher", "workers/dataPoster", "model/gitHubFileCollection"],
    function ($, _, Backbone, cu, dataGetter, dataPoster, GitHubFileCollection) {

        function ImportExportApp() {
            this.myData = {
                targetFile:$.url().param("targetFile"),
                targetFileFoundIndex:-1,
                targetFileMeta:null
            };
            if (_.isUndefined(this.myData.targetFile)) {
                updateFormDisplay({
                    rdcClass:ALERT_ERROR_CLASSES,
                    rdMsgVal:"ImportExportApp Missing 'targetFile' query param, can't continue."
                });
                return;
            }
            cu.log("cImportExportApp Target file to lookup: " + this.myData.targetFile);

            this.loadData();
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
                new GitHubFileCollection({userName:this.myData.repo.aname, repoName:this.myData.repo.repo});

            // Fetch the tree collection from GitHub
            var that = this;
            this.myData.gitHubFileCollection.fetch({
                success:function (collection, response) {
                    cu.log("%cImportExportApp received tree data: ", "color:yellow; background-color:blue");
                    _.each(collection.models, function (model, index) {
                        cu.log("tree entry: " + JSON.stringify(model));
                        if (_.isEqual(model.get("path"), that.myData.targetFile)) {
                            // Save index in collection where the target is located
                            that.myData.targetFileFoundIndex = index;
                        }
                    });
                    cu.log("ImportExportApp Found target file in collection at index: " + that.myData.targetFileFoundIndex);
                    // If the server data doesn't contain a match for the targetFile we can't continue
                    if (that.myData.targetFileFoundIndex == -1) {
                        updateFormDisplay({
                            rdcClass:ALERT_ERROR_CLASSES,
                            rdMsgVal:"ImportExportApp server did not contain targetFile: " + that.myData.targetFile
                        });
                        return;
                    }
                    that.myData.targetFileMeta = collection.at(that.myData.targetFileFoundIndex);
                    that.bindImportForm();
                },
                error:function (collection, response) {
                    cu.log("%cImportExportApp failed to get tree: " + response, "color:red; background-color:blue");
                    updateFormDisplay({
                        rdcClass:ALERT_ERROR_CLASSES,
                        rdMsgVal:"Failed to get tree data from GitHub. " + response
                    });
                }
            });
        }

        ImportExportApp.prototype.loadData = function () {
            var that = this;
            var dataId, dataValue;
            $("#eximData > span[type='data']").each(function (index) {
                dataId = $(this).attr("id");
                dataValue = $(this).data("value");
                console.log("dataId: " + dataId + " dataValue: " + dataValue);
                that.myData[dataId] = dataValue;
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
                }).fail(function (jqXHR, textStatus, errorThrown) {
                    cu.log("%cImportExportApp post to app dir returned status: " + jqXHR.status, "color:red; background-color:blue");
                    updateFormDisplay({
                        rdcClass:ALERT_ERROR_CLASSES,
                        rdMsgVal:"An error occurred during import. " + errorThrown
                    });
                });
        };

        // should be using backbone, angular, handlebars or some other view specific for doing this stuff
        function updateFormDisplay(options) {
            // TODO validation
            $("#responseDataControl").removeClass("hidden");
            $("#responseDataControl").removeAttr("class").addClass(options.rdcClass);
            var msg;

            // Ideally this type of stuff should be done with a template
            // If application grows add Backbone MVC + Handlebars for Template
            if (_.isEqual(options.rdcClass, ALERT_SUCCESS_CLASSES)) {
                msg = "<h4>Success</h4>" + options.rdMsgVal;
            } else if (_.isEqual(options.rdcClass, ALERT_ERROR_CLASSES)) {
                msg = "<h4>Error</h4>" + options.rdMsgVal;
            }
            $("#responseData").empty().html(msg);
        }

        ImportExportApp.prototype.startImport = function () {
            $("#responseDataControl").addClass("hidden"); // hide the response in case it is open from prev request
//            var url = _.template("https://api.github.com/repos/<%= aname %>/<%= repo %>/git/blobs/<%= sha %>")(this.myData.repo);
            var url = this.myData.targetFileMeta.get("theURL");
            var that = this;
            $.when(dataGetter({
                url:url,
                beforeSend:function (xhr) {
                    xhr.setRequestHeader("Accept", "application/vnd.github.raw");
                }
            })).done(function (data, textStatus, jqXHR) {
                    that.eventsHandler.trigger("updateProgressBar", {value:"50%"});
                    cu.log("%cImportExportApp sending import data to app dir, user: "
                        + that.myData.postParams.uname + " app dir host: " + that.myData.postParams.appdhost, "color:yellow; background-color:blue");
                    that.importData(data);
                }).fail(function (jqXHR, textStatus, errorThrown) {
                    cu.log("Failed: getting data from GH");
                    updateFormDisplay({
                        rdcClass:ALERT_ERROR_CLASSES,
                        rdMsgVal:"An error occurred during import. " + JSON.stringify({
                            code:jqXHR.status,
                            textStatus:textStatus,
                            errorThrow:errorThrown
                        })
                    });
                })
        };

        ImportExportApp.prototype.bindImportForm = function () {
            $("#appDirImportButton").addClass("btn-primary").removeAttr("disabled").text("Import");
            var fName = this.myData.targetFileMeta.get("path");
            $("#bpExportFN").attr("placeholder", fName);
            $("h1").empty().text("Import " + fName.split("\.")[0]);
            $("#importForm").validate({
                submitHandler:_.bind(function (form, e) {
                    e.preventDefault();
                    var uname = $("#appDirUserName").val();
                    var password = $("#appDirPassword").val();
                    var bytes =
                        Crypto.charenc.Binary.stringToBytes(uname + ":" + password);
                    var authToken = Crypto.util.bytesToBase64(bytes);
                    this.myData.postParams = {
                        uname:uname,
                        password:password,
                        appdhost:$("#appDirHost").val(),
                        appdeximep:this.myData.eximep,
                        beforeSend:function (xhr) {
                            xhr.setRequestHeader("Authorization", "Basic " + authToken);
                        },
                        xhrFields:{
                            withCredentials:true
                        }
                    };
                    this.eventsHandler.trigger("updateProgressBar", {value:"0%"});
                    cu.log("ImportExportApp form submitted");
                    this.startImport();
                }, this)
            });
            return this;
        };

        return ImportExportApp;
    }
);
