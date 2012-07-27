/**
 * Main requirejs app module for driving import
 * This app is based on launching a hidden iframe which resides on a domain that GitHub's CORS rules allows, it then
 * uses HTML5 postmessage to communicate with it to retrieve file data, that data is then sent to AppDirector using
 * CORS rules defined by AppDirector's CORS filter, CORS is another feature defined in the HTML5 spec.
 *
 * e.g
 * @author samueldoyle
 */

define(["jquery", "underscore", "backbone", "workers/corsDataListener", "workers/corsDataSender", "util/appDirCommon", "workers/dataPoster"],
    function ($, _, Backbone, CorsDataListener, corsDataSender, cu, dataPoster) {

        function ImportExportApp() {
            this.myData = {};

            this.loadData() .createParentListener() .launchGHIframe();
            var that=this;
            this.iframe.hide().load(function () {
              cu.log("ImportExportApp GitHub Application Domain IFrame created, url: " + that.myData.riframe);
            });
            this.iframe.appendTo('body');

            this.eventsHandler = {};
            _.extend(this.eventsHandler, Backbone.Events);

            this.eventsHandler.on("updateProgressBar", _.bind(function(data) {
                cu.log("Updating progress bar with value: " + data.value);
                switch(data.value) {
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

            // we don't know when the frame is done loading an cant send message for the data
            // until the frame is done, watch for this being set so we know.
            this.signal = false;
            cu.log("ImportExportApp Waiting on signal flag before continuing...");
            this.eventsHandler.on("childAck", _.bind(function(data) {
                cu.log("ImportExportApp childAck flag received");
                this.bindImportForm(); // now can listen for submit
                this.signal = true; // allow import to happen
            }, this));
        }

        ImportExportApp.prototype.loadData  = function() {
            var that = this;
            var dataId, dataValue;
            $("#eximData > span[type='data']").each(function(index) {
                dataId = $(this).attr("id");
                dataValue = $(this).data("value");
                console.log("dataId: " + dataId + " dataValue: " + dataValue);
                that.myData[dataId] = dataValue;
            });
            return this;
        };

        // Post this data to app dir, done once the child iframe gets the data for us
        ImportExportApp.prototype.importData = function (postData) {
            var that = this;
            $.when(dataPoster({
                url:this.myData.postParams.appdhost + this.myData.postParams.appdeximep,
                data:postData,
                contentType:"application/xml",
                dataType:"json",
                beforeSend:this.myData.postParams.beforeSend,
                xhrFields:this.myData.postParams.xhrFields
            })).always(function (jqXHR, textStatus) {
//                $("#responseDataControl").removeClass("hidden");
            }).done(function (data, textStatus, jqXHR) {
                var msgClass = ALERT_SUCCESS_CLASSES;
                var msgVal = "";
                if (!_.isBoolean(data.success) || data.success == false) {
                    msgClass = ALERT_ERROR_CLASSES;
                    msgVal = "Application Director reported non-success in importing the application. Please review the logs for result.";
                } else {
                    that.eventsHandler.trigger("updateProgressBar", {value:"100%"});
                    window.location = "https://localhost:8443/darwin/#applicationLanding"
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

        // This shouldn't be called directly since we need to wait for ack from ghiframe
        // which tells us that the iframe is loaded (only way with when it is not on this domain)
        // If the frame is not loaded everything will fail horribly but unfortunately silent
        ImportExportApp.prototype.startImport = function() {
            if (!this.signal) {
                cu.log("ImportExportApp Did not yet receive signal from child GH iframe, can't start");
                return;
            }

            $("#responseDataControl").addClass("hidden"); // hide the response in case it is open from prev request
            cu.log("%cImportExportApp sending get data request to child iframe", "color:yellow; background-color:blue");
            var url = _.template("https://api.github.com/repos/<%= aname %>/<%= repo %>/git/blobs/<%= sha %>")(this.myData.repo);
            this.requestGHData({
                target:window.frames[cu.MsgTypes.GH_IFRAME],
                from:cu.MsgTypes.PARENT,
                type:cu.MsgTypes.GH_IFRAME,
                data: {
                    uid:cu.getUid(cu.MsgTypes.PARENT, cu.MsgTypes.GH_IFRAME),
                    url:url
                }
             });
        };

        ImportExportApp.prototype.msgHandlerFunction = function (data) {
            var fromTo = cu.getFromToId(data.uid);
            cu.log("ImportExportApp child iframe message received from: " + fromTo.from) ;
            if (data.raw && data.raw.msg && _.isEqual(data.raw.msg, cu.MsgTypes.ACK)) {
                // GitHub iFrame has loaded and told us.
                cu.log("ImportExportApp github iframe ACK message received");
                this.eventsHandler.trigger("childAck", {value:true});
                return;
            }
            // Message from github iframe
            if (_.isEqual(fromTo.from, cu.MsgTypes.GH_IFRAME)) {
                if (!_.isBoolean(data.success) || data.success == false) {
                    // error
                    cu.log("ImportExportApp error cameback from child iframe");
                    updateFormDisplay({
                        rdcClass:ALERT_ERROR_CLASSES,
                        rdMsgVal:"An error occurred during import. " + JSON.stringify(data.errorData)
                    });
                    return;
                } else {
                    // supposed to be success so we should get a string in the raw field.
                    if (!_.isString(data.raw)) {
                        cu.log("ImportExportApp missing raw text field");
                        updateFormDisplay({
                            rdcClass:ALERT_ERROR_CLASSES,
                            rdMsgVal:"ImportExportApp received a success status but missing data ???"
                        });
                        return;
                    }
                    this.eventsHandler.trigger("updateProgressBar", {value:"50%"});
                    cu.log("%cImportExportApp sending import data to app dir, user: "
                        + this.myData.postParams.uname + " app dir host: " + this.myData.postParams.appdhost, "color:yellow; background-color:blue");
                    this.importData(data.raw);
                }
            }
        };

        ImportExportApp.prototype.createParentListener = function () {
            this.parentListener = new CorsDataListener({
                messageType:cu.MsgTypes.PARENT,
                handlerfunction:_.bind(function(data) {
                    this.msgHandlerFunction(data);
                }, this)
            }).startListening();
            cu.log("ImportExportApp created PARENT listener");
            return this;
        };

        ImportExportApp.prototype.launchGHIframe = function () {
            this.iframe =
                $('<iframe />', {
                    id:cu.MsgTypes.GH_IFRAME,
                    name:cu.MsgTypes.GH_IFRAME,
                    src:this.myData.riframe
                });
            return this;
        };

        ImportExportApp.prototype.requestGHData = function (sendMsgData) {
            cu.log("ImportExportApp sending message to github iframe: type: " + sendMsgData.type + " data: " + sendMsgData.data.url);
            corsDataSender.sendMsg(_.extend({}, sendMsgData));
            return this;
        };

        ImportExportApp.prototype.bindImportForm = function () {
            $("#appDirImportButton").addClass("btn-primary").removeAttr("disabled").text("Import");
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
    });
