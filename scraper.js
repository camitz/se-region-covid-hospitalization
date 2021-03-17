const jQuery = require('jquery');
const $=jQuery;
const moment = require('./moment.js')
const pdfjsLib = require('pdfjs-dist')

if (typeof $.ajaxPrefilter !== 'undefined')
	$.ajaxPrefilter( function (options) {
	  if (options.crossDomain && jQuery.support.cors) {
		var http = (window.location.protocol === 'http:' ? 'http:' : 'https:');
		//var providers = ['//cors-anywhere.herokuapp.com/',"//cors-proxy.htmldriven.com/?url=","//cors.corsproxy.io/url=","//thingproxy.freeboard.io/fetch/"];
		//options.url = http + providers[3] + options.url;
		options.url = http + '//cors-anywhere.herokuapp.com/' + options.url;
	  }
	});


var WIN, corsproxy='//cors-anywhere.herokuapp.com/';

if (typeof document !== 'undefined' && document)
{
	WIN = window;
}

class Scraper{
	constructor(url){
		if(url) {
			var a = WIN.document.createElement('a');
			a.href=url;
			if(a.protocol=="file:") {
    			var m = a.pathname.match(/(?<=:)\/.+/);
				this._path = m[0].substr(1);
			}else {
				this._path = url;
				this._baseUrl = url;
			}
		}
		
		if(typeof global !== 'undefined' && global.window){
			WIN = global.window;
			//corsproxy = "";
		}
	}

	get url(){
		if(this._path){
			var a = WIN.document.createElement('a');
			a.href=this._baseUrl;
			if(!this._path.startsWith("http")){
                this._baseUrl = `${a.protocol}//${a.host}/${this._path}`;
			} else {
                this._baseUrl = this._path;
			}
            this._path=null;
		}
		return this._baseUrl;
	}

	do(){
		return new Promise((resolve,reject)=>{
			var me = this;
			try {
				this.scrape()
				    .then(function(r){me.produceRow(r);},function(r){me.produceError(r);})
				    .then(r=>resolve(me));
			} catch(e){
				console.log(e);
				me.produceError();
				reject(me);
			} 
        });
	}

	scrape(){
		var me = this;
		var url = this.url;
		var http = (WIN.location.protocol === 'http:' ? 'http:' : 'https:');
		if(corsproxy)
			corsproxy = http + corsproxy;
		url = corsproxy + url;

		if(this.url.endsWith(".pdf")){			
			if(me.getpdfelements)
		        return me.getpdfelements(url).then(items=>me.parse(items));

		    
		    return me.getpdftext(url).then(items=>me.parse(items));
		}

		if(this.url.endsWith(".pptx")){			
			if(me.getpptxelements)
		        return me.getpptxelements(url).then(items=>me.parse(items));
		}

		if(this.parseS3mail){
			return this.parseS3mail();
		}

		if(this.parseXls)
		    return this.parseXls(url);
		

		return new Promise((resolve,reject)=>{
			$.ajax({
				url : this.url,
				success : function(result){
					try {
						var parsed;
						if(me.parse){
							var parser = new DOMParser();   
							var xmlDoc = parser.parseFromString(result,"text/html");
							parsed=me.parse(xmlDoc);
						}        
						else if(me.parseCsv)
							parsed = me.parseCsv(result);
						else
							parsed = me.parseJson(result);
                        
                        if(parsed[0])
                            parsed[0].set('year', 2020);

                        if(!me.dates){
                        	me.dates=[parsed[0]];
                        	me.inls=[parsed[1]];
                        	me.ivas=[parsed[2]];
                        }
						resolve(parsed);
					}catch(e){
						console.log(e);
						reject(e);
					}
				},
				error: function(c,s,e)    {
					console.log("xhr:"+s+"|"+e);
					reject("xhr:"+s+"|"+e);
				}
			});
		});
    }

    _dates=null;

    get dates(){
    	return this._dates;
    }

    set dates(value){
    	this._dates = value.map(x=>moment(x));
    }

     produceRow(result){
     	var row = WIN.document.createElement('tr');
			row.innerHTML = `<td>${this.name}</td>`;
				var date,iva,inl,raw,t,url;   
        	[date, inl, iva, raw,url] = result;
            row.innerHTML += `<td>${date.format('D MMMM').replace(" ","&nbsp;")}</td><td>${inl}</td><td>${iva}</td><td>${raw}</td>`;
    		row.innerHTML += `<td><a href="${url?url:this.url}">${url?url:this.url}</td>`;
            WIN.document.getElementById("p").appendChild(row);		
     }

     produceError(result){
     	var row = WIN.document.createElement('tr');
			row.innerHTML = `<td>${this.name}</td>`;
    		row.innerHTML += `<td>Fel!</td><td>${result}</td><td></td><td></td>`;
    		row.innerHTML += `<td><a href="${this.url}">${this.url}</td>`;
            WIN.document.getElementById("p").appendChild(row);		
            console.error(result);
     }

	

	get ordinals(){
		return ['noll','ett','två','tre','fyra','fem','sex','sju','åtta','nio','tio','elva','tolv','tretton','fjorton','femton','sexton','sjutton','arton','nitton'];
	  }
	ordinalOrNumber(s){
        var r = this.ordinals.indexOf(s.toLowerCase().replace("en","ett"));
		return r == -1 ? s*1 : r;
	}

	

	getpdftext(pdfUrl){
	  var pdf = pdfjsLib.getDocument(pdfUrl);
	  return pdf.promise.then(function(pdf) { // get all pages text
		var maxPages = pdf._pdfInfo.numPages;
		var countPromises = []; // collecting all page promises
		for (var j = 1; j <= maxPages; j++) {
		  var page = pdf.getPage(j);

		  var txt = "";
		  countPromises.push(page.then(function(page) { // add page promise
			var textContent = page.getTextContent();
			return textContent.then(function(text){ // return content promise
			  return text.items;
			});
		  }));
		}
		// Wait for all pages and join text
		return Promise.all(countPromises);
	  });
	}

	b64DecodeUnicode(s) {
		// Going backwards: from bytestream, to percent-encoding, to original string.
		return decodeURIComponent(atob(s.replace("?=","")).split('').map(function(c) {
			return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
		}).join(''));
	};

}

module.exports = Scraper