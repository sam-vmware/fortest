/*if (has("beenOptimized")) {
    // in product environment: we do not have to load config.js
    requirejs(["domReady!"], function(doc) {
        requirejs(["entry"]);
    });
} else {
    requirejs(["config"], function(config) {
        requirejs(["domReady!"], function(doc) {
            requirejs(["entry"]);
        });
    });
}*/
requirejs(["config"], function(config) {
    requirejs(["domReady!"], function(doc) {
        requirejs([TARGET_ENTRY]);
    });
});
