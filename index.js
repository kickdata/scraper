var request = require('request');
var sleep = require('sleep');
var _ = require('underscore');
var $ = require('jquery')

var maxPage = 1; // The maximum page number to crawl
var projects = {};

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

var projects = {}
function addProject(name) {
  if (projects[name] == undefined) {
    console.log("  Project " + name + " addded")
    projects[name] = true
  } else {
    console.log("  Project " + name + " already known")
  }
}

function scrapeQuery(query,page) {
  scrapeProjects(query + "&page=" + page,function(projects) {
    if (projects.length > 0) {
      _.each(projects,function(project) {
        addProject(project)
      });
      sleep.sleep(5);
      scrapeQuery(query,page+1);
    } else {
      console.log("No more projects for query " + query)
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

console.log("Generating URLs")
var queries = generateQueries();
var query = _.first(queries)
scrapeQuery(query,1);

var http = require('http');

// Configure our HTTP server to respond with Hello World to all requests.
var server = http.createServer(function (request, response) {
  response.writeHead(200, {"Content-Type": "text/plain"});
  response.end("Hello World\n");

  
});

// Listen on port 8000, IP defaults to 127.0.0.1
server.listen(8001);





