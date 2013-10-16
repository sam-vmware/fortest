({
    // RequireJS build profile, requires node to be installed
    // 1.) Install requirejs package for node: npm install -g requirejs
    // 2.) exec from this directory: node js/thirdparty/require/plugins/r-2.1.1.js -o app.build.js
    // Build output directory is ../appdir-build
    // More info see here: http://requirejs.org/docs/optimization.html
    // For more configuration options see example @ https://github.com/jrburke/r.js/blob/master/build/example.build.js
    name: "apps/main",
    create: true,
    appDir: "../",
    baseUrl: "appdir/js",
    dir: "../../exportimport-deploy",
    mainConfigFile:"js/apps/configs/shared.config.js",
    findNestedDependencies: true,
    onBuildWrite: function (moduleName, path, content) {
        // replace handlebars with the runtime version
        if (moduleName === 'Handlebars') {
            path = path.replace('handlebars.js', 'handlebars.runtime.js');
            content = fs.readFileSync(path).toString();
            content = content.replace(/(define\()(function)/, '$1"handlebars", $2');
        }
        return content;
    },
    wrap: true,
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
    inlineText: true,
    pragmasOnSave: {
        //removes Handlebars.Parser code (used to compile template strings) set
        //it to `false` if you need to parse template strings even after build
        excludeHbsParser : true,
        // kills the entire plugin set once it's built.
        excludeHbs: true,
        // removes i18n precompiler, handlebars and json2
        excludeAfterBuild: true
    },
    optimizeCss:"standard",
    cssImportIgnore:null,
    useStrict:false,
    cjsTranslate:true,
    logLevel:0,
    stubModules: ['text']
})