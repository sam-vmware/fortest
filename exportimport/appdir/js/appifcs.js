define(["jquery", "jqPlugins/postmessage"], function ($, postMessage) {
    exportURL = "https://localhost:8443/api/service/action/export";
    importURL = "https://localhost:8443/api/service/action/importexport";
    localDataURL = "http://localhost:3000/AppDirExternalmport/appdir/data/jPetStore.1.0.0.xml";
    testHost = "https://localhost:8443/j_spring_security_check?ajax=true";
    testRestAPI = "https://localhost:8443/api/deployment-environments";
    testImportData = "http://raw.github.com/vmware-applicationdirector/solutions/staging/IDM_OVD_Blueprint/adapters.os_xml";


    defaultOptions = {
        appDirIFName:"appDirIF",
        appDirIFID:"appDirIF",
        ghIFName:"ghDirIF",
        ghDirIFID:"ghDirIF"
    };

    submitHandlerFunction = function (form, e) {
        e.preventDefault();
        var uname = $("#appDirUserName").val();
        var password = $("#appDirPassword").val();
        var bytes = Crypto.charenc.Binary.stringToBytes("admin" + ":" + "password");
        var authToken = Crypto.util.bytesToBase64(bytes);

        //            $.when(appDirImporter.importData(authToken, testRestAPI, null)).done(function (data, textStatus, jqXHR) {
        $.when(appDirImporter.fetchImportData(authToken, localDataURL, null)).done(function (data, textStatus, jqXHR) {
            $("#responseDataControl").addClass("success");
            $("#responseData").val("Success!");

            $.when(appDirImporter.importData(authToken, importURL, data)).done(function (data, textStatus, jqXHR) {
                console.log(data);
            }).fail(function (jqXHR, textStatus) {
                    alert(textStatus);
                });
        }).fail(function (jqXHR, textStatus, errorThrown) {
                $("#responseDataControl").addClass("error");
                $("#responseData").val("Error: " + errorThrown);
        }).always(function (jqXHR, textStatus) {
                //            var status = jqXHR.status;
                //            var responseHeaders = jqXHR.getAllResponseHeaders();
           $("#responseDataControl").removeClass("hidden");
        });
    };


    function initialize(options) {
        var theOptions = $.extend({}, defaultOptions, options);

        appDirIF = $('<iframe />', {
            name:theOptions.appDirIFName,
            id:theOptions.appDirIFID
        }).appendTo('body');

        $("#importForm").validate({
            submitHandler:submitHandlerFunction
        });
    }

    return {
        init:initialize
    }
});