var gulp = require('gulp');

gulp.task('copy', function() {
  gulp.src('test/**/*')
      .pipe(gulp.dest('./build/test'));
});
