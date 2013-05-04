var _ = require('underscore');
var $ = require('jquery');
var fs = require('fs');
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/kickdata');

var dataDir = 'data'

var Project = mongoose.model('Project', { 
  title: String 
});

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

fs.readdir(dataDir, function(err,files) {
  var htmlFiles = _.reject(files,function(f) { return !f.endsWith('.html')} )
  _.each(htmlFiles,function(file) {
    var path = dataDir + "/" + file
    console.log("Importing " + file)
    fs.readFile(path, {'encoding': 'utf-8'}, function (err, data) {
      var data = $(data)
      var project = new Project({ 
        title: $('#title a',data).text() 
      });
      project.save(function (err) {
        if (err) console.log('Error ' + err);
      });
      console.log("Done")
      return true
    })
  });
})

mongoose.disconnect()