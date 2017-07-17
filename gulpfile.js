var gulp = require('gulp');
var UglifyJS = require('uglify-es')
var fs = require('fs')



var options = {
  toplevel: true,
  mangle: {
    properties: true,
  }
},
  code =
    {
      "FileSystem.js": fs.readFileSync("src/FileSystem.js", "utf8"),
      "FSProvider.js": fs.readFileSync("src/FSProvider.js", "utf8"),
      "IDBProvider.js": fs.readFileSync("src/IDBProvider.js", "utf8"),
      "utils.js": fs.readFileSync("src/utils.js", "utf8")
    }


gulp.task('compress', function (cb) {
  fs.writeFileSync("dist/FileSystem.min.js", UglifyJS.minify(code, options).code, "utf8")
  cb
});