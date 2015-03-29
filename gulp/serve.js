var gulp = require('gulp'),
    browserSync = require('browser-sync');

gulp.task('serve', function() {
  browserSync({
    ghostMode: false,
    server: {
      baseDir: ['./build/test'],
      open: true
    },
    port: 8085
  });
});
