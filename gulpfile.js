var gulp = require('gulp');

var build = require('./gulp/build');
    build_tests = require('./gulp/build_tests'),
    copy = require('./gulp/copy')
    serve = require('./gulp/serve');

gulp.task('default', ['copy', 'build_tests', 'serve']);
