
exports.compileCssFiles = function(files, minify, output) {
    var result = '', imports = '';

    for (var i=0, l=files.length; i<l; i++) {
        if (Strings.endsWith(files[i], '.less'))
            imports += '@import (less) "' + files[i] + '";';
        else {
            result += Files.getFileAsString(files[i]);
            result += "\n";
        }
    }

    if (imports.length) {
        new exports.less.Parser().parse(imports, function (err, tree) {
                try {
                    if (err)
                        throw err;
                    result = tree.toCSS({ compress: minify }) + result; // append .css files after .less
                }
                catch (e) {
                    throw see(e);
                }
        });
    }

    if (minify)
        result = Resources.minifyCss(result); // while less has been minified, css still isnt

    if (output != null) {
        Files.mkdirs(Files.getFile(output), true); // writable by all
        Files.writeStringToFile(result, output);
        Files.makeWritableByAll(output);
    }

    return result;
}

/**
 * This function is used by Ant ScriptableCompileTask to compile Less/CSS files
 */
exports.runLessCompileTask = sync(function(baseName) {

    if (!__developmentMode__ && !__compilationMode__)
        throw "runLessCompileTask: should only be used in development or compilation mode";

    var files = _r.listSourceFilesCached(baseName);
    var dataLastModified = _r.getMostRecentModified(files);
    var output = _r.config[baseName+'.output'];

    if (dataLastModified > Files.getLastModified(output)) {
        _r.clearSourceFileListCache(baseName);
        files = _r.listSourceFilesCached(baseName);

        logEvent("Compiling " + files.length + " " + baseName + " file(s)");

        var p = baseName+'.minify';
        exports.compileCssFiles(files, p in _r.config? _r.config[p] : true, _r.config[baseName+'.output']);
    }
    else if (__compilationMode__)
            logEvent("No " + baseName + " files changed, compilation skipped.");

    return files.length;
});
