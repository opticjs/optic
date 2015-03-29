var browserify = require('browserify'),
    browserSync = require('browser-sync'),
    buffer = require('vinyl-buffer'),
    gulp = require('gulp'),
    source = require('vinyl-source-stream'),
    watchify = require('watchify');

function errorHandler(err) {
  console.log(err);
}

gulp.task('build', function() {
  var bundler = browserify({
    debug: true,
    entries: ['./src/index.js']
  });

  var rebundle = function(ids, done) {
    if (ids) {
      console.log('File changed: ' + ids[0]);
    }

    return bundler.bundle()
        .on('error', errorHandler)
        .pipe(source('index.js'))
        .pipe(buffer())
        .pipe(gulp.dest('./build/js/'))
        .pipe(browserSync.reload({stream: true}));
  };

  // TODO: This should only happen in dev environment.
  bundler = watchify(bundler);
  bundler.on('update', rebundle);

  return rebundle();
});
