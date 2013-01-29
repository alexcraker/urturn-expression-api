module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    lint: {
      all: ['grunt.js', 'src/**/*.js', 'test/**/*.js']
    },
    jshint: {
      options: {
        browser: true
      }
    },
    min: {
      minimifiedDist: {
        src: 'dist/urturn-expression-api.js',
        dest: 'dist/urturn-expression-api.min.js'
      }
    },
    concat: {
      dist: {
        src: [
          'lib/expression-api/core.js',
          'lib/expression-api/uuid.js',
          'lib/expression-api/item-collection.js',
          'lib/expression-api/item-collection-store.js',
          'lib/expression-api/container.js',
          'lib/expression-api/medias.js',
          'lib/expression-api/document.js',
          'lib/expression-api/url.js'
        ],
        dest: 'dist/urturn-expression-api.js'
      }
    },
    buster: {
      test: {
        config: 'test/compiled-buster.js'
      },
      server: {
        port: 1111
      }
    }
  });

  grunt.loadNpmTasks('grunt-buster');

  // Default task.
  grunt.registerTask('default', 'lint concat min buster');
};