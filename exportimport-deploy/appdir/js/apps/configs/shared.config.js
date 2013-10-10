TESTING = false;
ALERT_ERROR_CLASSES = "alert alert-error";
ALERT_SUCCESS_CLASSES = "alert alert-success";

requirejs.config({
    baseUrl:"../js", 
    waitSeconds: 15,
    callback:function () {
        // Assertion from: http://aymanh.com/9-javascript-tips-you-may-not-know#assertion
        function AssertException(message) {
            this.message = message;
        }
        AssertException.prototype.toString = function () {
            return 'AssertException: ' + this.message;
        };
        window.assert = function assert(exp, message) {
            if (!exp) {
                throw new AssertException(message);
            }
        }
    }
});
