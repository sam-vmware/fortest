/**
 * Main requirejs app module for import
 * @author samueldoyle
 */

define(["jquery", "underscore", "workers/dataFetcher", "workers/dataPoster"], function ($, _, dataGetter, dataPoster) {

    var exportURL = "https://localhost:8443/api/service/action/export";
    var importURL = "https://localhost:8443/api/service/action/importexport";
    var importEP = "/api/service/action/importexport";
    var localDataURL = "https://localhost/AppDirExternalmport/appdir/data/jPetStore.1.0.0.xml";
    var testHost = "https://localhost:8443/j_spring_security_check?ajax=true";
    var testRestAPI = "https://localhost:8443/api/deployment-environments";
    var testImportData = "http://raw.github.com/vmware-applicationdirector/solutions/staging/IDM_OVD_Blueprint/adapters.os_xml";

    var initialize = function() {
        $("#importForm").validate({
            submitHandler:function (form, e) {
                e.preventDefault();
                var appdhost = $("#appDirHost").val();
                var uname = $("#appDirUserName").val();
                var password = $("#appDirPassword").val();
                var bytes = Crypto.charenc.Binary.stringToBytes(uname + ":" + password);
                var authToken = Crypto.util.bytesToBase64(bytes);
                var beforeSend = function(xhr) {
                    xhr.setRequestHeader("Authorization", "Basic " + authToken);
                };
                var xhrFields = { withCredentials:true };

                $.when(dataGetter({
                    url:localDataURL,
                    beforeSend:beforeSend,
                    xhrFields:xhrFields
                })).done(function (data, textStatus, jqXHR) {
                    $.when(dataPoster({
                        url:appdhost+importEP,
                        data:data,
                        contentType:"application/xml",
                        dataType:"json",
                        beforeSend:beforeSend,
                        xhrFields:xhrFields
                    })).always(function (jqXHR, textStatus) {
                        $("#responseDataControl").removeClass("hidden");
                    }).done(function (data, textStatus, jqXHR) {
                        var msgClass = "success";
                        var msgVal = "Success!";
                        if (!_.isBoolean(data.success) || data.success == false) {
                            msgClass = "error";
                            msgVal = "Application Director reported non-success in importing the application. Please review the logs for result.";
                        }
                        $("#responseDataControl").addClass(msgClass);
                        $("#responseData").val(msgVal);
                    }).fail(function (jqXHR, textStatus, errorThrown) {
                        $("#responseDataControl").addClass("error");
                        $("#responseData").val("An error occurred during import. " + errorThrown);
                    });
                }).fail(function (jqXHR, textStatus, errorThrown) {
                    $("#responseDataControl").addClass("error");
                    $("#responseData").val("Error: " + errorThrown);
                    $("#responseDataControl").removeClass("hidden");
                });
            }
        });
    };

    return {
        init:initialize
    }
});
