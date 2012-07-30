// hbtemplate.js plugin for requirejs / text.js
// it loads and compiles Handlebars templates

/* I added a crude change to this to support dealing with partials
* Partial filename assumed to be <foo>.part.<bar>... if part will register partial with foo as the name
* S.D.
*/
define(["underscore", "handlebars"], function (_, Handlebars) {
    var loadResource = function (resourceName, parentRequire, callback, config) {
        parentRequire([("text!" + resourceName)],
            function (templateContent) {
                var type, returnValue = "";
                var fnSplit = resourceName.split('.');
                if (_.indexOf(fnSplit, "part") != -1) {
                    type = "partial";
                }

                // just in case get rid of leading / if path separated
                fnSplit = fnSplit[0].split('/');

                switch(type) {
                    case "partial":
                        Handlebars.registerPartial(_.last(fnSplit), templateContent);
                        break;
                    default:
                        returnValue = Handlebars.compile(templateContent);
                }
                callback(returnValue);
            }
        );
    };
    return {
        load:loadResource
    };
});