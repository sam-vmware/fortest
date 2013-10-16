/**
 * Main requirejs app module for driving import
 * This version of the application resides entirely in GitHub and doesn't use HTML5 postmessage.
 * Data retrieved is still sent to AppDirector via CORS
 * @author samueldoyle
 */
define(function (require) {
            var $ = require("jquery"),
            _ = require("underscore"),
            GitHubFileCollection = require("model/gitHubFileCollection"),
            cp = require("model/commonProperties"),
            errors = require("model/errorMappings"),
            cu = require("util/appDirCommon"),
            uiUtils = require("util/uiUtils"),
            VMwareJSONModel = require("model/vmWareJSON"),
            ImportFormModel = require("model/importForm"),
            GHViewDataModal = require("view/ghViewDataModal"),
            ProgressBarView = require("view/progressBar"),
            compiledImportFormTmpl = require("hbs!template/importForm"),
            compiledWrongBrowser = require("hbs!template/unsupportedBrowser"),
            compiledPopupBlocked = require("hbs!template/popupBlocked"),
            compiledNextSteps = require("hbs!template/nextSteps"),
            marked = require("thirdparty/marked"),
            dataPoster = require("workers/dataPoster");
            jqPurl = require("jqPlugins/jquery.url");

        marked.setOptions({
            gfm: true,
            pedantic: false,
            sanitize: true
        });

        var activityValues = {el: "document", segments: 12, width: 5.5, space: 6, length: 13, color: '#252525', outside: false, speed: 1.5},
            importFormModel = new ImportFormModel();

        // First thing browser check
        if (!cp.get("page-index").hasClass("chrome-gte20") && !cp.get("page-index").hasClass("ff-gte15")) {
            // Yes this could be modeled as collection/model
            var browserInfo = {
                "info": "The latest version of Chrome or Firefox is required to work with this page.",
                "supportedBrowsers": [
                    {"name": "Google Chrome", "version": "20.0", "link": "http://www.google.com/chrome", "img": "../images/chrome_logo_2x.png"},
                    {"name": "Firefox", "version": "15.0", "link": "http://www.mozilla.org/en-US/firefox", "img": "../images/ff-usage-standard.png"}
                ]
            };
            var context = {
                headerText: "Unsupported Browser",
                bodyText: compiledWrongBrowser(browserInfo)
            };
            uiUtils.noticeModal(context);
            return undefined;
        }

        function ImportExportApp() {
            this.queryParams = jqPurl().param();
            this.vmwareJSONFile = undefined;
            this.targetFileMeta = undefined;
            this.readMeFile = undefined;
            this.errorReadMeFile = undefined;
            this.nextsStepFile = undefined;
            this.progressBarEL = undefined;
            this.progressBar = undefined;
            this.importButtonEL = "#viewImportFileButton";
            this.viewDataModal = undefined;
            this.gitHubFileCollection = undefined;
            this.postParams = undefined;

            _.bindAll(this);
        }

        ImportExportApp.prototype.postConstruct = function () {
            // This was made invalid with the appd index.html provided. TODO move the index.html into template.
            var content = compiledImportFormTmpl(importFormModel.toJSON());
            cp.get("importFormWrapper").html(content);

            this.queryParams = $.url().param();
            this.progressBarEL = "#progressGroup";
            this.progressBar = new ProgressBarView({el: this.progressBarEL});
            this.eximep = cp.get("APPD_SE");

            // Check for anything missing that is required on the URL that redirected to our page
            var missingValues = [];
            if (_.isUndefined(this.queryParams.uname)) missingValues.push("uname");
            if (_.isUndefined(this.queryParams.repo)) missingValues.push("repo");
            if (_.isUndefined(this.queryParams.branch)) missingValues.push("branch");

            if (missingValues.length > 0) {
                var missingValuesString = missingValues.join(", ");
                uiUtils.updateFormDisplay({
                    rdcClass: ALERT_ERROR_CLASSES,
                    rdMsgVal: "Missing <b>[" + missingValuesString + "]</b> required parameter(s) to continue. " + errors.get("ERRORS").import

            });
                return;
            }

            $("input:radio[name=importOptionsRadio]").on("click", function (e) {
                if ($(this).attr("id") == "importNew") {
                    cp.get("importAsNewSuffix").removeAttr("disabled");
                } else {
                    cp.get("importAsNewSuffix").attr("disabled", true);
                }
            });

            // Move this out when we get a page that doesn't have all the extjs stuff in it
            cp.get("advancedOptionsWrap").on("hide",function () {
                cp.get("advancedOptionsChevron").removeClass("icon-chevron-down").addClass("icon-chevron-right");
            }).on("show", function () {
                    cp.get("advancedOptionsChevron").removeClass("icon-chevron-right").addClass("icon-chevron-down");
                });

            var spinner;
            $(document).ajaxStart(function () {
                spinner = new Spinner().spin(cp.get("center")[0]);
            }).ajaxStop(function () {
                    spinner.stop();
                });

            /*  var $target = $(".content");
             $target.css("height", $(window).height());
             $target.css("width", $(window).width());
             $(window).resize(function () {
             $target.css("height", $(window).height());
             $target.css("width", $(window).width());
             });*/

            this.initData();
            this.gaugesTrack('50b3b654613f5d6634000009');
        };

        // Initialize data values required for app, includes fetching what is needed from GH
        ImportExportApp.prototype.initData = function () {
            try {
                this.gitHubFileCollection =
                    new GitHubFileCollection({
                        userName: this.queryParams.uname,
                        repoName: this.queryParams.repo,
                        sha: this.queryParams.branch
                    });
            } catch (e) {
                uiUtils.updateFormDisplay({
                    rdcClass: ALERT_ERROR_CLASSES,
                    rdMsgVal: errors.get("ERRORS").import
//                    rdMsgVal: e
                });
                return false;
            }

            // Fetch the tree collection from GitHub
            cu.log("Fetching GH repo base dir. file meta-data");
            this.gitHubFileCollection.fetch({
                parse: false,
                success: this.ghCollectionSuccessHandler,
                error: function (collection, response) {
                    var msg = "Failed to get data from GitHub repository. " + response.statusText
                    if (response.status === 404) {
                        msg = 'The repository or branch was not found on github. Please check the url parameters!'
                    }
                    cu.log("%cImportExportApp failed to get tree: " + response, "color:red; background-color:blue");
                    uiUtils.updateFormDisplay({
                        rdcClass: ALERT_ERROR_CLASSES,
                        rdMsgVal: errors.get("ERRORS").import
//                        rdMsgVal: msg
                    });
                }
            });
        };

        // Post this data to app dir, done once we have the data
        ImportExportApp.prototype.importData = function (postData) {
            /* this.displayNextSteps("http://foo");
             return;*/
            var missingValuesString = ''
            if (this.postParams.appdhost === undefined || this.postParams.appdhost == '') {
                missingValuesString = 'Host Url';
            }

            /* if (this.postParams.uname === undefined || this.postParams.uname == '') {
             missingValuesString = 'username';
             }

             if (this.postParams.password === undefined || this.postParams.password == '') {
             missingValuesString = 'password';
             }*/

            if (missingValuesString != '') {
                uiUtils.updateFormDisplay({
                    rdcClass: ALERT_ERROR_CLASSES,
                    rdMsgVal: "Please enter a valid " + missingValuesString + " to continue!"
                });
                return;
            }

            var paramObject = {
                conflictResolution: this.postParams.conflictResolution,
                importAsNewSuffix: !_.isUndefined(this.postParams.importAsNewSuffix) ? this.postParams.importAsNewSuffix
                    : "NOOP"
            }, url = [ this.postParams.appdhost, this.postParams.appdeximep, "?", $.param(paramObject) ].join("");

            var importSuccessHandler = function (data, textStatus, jqXHR) {

                var msgClass = ALERT_SUCCESS_CLASSES, msgVal = "", errored = false;

                if (!_.isBoolean(data.success) || data.success == false) {
                    msgClass = ALERT_ERROR_CLASSES;
                    msgVal = "Application Director could not import the application. Please review the Application Director server logs.";
                    errored = true;
/*                    if (!_.isUndefined(this.errorReadMeFile)) {
                        this.displayErrorReadme();
                    } else {
                        cp.get("error-readme-content").hide();
                    }*/
                    cp.get("error-readme-content").hide();
                    this.gaugesTrack('50b3c1fbf5a1f548a9000010');
                } else {
                    this.progressBar.update({
                        value: "100%",
                        text: "Complete!"
                    });
                    this.gaugesTrack('50b3c1ebf5a1f548a900000f');
                }
                uiUtils.updateFormDisplay({
                    rdcClass: msgClass,
                    rdMsgVal: errors.get("ERRORS").import
//                    rdMsgVal: msgVal
                });
                if (errored) {
                    return;
                }


                // this code should work with the 5.0 version of the backend
                // too.Put in checks using just the id and app name, instead of
                // count.
                // depending on whether application or only service(s)/task(s)
                // were imported, change the message and url
                var artifactType = '';
                var baseURL = this.postParams.appdhost + "/darwin/#";
                var encodedSegment = '';

                //first check if there is an applicationId, to be compatible with the previous code in titan release
                if (data.applicationId > 0 || data.applicationsCount > 0) {
                    artifactType = data.applicationsCount > 1 ? data.applicationsCount + ' Applications' : '1 Application';
                    encodedSegment = cu.strToBase64("false:applicationOverviewPage:" + data.applicationId);
                } else if (data.servicesCount > 0) {
                    artifactType = data.servicesCount > 1 ? data.servicesCount + ' Services' : '1 Service';
                    encodedSegment = cu.strToBase64('false:serviceVersionOverviewPage:' + data.serviceId + ':overviewMode=view');
                } else if (data.scriptTasksCount > 0) {
                    artifactType = data.scriptTasksCount > 1 ? data.scriptTasksCount + ' Script Tasks' : '1 Script Task';
                    encodedSegment = cu.strToBase64('false:taskVersionOverviewPage:' + data.scriptTaskId + ':overviewMode=view');
                } else {
                    //cannot determine which one of app/service or script task was imported
                    //show the application landing url in that case
                    artifactType = '';
                    encodedSegment = cu.strToBase64('false:applicationLanding');
                }

                var base64URL = baseURL + encodedSegment;
                this.displayNextSteps(artifactType, base64URL);
            };

            cu.log("Sending to... " + url);
            $.when(dataPoster({
                    url: url,
                    data: postData,
                    contentType: "application/xml",
                    dataType: "json",
                    beforeSend: this.postParams.beforeSend,
                    xhrFields: this.postParams.xhrFields,
                    error: function (xhr, desc, err) {
                        cu.log(xhr);
                        cu.log("Desc: " + desc + "\nErr:" + err);
                    }
                })).done(_.bind(importSuccessHandler, this)).
                fail(function (jqXHR, textStatus, errorThrown) {
                    cu.log("%cImportExportApp post to app dir returned status: " + jqXHR.status, "color:red; background-color:blue");
//                    var msg = "An error occurred during import. " + errorThrown;
                    var msg = errors.get("ERRORS").import;

                    if (errorThrown === 'Unauthorized' || jqXHR.status === 401) {
//                        msg = 'Login credentials are incorrect. Please check the username and password!'
                        msg = errors.get("ERRORS").authenticate;
                    }

                    if (errorThrown == 'timeout') {
//                        msg = 'Connection to the Application Director server timed out. Please check connection parameters!';
                        msg = errors.get("ERRORS").connect;

                    }
                    uiUtils.updateFormDisplay({
                        rdcClass: ALERT_ERROR_CLASSES,
                        rdMsgVal: msg
                    });
                    /*if (!_.isUndefined(this.errorReadMeFile)) {
                        this.displayErrorReadme();
                    } else {
                        cp.get("error-readme-content").hide();
                    }*/
                    cp.get("error-readme-content").hide();
                });
        };

        ImportExportApp.prototype.gaugesTrack = function (trackingId) {
            var t = document.createElement('script');
            t.type = 'text/javascript';
            t.async = true;
            t.id = 'gauges-tracker';
            t.setAttribute('data-site-id', trackingId);
            t.src = 'https://secure.gaug.es/track.js';
            var s = document.getElementsByTagName('script')[0];
            s.parentNode.insertBefore(t, s);
        };
        /* We only have meta data in the collection getting all the file data potentially could take a lot of time
         * this can be used in a lazy init manner to get the raw full data for a file from GH
         * each property can be overridden in the options success,error etc. the defaults are as you see.
         */
        ImportExportApp.prototype.getGHFileRawData = function (model, options) {
            cp.get("responseDataControl").addClass("hidden"); // hide the response in case it is open from prev request

            var requestOpts = _.extend({}, {
                reset: false, // if this model has retrieved its data already skip
                success: function (model, response, jqXHR) {
                    cu.log("!! Empty success callback encountered !!");
                },
                error: function (model, error, jqXHR) {
                    cu.log("Failed: getting data from GH");
                    uiUtils.updateFormDisplay({
                        rdcClass: ALERT_ERROR_CLASSES,
                        rdMsgVal: "Failed to get data from GitHub. " + JSON.stringify({
                            name: model.get("path"),
                            code: jqXHR.status,
                            error: error
                        }) + " " + errors.get("ERRORS").import

                });

                }
            }, options);

            // another bind before fetch
            requestOpts.success = _.bind(requestOpts.success, this);

            // Fetch the rawData for the file we want from GitHub
            model.fetch(requestOpts);
        };


        /* 1.) Process file data
         * TODO This was a basic callback at first should be factored out in a separate module for
         * specifically dealing with GH file data and also clean up the nested async callbacks providing functions
         * instead of inline. See if GH API provides bulk get from tree atm 3 files (2 depend on 1) are fetched
         * sequentially, should be able to get all in one shot.
         * I saw a promising lib for this would need to review further: https://github.com/fjakobs/async.js.
         * "this" is assumed to be bound to the correct context
         */
        ImportExportApp.prototype.ghCollectionSuccessHandler = function (collection, response) {
            cu.log("%cImportExportApp received tree data: ", "color:yellow; background-color:blue");

            // First need to locate the vmware.json configuration file.
            var jsonFileID = cp.get("VMW_JSON"),
                jsonMetaFile = collection.get(jsonFileID);

            if (_.isUndefined(jsonMetaFile)) {
                uiUtils.updateFormDisplay({
                    rdcClass: ALERT_ERROR_CLASSES,
                    rdMsgVal: "Unable to locate the required json configuration file: " + jsonFileID + " " + errors.get("ERRORS").import
            });
                return;
            }

            // Process the vmware.json file
            this.getGHFileRawData(jsonMetaFile, {
                success: function (model, response, jqXHR) {
                    try {
                        var vmwareJSONFile = new VMwareJSONModel({rawJSON: model.get("rawData")});
                        this.targetFileMeta = collection.get(vmwareJSONFile.get("exportFileName"));
                        this.readMeFile = collection.get(vmwareJSONFile.get("exportedFileReadme"));
                        if (_.isUndefined(this.targetFileMeta)) throw new Error("Export File: " + vmwareJSONFile.get("exportFileName")) + " missing";
                        if (_.isUndefined(this.readMeFile)) throw new Error("Export Readme File: " + vmwareJSONFile.get("exportFileReadme")) + " missing";

                        var optional = vmwareJSONFile.get("optional");
/*                        if (!optional || !optional.exportedFileErrorReadme) {
                            cu.log("No error readme file was entered in configuration.");
                        } else if (optional.exportedFileErrorReadme) {
                            this.errorReadMeFile = collection.get(optional.exportedFileErrorReadme);
                            if (_.isUndefined(this.errorReadMeFile)) throw new Error("Missing Error-Readme File: " + vmwareJSONFile.get("exportedFileErrorReadme"));
                        }*/

                        this.importSectionHeader = vmwareJSONFile.get("importSectionHeader");
                        this.vmwareJSONFile = vmwareJSONFile;

                        // Check for optional enableConsoleLogging field and set TESTING to true if set for logging.
                        var optional = this.vmwareJSONFile.get("optional");
                        if (optional && optional.enableConsoleLogging == true) {
                            TESTING = true;
                            cu.log("Logging output to console");
                        }

                        this.displayReadme();
                    } catch (e) {
                        uiUtils.updateFormDisplay({
                            rdcClass: ALERT_ERROR_CLASSES,
                            rdMsgVal: errors.get("ERRORS").import
//                            rdMsgVal: e
                        });
                        return false;
                    }
                }
            });
        };

        // Fetches the readme data file and displays it in the textarea, after so enables input fields
        ImportExportApp.prototype.displayReadme = function () {
            this.getGHFileRawData(this.readMeFile, {
                success: function (model, response, jqXHR) {
                    cp.get("readme-content").empty().append(_.escape(response)); // insert our data into the modal
                    this.allowInput();
                }
            });
        };

        // Fetches the error readme data file and displays it in case of error importing
        ImportExportApp.prototype.displayErrorReadme = function () {
            if (!_.isUndefined(this.errorReadMeFile)) {
                this.getGHFileRawData(this.errorReadMeFile, {reset: true,
                    success: function (model, response, jqXHR) {
                        cp.get("error-readme-content").empty().append(_.escape(response)); // insert our data into the modal
                        this.allowInput();
                    }
                });
            }
        };

        // If the nextsteps file exists display it
        ImportExportApp.prototype.displayNextSteps = function (artifactType, importedBPURL) {

            function displayNSFrame(contentParams) {
                // Content params: always importLink and optional nextStepsContent
                // Need to display in embedded iframe since the styles.css from appd clobber many markdown styles
                // adding to iframe gives us a way to easily reset.
                var content = compiledNextSteps(contentParams),
                    contentLink = cu.getLinkForData(content, "text/html"),
                    $contentWrapper = cp.get("contentWrapper"),
                    width = $contentWrapper.css("width"),
                    height = $contentWrapper.css("height");

                cu.log("content: " + content);
                cu.log("contentLink: " + contentLink);


                $contentWrapper.empty();
                uiUtils.displayIframe(
                    { id: "contentWrapper",
                        src: contentLink,
                        cssObj: { width: width, height: height, padding: "10px" }
                    }
                );
                // Disable the import button
                cp.get("importButton").addClass("x-item-disabled").find("button").attr("disabled", "disabled");
            }

            // Get the optional section, markdown nextsteps file is optional
            var optional = this.vmwareJSONFile.get("optional"),
                contentParams = {artifactType: artifactType, importLink: importedBPURL}, // will always present imported bp url
                haveNSFile = true;

            if (!optional || !optional.nextStepsMarkdownFile) {
                cu.log("No nextSteps file was entered in configuration.");
                haveNSFile = false;
            } else if (optional.nextStepsMarkdownFile) {
                cu.log("nextSteps File: " + optional.nextStepsMarkdownFile);
                this.nextsStepFile = this.gitHubFileCollection.get(optional.nextStepsMarkdownFile);
                if (!this.nextsStepFile) {
                    cu.log("!! ERROR !! nextSteps file was entered in configuration but missing from repo");
                    haveNSFile = false;
                }
            }

            if (!haveNSFile) {
                displayNSFrame(contentParams);
                return;
            }

            // Fetch the markdown nextstep file from the repo
            this.getGHFileRawData(this.nextsStepFile, {
                success: function (model, response, jqXHR) {
                    // convert markeddown file to html to and add to our contentparams for display
                    contentParams.nextStepsContent = marked(model.get("rawData"));
                    displayNSFrame(contentParams);
                }
            });
        };

        ImportExportApp.prototype.allowInput = function () {
            // Construct the modal for viewing the importfile on the view file click
            // TODO clean this, the show modal no longer exists and all this is doing now is providing the download
            // on click functionality
            this.viewDataModal =
                new GHViewDataModal({model: this.targetFileMeta, clickTarget: this.importButtonEL, showModal: false});

            this.bindImportForm(); // ok to allow input on the form now that we have all our data
        };

        ImportExportApp.prototype.bindImportForm = function () {
            var fName = this.targetFileMeta.get("path"),
                header = !_.isUndefined(this.importSectionHeader) ? this.importSectionHeader : fName.split("\.")[0];

            cp.get("bpExportFN").attr("placeholder", fName);
            cp.get("importHeader").empty().text("Import " + header);
//            cp.get("importButton").on("click", _.bind(clickHandler, this));

            $("#importForm").validate({
                showErrors:function(errorMap, errorList) {

                    // Clean up any tooltips for valid elements
                    $.each(this.validElements(), function (index, element) {
                        $(element).data("title", "").css({"background-color": "white"}).tooltip("destroy");
                    });

                    // Create new tooltips for invalid elements
                    $.each(errorList, function (index, error) {
                        $(error.element).tooltip("destroy")
                            .data("title", error.message)
                            .css({"background-color": "red"})
                            .tooltip();
                    });
                },

                submitHandler: _.bind(function (form, e) {
                    e.preventDefault();

//                  var clickHandler = function () {
                    var uname = cp.get("appDirUserName").val() ? cp.get("appDirUserName").val() : cp.get("appDirUserName").attr("placeholder"),
                        password = cp.get("appDirPassword").val() ? cp.get("appDirPassword").val() : cp.get("appDirPassword").attr("placeholder"),
                        appdhost = cp.get("appDirHost").val() ? cp.get("appDirHost").val() : cp.get("appDirHost").attr("placeholder"),
                        bytes = Crypto.charenc.Binary.stringToBytes(uname + ":" + password),
                        authToken = Crypto.util.bytesToBase64(bytes),
                        conflictResolution = $(":checked", "#conflictResolutionStrategy").val(),
                        importAsNewSuffix = (conflictResolution == "IMPORTASNEW") ? (cp.get("importAsNewSuffix").val() ? cp.get("importAsNewSuffix").val() : cp.get("importAsNewSuffix").attr("placeholder")) : null;

                    appdhost = "http://"+appdhost+":8080";
                    // On import these are the params used to push our data to appdir
                    this.postParams = {
                        uname: uname,
                        password: password,
                        appdhost: appdhost,
                        appdeximep: this.eximep,
                        conflictResolution: conflictResolution,
                        beforeSend: function (xhr) {
//                        xhr.setRequestHeader("Authorization", "Basic " + authToken);
                        },
                        xhrFields: {
                            withCredentials: true // required for CORS check
                        }
                    };

                    if (importAsNewSuffix !== null) {
                        this.postParams.importAsNewSuffix = importAsNewSuffix;
                    }

                    this.progressBar.show().update({value: "0%", text: "Importing..."});
                    cu.log("ImportExportApp form submitted");
                    this.getGHFileRawData(this.targetFileMeta, {
                        reset: true,
                        success: function (model, response, jqXHR) {
                            this.progressBar.update({value: "50%"});
                            cu.log("%cImportExportApp sending import data to app dir, user: "
                                + this.postParams.uname + " app dir host: " + this.postParams.appdhost, "color:yellow; background-color:blue");
                            this.importData(model.get("rawData"));
                        }
                    });
//                  };
                }, this)
            });
        };

        return new ImportExportApp();
    }
)
;

