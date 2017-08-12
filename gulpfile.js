var gulp = require('gulp'),
    babel = require('gulp-babel'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    pump = require('pump');

gulp.task('es5', function () {
    gulp.src('src/FileSystem.js') 
        .pipe(gulp.dest('dist'))
        .pipe(babel({              
            presets: ['es2015']
        }))
        .pipe(rename('FileSystem.ES5.js'))
        .pipe(gulp.dest('dist'))
})

gulp.task('min', function () {   
    gulp.src('dist/FileSystem.js')
        .pipe(rename('FileSystem.min.js'))
        //.pipe(uglify())
        .pipe(gulp.dest('dist'))
})

gulp.task('min-es5', function () {
    // 压缩ES5版本
    gulp.src('dist/FileSystem.ES5.js')
        .pipe(rename('FileSystem.ES5.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist'))

})

gulp.task('copy', function () {
    gulp.src('dist/**')
        .pipe(gulp.dest('docs/demo'))
})


gulp.task('watch', function () {
    gulp.watch('src/FileSystem.js', ['ES6ToES5'])
});

/*
gulp.task('compress', function (cb) {
    pump([
        gulp.src('dist/FileSystem.ES5.min.js'),
        uglify(),
        gulp.dest('dist')
    ],
        cb
    );
}); */


gulp.task('default',['es5','min','min-es5','copy'])
