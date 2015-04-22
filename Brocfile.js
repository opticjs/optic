var funnel = require('broccoli-funnel');
var browserify = require('broccoli-fast-browserify');
var mergeTrees = require('broccoli-merge-trees');
var babel = require('broccoli-babel-transpiler');
var babelify = require('babelify');
var concat = require('broccoli-concat');
var glob = require('glob');
var path = require('path');

var testSuiteGlob = '**/__test__/**/*test.js*';

var testDirectory = funnel('test', {
  include: ['**/*']
});

var optic = funnel('src', {
  include: ['index.js']
});

var testTree = funnel('src', {
  include: [testSuiteGlob]
});

var testSuite = browserify('src', {
  bundles: {
    'test_suite.js': {
      transform: babelify,
      entryPoints: glob.sync(testSuiteGlob, {cwd: path.join(process.cwd(), 'src')}),
      debug: true
    }
  }
});

module.exports = mergeTrees([testDirectory, testSuite]);
