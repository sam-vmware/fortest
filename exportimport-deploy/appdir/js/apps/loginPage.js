/**
 * Main requirejs page module for driving login
 * This version of the application resides entirely in GitHub and doesn't use HTML5 postmessage.
 * Data retrieved is still sent to AppDirector via CORS
 * @author samueldoyle
 */
define(function (require) {
    var $ = require("jquery"),
        _ = require("underscore"),
        SessionStorage = require("model/sessionStorage"),
        BusinessGroupCollection = require("model/tenantBusinessGroupCollection"),
        GitHubFileCollection = require("model/gitHubFileCollection"),
        cp = require("model/commonProperties"),
        errors = require("model/errorMappings"),
        cu = require("util/appDirCommon"),
        uiUtils = require("util/uiUtils"),
        ghFH = require("util/ghFileHandler"),
        VMwareJSONModel = require("model/vmWareJSON"),
        GHViewDataModal = require("view/ghViewDataModal"),
        compiledWrongBrowser = require("hbs!template/unsupportedBrowser"),
        dataPoster = require("workers/dataPoster"),
        marked = require("marked"),
        Crypto = require("Crypto"),
        twitterjs = require("twitterjs"),
        Spinner = require("spin"),
        eventBus = require("util/appCommonEB");

    var LoginPage = Backbone.Model.extend({

        defaults: {
            queryParams: $.url().param(),
            vmwareJSONFile: undefined,
            targetFileMeta: undefined,
            defaultBPFile: undefined,
            readMeFile: undefined,
            errorReadMeFile: undefined,
            nextsStepFile: undefined,
            importButtonEL: "#viewImportFileButton",
            viewDataModal: undefined,
            gitHubFileCollection: undefined,
            sessionStorage: undefined,
            getParams: undefined,
            appdVersions: undefined
        },

        initialize: function () {
            marked.setOptions({
                gfm: true,
                pedantic: false,
                sanitize: true
            });
            var activityValues = {el: "document", segments: 12, width: 5.5, space: 6, length: 13, color: '#252525', outside: false, speed: 1.5};


            // First thing browser check
            if (!cp.get("page-index").hasClass("chrome-gte20") && !cp.get("page-index").hasClass("ff-gte15")) {
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

            _.bindAll(this, 'postConstruct', 'gaugesTrack', 'ghCollectionSuccessHandler',
                'displayReadme', 'initData', 'allowInput', 'businessGroupSuccessHandler', 'bindLoginForm');
        },

        postConstruct: function () {
            this.set("queryParams", $.url().param());
            this.set("verifyLoginEP", cp.get("APPD_VERIFY_LOGIN"));

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

            this.initData();
            this.gaugesTrack('50b3b654613f5d6634000009');
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
                        msg = 'The repository or branch was not found on github. Please check the url parameters!';
                    }
                    cu.log("%cLoginPage failed to get tree: " + response, "color:red; background-color:blue");
                    uiUtils.updateFormDisplay({
                        rdcClass: ALERT_ERROR_CLASSES,
                        rdMsgVal: errors.get("ERRORS").import
                    });
                }
            });
        },

        // Post this data to app dir, done once we have the data
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
            cu.log("%cLoginPage received tree data: ", "color:yellow; background-color:blue");

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
                        that.set("defaultBPFile", vmwareJSONFile.get("exportFileName"));
                        that.set("targetFileMeta", collection.get(vmwareJSONFile.get("exportFileName")));
                        that.set("readMeFile", collection.get(vmwareJSONFile.get("exportedFileReadme")));
                        if (_.isUndefined(that.attributes.targetFileMeta)) throw new Error("Export File: " + vmwareJSONFile.get("exportFileName")) + " missing";
                        if (_.isUndefined(that.attributes.readMeFile)) throw new Error("Export Readme File: " + vmwareJSONFile.get("exportFileReadme")) + " missing";

                        var optional = vmwareJSONFile.get("optional");
                        that.set("importSectionHeader", vmwareJSONFile.get("importSectionHeader"));
                        that.set("vmwareJSONFile", vmwareJSONFile);

                        // Check for optional enableConsoleLogging field and set TESTING to true if set for logging.
                        var optional = that.attributes.vmwareJSONFile.get("optional");
                        if (optional) {
                            if (optional.enableConsoleLogging == true) {
                                TESTING = true;
                                cu.log("Logging output to console");
                            }

                            // If there is optional appdversions check to see if the default first entry contains an exportFileName
                            // and set that instead of the default
                            if (optional.appdVersions) {
                                var firstEntry = _.first(optional.appdVersions);
                                if (firstEntry && firstEntry.exportFileName) {
                                    // there was an appdentry found with an alternate export file, verify first
                                    // it is in the collection before setting on model
                                    if (! collection.get(firstEntry.exportFileName)) {
                                        cu.log("!! ERROR !! alternate exportFile file was entered in configuration but missing from repo: " + firstEntry);
                                    } else {
                                        that.set("defaultBPFile", firstEntry.exportFileName);
                                        that.set("targetFileMeta", collection.get(firstEntry.exportFileName));
                                    }
                                }
                                if (firstEntry && firstEntry.nextStepsMarkdownFile) {
                                    var collectionFile = collection.get(firstEntry.nextStepsMarkdownFile);
                                    if (!collectionFile) {
                                        cu.log("!! ERROR !! nextsSteps specified with appdVersion but no matching file of that name found in repo: " + collectionFile);
                                    } else {
                                        that.set("nextsStepFile", firstEntry.nextStepsMarkdownFile);
                                    }
                                } else {
                                    that.set("nextsStepFile", optional.nextStepsMarkdownFile);
                                }
                            }
                        }

                        that.displayReadme();
                    } catch (e) {
                        cu.log("getGHFileRawData: exception: " + e);
                        uiUtils.updateFormDisplay({
                            rdcClass: ALERT_ERROR_CLASSES,
                            rdMsgVal: errors.get("ERRORS").import
                        });
                        return false;
                    }

                    eventBus.triggerEvent(eventBus.getEvents().VMW_JSON_LOADED, that.attributes.vmwareJSONFile);
                }
            });
        },

        // Fetches the readme data file and displays it in the textarea, after so enables input fields
        displayReadme: function () {
            ghFH.getGHFileRawData(this.attributes.readMeFile, {
                success: function (model, response, jqXHR) {
                    cp.get("readme-content").empty().append(_.escape(response)); // insert our data into the modal
                }
            });
        },

        allowInput: function () {
            // Construct the modal for viewing the importfile on the view file click
            // TODO clean this, the show modal no longer exists and all this is doing now is providing the download
            // on click functionality
            this.set("viewDataModal",
                new GHViewDataModal({model: this.attributes.targetFileMeta, clickTarget: this.attributes.importButtonEL, showModal: false}));

            this.bindLoginForm(); // ok to allow input on the form now that we have all our data
        },

        businessGroupSuccessHandler: function (collection, response) {
            cu.log("%cLoginPage retrieved busingess groups: ", "color:yellow; background-color:blue");

            if (!collection.length) {
                uiUtils.updateFormDisplay({
                    rdcClass: ALERT_ERROR_CLASSES,
                    rdMsgVal: "Collection contain no business group entries: " + errors.get("ERRORS").import
                });
                return;
            }

            // Save local storage values including business group collections
            this.attributes.sessionStorage.save();

            var importPage = $.url().attr("directory") + cp.get("IMPORT_PAGE") + "?" + $.url().attr("query");
            cu.log("Redirecting --> " + importPage);
            // window.location.replace(importPage);
            window.location = importPage;
        },

        bindLoginForm: function () {
            var fName = this.attributes.targetFileMeta.get("path"),
                header = !_.isUndefined(this.attributes.importSectionHeader) ? this.attributes.importSectionHeader : fName.split("\.")[0];

            cp.get("bpExportFN").attr("placeholder", fName);
            cp.get("importHeader").empty().text("Import " + header);

            var that=this;
            cp.get('appDirVersion').on('change', function () {
                //var optionSelected = $(this).find("option:selected");

                var collectionFile = undefined;
                var version = parseFloat(this.value);
                var optional = that.attributes.vmwareJSONFile.get("optional");
                if (optional && optional.appdVersions) {
                    var entry = _.findWhere(optional.appdVersions,{version: this.value});
                    cu.log("change event, found entry: " + JSON.stringify(entry));
                    if (entry && entry.exportFileName) {
                        collectionFile = that.attributes.gitHubFileCollection.get(entry.exportFileName);
                        if (!collectionFile) {
                            cu.log("!! ERROR !! exportFileName specified with appdVersion but no matching file of that name found in repo: " + collectionFile);
                        } else {
                            cp.get("bpExportFN").attr("placeholder", entry.exportFileName);
                            that.set("defaultBPFile", entry.exportFileName);
                            that.set("targetFileMeta", collectionFile);
                            that.set("viewDataModal",
                                new GHViewDataModal({model: that.attributes.targetFileMeta, clickTarget: that.attributes.importButtonEL, showModal: false}));
                        }
                    } else {
                        cp.get("bpExportFN").attr("placeholder", that.attributes.defaultBPFile);
                    }
                    if (entry && entry.nextStepsMarkdownFile) {
                        collectionFile = that.attributes.gitHubFileCollection.get(entry.nextStepsMarkdownFile);
                        if (!collectionFile) {
                            cu.log("!! ERROR !! nextsSteps specified with appdVersion but no matching file of that name found in repo: " + collectionFile);
                        } else {
                            that.set("nextsStepFile", entry.nextStepsMarkdownFile);
                        }
                    } else {
                        that.set("nextsStepFile", optional.nextStepsMarkdownFile);
                    }
                }
            });

            $("#loginForm").validate({
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

                submitHandler: _.bind(function (form, e) {
                    e.preventDefault();
                    var userProvidedHost = cp.get("appDirHost").val() ? cp.get("appDirHost").val() : cp.get("appDirHost").attr("placeholder"),
                        userProvidedTenant = cp.get("appDirTenant").val(),
                        userProvidedAppdVersion = cp.get('appDirVersion').val() ? parseFloat(cp.get('appDirVersion').val()) : undefined
                        ;

                    this.set("sessionStorage", new SessionStorage({
                        targetHost: userProvidedHost,
                        tenantId: userProvidedTenant,
                        appdVersion:userProvidedAppdVersion,
                        exportFileName:that.attributes.defaultBPFile,
                        nextsStepFile:that.attributes.nextsStepFile,
                        businessGroupCollection: new BusinessGroupCollection({
                            appdhost: userProvidedHost,
                            tenant: userProvidedTenant
                        })
                    }));

                    if (parseFloat(userProvidedAppdVersion) >= 6.1) {
                        // Fetch the business groups
                        cu.log("Logging in to retrieve tenant information.");
                        this.attributes.sessionStorage.get("businessGroupCollection").fetch({
                            success: this.businessGroupSuccessHandler,
                            error: function (collection, response) {
                                var msg = "Failed to verify login information through App Director. " + response.statusText;
                                if (response.status === 404) {
                                    msg = 'The verify login url was not available. Please check the url parameters!';
                                }
                                cu.log("%cLoginPage failed to get tree: " + JSON.stringify(response), "color:red; background-color:blue");
                                uiUtils.updateFormDisplay({
                                    rdcClass: ALERT_ERROR_CLASSES,
                                    rdMsgVal: errors.get("ERRORS").import
                                });
                            }
                        });
                    } else {
                        this.attributes.sessionStorage.save();
                        window.location = $.url().attr("directory") + cp.get("IMPORT_PAGE") + "?" + $.url().attr("query");
                    }
                }, this)
            });

            var currentVersion = cp.get('appDirVersion').val() ? parseFloat(cp.get('appDirVersion').val()) : undefined;
            uiUtils.appdVersionChangeUpdateTenant({
                appdVersion:currentVersion
            });
        }
    });

    return new LoginPage();
});

