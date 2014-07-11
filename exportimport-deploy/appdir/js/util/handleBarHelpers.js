/**
 * If you have any handlebar helpers can place them here
 * @author samueldoyle
 */
define(function (require) {
    var Handlebars = require("Handlebars");
    assert(Handlebars, "Unable to find handlebars dependency");

    // {{year}}
    Handlebars.registerHelper("yearHelper", function() {
        return new Date().getFullYear();
    });
});