var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var async = require('async');
var cp = require('child_process');


var dataDir = 'data';

if(process.argv[2]) {
  dataDir = process.argv[2];
  console.log('Datadir: ' + dataDir);
}

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

Array.prototype.chunk = function(chunkSize) {
    var array=this;
    return [].concat.apply([],
        array.map(function(elem,i) {
            return i%chunkSize ? [] : [array.slice(i,i+chunkSize)];
        })
    );
};

function getHtmlFiles(dataDir, callback) {
  fs.readdir(dataDir, function(err,files) {
    var htmlFiles = _.reject(files,function(f) { return !f.endsWith('.html') || f.endsWith('__backers.html');} );
    htmlFiles = _.map(htmlFiles, function(file) {
      return path.join(dataDir,file);
    });
    callback(htmlFiles.slice(0, 200));
  });
}

function createChunks(files, callback) {
  _.each(files.chunk(100), function(part, index) {
    callback(part, index);
  });
}

function importProject(chunk, index, callback) {
  
  var n = cp.fork(__dirname + '/import.js');
  n.send({ chunk: chunk, index: index });

  n.on('message', function(m) {
    console.log('PARENT got message:', m);
    callback();
  });
}

var tasks = [];

getHtmlFiles(dataDir, function(files) {

  createChunks(files, function(chunk, index) {
       tasks.push(function(callback) {
          importProject(chunk, index, function() {
            callback();
          });
       });
  });
  
  async.waterfall(tasks, function(err, result) {
    console.log('Finished');
      if(err) {
        console.log('Err:' + err);
      }
      process.exit();

  });

});







