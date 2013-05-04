var request = require('request');
var sleep = require('sleep');
var _ = require('underscore');
var $ = require('jquery');
var fs = require('fs');

var outFile = 'projects.txt'
var startIndex = 0;
var sleepTime = 4;

if(process.argv[2]) {
  console.log('OutFile: ' + process.argv[2]);
  outFile = process.argv[2];
}

if(process.argv[3]) {
  console.log('StartIndex: ' + process.argv[3]);
  startIndex = process.argv[3];
}

if(process.argv[4]) {
  console.log('SleepTime: ' + process.argv[4]);
  sleepTime = process.argv[4];
}

function generateQueries() {
  var characters = []
  for (var i = 0; i < 26; i ++) {
    characters.push(String.fromCharCode(i+97))
  }
  var queries = []
  _.each(characters,function(a) {
    _.each(characters,function(b) {
      queries.push(a + b)
    })
  })
  return _.map(queries, function(q) {
    return 'http://www.kickstarter.com/projects/search.json?utf8=%E2%9C%93&term=' + q;
  })  
}

function addProject(path) {
  fs.appendFile(outFile,'http://www.kickstarter.com/' + path + "\n")
}

function scrapeBase(queries,i) {
  console.log("Scraping sequence " + i)
  var firstQuery = _.first(queries)
  var restQueries = queries.slice(1)
  scrapeQuery(firstQuery,1,function() {
    scrapeBase(restQueries,i+1);
  });
}

function scrapeQuery(query,page,callback) {
  scrapeProjects(query + "&page=" + page,function(projects) {
    if (projects.length > 0) {
      _.each(projects,function(project) {
        addProject(project)
      });
      sleep.sleep(sleepTime);
      scrapeQuery(query,page+1,callback);
    } else {
      console.log("No more projects for query " + query)
      callback()
    }
  });   
}  

function scrapeProjects(url,handler) {
  console.log("Fetching projects from " + url)
  request(url, function (error, response, body) {
    var projectsSource = JSON.parse(body).projects
    var projectNames = _.map(projectsSource,function(p) { 
      return $('.project-thumbnail a',$(p.card_html)).attr('href')
    });
    handler(projectNames)
  });
}

console.log("Beginning project scrape at index " + startIndex)
var queries = generateQueries();

scrapeBase(queries.slice(startIndex),0);


