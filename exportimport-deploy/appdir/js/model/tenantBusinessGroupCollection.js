/**
 * The collection of business groups from the verify-login with tenant
 * @author samueldoyle
 */
define(["underscore", "backbone", "localstorage", "model/tenantBusinessGroup", "util/appDirCommon"],
    function (_, Backbone, localstorage, BusinessGroup, cu) {

    var BusinessGroupCollection = Backbone.Collection.extend({
        model:BusinessGroup,
        collectionOptions:{
            appdhost:undefined,
            tenant:undefined,
            url:undefined
        },

        initialize:function (options) {
            options = options || {};
            if (!_.isString(options.appdhost) || !_.isString(options.tenant)) {
                throw new Error("Can't missing or invalid App Director host or tenant");
            }
            _.extend(this.collectionOptions, options);
            this.collectionOptions.url = _.template("https://<%= appdhost %>:8443/darwin/api/security/verify-login")(this.collectionOptions);
        },

        sync:function (method, model, options) {
            var that=this;
            var params = _.extend({
                type:"GET", // force get backbone likes using post for new/save
                timeout:30000,
                processData:true,
                url:that.collectionOptions.url,
                context:that,
                dataType:"json",
                complete:function (data) {
                },
                success:function (data) {
                    cu.log("success: " + data);
                },
                error:function (data) {
                    cu.log("error: " + data);
                },
                beforeSend: function (xhr) {
                  /*  var bytes = Crypto.charenc.Binary.stringToBytes("tony@coke.vmware.com:password");
                    var authToken = Crypto.util.bytesToBase64(bytes);
                    xhr.setRequestHeader("Authorization", "Basic " + authToken);*/
                    xhr.setRequestHeader("darwin-tenant-id", that.collectionOptions.tenant);
                },
                xhrFields: {
                    withCredentials: true // required for CORS check
                }
            }, options);

            return $.ajax(params);
        },

        // Parse out the collection of response objects
        parse:function (response) {
            if (response.result.businessGroups) {
                _.each(response.result.businessGroups, function(bg) {
                    bg.user = response.result.name;
                    bg.authToken = response.result.credential.password;
                });
                return response.result.businessGroups;
            }
            return response;
        }
    });

    return BusinessGroupCollection;
});

