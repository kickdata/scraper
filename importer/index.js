var _ = require('underscore');
var $ = require('jquery');
var fs = require('fs');
var path = require('path');
var moment = require('moment');
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/kickdata');

var dataDir = 'data'

if(process.argv[2]) {
  dataDir = process.argv[2];
  console.log('Datadir: ' + dataDir);
}

var pledgeSchema = new mongoose.Schema({ pledge: String, backers_count: Number, unit: String });
var backerSchema = new mongoose.Schema({ name: String, location: String, profile: String });

var Project = mongoose.model('Project', { 
  title: String,
  creator: String,
  category: String,
  location: String, 
  start: Date, 
  end: Date, 
  last_update: Date, 
  pledged: {
    goal: Number,
    percent_raised: Number,
    pledged: Number,
    currency: String
  },
  status: String,
  backers: [backerSchema],
  pledges: [pledgeSchema]
});

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
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
  })
}

function getPledges(data) {
  return $('#what-you-get li', data).map(function() {
    var p = {}; 
    p.pledge=$('h5', this).text().substring(8).split(' ')[0];
    p.unit = $('h5', this).text().substring(7, 8);
    p.backers_count= $('.num-backers', this).text().trim().split(' ')[0]; 
    return p;
  })
}

function readDetails(detailPages) {
   if (detailPages.length <= 0) {
    mongoose.disconnect()
    return;
   }
   detailPageFile = _.first(detailPages);
   fs.readFile(detailPageFile, {'encoding': 'utf-8'}, function (err, data) {
      console.log("Importing " + detailPageFile)
      var data = $(data)
      var project = new Project({ 
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
        status: getProjectStatus(data)
      });

      _.each(getPledges(data), function(item) {
        project.pledges.push(item);
      });

      fs.readFile(detailPageFile.replace(path.extname(detailPageFile), '') + '__backers.html', {'encoding': 'utf-8'}, function(err, data) {
          var data = $(data);

          _.each(getBackers(data), function(item) {
            console.log(item);
            project.backers.push(item);
          });

          project.save(function (err) {
            if (err) console.log('Error ' + err);
            console.log("Done")
            readDetails(detailPages.slice(1))
          });

      });
    })  
}

fs.readdir(dataDir, function(err,files) {
  var htmlFiles = _.reject(files,function(f) { return !f.endsWith('.html') || f.endsWith('__backers.html')} )
  var detailPages = _.map(htmlFiles,function(file) { return dataDir + "/" + file; });
  readDetails(detailPages);
})

