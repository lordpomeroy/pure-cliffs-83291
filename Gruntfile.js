// Gruntfile.js
module.exports = function(grunt) {
  'use strict';
  grunt.initConfig({
    // JS TASKS ================================================================
    // check all js files for errors
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        browser: true,
        node: true,
        strict: true,
        latedef: true,
      },
      all: ['public/**/*.js', '!public/libs/**/*.js', '!public/dist/js/*.js', 'app/**/*.js', 'Gruntfile.js']
    },

    jscs: {
      src: ['public/**/*.js', '!public/libs/**/*.js', '!public/dist/js/*.js', 'app/**/*.js', 'Gruntfile.js'],
      options: {
        config: '.jscsrc'
      }
    },

    // take all the js files and minify them into app.min.js
    uglify: {
      options: {
        mangle: false,
        beautify: true
      },
      build: {
        files: {
          'public/dist/js/app.min.js': ['public/**/*.js', '!public/libs/**/*.js', '!public/dist/js/*.js']
        }
      }
    },

    // CSS TASKS ===============================================================
    // process the less file to style.css
    less: {
      build: {
        files: {
          'public/dist/css/style.css': ['public/**/css/*.less', '!public/libs/**/*.*']
        }
      }
    },

    // take the processed style.css file and minify
    cssmin: {
      build: {
        files: {
          'public/dist/css/style.min.css': 'public/dist/css/style.css'
        }
      }
    },

    // COOL TASKS ==============================================================
    // watch css and js files and process the above tasks
    watch: {
      css: {
        files: ['public/**/css/*.less', '!public/libs/**/*.*'],
        tasks: ['less', 'cssmin'],
        options: {
          livereload: true
        }
      },
      js: {
        files: ['public/**/*.js', '!public/libs/**/*.js', '!public/dist/js/*.js'],
        tasks: ['jshint', 'uglify'],
        options: {
          livereload: true
        }
      }
    },

    // watch the node server for changes
    nodemon: {
      dev: {
        script: 'server.js',
        options: {
          watch: ['app/**/*.js']
        }
      }
    },

    // run watch and nodemon at the same time
    concurrent: {
      options: {
        logConcurrentOutput: true
      },
      tasks: ['nodemon', 'watch']
    },

  });

  grunt.loadNpmTasks('grunt-jscs');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-env');
  grunt.loadNpmTasks('grunt-nodemon');

  grunt.registerTask('default', ['jshint', 'jscs', 'less', 'cssmin', 'uglify', 'concurrent']);
};