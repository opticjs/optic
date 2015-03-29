var babelify = require('babelify'),
    browserify = require('browserify'),
    browserSync = require('browser-sync'),
    buffer = require('vinyl-buffer'),
    glob = require('glob'),
    gulp = require('gulp'),
    source = require('vinyl-source-stream'),
    watchify = require('watchify');

function errorHandler(err) {
  console.log(err);
}

gulp.task('build_tests', function() {
  var bundler = browserify({
    debug: true,
    entries: [glob.sync('./src/__test__/*_test.js*')]
  });

  var rebundle = function(ids, done) {
    if (ids) {
      console.log('File changed: ' + ids[0]);
    }

    return bundler
        .transform(babelify)
        .bundle()
        .on('error', errorHandler)
        .pipe(source('test_suite.js'))
        .pipe(buffer())
        .pipe(gulp.dest('./build/test/'))
        .pipe(browserSync.reload({stream: true}));
  };

  // TODO: This should only happen in dev environment.
  bundler = watchify(bundler);
  bundler.on('update', rebundle);

  return rebundle();
});
