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
    callback(htmlFiles);
  });
}

function createChunks(files, callback) {
  var chunks = files.chunk(100);
  _.each(chunks, function(part, index) {
    callback(part, index, chunks.length);
  });
}

function importProject(chunk, index, totalChunks, callback) {
  
  var n = cp.fork(__dirname + '/import.js');
  n.send({ chunk: chunk, index: index, totalChunks: totalChunks });

  n.on('message', function(m) {
    n.kill();
    callback();
  });

}

var tasks = [];

getHtmlFiles(dataDir, function(files) {

  createChunks(files, function(chunk, index, totalChunks) {
       tasks.push(function(callback) {
          importProject(chunk, index, totalChunks, function() {
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







