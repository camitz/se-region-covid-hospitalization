const scraperApp = require('./scraperApp');
const http = require('http');
const hostname = '127.0.0.1';
const port = 3000;
const fs = require('fs')
const jsdom = require('jsdom')
const { JSDOM } = jsdom;



const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World');


});


fs.readFile('./Noname.html', 'utf8' , (err, data) => {
  if (err) {
	console.error(err)
	return
  }

  let dom = new JSDOM(data, {
		  url: "https://example.org/",
		  referrer: "https://example.com/",
		  contentType: "text/html",
		  includeNodeLocations: true,
		  storageQuota: 10000000
		});

//	WIN.location = {protocol:'https'};
	global.window = dom.window;
	//console.log(global.window);

	server.listen(port, hostname, () => {
	  console.log(`Server running at http://${hostname}:${port}/`);
	});

	new scraperApp().scrapeAll();	
})
