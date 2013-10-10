({
    // RequireJS build profile, requires node to be installed
    // 1.) Install requirejs package for node: npm install -g requirejs
    // 2.) exec from this directory: node js/thirdparty/require/plugins/r-2.1.1.js -o app.build.js
    // Build output directory is ../appdir-build
    // More info see here: http://requirejs.org/docs/optimization.html
    // For more configuration options see example @ https://github.com/jrburke/r.js/blob/master/build/example.build.js
    baseUrl:"js",
    inlineText:true,
    mainConfigFile:"js/apps/configs/shared.config.js",
    name:"apps/importExportApp.nopm",
    out:"../../exportimport-deploy/appdir/js/apps/importExportApp.nopm.js",
    //dir:"../../exportimport-deploy/appdir/js",
    //include:["thirdparty/crypto-min", "util/uiUtils", "util/appDirCommon"],
    //exclude:["jquery"],
    //deps:["text"],
    pragmasOnSave:{
        //removes Handlebars.Parser code (used to compile template strings) set
        //it to `false` if you need to parse template strings even after build
        excludeHbsParser:true,
        // kills the entire plugin set once it's built.
        excludeHbs:true,
        // removes i18n precompiler, handlebars and json2
        excludeAfterBuild:true
    },
    skipModuleInsertion:false,
    findNestedDependencies:false,
    optimizeAllPluginResources:false,
    keepBuildDir:false,
    optimize:"uglify",
    uglify:{
        toplevel:true,
        ascii_only:true,
        beautify:false,
        max_line_length:32000,
        defines:{
            DEBUG:["name", "false"]
        },
        no_mangle:true
    },
    optimizeCss:"standard",
    cssImportIgnore:null,
    useStrict:false,
    cjsTranslate:true,
    logLevel:0
})