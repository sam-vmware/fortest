({
    // RequireJS build profile, requires node to be installed
    // 1.) Install requirejs package for node: npm install -g requirejs
    // 2.) exec from this directory: node js/thirdparty/require/plugins/r-2.1.1.js -o app.build.js
    // Build output directory is ../appdir-build
    // More info see here: http://requirejs.org/docs/optimization.html
    // For more configuration options see example @ https://github.com/jrburke/r.js/blob/master/build/example.build.js
    name: "main",
    insertRequire: ["main"],
    wrap: true,
    create: true,
    appDir: "../",
    baseUrl: "appdir/js",
    dir: "../../exportimport-deploy",
    mainConfigFile:"js/apps/config.js",
    findNestedDependencies: true,
    inlineText: true,
    optimizeCss:"standard",
    cssImportIgnore:null,
    useStrict:false,
    cjsTranslate:true,
    logLevel:0,
    stubModules: ["text"],
    normalizeDirDefines: "skip",
    skipModuleInsertion:false,
    optimizeAllPluginResources:false,
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
    pragmasOnSave: {
        //removes Handlebars.Parser code (used to compile template strings) set
        //it to `false` if you need to parse template strings even after build
        excludeHbsParser : false,
        // kills the entire plugin set once it's built.
        excludeHbs: false,
        // removes i18n precompiler, handlebars and json2
        excludeAfterBuild: false
    },
    onBuildWrite: function (moduleName, path, content) {
        // replace handlebars with the runtime version
        if (moduleName === 'Handlebars') {
            path = path.replace('handlebars.js', 'handlebars.runtime.js');
            content = fs.readFileSync(path).toString();
            content = content.replace(/(define\()(function)/, '$1"handlebars", $2');
        }
        return content;
    }
})