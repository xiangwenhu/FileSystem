var gulp = require('gulp'),
    babel = require('gulp-babel'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    pump = require('pump');

gulp.task('default', function () {
    gulp.src('src/FileSystem.js')
        .pipe(gulp.dest('dist'))
        .pipe(gulp.dest('docs/demo'))
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(rename('FileSystem.ES5.js'))
        .pipe(gulp.dest('dist'))
        .pipe(gulp.dest('docs/demo'))
        .pipe(rename('FileSystem.ES5.min.js'))
        .pipe(gulp.dest('dist'))
        .pipe(gulp.dest('docs/demo'))
});
gulp.task('watch', function () {
    gulp.watch('src/FileSystem.js', ['ES6ToES5'])
});
gulp.task('compress', function (cb) {
    pump([
        gulp.src('dist/FileSystem.ES5.min.js'),
        uglify(),
        gulp.dest('dist')
    ],
        cb
    );
});