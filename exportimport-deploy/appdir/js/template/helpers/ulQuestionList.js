/**
 * Created by samueldoyle on 10/16/13.
 */
define("template/helpers/ulQuestionList", ["Handlebars"], function ( Handlebars ) {
    function ulQuestionList(context, options) {
        var ret = "<ul>";
        for (var i = 0, j = context.length; i < j; i++) {
            ret = ret + "<li class='bullet'> <i class='icon-question-sign'></i>    " + options.fn(context[i]) + "</li>";
        }
        return ret + "</ul>";
    }
    Handlebars.registerHelper("ulQuestionList", ulQuestionList);
    return ulQuestionList;
});