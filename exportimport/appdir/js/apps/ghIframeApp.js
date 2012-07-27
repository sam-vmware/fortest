/**
 * This sits inside the iFrame that runs on the domain that our application is associated with and is permitted
 * to make make requests from by GitHub CORS rules.
 * @author samueldoyle
 */
define(["jquery", "underscore", "workers/corsDataListener", "workers/corsDataSender", "util/appDirCommon"],
    function ($, _, CorsDataListener, corsDataSender, cu) {

        var requestTimeout = 300000;
        var sendMsgDefaults = {
            target:window.parent,
            type:cu.MsgTypes.PARENT
        };
        var messageType = cu.MsgTypes.GH_IFRAME;
        var listenerOpts = {
            messageType:messageType,
            handlerfunction:function (dataFromParent) {
                cu.log("GitHubListener received message from parent: " + JSON.stringify(dataFromParent));
                $.when($.ajax({
                    url:dataFromParent.url,
                    type:"get",
                    timeout:requestTimeout,
                    beforeSend:function (xhr) {
                        xhr.setRequestHeader("Accept", "application/vnd.github.raw");
                    }
                })).done(function (data, textStatus, jqXHR) {
                    cu.log("Done: getting from url: " + dataFromParent.url);
                    corsDataSender.sendMsg(_.extend({}, sendMsgDefaults, {
                        data:{
                            requestedUrl:data.url,
                            success:true,
                            uid:cu.getUid(messageType, cu.MsgTypes.PARENT),
                            raw:data
                        }
                    }));
                }).fail(function (jqXHR, textStatus, errorThrown) {
                   cu.log("Failed: getting data from GH");
                   corsDataSender.sendMsg(_.extend({}, sendMsgDefaults, {
                       data:{
                           requestedUrl:dataFromParent.url,
                           success:false,
                           uid:cu.getUid(messageType, cu.MsgTypes.PARENT),
                           errorData:{
                               code:jqXHR.status,
                               textStatus:textStatus,
                               errorThrow:errorThrown
                           }
                       }
                   }));
                });
            }
        };

        // The parent window is waiting on this message so it knows the iframe is loaded
        // this is the signal for it to continue
        function ackParent() {
            corsDataSender.sendMsg(_.extend({}, sendMsgDefaults, {
                data:{
                    success:true,
                    uid:cu.getUid(cu.MsgTypes.GH_IFRAME, cu.MsgTypes.PARENT),
                    raw:{msg:cu.MsgTypes.ACK}
                }
            }));
        }

        var gitHubListener = null;
        return {
            start:function () {
                if (!_.isNull(gitHubListener)) {
                    cu.log("!!! gitHubListener had been set already !!!");
                    gitHubListener.stopListening();
                }
                gitHubListener = new CorsDataListener(listenerOpts).startListening();
                ackParent();
            }
        };
    });
