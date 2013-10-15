define("template/helpers/ulQuestionList", ["handlebars"], function ( Handlebars ) {
    function ulQuestionList ( context, options ) {
        var ret = "<ul>";
        for(var i=0, j=context.length; i<j; i++) {
            ret = ret + "<li> <i class='icon-question-sign'></i>    " + options.fn(context[i]) + "</li>";
        }
        return ret + "</ul>";
    }
    Handlebars.registerHelper("ulQuestionList", ulQuestionList);
    return ulQuestionList;
});
