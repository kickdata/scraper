var _ = require('underscore');
var $ = require('jquery');
var fs = require('fs');
var moment = require('moment');
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/kickdata');

var dataDir = 'data'

var pledgeSchema = new mongoose.Schema({ pledge: String, backers_count: Number, unit: String });

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
  status: Array,
  backers: [
    {
      name: String, 
      location: String
    }
  ],
  pledges: [pledgeSchema]
});

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

function getProjectStatus(data) {
  return JSON.parse($('#moneyraised div[data-evaluation="true"]', data).has('#banner').attr('data-conditions'))
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
    console.log(JSON.stringify(p));
    return p;
  })
}

fs.readdir(dataDir, function(err,files) {
  var htmlFiles = _.reject(files,function(f) { return !f.endsWith('.html')} )
  _.each(htmlFiles,function(file) {
    var path = dataDir + "/" + file
    console.log("Importing " + file)
    fs.readFile(path, {'encoding': 'utf-8'}, function (err, data) {
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

      //TODO read backers from sub-page
      // backers: getBackers(data),

      project.save(function (err) {
        if (err) console.log('Error ' + err);
      });
      console.log("Done")
      return true
    })
  });
})

mongoose.disconnect()