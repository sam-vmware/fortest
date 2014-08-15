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
            GHViewDataModal = require("view/ghViewDataModal"),
            ProgressBarView = require("view/progressBar"),
            compiledWrongBrowser = require("hbs!template/unsupportedBrowser"),
            compiledPopupBlocked = require("hbs!template/popupBlocked"),
            compiledNextSteps = require("hbs!template/nextSteps"),
            dataPoster = require("workers/dataPoster"),
            marked = require("marked"),
            Crypto = require("Crypto"),
            twitterjs = require("twitterjs"),
            Spinner = require("spin"),
            eventBus = require("util/appCommonEB"),
            ghFH = require("util/ghFileHandler"),
            SessionStore = require("model/sessionStorage");

        var ImportPage = Backbone.Model.extend({
            sessionStorage:undefined,
            defaultBPFile: undefined,
            nextsStepFile:undefined,

            defaults: {
                queryParams: $.url().param(),
                vmwareJSONFile: undefined,
                targetFileMeta: undefined,
                errorReadMeFile: undefined,
                progressBarEL: undefined,
                progressBar: undefined,
                importButtonEL: "#viewImportFileButton",
                viewDataModal: undefined,
                gitHubFileCollection: undefined,
                postParams: undefined,
                performReset: false
            },

            initialize: function () {
                marked.setOptions({
                    gfm: true,
                    pedantic: false,
                    sanitize: true
                });

                var activityValues = {el: "document", segments: 12, width: 5.5, space: 6, length: 13, color: '#252525', outside: false, speed: 1.5};

                // First thing browser check
                if (!cp.get("page-import").hasClass("chrome-gte20") && !cp.get("page-import").hasClass("ff-gte15")) {
                    // Yes this could be modeled as collection/model
                    var browserInfo = {
                        "info": "The latest version of Chrome or Firefox is required to work with this page.",
                        "supportedBrowsers": [
                            {"name": "Google Chrome", "version": "20.0", "link": "http://www.google.com/chrome", "img": "../additional_images/chromeLogo.png"},
                            {"name": "Firefox", "version": "15.0", "link": "http://www.mozilla.org/en-US/firefox", "img": "../additional_images/ffLogo.png"}
                        ]
                    };
                    var context = {
                        headerText: "Unsupported Browser",
                        bodyText: compiledWrongBrowser(browserInfo)
                    };
                    uiUtils.noticeModal(context);
                    return undefined;
                }

                // Retrieve localstorage from index/login page
                this.sessionStorage = new SessionStore({id: "DEFAULT"});
                this.sessionStorage.fetch();
                this.defaultBPFile = this.sessionStorage.get("exportFileName");

                _.bindAll(this, 'postConstruct', 'gaugesTrack', 'ghCollectionSuccessHandler', 'initData', 'allowInput',
                    'bindImportForm', 'importData', 'displayErrorReadme', 'displayNextSteps');
            },

            postConstruct: function () {
                this.set("queryParams", $.url().param());
                this.set("progressBarEL", "#progressGroup");
                this.set("progressBar", new ProgressBarView({el: this.attributes.progressBarEL}));
                this.set("eximep", cp.get("APPD_SE"));

                // Check for anything missing that is required on the URL that redirected to our page
                var missingValues = [];
                if (_.isUndefined(this.attributes.queryParams.uname)) missingValues.push("uname");
                if (_.isUndefined(this.attributes.queryParams.repo)) missingValues.push("repo");
                if (_.isUndefined(this.attributes.queryParams.branch)) missingValues.push("branch");

                if (missingValues.length > 0) {
                    var missingValuesString = missingValues.join(", ");
                    uiUtils.updateFormDisplay({
                        rdcClass: ALERT_ERROR_CLASSES,
                        rdMsgVal: "Missing <b>[" + missingValuesString + "]</b> required parameter(s) to continue. " + errors.get("ERRORS").import

                    });
                    return;
                }

                // Move this out when we get a page that doesn't have all the extjs stuff in it
                cp.get("advancedOptionsWrap").on("hide", function () {
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

                $(document).on('change', 'input:radio[name=importOptionsRadio]', function (e) {
                    if ($(this).attr("id") == "importNew") {
                        cp.get("importAsNewSuffix").removeAttr("disabled");
                    } else {
                        cp.get("importAsNewSuffix").attr("disabled", true);
                    }
                });


                this.initData();
                //this.gaugesTrack('50b3b654613f5d6634000009');
            },

            // Initialize data values required for app, includes fetching what is needed from GH
            initData: function () {
                try {
                    this.set("gitHubFileCollection",
                        new GitHubFileCollection({
                            userName: this.attributes.queryParams.uname,
                            repoName: this.attributes.queryParams.repo,
                            sha: this.attributes.queryParams.branch
                        }));
                } catch (e) {
                    cu.log("initData: exception: " + e);
                    uiUtils.updateFormDisplay({
                        rdcClass: ALERT_ERROR_CLASSES,
                        rdMsgVal: errors.get("ERRORS").import
                    });
                    return false;
                }

                // Fetch the tree collection from GitHub
                cu.log("Fetching GH repo base dir. file meta-data");
                this.attributes.gitHubFileCollection.fetch({
                    success: this.ghCollectionSuccessHandler,
                    error: function (collection, response) {
                        var msg = "Failed to get data from GitHub repository. " + response.statusText;
                        if (response.status === 404) {
                            msg = 'The repository or branch was not found on github. Please check the url parameters!'
                        }
                        cu.log("%cImportExportApp failed to get tree: " + response, "color:red; background-color:blue");
                        uiUtils.updateFormDisplay({
                            rdcClass: ALERT_ERROR_CLASSES,
                            rdMsgVal: errors.get("ERRORS").import
                        });
                    }
                });
            },

            // Post this data to app dir, done once we have the data
            importData: function (postData) {
                var that=this;
                var missingValuesString = '';
                if (this.attributes.postParams.appdhost === undefined || this.attributes.postParams.appdhost == '') {
                    missingValuesString = 'Host Url';
                }

                if (missingValuesString != '') {
                    uiUtils.updateFormDisplay({
                        rdcClass: ALERT_ERROR_CLASSES,
                        rdMsgVal: "Please enter a valid " + missingValuesString + " to continue!"
                    });
                    return;
                }

                var paramObject = {
                    conflictResolution: that.attributes.postParams.conflictResolution,
                    importAsNewSuffix: !_.isUndefined(that.attributes.postParams.importAsNewSuffix) ? that.attributes.postParams.importAsNewSuffix : null,
                    importGroup: !_.isUndefined(that.attributes.postParams.importGroup) ? that.attributes.postParams.importGroup : null,
                    shared: that.attributes.postParams.shared
                }, url = [ that.attributes.postParams.appdhost, that.attributes.postParams.appdeximep, "?", $.param(paramObject) ].join("");

                var importSuccessHandler = function (data, textStatus, jqXHR) {
                    var msgClass = ALERT_SUCCESS_CLASSES, msgVal = "", errored = false;
                    if (!_.isBoolean(data.success) || data.success == false) {
                        msgClass = ALERT_ERROR_CLASSES;
                        msgVal = errors.get("ERRORS").import;
                        errored = true;
                        cp.get("error-readme-content").hide();
                        //this.gaugesTrack('50b3c1fbf5a1f548a9000010');
                    } else {
                        that.attributes.progressBar.update({
                            value: "100%",
                            text: "Complete!"
                        });
                        //that.gaugesTrack('50b3c1ebf5a1f548a900000f');
                    }
                    uiUtils.updateFormDisplay({
                        rdcClass: msgClass,
                        rdMsgVal: msgVal
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
                    var baseURL = that.attributes.postParams.appdhost + "/darwin/#";
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
                    beforeSend: that.attributes.postParams.beforeSend,
                    xhrFields: that.attributes.postParams.xhrFields,
                    error: function (xhr, desc, err) {
                        cu.log(xhr);
                        cu.log("Desc: " + desc + "\nErr:" + err);
                    }
                })).done(_.bind(importSuccessHandler, this)).
                    fail(function (jqXHR, textStatus, errorThrown) {
                        cu.log("%cImportExportApp post to app dir returned status: " + jqXHR.status, "color:red; background-color:blue");
                        var msg = errors.get("ERRORS").import;

                        if (errorThrown === 'Unauthorized' || jqXHR.status === 401) {
                            msg = errors.get("ERRORS").authenticate;
                        }

                        if (errorThrown == 'timeout') {
                            msg = errors.get("ERRORS").connect;

                        }
                        uiUtils.updateFormDisplay({
                            rdcClass: ALERT_ERROR_CLASSES,
                            rdMsgVal: msg
                        });
                        cp.get("error-readme-content").hide();
                    });
            },

            gaugesTrack: function (trackingId) {
                return;
                var t = document.createElement('script');
                t.type = 'text/javascript';
                t.async = true;
                t.id = 'gauges-tracker';
                t.setAttribute('data-site-id', trackingId);
                t.src = 'https://secure.gaug.es/track.js';
                var s = document.getElementsByTagName('script')[0];
                s.parentNode.insertBefore(t, s);
            },

            /* 1.) Process file data
             * TODO This was a basic callback at first should be factored out in a separate module for
             * specifically dealing with GH file data and also clean up the nested async callbacks providing functions
             * instead of inline. See if GH API provides bulk get from tree atm 3 files (2 depend on 1) are fetched
             * sequentially, should be able to get all in one shot.
             * I saw a promising lib for this would need to review further: https://github.com/fjakobs/async.js.
             * "this" is assumed to be bound to the correct context
             */
            ghCollectionSuccessHandler: function (collection, response) {
                cu.log("%cImportExportApp received tree data: ", "color:yellow; background-color:blue");

                // First need to locate the vmware.json configuration file.
                var jsonFileID = cp.get("VMW_JSON"),
                    jsonMetaFile = collection.findWhere({path: jsonFileID});

                if (_.isUndefined(jsonMetaFile)) {
                    uiUtils.updateFormDisplay({
                        rdcClass: ALERT_ERROR_CLASSES,
                        rdMsgVal: "Unable to locate the required json configuration file: " + jsonFileID + " " + errors.get("ERRORS").import
                    });
                    return;
                }

                // Process the vmware.json file
                var that=this;
                ghFH.getGHFileRawData(jsonMetaFile, {
                    success: function (model, response, jqXHR) {
                        try {
                            var vmwareJSONFile = new VMwareJSONModel({rawJSON: model.get("rawData")});
                            //that.set("targetFileMeta", collection.get(vmwareJSONFile.get("exportFileName")));
                            that.set("targetFileMeta", collection.get(that.defaultBPFile));
                            if (_.isUndefined(that.attributes.targetFileMeta)) throw new Error("Export File: " + vmwareJSONFile.get("exportFileName")) + " missing";

                            var optional = vmwareJSONFile.get("optional");
                            that.set("importSectionHeader", vmwareJSONFile.get("importSectionHeader"));
                            that.set("vmwareJSONFile", vmwareJSONFile);

                            // Check for optional enableConsoleLogging field and set TESTING to true if set for logging.
                            var optional = that.attributes.vmwareJSONFile.get("optional");
                            if (optional && optional.enableConsoleLogging == true) {
                                TESTING = true;
                                cu.log("Logging output to console");
                            }
                        } catch (e) {
                            cu.log("getGHFileRawData: exception: " + e);
                            uiUtils.updateFormDisplay({
                                rdcClass: ALERT_ERROR_CLASSES,
                                rdMsgVal: errors.get("ERRORS").import
                            });
                            return false;
                        }

                        // set our host retrieved from localstorage set on login
                        /*                    var targetHost = that.theLocalStorge.get("targetHost");
                         cu.log("Setting host field from localstorage: " + targetHost);
                         cp.get("appDirHost").attr("placeholder", targetHost);*/

                        eventBus.triggerEvent(eventBus.getEvents().VMW_JSON_LOADED, that.attributes.vmwareJSONFile);
                    }
                });
            },

            // Fetches the error readme data file and displays it in case of error importing
            displayErrorReadme: function () {
                if (!_.isUndefined(this.attributes.errorReadMeFile)) {
                    ghFH.getGHFileRawData(this.attributes.errorReadMeFile, {reset: true,
                        success: function (model, response, jqXHR) {
                            cp.get("error-readme-content").empty().append(_.escape(response)); // insert our data into the modal
                        }
                    });
                }
            },

            // If the nextsteps file exists display it
            displayNextSteps: function (artifactType, importedBPURL) {

                function displayNSFrame(contentParams) {
                    // Content params: always importLink and optional nextStepsContent
                    // Need to display in embedded iframe since the styles.css from appd clobber many markdown styles
                    // adding to iframe gives us a way to easily reset.
                    var content = compiledNextSteps(contentParams),
                        contentArray = cu.getLinkForData(content, "text/html"),
                        $contentWrapper = $("#mainbody"),
                        width = $(window).width() + "px",
                        height = $(window).height() + "px";
                        //width = $contentWrapper.css("width"),
                        //height = $contentWrapper.css("height");

                    cu.log("content: " + content);
                    cu.log("contentLink: " + contentArray[0]);


                    $contentWrapper.empty();
                    uiUtils.displayIframe(
                        { id: "mainbody",
                            src: contentArray[0],
                            blob: contentArray[1],
                            originalContent: content,
                            cssObj: { width: width, height: height, padding: "10px" }
                        }
                    );
                    // Disable the import button
                    cp.get("importButton").addClass("x-item-disabled").find("button").attr("disabled", "disabled");
                }

                // Get the optional section, markdown nextsteps file is optional
                var optional = this.attributes.vmwareJSONFile.get("optional"),
                    contentParams = {artifactType: artifactType, importLink: importedBPURL}, // will always present imported bp url
                    haveNSFile = false;

                var optionalNSFile = undefined;
                // Check optional field first
                cu.log("Checking for optional nextSteps file ...");
                if (optional.nextStepsMarkdownFile) {
                    cu.log("Optional nextSteps File found: " + optional.nextStepsMarkdownFile);
                    optionalNSFile = this.attributes.gitHubFileCollection.get(optional.nextStepsMarkdownFile);
                    if (!optionalNSFile) {
                        cu.log("!! ERROR !! nextSteps file was entered in configuration but missing from repo: " + optional.nextStepsMarkdownFile);
                    } else {
                        this.nextsStepFile = optionalNSFile;
                        haveNSFile = true;
                    }
                } else {
                    cu.log("No optional nextSteps file found!");
                }

                // Check localstorage overrides default optional
                cu.log("Checking localstorage for nextSteps override file ...");
                var setNSFile = this.sessionStorage.get("nextsStepFile");
                if (setNSFile) {
                    cu.log("Storage nextsSteps file was set:" + setNSFile);
                    optionalNSFile = this.attributes.gitHubFileCollection.get(setNSFile);
                    if (!optionalNSFile) {
                        cu.log("!! ERROR !! nextSteps file was set on the model but missing from repo: " + setNSFile);
                    } else {
                        this.nextsStepFile = optionalNSFile;
                        haveNSFile = true;
                    }
                } else {
                    cu.log("No localstorage nextSteps file found!");
                }

                if (!haveNSFile) {
                    displayNSFrame(contentParams);
                    return;
                }

                // Fetch the markdown nextstep file from the repo
                ghFH.getGHFileRawData(this.nextsStepFile, {
                    success: function (model, response, jqXHR) {
                        // convert markeddown file to html to and add to our contentparams for display
                        contentParams.nextStepsContent = marked(model.get("rawData"));
                        displayNSFrame(contentParams);
                    }
                });
            },

            allowInput: function () {
                // Construct the modal for viewing the importfile on the view file click
                // TODO clean this, the show modal no longer exists and all this is doing now is providing the download
                // on click functionality
                this.set("viewDataModal",
                    new GHViewDataModal({model: this.attributes.targetFileMeta, clickTarget: this.attributes.importButtonEL, showModal: false}));

                this.bindImportForm(); // ok to allow input on the form now that we have all our data
            },

            bindImportForm: function () {
                var that=this;
                var fName = this.attributes.targetFileMeta.get("path"),
                    header = !_.isUndefined(this.attributes.importSectionHeader) ? this.attributes.importSectionHeader : fName.split("\.")[0];

                // Set the header
                cp.get("bpExportFN").attr("placeholder", fName);
                cp.get("importHeader").empty().text("Import " + header);

                $("#importForm").validate({
                    showErrors: function (errorMap, errorList) {

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

                    submitHandler: function (form, e) {
                        e.preventDefault();
                        var uname = cp.get("appDirUserName").val(),
                            password = cp.get("appDirPassword").val(),
                            //appdhost = cp.get("appDirHost").val(),
                            appdhost = that.sessionStorage.get("targetHost"),
                            appdVersion = that.sessionStorage.get("appdVersion"),
                            appdtenant = that.sessionStorage.get("tenantId"),
                            bytes = Crypto.charenc.Binary.stringToBytes(uname + ":" + password),
                            authToken = Crypto.util.bytesToBase64(bytes),
                            conflictResolution = $("input:radio[name=importOptionsRadio]:checked").val(),
                            importAsNewSuffix = (conflictResolution == "IMPORTASNEW") ? (cp.get("importAsNewSuffix").val() ? cp.get("importAsNewSuffix").val() : cp.get("importAsNewSuffix").attr("placeholder")) : null,
                            shared = cp.get("shared").is(":checked"),
                            importGroup = cp.get("appDirBusinessGroups").find(":selected").text();

                        appdhost = "https://" + appdhost + ":8443";

                        // Retrieve session store to get user+token
                        var bg = _.findWhere(that.sessionStorage.get("businessGroupCollection"), {name: importGroup});
                        var postParams = {
                            uname: uname,
                            password: password,
                            appdhost: appdhost,
                            appdeximep: that.attributes.eximep,
                            conflictResolution: conflictResolution,
                            shared: shared,
                            xhrFields: {
                                withCredentials: true // required for CORS check
                            }
                        };

                        if (parseFloat(appdVersion) >= 6.1) {
                            postParams = _.extend(postParams, {
                                appdtenant: appdtenant,
                                beforeSend: function (xhr) {
                                    xhr.setRequestHeader("darwin-security-token", bg.authToken);
                                    xhr.setRequestHeader("darwin-tenant-id", appdtenant);
                                }
                            });
                        }

                        // On import these are the params used to push our data to appdir
                        that.set("postParams", postParams);

                        if (importAsNewSuffix !== null) {
                            that.attributes.postParams.importAsNewSuffix = importAsNewSuffix;
                        }
                        if (importGroup !== null) {
                            that.attributes.postParams.importGroup = importGroup;
                        }

                        that.attributes.progressBar.show().update({value: "0%", text: "Importing..."});
                        cu.log("ImportExportApp form submitted");
                        var rawData = that.attributes.targetFileMeta.get("rawData");
                        if (_.isUndefined(rawData)) {
                            ghFH.getGHFileRawData(that.attributes.targetFileMeta, {
                                reset: false,
                                success: function (model, response, jqXHR) {
                                    that.attributes.progressBar.update({value: "50%"});
                                    cu.log("%cImportExportApp sending import data to app dir, user: "
                                    + that.attributes.postParams.uname + " app dir host: " + that.attributes.postParams.appdhost, "color:yellow; background-color:blue");
                                    that.importData(model.get("rawData"));
                                }
                            });
                        } else {
                            cp.get("responseDataControl").addClass("hidden"); // hide the response in case it is open from prev request
                            that.importData(rawData);
                        }
                    }
                });
            }
        });

        return new ImportPage()
    }
);

