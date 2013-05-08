var $ = require('jquery');
var fs = require('fs');
var async = require('async');
var moment = require('moment');
var MongoClient = require('mongodb').MongoClient;

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

  if(selector.indexOf('-state-canceled') > 0) {
    state = 'canceled';
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

function importProjects(projects, callback) {
  MongoClient.connect("mongodb://localhost/kickdata", function(err, db) {
    if(err) { return console.dir(err); }

    var collection = db.collection('projects');

    collection.insert(projects, function(err) {

      if(err) {
        console.dir(err);
      }
      console.log('Done');
      callback();
    });
  });
}

process.on('message', function(m) {

  var projects = [];

  console.log('Batch ' + m.index + '/' + m.totalChunks);

  async.eachSeries(m.chunk, function(item, callback) {
    parseHtml(item, function(obj) {
      console.log('  Importing ' + item);
      projects.push(obj);
    });

    callback();

  }, function() {
    importProjects(projects, function() {
      process.send({status: 'success'});
    });
  });
});
