/**
 * Progress bar specific
 * @author samueldoyle
 */
define(["underscore", "backbone", "util/appDirCommon"],
    function (_, Backbone, cu) {

        var ProgressBarView = Backbone.View.extend({
            el:"#progressGroup",
            initialize:function () {
                _.bindAll(this, "update", "show", "hide");
            },
            update:function (options) {
                cu.log("ProgressBarView updating with value: " + options.value);
                switch (options.value) {
                    case "0%":
                        this.$("#progressWrapper").addClass("active"); // reset so make sure this is hidden
                        break;
                    case "100%":
                        this.$("#progressWrapper").removeClass("active"); // reset so make sure this is hidden
                        break;
                }
                this.$("#progressBadge").text(options.value);
                this.$("#progressBar").css("width", options.value);
                return this;
            },
            show:function () {
                this.$el.removeClass("hidden");
                return this;
            },
            hide:function () {
                this.$el.addClass("hidden");
                return this;
            }
        });

        return ProgressBarView;
    });
