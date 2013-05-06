var _ = require('underscore');
var $ = require('jquery');
var fs = require('fs');
var path = require('path');
var moment = require('moment');
var MongoClient = require('mongodb').MongoClient;

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

function getProjectStatus(data) {
  var selector = $('#main_content', data).attr('class');
  var state = 'unknown';

  if(selector.indexOf('-state-successful') > 0) {
    state = 'successful';
  }

  if(selector.indexOf('-state-live') > 0) {
    state = 'live';
  }

  if(selector.indexOf('-state-failed') > 0) {
    state = 'failed';
  }
  return state;
}

function getBackers(data) {
  return $('.NS_backers__backing_row', data).map(function() {
    var b = {};
    b.name = $('.meta h5 a', this).text();
    b.profile = $('.meta h5 a', this).attr('href');
    b.location = $('.location', this).text().trim();
    return b;
  });
}

function getPledges(data) {
  var result = [];

  $('#what-you-get li', data).each(function() {
    var p = {};
    p.pledge=$('h5', this).text().substring(8).split(' ')[0];
    p.unit = $('h5', this).text().substring(7, 8);
    p.backers_count= $('.num-backers', this).text().trim().split(' ')[0];
    result.push(p);
  });
  return result;
}

function getHtmlFiles(dataDir, callback) {
  fs.readdir(dataDir, function(err,files) {
    var htmlFiles = _.reject(files,function(f) { return !f.endsWith('.html') || f.endsWith('__backers.html');} );
    htmlFiles = _.map(htmlFiles, function(file) {
      return path.join(dataDir,file);
    });
    callback(htmlFiles);
  });
}

function parseHtml(file, callback) {
    var fileContent = fs.readFileSync(file, {'encoding': 'utf-8'});
    var data = $(fileContent);

    var project = {
      title: $('#title a',data).text(),
      creator: $('.creator', data).text().trim().substring(3),
      category: $('.category', data).attr('data-project-parent-category'),
      location: $('.location:first a', data).text().trim(),
      start: moment($('.posted', data).text().trim().substring(10)).toJSON(),
      end: moment($('.ends', data).text().trim().substring(10)).toJSON(),
      last_update: moment().toJSON(),
      pledged: {
        goal: $('#pledged', data).attr('data-goal'),
        percent_raised: $('#pledged', data).attr('data-percent-raised'),
        pledged: $('#pledged', data).attr('data-pledged'),
        currency: $('#pledged data', data).attr('data-currency')
      },
      status: getProjectStatus(data),
      pledges: getPledges(data)
    };

    //TODO
    // var backersFileContent = fs.readFileSync(file.replace(path.extname(file), '') + '__backers.html', {'encoding': 'utf-8'});
    // project.backers = getBackers($(backersFileContent));
    callback(project);
}

function importProject() {
  MongoClient.connect("mongodb://localhost/kickdata", function(err, db) {
    if(err) { return console.dir(err); }

    var collection = db.collection('projects');

    collection.insert(project, function(err) {

      if(err) {
        console.dir(err);
        process.exit();
      }
      console.log('Done');
    });

    if(obj.index === obj.totalFiles) {
      db.close();
    }

  });

}

function createChunks(files, callback) {
  var htmlFiles = _.reject(files,function(f) { return !f.endsWith('.html') || f.endsWith('__backers.html');} );
  _.each(htmlFiles.chunk(100), function(part, index) {
    callback(part, index);
  });
}


getHtmlFiles(dataDir, function(files) {

  createChunks(files, function(chunk, index) {

    console.log('Chunk ' + index);

    _.each(chunk, function(file) {

        console.log('Importing ' + file);

    //     parseHtml(file, function(project) {

    //     });
    });

  });




  // console.log("Importing " + obj.file + ' (' + obj.index + '/' + obj.totalFiles + ')' );

  

});




