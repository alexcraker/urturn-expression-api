module.exports = function(grunt) {

  var fs = require('fs'),
      path = require('path');

  function loadS3Config(){
    if(fs.existsSync(s3PrivatePath)){
      return JSON.parse(fs.readFileSync(s3PrivatePath));
    } else {
      console.log("You need to create a " + s3PrivatePath + " file to run `grunt s3deploy`");
      return null;
    }
  }

  var s3PrivatePath = path.join(__dirname, '.s3private.json');
  var s3Config = loadS3Config();
  var info = JSON.parse(grunt.file.read('package.json'));

  // List all source files that might be include.
  var sources = [
    'lib/expression-api/namespace.js',
    'lib/expression-api/uuid.js',
    'lib/expression-api/compat.js',
    'lib/expression-api/Collection.js',
    'lib/expression-api/CollectionStore.js',
    'lib/expression-api/PublicCollection.js',
    'lib/expression-api/Expression.js',
    'lib/expression-api/Post.js',
    'lib/expression-api/Image.js',
    'lib/expression-api/Video.js',
    'lib/expression-api/Sound.js',
    'lib/expression-api/events.js',
    'components/fastclick/lib/fastclick.js',
    'lib/expression-api/init.js'
  ];

  var config = {};
  // Lint
  config.jshint = {
    options: {
      browser: true
    },
    all: ['grunt.js', 'lib/**/*.js', 'test/**/*.js']
  };

  // Minify JS
  config.uglify = {
    minimifiedIframe: {
      src: 'dist/iframe.js',
      dest: 'dist/iframe.min.js'
    },
    minimifiedSandbox: {
      src: 'dist/sandbox.js',
      dest: 'dist/sandbox.min.js'
    }
  };

  // Minify CSS
  config.cssmin = {
    csscompress: {
      src: 'dist/iframe.css',
      dest: 'dist/iframe.min.css'
    }
  };

  config.filecheck = {
    sources: sources
  };

  // Concatenation
  config.concat = {
    sandbox: {
      src: [
        'lib/expression-api/namespace.js',
        'lib/expression-api/uuid.js',
        'lib/expression-api/compat.js',
        'lib/expression-api/ItemCollection.js',
        'lib/expression-api/ItemCollectionStore.js'
      ],
      dest: 'dist/sandbox.js'
    },
    iframe: {
      src: sources,
      dest: 'dist/iframe.js'
    },
    iframecss: {
      src: ['lib/iframe.css'],
      dest: 'dist/iframe.css'
    }
  };

  // Tests
  config.buster = {
    test: {
      config: 'test/buster.js',
      'config-group': 'compiled'
    },
    server: {
      port: 1111
    }
  };

  if(s3Config){
    var genS3Config = function(configs){
      return {
        apiKey: configs.apiKey,
        secretKey: configs.secretKey,
        bucket: configs.bucket,
        distribution: configs.distribution,
        files: {
          'dist/sandbox.js': '/expression/lib/urturn-expression-api/' + info.version + '/sandbox.js',
          'dist/iframe.js': '/expression/lib/urturn-expression-api/' + info.version + '/iframe.js',
          'dist/sandbox.min.js': '/expression/lib/urturn-expression-api/' + info.version + '/sandbox.min.js',
          'dist/iframe.min.js': '/expression/lib/urturn-expression-api/' + info.version + '/iframe.min.js',
          'dist/iframe.css': '/expression/lib/urturn-expression-api/' + info.version + '/iframe.css',
          'dist/iframe.min.css': '/expression/lib/urturn-expression-api/' + info.version + '/iframe.min.css'
        }
      };
    };
    config.s3deploy = {};
    for(var target in s3Config){
      config.s3deploy[target] = genS3Config(s3Config[target]);
    }
  }

  grunt.initConfig(config);

  // Load external grunt Task
  grunt.loadNpmTasks('grunt-buster');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerMultiTask('filecheck', "Ensure sources file are here", function(){
    for(var i in this.data){
      if(!fs.existsSync(this.data[i])){
        grunt.warn("Missing " + this.data[i]);
      }
    }
  });

  // Declare the S3 grunt Task
  grunt.registerMultiTask('s3deploy', 'Deploying built file on AWS s3', function() {
    var done = this.async();
    var knox = require('knox');
    var cloudfront = require('cloudfront');
    var client = knox.createClient({
      key: this.data.apiKey,
      secret: this.data.secretKey,
      bucket: this.data.bucket
    });
    var cf = cloudfront.createClient(this.data.apiKey, this.data.secretKey);
    var counter = 0;
    var bucket = this.data.bucket;
    var distribution = this.data.distribution;
    var files = this.data.files;

    var syncPoint = function(src, dest, bucket, callback){
      return function(err){
        counter --;
        if(err){
          console.log("Error " + err);
        } else {
          console.log("Uploaded " + src + " to " + bucket + dest);
        }
        if(counter === 0){
          callback();
        }
      };
    };

    var headers = {'x-amz-acl': 'public-read'};
    // Define cache controle policy (no-cache if -beta, -alpha or -rc)
    if(info.version.match(/^[0-9]+\.[0-9]+\.[0-9]+$/)){
      headers['Cache-Control'] = "public, max-age=" + 60*60*24*365;
    } else {
      headers['Cache-Control'] = "no-cache";
    }

    function doUpload(src, dest, headers, retry, callback){
      client.putFile(src, dest, headers, function(err){
        if(err){
          if(retry > 2){
            callback(err);
          } else {
            console.log(err, "Retrying...");
            doUpload(src, dest, headers, retry + 1, callback);
          }
        } else {
          callback();
        }
      });
    }

    var invalidate = function(){
      var reqID = "grunt_api_deploy_" + parseInt(Math.random()*1000000000, 10);
      var paths = [];
      for(var k in files){
        paths.push(files[k]);
      }
      cf.createInvalidation(distribution, reqID, paths, function(err, invalidation){
        if (err){
          console.log(err);
        } else {
          console.log("Invalidation request " + reqID + " sent to CloudFront, this may take as long as 15 minutes to complete.");
        }
        done();
      });
    };

    for(var key in files){
      var src = key;
      var dest = files[src];
      counter ++;
      doUpload(src, dest, headers, 0, syncPoint(src, dest, bucket, invalidate));
    }
  });

  // Default task.
  grunt.registerTask('default', ['jshint', 'filecheck', 'concat', 'uglify', 'buster', 'cssmin']);
  grunt.registerTask('all', ['default', 's3deploy']);
  grunt.registerTask('local', ['concat', 'uglify', 'cssmin']);
  grunt.registerTask('l', 'jshint');
};