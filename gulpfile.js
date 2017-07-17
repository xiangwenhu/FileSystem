var gulp = require('gulp');
var UglifyJS = require('uglify-es')
var concat = require('gulp-concat');



/*
var options = {
  parse: {

  },
  mangle: {
    properties: true,
    toplevel: true,
    keep_fnames: true,
    reserved: ['FileSystem', 'requestFileSystem', 'indexedDB'],
  }

},
  code =
    {
      "utils.js": fs.readFileSync("src/utils.js", "utf8"),
      "FSProvider.js": fs.readFileSync("src/FSProvider.js", "utf8"),
      "IDBProvider.js": fs.readFileSync("src/IDBProvider.js", "utf8"),
      "FileSystem.js": fs.readFileSync("src/FileSystem.js", "utf8")
    }

*/


gulp.task('compress', function() {
  return gulp.src(['src/utils.js', 'src/FSProvider.js', 'src/IDBProvider.js','src/FileSystem.js'])
    .pipe(concat('FileSystem.js'))
    .pipe(gulp.dest('dist/')).pipe(gulp.dest('test/'));
});