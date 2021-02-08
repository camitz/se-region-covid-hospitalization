AWS.config.region = 'eu-north-1'; // Region
AWS.config.credentials = new AWS.Credentials('AKIAUQDSUWQ4Z55VNFPI', 'kpDmVzfJrjRcr4uhSMzcOPycZhkYST4B3Uj2Vp2J');


var text, parser, xmlDoc;
moment.locale('sv');
var momentPrototype = moment;
moment = function(s, format = false){
	if(!s)
	    return momentPrototype(s, format);
    
    if(typeof(s)==="string"){
		s=s.replace(/\s/," ");
		if(/[a-z]{3,}/gi.test(s)){
			s=s.replace(/[a-z]{3,}/gi, (m,p1)=>m.substr(0,3).replace("okt","oct").replace("maj","may"));
		}
    }
	return momentPrototype(s, format);
}

$.ajaxPrefilter( function (options) {
  if (options.crossDomain && jQuery.support.cors) {
    var http = (window.location.protocol === 'http:' ? 'http:' : 'https:');
    //var providers = ['//cors-anywhere.herokuapp.com/',"//cors-proxy.htmldriven.com/?url=","//cors.corsproxy.io/url=","//thingproxy.freeboard.io/fetch/"];
    //options.url = http + providers[3] + options.url;
    options.url = http + '//cors-anywhere.herokuapp.com/' + options.url;
  }
});


class Scraper{
	constructor(url){
		if(url) {
			var a = document.createElement('a');
			a.href=url;
			if(a.protocol=="file:") {
    			var m = a.pathname.match(/(?<=:)\/.+/);
				this._path = m[0].substr(1);
			}else {
				this._path = url;
				this._baseUrl = url;
			}
		}
	}

	get url(){
		if(this._path){
			var a = document.createElement('a');
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
		var http = (window.location.protocol === 'http:' ? 'http:' : 'https:');
		url = http + '//cors-anywhere.herokuapp.com/' + url;

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
							parser = new DOMParser();   
							xmlDoc = parser.parseFromString(result,"text/html");
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
     	var row = document.createElement('tr');
			row.innerHTML = `<td>${this.name}</td>`;
				var date,iva,inl,raw,t,url;   
        	[date, inl, iva, raw,url] = result;
            row.innerHTML += `<td>${date.format('D MMMM').replace(" ","&nbsp;")}</td><td>${inl}</td><td>${iva}</td><td>${raw}</td>`;
    		row.innerHTML += `<td><a href="${url?url:this.url}">${url?url:this.url}</td>`;
            document.getElementById("p").appendChild(row);		
     }

     produceError(result){
     	var row = document.createElement('tr');
			row.innerHTML = `<td>${this.name}</td>`;
    		row.innerHTML += `<td>Fel!</td><td>${result}</td><td></td><td></td>`;
    		row.innerHTML += `<td><a href="${this.url}">${this.url}</td>`;
            document.getElementById("p").appendChild(row);		
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


}

String.prototype.b64DecodeUnicode = function() {
		// Going backwards: from bytestream, to percent-encoding, to original string.
		return decodeURIComponent(atob(this.replace("?=","")).split('').map(function(c) {
			return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
		}).join(''));
	};

/*
class Varmland extends Scraper{
    _baseUrl = 'https://www.regionvarmland.se/halsa-och-vard/coronavirus---covid-19/aktuellt-lage-i-varmland--covid-19/';

	get name() {
    return 'Värmland';
  }
  parse(xmlDoc){
        var raws=[],i,dates=[],inls=[],ivas=[];


        var t = xmlDoc.evaluate('//div[@class="EditorContent"]//h2', xmlDoc);

        while(i = t.iterateNext()) {
        	if(/Lägesbild\s[a-zåäö]+\s(den)?/gi.test(i.innerText)){
				var raw="",i,date,inl=-1,iva=-1,m;
				m = [...i.innerText.matchAll(/(den)?\s(\d+\s\w+)/gi)];
				if(m.length){
					raw+=i.innerText;
					date = m[0][2];
				}

                
				while (i=i.nextElementSibling){
					m = [...i.innerText.matchAll(/(\d+)\sinneliggande patienter som vårdas för covid-19 varav\s(\d+)\svårdas på IVA/gi)];
					if(m.length){
						raw+=i.innerText;
						inl = m[0][1]*1;
						iva = m[0][2]*1;
						continue;
					}
        	

					m = [...i.innerText.matchAll(/uppdatera\w\s(\d+ \w+)/gi)];
					if(m.length){
						raw+=i.innerText;
						date = m[0][1];
						break;
					}


					m = [...i.innerText.matchAll(/(\d+)+ patienter(,\svarav\s(\d+)\spå IVA)?/gi)];
					if(m.length && inl<0){
						iva=inl=0;
						for(const m1 in m){
							raw+=i.innerText;
							inl += m[m1][1]*1;
							if(m[m1].length>=4 && m[m1][3])
							    iva += m[m1][3]*1;
						}
					}

					if(i.tagName=="H2")
					    break;
				}

				raws.push(raw);
				dates.push(date);
				inls.push(inl);
				ivas.push(iva);

        	}
        };

        
        [this.dates,this.inls,this.ivas]=[dates.map(x=>moment(x).set('year',2020)).reverse(),inls.reverse(),ivas.reverse()];

        var l = this.dates.length-1;
        return [this.dates[l],this.inls[l],this.ivas[l],raw,this.url,raws,dates,inls,ivas];
  }
}
*/

class Varmland extends Scraper{
    _baseUrl = 'https://www.regionvarmland.se/halsa-och-vard/coronavirus---covid-19/aktuellt-lage-i-varmland--covid-19/';

	get name() {
        return 'Värmland';
	}
	
  parse(xmlDoc) {
        var node = xmlDoc.evaluate('//article[@id="content"]//div[@class="EditorContent"]//h2', xmlDoc);

       var raw = null,t, inl=null, iva=null,date;

       while(t = node.iterateNext()){
			var m = [...t.innerText.matchAll(/Lägesbild\s(den)?\s(\d+\s[a-z]+)/gi)];
			if(m.length){
				raw+=t.innerText;
				date = moment(m[0][2]);
				break;
            }
       }

        node = xmlDoc.evaluate('//article[@id="content"]//div[@class="EditorContent"]//li', xmlDoc);
       while(t = node.iterateNext()){
			var m = [...t.innerText.matchAll(/(\d+)\spatienter\svarav\s(\d+)\spå intensiv/gi)];
			if(m.length){
				raw+=t.innerText;
				inl = m[0][1]*1;
				iva = m[0][2]*1;
				break;
            }
       }

       if(!raw)
           throw("Nothing registered")


        return [date,inl,iva,raw];
  }
}

class Halland extends Scraper{
    _baseUrl = 'https://www.regionhalland.se/om-region-halland/smittskydd/information-om-det-nya-coronaviruset/laget-i-halland-covid-19/';

	get name() {
    return 'Halland';
  }

  parse(xmlDoc){
        var raw = xmlDoc.evaluate('//*[@id="main"]//time',xmlDoc,null,XPathResult.STRING_TYPE ).stringValue;


        var date = moment(raw);

        var check = xmlDoc.evaluate('//*[@id="main"]/article/table[1]/tbody/tr[4]/td[1]',xmlDoc,null,XPathResult.STRING_TYPE ).stringValue;

        if(!check.startsWith("Inlagda på Hallands sjukhus"))
            throw "Halland failed check."

        var inl = xmlDoc.evaluate('//*[@id="main"]/article/table[1]/tbody/tr[4]/td[2]',xmlDoc,null,XPathResult.STRING_TYPE ).stringValue;
        inl=inl.match(/\d+/)[0]*1;

        var iva = xmlDoc.evaluate('//*[@id="main"]/article/table[1]/tbody/tr[5]/td[2]',xmlDoc,null,XPathResult.STRING_TYPE ).stringValue;        
        iva=iva.match(/\d+/)[0]*1;
        
        var raw = xmlDoc.evaluate('//*[@id="main"]/article/table[1]',xmlDoc,null,XPathResult.STRING_TYPE ).stringValue;

        return [date,inl,iva,raw];
  }
}

class VG extends Scraper{
    _baseUrl = 'https://www.vgregion.se/covid-19-corona/statistik-covid-19-i-vastra-gotaland/';

	get name() {
    return 'Västra götaland';
  }

  parse(){
        var t = xmlDoc.evaluate('//*[@id="main-content"]/div[1]/div[1]/div/div//p', xmlDoc);

        var raw="",i,date,inl,iva;
        while(i = t.iterateNext()){
        	var m = [...i.innerText.matchAll(/Den\s(\d+\s\w+)\skl\.\s[0-9:]+\sfanns det totalt\s(\d+)\sinneliggande patienter med positiv covid-19, varav\s(\d+)/gi)];
        	if(m.length){
            	raw += i.innerText;
               date = m[0][1];
               inl = m[0][2]*1;
               iva = m[0][3]*1;
        	    break;
        	}

        };

        var raw = raw.substr(0,300);
        var date = moment(date);
                
        return [date,inl,iva,raw,this.url];
  }
}


class VG2 extends Scraper{
    _baseUrl = 'https://e.infogram.com/1pyyqv6pym1kd0c3w23qk6jj0ety91y3nwp?src=embed';

	get name() {
    return 'Västra götaland';
  }

  parse(){       
        var t = xmlDoc.evaluate('//script', xmlDoc);

        var raw="",i,date,inl,iva,m;
        while(i = t.iterateNext()){
        	if(i.innerText.indexOf('window.infographicData')===-1)
        	    continue;

            try{
            	eval(i.innerText);
            }catch{
            }

            var dataObject = window.infographicData;            
            var key = Object.keys(dataObject.elements.content.content.entities)[1];
            dataObject = dataObject.elements.content.content.entities[key];
            dataObject=dataObject.props.chartData.data[0].slice(1);
            var l = dataObject.length;
            
            this.dates = dataObject.map(x=>moment(x[0].replace("-"," ")).set("year",2020));
            this.inls = dataObject.map(x=>x[1]*1);
            this.ivas = dataObject.map(x=>x[2]*1);

			return [this.dates[l-1],this.inls[l-1],this.ivas[l-1],JSON.stringify(dataObject).replaceAll("SAKNAS","na").replaceAll("#na!","na"),
			        this.url, i.innerText,this.dates,
				this.inls,
				this.ivas,
			];
        };
  }
}


class Vastmanland extends Scraper{
//    _baseUrl = 'https://regionvastmanland.se/uppdateringar-fran-region-vastmanland-om-covid-19/lagesbild-arkiverad/';
    _baseUrl = 'https://regionvastmanland.se/uppdateringar-fran-region-vastmanland-om-covid-19/lagesbild-daglig/';

	get name() {
    return 'Västmanland';
  }

  parse(xmlDoc){
        var t = xmlDoc.evaluate('//script', xmlDoc);

        var raw="",i,date,inl,iva,m;
        while(i = t.iterateNext()){
        	if(i.innerText.indexOf('ns50240.dataObject')===-1)
        	    continue;

            var ns50240;
            var script = i.innerText.replace('var ns50240','ns50240');
            try{
            	eval(script);
            }catch{
            }
            var dataObject = ns50240.dataObject;

            var l = dataObject.labels.length;
            date = dataObject.labels[l-1];

            var f= x=>isNaN(x)?0:(x*1);
            iva = f(dataObject.data2[l-1]);//+f(dataObject.data3[l-1]); //27/5
            inl = f(dataObject.data1[l-1])+iva;

            break;

        };

        var raw = raw.substr(0,400);
        var date = moment(date, "DD MMM");
        var inls = dataObject.data2.map((x,i)=>f(x)/*+f(dataObject.data3[i])*/+f(dataObject.data1[i]));
        var ivas = dataObject.data2.map((x,i)=>f(x)/*+f(dataObject.data3[i]*/);

        [this.dates,this.inls,this.ivas]=[dataObject.labels.map(x=>moment(x).set('year',2020)),inls,ivas];
                
        return [date,inl,iva,raw,this.url, raw,dataObject.labels,
            inls,
            ivas,
        ];
  }
}


class Blekinge extends Scraper{
    _baseUrl = 'https://regionblekinge.se/halsa-och-vard/for-vardgivare/smittskyddsenheten/information-om-coronaviruset.html';

	get name() {
    return 'Blekinge';
  }

  parse(xmlDoc){
        var raw = xmlDoc.evaluate('//*[@id="svid12_2cd827be170f3b15ca913afb"]/div[2]//table', xmlDoc).iterateNext();
        raw = "<table>"+raw.innerHTML+"</table>";

        var node = xmlDoc.evaluate('//*[@id="svid12_2cd827be170f3b15ca913afb"]/div[2]//table/tbody/tr/td', xmlDoc);
        var t = node.iterateNext();
        var t = node.iterateNext();

        var inl = t.innerText.match(/\d+/)[0]*1;
        var iva = t.innerText.match(/\((\d+)/)[1];

        var date = xmlDoc.evaluate('//*[@id="svid12_2cd827be170f3b15ca913af1"]//h2', xmlDoc).iterateNext().innerText.match(/den (\d{1,2} \w+)/)[1];
        date = moment(date);

        return [date,inl,iva,raw];
  }
}



class Sormland extends Scraper{
    _baseUrl = 'https://regionsormland.se/halsa-vard/information-om-coronaviruset-covid-19/';

	get name() {
    return 'Sörmland';
  }

  parse(xmlDoc){
        var t = xmlDoc.evaluate('//*[@id="content"]/div[1]//p', xmlDoc);

        var raw,t1,i;
        while(i=t.iterateNext()) {
        	raw = i.innerText;
            t1 = [...raw.matchAll(/(\d\d?\s+\w+):\s(\d+).+?\.\s\s?Av dessa får ([a-zåäö]+|\d+)/gi)];
            if(t1.length)
                break;
        }
        t1=t1[0];
        var inl = t1[2]*1;
        var iva = this.ordinalOrNumber(t1[3]);

        var t2 = [...raw.matchAll(/Ingen av dessa patienter får intensivvård/gi)];
        if(t2.length)
            iva=0;

        var date = moment(t[1]);

        return [date,inl,iva,raw];
  }
}

class Norrbotten extends Scraper{
    _baseUrl = 'https://www.google.com/';

	get name() {
    return 'Norrbotten';
  }

  parse(xmlDoc){
  	    var me = this;
  	    var weekly = new Norrbotten2();
  	    
       return Promise.all([
           weekly.scrape().then(function(v){
           	[this.dates,this.ivas,this.inls]=[weekly.dates,weekly.ivas,weekly.inls];
           	return v;
           }.bind(this),weekly), (new NorrbottenDaily()).scrape()
       ]).then(values=>{
       	console.log(values);
       	return values[1];
       });
  }
}



class NorrbottenDaily extends Scraper{
    _baseUrl = 'https://www.norrbotten.se/sv/Halsa-och-sjukvard/Smittskydd-i-Norrbotten/Information-om-nya-coronaviruset/';

	get name() {
    return 'Norrbotten';
  }

  parse(xmlDoc){
        var t = xmlDoc.evaluate('//*[@id="rs_read_text"]/div[2]/*', xmlDoc);

        var raw="",i,date,inl,iva,m;
        while(i = t.iterateNext()){
        	raw += i.innerText;


        	m = [...i.innerText.matchAll(/vårdas\s(\d+)\spersoner med covid-19 på sjukhus i länet,\s(varav\s)?(\d+)/gi)];
        	if(m.length){
        	    inl = m[0][1]*1;
        	    iva = m[0][3]*1;
        	    continue;
        	}
        	

        	m = [...i.innerText.matchAll(/Uppdaterat\s(\d+ \w+)/g)];
        	if(m.length){
        	    date = m[0][1];
        	    break;
        	}
        };

        var raw = raw.substr(0,300);
        var date = moment(date);
                
        return [date,inl,iva,raw,this.url];
  }
}


class Skane extends Scraper{
    _baseUrl = 'https://www.google.com/';

	get name() {
    return 'Skåne';
  }

  parse(xmlDoc){
  	    var me = this;
  	    var weekly = new SkaneWeekly();
  	    
       return Promise.all([
           weekly.scrape().then(function(v){
           	[this.dates,this.ivas,this.inls]=[weekly.dates,weekly.ivas,weekly.inls];
           	return v;
           }.bind(this),weekly), (new SkaneDaily()).scrape()
       ]).then(values=>{
       	console.log(values);
       	return values[1];
       });
  }
}



class SkaneWeekly extends Skane{
    _baseUrl = 'https://www.skane.se/digitala-rapporter/lagesbild-covid-19-i-skane/fordjupad-lagesbild/';


  parse(xmlDoc){
              var t = xmlDoc.evaluate('//script', xmlDoc);

        var raw="",i,date,inl,iva,m;
        while(i = t.iterateNext()){
        	if(i.innerText.indexOf('chart-block-seven-170352')===-1)
        	    continue;

            var excelData;
            var script = i.innerText;
            script = script.substring(0,script.indexOf("var categories")).substr(script.indexOf("var excelData")+4);
            try{
            	eval(script);
            }catch{
            }

            var l = excelData.Categories.length;
            date = excelData.Categories[l-1].name;
            this.dates = excelData.Categories.map(x=>moment(x.name));

            var f= x=>isNaN(x)?0:(x*1);
            iva = excelData.Series[1].data[l-1];
            this.ivas = excelData.Series[1].data;
            inl = excelData.Series[0].data[l-1]+iva;
            this.inls = excelData.Series[0].data.map((x,i)=>x+this.ivas[i]);

            raw = script;
            
            break;
        };

        date = moment(date);
                
        return [date,inl,iva,raw,this.url];
  }
}


class SkaneDaily extends Skane{
    _baseUrl = 'https://www.skane.se/digitala-rapporter/lagesbild-covid-19-i-skane/inledning/';

  parse(xmlDoc){
              var t = xmlDoc.evaluate('//script', xmlDoc);

        var raw="",i,date,inl,iva,m;
        while(i = t.iterateNext()){
        	if(i.innerText.indexOf('chart-block-seven-179283')===-1)
        	    continue;

            var excelData;
            var script = i.innerText;
            script = script.substring(0,script.indexOf("var categories")).substr(script.indexOf("var excelData")+4);
            try{
            	eval(script);
            }catch{
            }

            var l = excelData.Categories.length;
            date = excelData.Categories[l-1].name;
            this.dates = excelData.Categories.map(x=>moment(x.name));

            var f= x=>isNaN(x)?0:(x*1);
            iva = excelData.Series[1].data[l-1];
            this.ivas = excelData.Series[1].data;
            inl = excelData.Series[0].data[l-1]+iva;
            this.inls = excelData.Series[0].data.map((x,i)=>x+this.ivas[i]);

            raw = script;
            
            break;
        };

        date = moment(date);
                
        return [date,inl,iva,raw,this.url];
  }
}


class Uppsala extends Scraper{
    _baseUrl = 'https://via.tt.se/json/v2/releases?publisher=3235664';

	get name() {
    return 'Uppsala';
  }

  parseJson(result){
        var raw = result.releases.filter(x=>x.title.startsWith("Covid") && x.title.indexOf("Läget")>-1)[0];
        var date = moment(raw.title.match(/(\d\d? \w+)/gi)[0]);
        
        var t = document.createElement("div");
        t.innerHTML=raw.body;
        t= [...t.innerText.matchAll(/(\d+) personer med .+covid\s?-19\D+(\d+)/gi)][0];

        var inl = t[1]*1;
        var iva = t[2]*1;

        raw = (raw.title+raw.body).substr(0,300);
        

        return [date,inl,iva,raw];
  }
}


/*
class Jonkoping extends Scraper{
    _baseUrl = 'https://www.rjl.se/api/minanyheterlistblockitemapi?minanyhetertags=407&sincendays=500&listpage=51359&skipcache=true';

	get name() {
    return 'Jönköping';
  }

  parseJson(result){
        var raw = result.filter(x=>x.Heading.startsWith("Uppdatering om covid"))[0];
        //var t = RegExp('(\\d+)\\D+(\\d+ \\w+) \\d+.+?\\. ('+this.ordinals.reverse().join('|')+')').exec(raw.Preamble.toLowerCase());
        
        var date = moment(raw.MachineReadablePublishDateTimeString);

        var inl = raw.Preamble.match(/^(\d+)/)[1]*1;
        var iva = raw.Preamble.match(/([0-9a-zåäö]+) av patie/i)[1];
        iva = this.ordinalOrNumber(iva);

        return [date,inl,iva,raw.Preamble];
  }
}
*/

class Jonkoping extends Scraper{
    _baseUrl = 'https://www.rjl.se/om-oss/pressrum/aktuell-statistik-covid-19-i-jonkopings-lan/';

	get name() {
    return 'Jönköping';
  }

  parse(xmlDox){
        var node = xmlDoc.evaluate('//*[@id="main-content"]//p[@class="main-intro"]', xmlDoc).iterateNext();
        var raw = "<table>"+node.nextElementSibling.querySelector("table").innerHTML+"</table>";

        var rows = node.nextElementSibling.querySelectorAll("table:first-of-type tr");

        this.dates = [...rows].map(x=>moment(x.children[0].innerText)).slice(1).reverse();
        this.inls = [...rows].map(x=>x.children[1].innerText*1).slice(1).reverse();
        this.ivas = [...rows].map(x=>x.children[2].innerText=='-' ? 0 : x.children[2].innerText*1).slice(1).reverse();

        return [this.dates[this.dates.length-1],this.inls[this.dates.length-1],this.ivas[this.dates.length-1],raw];  
  }
}


class Vasterbotten extends Scraper{
    _baseUrl = 'https://coronarapportering.regionvasterbotten.se/CoronaRVBuppdat.csv';

  	get name() {
    return 'Västerbotten';
  }


  parseCsv(csv){
  	    csv = csv.substr(csv.indexOf("Datum;Bekr"));
  	    csv = csv.substr(csv.indexOf("\n")+1);

  	    var raw = $.csv.toArrays(csv);
  	    raw=raw.map(x=>x[0].split(";"));

        this.dates = raw.map(x=>moment(x[0])).reverse();
        this.inls = raw.map(x=>x[2]*1).reverse();
        this.ivas = raw.map(x=>x[3]*1).reverse();

        raw = raw[raw.length-1];
        var date = moment(raw[0]);
        
        var inl = raw[2]*1;
        var iva = raw[3]*1;

        return [date,inl,iva,raw];
  }
}


class Gotland extends Scraper{
    _baseUrl = 'https://www.gotland.se/nyhetsarkiv';

	get name() {
    return 'Gotland';
  }

  parse(xmlDoc){
        var t=xmlDoc.evaluate('//*[@id="newsItems"]/ul/li/article/a', xmlDoc);
        var i;
       
        do{
            i = t.iterateNext();
        }while(!i.querySelector('.news-header').innerText.trim().startsWith("Lägesrapport om covid"));
        var raw = i.innerText;

        var date = moment(i.querySelector('.news-date').innerText);
        
       var t = new GotlandSub(i.href);

       return t.scrape();

  }
}


class GotlandSub extends Gotland{

  parse(xmlDoc){
        var t=xmlDoc.evaluate('//*[@id="content"]/div[2]', xmlDoc);
        var raw = t.iterateNext().innerText.substr(0,1000);
        var date = moment([...raw.matchAll(/Publicerad ([0-9-]+)/g)][0][1]);


        try{
			if(raw.match(/För närvarande vårdas ingen person med sjukdomen covid-19 på Visby lasarett/gi))
				return [date,0,0,raw,this.url];
				
			if(raw.match(/Ingen patient med konstaterat covid-19 vårdas för närvarande på Visby lasarett/gi))
				return [date,0,0,raw,this.url];

            t = [...raw.matchAll(/([a-zåäö]+) person vårdas på Visby lasaretts intensivvårdsavdelning/gi)];
            if(t.length)
			    return [date,this.ordinalOrNumber(t[0][1]),this.ordinalOrNumber(t[0][2]),raw,this.url];
            
            t = [...raw.matchAll(/([a-zåäö]+) person med sjukdomen covid-19 vårdas på Visby lasaretts intensivvårdsavdelning/gi)];
            if(t.length)
			    return [date,this.ordinalOrNumber(t[0][1]),this.ordinalOrNumber(t[0][2]),raw,this.url];

			t = [...raw.matchAll(/På Visby lasarett vårdas för närvarande ([a-zåäö]+|\d+) patienter.*, varav ([a-zåäö]+|\d+)/gi)];
			if(t.length)
			    return [date,this.ordinalOrNumber(t[0][1]),this.ordinalOrNumber(t[0][2]),raw,this.url];

            var inl = -1;
			t = [...raw.matchAll(/\s([a-zåäö]+|\d+)\s(person|patient)(.*covid-19)?.*på (Visby lasarett|vårdavdelning)/gi)][0];
			if(t.length)
    			inl = this.ordinalOrNumber(t[1]);

			var iva =0;

			if(!raw.match(/men är inte i behov av i/gi) && !raw.match(/ingen (vårdas )?på i/gi)) {
				var t = [...raw.matchAll(/varav\s([a-zåäö]+|\d+)\spå intensiv/gi)];
				if (t.length)
					iva = this.ordinalOrNumber(t[0][1]);
				else if(inl<0)				    
					return [date,"recode", "recode",raw,this.url];
			}

			return [date,inl, iva,raw,this.url];
        } catch(e){
            return [date,"recode", "recode",raw,this.url];
        }
  }
}



class JH extends Scraper{
    _baseUrl = 'https://www.regionjh.se/';

	get name() {
    return 'Jämtland Härjedalen';
  }

  parse(xmlDoc){
        var t=xmlDoc.evaluate('//*[@id="svid12_43e32b9815b44bf8a8199f96"]/ul/li/a', xmlDoc);
        var i;
        do{
            i = t.iterateNext();
        }while(!i.innerText.trim().startsWith("Lägesrapport"));
       var t = new JHSub(i.href);

       return t.scrape();

  }
}


class JHSub extends JH{
  parse(xmlDoc){
        var t = xmlDoc.evaluate('//h1[@class="heading" and contains(@id,"h-Lagesrapport")]', xmlDoc).iterateNext();
        var raw = t.innerText,iva,inl;
        var date = moment(t.innerText.match(/\d\d-\d\d-\d\d/g)[0],"YY-MM-DD");
                
        t = t.parentElement.parentElement.nextElementSibling.innerText;
       
        var t2 = [...t.matchAll(/(\d+)(\sst)?,\singen på IVA/g)][0];
        if(t2)
            return [date,t2[1]*1,0,raw,this.url];

        var t2 = [...t.matchAll(/(\d+)(\sst)?,\sbåda på IVA/g)][0];
        if(t2)
            return [date,2,2,raw,this.url];

        t2 = [...t.matchAll(/(\d+)(\sstycken totalt)?(\spatienter)?,? varav ([a-zåäö0-9]+)/g)][0];
        if(t2)
            return [date,t2[1]*1,this.ordinalOrNumber(t2[4]),raw,this.url];
       
        t2 = [...t.matchAll(/(\d+) stycken på IVA/g)][0];
        if(t2)
            return [date,0,t2[1]*1,raw,this.url];
        
        t2 = [...t.matchAll(/Smittade patienter under sjukhusvård just nu: (\d+)/g)][0];
        if(t2){
        	var inl = t2[1]*1;
            t2 = [...t.matchAll(/st, varav (\d+) på IVA/gi)][0];
            var iva = t2[1]*1
            return [date,inl,iva,raw,this.url];        	
        }

        throw "Fel";
  }
}

class Kronoberg extends Scraper{
    _baseUrl = 'http://www.regionkronoberg.se/corona';

	get name() {
    return 'Kronoberg';
  }

  parse(xmlDoc){
        var table = xmlDoc.evaluate('//*[@id="content"]/div[1]/div', xmlDoc).iterateNext();
        var t = table.querySelectorAll('table td')[4].innerText;
        var raw = table.innerText.substr(0,300);

        var p = table.querySelector('p');

        var sel = "p~*", date = "";
        while(!date)
             date = table.querySelector(sel).innerText.match(/\d\d\d\d-\d\d-\d\d/), sel+="~*";
        
        date= moment(date[0]);

        var inl = t.match(/\d+/)[0]*1;
        var iva = t.match(/(?<=\()\d+/)[0]*1;

        return [date,inl,iva,raw];
  }
}


class Vasternorrland extends Scraper{
		_baseUrl = "https://www.rvn.se/sv/Vard-o-halsa/coronavirus---for-dig-som-vill-veta-mer/statistik-och-fakta/";

	get name() {
    return 'Västernorrland';
  }

  parse(xmlDoc){
        var t = xmlDoc.evaluate('//*[@id="main"]//section/div/p', xmlDoc);
        var raw="",i,date,inl,iva,m;

        while(i = t.iterateNext()){
        	raw += i.innerText;

        	m = [...i.innerText.matchAll(/Totalt antal som vårdas på sjukhus\:\s?(\d+)/gi)];
        	if(m.length){
        	    inl = m[0][1]*1;
        	    continue;
        	}

        	m = [...i.innerText.matchAll(/Antal som vårdas på IVA\:\s?(\d+)/gi)];
        	if(m.length){
        	    iva = m[0][1]*1;
        	    continue;
        	}
        	

        	m = [...i.innerText.matchAll(/Senast uppdatera[a-zåäö ]*(\d+\s\w+)\skl\./g)];
        	if(m.length){
        	    date = m[0][1];
        	    break;
        	}
        };

        var raw = raw.substr(0,300);
        var date = moment(date);
                
        return [date,inl,iva,raw,this.url];


                t.iterateNext();

        var raw ="";
        var iva = t.iterateNext().innerText;
        raw += iva;
        iva = iva.match(/\d+/)[0]*1;

        var inl = t.iterateNext().innerText;
        raw += inl;
        inl = inl.match(/\d+/)[0]*1+iva;

        t.iterateNext();
        var date = t.iterateNext().innerText;
        raw += date;
        date = moment(date.match(/(\d+ \w+)/)[0]);

        return [date,inl,iva,raw,this.url];
  }
}


/*
class Orebro extends Scraper{
    _baseUrl = 'https://www.regionorebrolan.se/';

	get name() {
    return 'Örebro';
  }

  parse(xmlDoc){
        var t=xmlDoc.evaluate('//*[@id="teasers"]//div//p', xmlDoc);
        var i;


        do{
            i = t.iterateNext();
        //}while(!/^Antal\sfall/gi.test(i.innerText.trim()));
        }while(!/^Senaste\ssiffrorna/gi.test(i.innerText.trim()));//ca 3 april

        var raw=i.innerText,inl,iva,date;
        //date = [...raw.matchAll(/Alla\sfall\si\sÖrebro\slän\s?[:–]?\s(\d+\s[a-z]+)/g)];
        date = [...raw.matchAll(/Senaste siffrorna för Örebro län den\s(\d+\s\w+)/g)];//3 maj ca
        date = date[0][1];
        date = date.replace(/\s/," ");
        date = moment(date);

        iva = [...raw.matchAll(/IVA\s\(utöver vårdavdelning\):?\s(\d+)/g)][0][1]*1;
        inl = [...raw.matchAll(/vårdavdelning\:?\s(\d+)/g)][0][1]*1 + iva;

        return [date,inl,iva,raw,this.url];

  }
}
*/
/*
class Orebro extends Scraper{
    _baseUrl = 'https://www.regionorebrolan.se/sv/Halsa-och-vard/Corona/';

	get name() {
    return 'Örebro';
  }

  parse(xmlDoc){
        var raw = xmlDoc.evaluate('//*[@id="article-inner"]/div[3]/table', xmlDoc).iterateNext();
        raw = "<table>"+raw.innerHTML+"</table>";

        var node = xmlDoc.evaluate('//*[@id="article-inner"]/div[3]/table/tbody/tr/td', xmlDoc);
        var t = node.iterateNext();
        var t = node.iterateNext();

        var inl = t.innerText.match(/\d+/)[0]*1;
        var t = node.iterateNext();
        var t = node.iterateNext();
        var t = node.iterateNext();

        var iva = t.innerText.match(/\d+/)[0]*1;
        inl+=iva;

        var date = xmlDoc.evaluate('//*[@id="article-inner"]/div[3]/h2[1]', xmlDoc).iterateNext().innerText;
        date = date.match(/(\d+\s\w+)$/)[1];
        date = moment(date);

        return [date,inl,iva,raw];
  }
}

*/


class Vastmanland2 extends Scraper{
    _baseUrl = '';

	get name() {
    return 'Västmanland';
  }

  parseS3mail(){

		var s3 = new AWS.S3({
		  apiVersion: '2006-03-01',
		  params: {Bucket: 'fhmbelaggningse'}
		});

		return s3.listObjectsV2({Bucket: 'fhmbelaggningse'}).promise().then(data=> {
			  var items = data.Contents.filter(x=>moment(x.LastModified).add(7,'days').isAfter(moment())).map(x=>x.Key);
			  return Promise.all(items.map(key=>s3.getObject({Bucket: 'fhmbelaggningse',Key:key}).promise()));
			})
			.then(objs=>{
				var from = objs.map(x=>x.Body.toString().match(/From:\s.*/i)[0]);
				var subjectRegex = /Subject:.*V=E4stmanland/;
				var t = objs.filter(x=>x.Body.toString().match(subjectRegex));
				if(!t.length)
				    return[moment(),'-','-',null];
				    
				t = t.sort((a,b)=>a.LastModified<b.LastModified?1:-1)[0].Body.toString();

                try {
					var raw = [...t.matchAll(/Dagens rapport ([\d-]+)/gi)][0][0];
					var date = [...t.matchAll(/Dagens rapport ([\d-]+)/gi)][0][1];
					date = moment(date);

					var inl = [...t.matchAll(/har idag (\d+) st inlagda varav (\d+)/gi)][0];
					raw += inl[0];
					var iva = inl[2]*1;
					inl = inl[1]*1;

					return [date, inl, iva, raw];
                }catch(e){
                        this.inls=[];
                        this.dates=[];
                        this.ivas=[];

                	var p = t.indexOf("Content-Type: text/plain");
                	var t = t.substr(p).split("\n");

                    p = t.findIndex(s=>s.match(/^\d{4}-\d{2}-\d{2}/gi), 0);
                	while(p>-1) {
                        this.dates.push(moment(t[p]));
                        this.inls.push(t[p+1]*1);
                        this.ivas.push(t[p+2]*1);
                        t.splice(p,3);
                        p = t.findIndex(s=>s.match(/^\d{4}-\d{2}-\d{2}/gi));
                	}

					return [this.dates[this.dates.length-1], this.inls[this.inls.length-1], this.ivas[this.ivas.length-1], raw];                	
                }
			});
  }
}

class Gavleborg extends Scraper{
    _baseUrl = '';

	get name() {
    return 'Gävleborg';
  }

  parseS3mail(){

		var s3 = new AWS.S3({
		  apiVersion: '2006-03-01',
		  params: {Bucket: 'fhmbelaggningse'}
		});

		return s3.listObjectsV2({Bucket: 'fhmbelaggningse'}).promise().then(data=> {
			  var items = data.Contents.filter(x=>moment(x.LastModified).add(7,'days').isAfter(moment())).map(x=>x.Key);
			  return Promise.all(items.map(key=>s3.getObject({Bucket: 'fhmbelaggningse',Key:key}).promise()));
			})
			.then(objs=>{
				var from = objs.map(x=>x.Body.toString().match(/From:\s.*/i)[0]);
				var subjectRegex = /Subject:.*Statistik_Region_G=E4vleborg_Patienter_v=E5rdade_i_slutenv/;
				var t = objs.filter(x=>x.Body.toString().match(subjectRegex));
				if(!t.length)
				    return[moment(),'-','-',null];
				    
				t = t.sort((a,b)=>a.LastModified<b.LastModified?1:-1)[0].Body.toString();

				var raw =t.match(/Content-Type: application\/octet-stream;[\n\r]*\s*name.*CovidData.csv(.*[\n\r]{2}){7}[\n\r]{2}([\s\S]+)[\n\r]{3}/m)[2];
				var raw = atob(raw);

			    t = raw.split("\n").map(x=>x.split(",")).filter(x=>x.length==3);
			    t=t.slice(65);
			    var date = moment(t[t.length-1][0]);
			    var inl = t[t.length-1][1]*1;
			    var iva = t[t.length-1][2]*1;

			    this.dates = t.map(x=>moment(x[0]));
			    this.inls = t.map(x=>x[1]*1);
			    this.ivas = t.map(x=>x[2]*1);

			    return [date, inl, iva, raw];
			});
  }
}

class Orebro extends Scraper{
    _baseUrl = '';

	get name() {
    return 'Örebro';
  }

  parseS3mail(){

		var s3 = new AWS.S3({
		  apiVersion: '2006-03-01',
		  params: {Bucket: 'fhmbelaggningse'}
		});

		return s3.listObjectsV2({Bucket: 'fhmbelaggningse'}).promise().then(data=> {
			  var items = data.Contents.filter(x=>moment(x.LastModified).add(7,'days').isAfter(moment())).map(x=>x.Key);
			  return Promise.all(items.map(key=>s3.getObject({Bucket: 'fhmbelaggningse',Key:key}).promise()));
			})
			.then(objs=>{
				var from = objs.map(x=>x.Body.toString().match(/From:\s.*/i)[0]);
				var subjectRegex = /Subject: =\?utf-8\?B\?(.+)/;
				var t = objs.filter(x=>x.Body.toString().match(subjectRegex))
				    .filter(x=>x.Body.toString().match(subjectRegex)[1].b64DecodeUnicode().match(/Beläggningsstatistik för Region Ö/));
				t = t.sort((a,b)=>a.LastModified<b.LastModified?1:-1);
				t=t[0].Body.toString();
				var raw = [...atob(t.match(/Content-Type: application\/octet-stream; name="Belaggning.csv"[\s\S]+[\n\r]{4}([\s\S]+)----/m)[1].trim())].filter(x=>x.charCodeAt(0)!==0)
				    .join("");

			    t = raw.split("\n").map(x=>x.split(",")).filter(x=>moment(x[0]).isValid());
			    var date = moment(t[t.length-1][0]).add(1,'days');
			    var iva = t[t.length-1][2]*1;
			    var inl = t[t.length-1][1]*1+iva;

			    this.dates = t.map(x=>moment(x[0]).add(1,'days'));
			    this.inls = t.map(x=>x[1]*1+x[2]*1);
			    this.ivas = t.map(x=>x[2]*1);

			    return [date,inl,iva,raw];
			});
  }
}


class Ostergotland extends Scraper{
    _baseUrl = '';

	get name() {
    return 'Östergötland';
  }

  parseS3mail(){

		var s3 = new AWS.S3({
		  apiVersion: '2006-03-01',
		  params: {Bucket: 'fhmbelaggningse'}
		});

		return s3.listObjectsV2({Bucket: 'fhmbelaggningse'}).promise().then(data=> {
			  var items = data.Contents.filter(x=>moment(x.LastModified).add(7,'days').isAfter(moment())).map(x=>x.Key);
			  return Promise.all(items.map(key=>s3.getObject({Bucket: 'fhmbelaggningse',Key:key}).promise()));
			})
			.then(objs=>{
				var subjectRegex = /Subject: =\?utf-8\?B\?(.+)/;
				var t = objs.filter(x=>{
					    let m = x.Body.toString().match(subjectRegex);
					    return m && /RegionOstergotland Covid19/.test(m[1].b64DecodeUnicode())
					});
				t = t.sort((a,b)=>a.LastModified<b.LastModified?1:-1);
				t=t.filter(x=>x.Body.toString().indexOf("DatumNyckel;Kön")!==-1)
				t=t[0];
				t=t.Body.toString();
                var raw = t.substring(t.indexOf("DatumNyckel")).trim();

			    t = raw.split("\n").map(x=>x.split(";"));
			    t=t.filter(x=>moment(x[0]).isValid());

			    let group = t.reduce((r, a) => {
				 r[a[0]] = r[a[0]] || [0,0];
				 r[a[0]][0] += a[3]!="IVA" ? a[4]*1:0;
				 r[a[0]][1] += a[3]=="IVA" ? a[4]*1:0;
				 return r;
				}, {});

				t = Object.keys(group)
				    .sort((a,b)=>a>b?1:-1);
				t=t
				    .map(x=>[moment(x), group[x][0]+group[x][1], group[x][1]]);
				    

			    var date = t[t.length-2][0];
			    var inl = t[t.length-2][1];
			    var iva = t[t.length-2][2];

			    this.dates = t.map(x=>x[0]);
			    this.inls = t.map(x=>x[1]);
			    this.ivas = t.map(x=>x[2]);

			    return [date,inl,iva,t];
			});
  }
}

// Metadata tag
/*
class Orebro extends Scraper{
    _baseUrl = 'https://www.regionorebrolan.se/sv/Halsa-och-vard/Corona/';

	get name() {
    return 'Örebro';
  }

  parse(xmlDoc){
        var t=xmlDoc.evaluate('//meta[@name="summary"]', xmlDoc);
        var i = t.iterateNext();


        var raw=i.content,inl,iva,date,
        m=[...raw.matchAll(/(\d+\s\w+)\sSiffrorna uppdateras.*Covidpatienter på vårdavdelning:\s(\d+).*Covidpatienter på intensivvårdsavdelning, IVA \(utöver vårdavdelning\):\s(\d+)/gi)][0];
        date = moment(m[1]);

        iva = m[2]*1;
        inl = m[3]*1 + iva;

        return [date,inl,iva,raw,this.url];

  }
}
*/

/*
class Ostergotland extends Scraper{
    _baseUrl = 'https://www.regionostergotland.se/Halsa-och-vard/aktuellt-om-coronaviruset/';

  	get name() {
    return 'Östergötland';
  }


  parse(xmlDoc){
        var t = xmlDoc.evaluate('//*[contains(@class,"mainbodycontent")]/*',xmlDoc);

        var raw="",i,date,inl,iva;
        while(i = t.iterateNext()){

        	var m = [...i.innerText.matchAll(/[\wåäö]+ (\d+ \w+) klockan/g)];
        	if(m.length){
            	raw += i.innerText;
        	    date = m[0][1];
        	    continue;
        	}

            var inl,iva;
        	if(i.innerText.match(/isolerade på sjukhus/)){
            	raw += i.innerText;
        	    const regexInl = RegExp('('+this.ordinals.reverse().join('|')+'|\\d+) (patienter )?på vårdavdelning',"g");
        	    const regexIva = RegExp('('+this.ordinals.reverse().join('|')+'|\\d+) i intensivvård',"g");

        	    inl = [...i.innerText.matchAll(regexInl)].reduce((a,b)=>a+this.ordinalOrNumber(b[1])*1,0);
        	    iva = [...i.innerText.matchAll(regexIva)].reduce((a,b)=>a+this.ordinalOrNumber(b[1])*1,0);
        	    inl +=iva;
        	    break;
        	}
        };

        var raw = raw.substr(0,400);
        var date = moment(date);
                
        return [date,inl,iva,raw,this.url];
  }
}
*/

/*
class Ostergotland extends Scraper{
    _baseUrl = 'https://www.regionostergotland.se/Halsa-och-vard/aktuellt-om-coronaviruset/';

  	get name() {
    return 'Östergötland';
  }


  parse(xmlDoc){
        var t = xmlDoc.evaluate('//*[contains(@class,"mainbodycontent")]/*',xmlDoc);

        var raw="",i,date,inl,iva;
        while(i = t.iterateNext()){

        	var m = [...i.innerText.matchAll(/[\wåäö]+ (\d+ \w+) klockan/g)];
        	if(m.length){
            	raw += i.innerText;
        	    date = m[0][1];
        	    continue;
        	}

            var inl,iva;
        	if(i.innerText.match(/isolerade på sjukhus/)){
            	raw += i.innerText;
        	    const regexInl = RegExp('('+this.ordinals.reverse().join('|')+'|\\d+) (patienter )?på vårdavdelning',"g");
        	    const regexIva = RegExp('('+this.ordinals.reverse().join('|')+'|\\d+) i intensivvård',"g");

        	    inl = [...i.innerText.matchAll(regexInl)].reduce((a,b)=>a+this.ordinalOrNumber(b[1])*1,0);
        	    iva = [...i.innerText.matchAll(regexIva)].reduce((a,b)=>a+this.ordinalOrNumber(b[1])*1,0);
        	    inl +=iva;
        	    break;
        	}
        };

        var raw = raw.substr(0,400);
        var date = moment(date);
                
        return [date,inl,iva,raw,this.url];
  }
}
*/

class Dalarna extends Scraper{
    _baseUrl = 'https://www.regiondalarna.se/';

	get name() {
    return 'Dalarna';
  }

  parse(xmlDoc){
        var t=xmlDoc.evaluate('//*[@id="pills-news"]/div/a', xmlDoc);
        var i;
        do{
            i = t.iterateNext();
        }while(i.href.indexOf("lagesrapport-covid")===-1&&i.href.indexOf("covid-19-siffror")===-1);

       var t = new DalarnaSub(i.href);

       return t.scrape();

  }
}


class DalarnaSub extends Dalarna{
    _baseUrl='https://www.regiondalarna.se';

  parse(xmlDoc){
        var t = xmlDoc.evaluate('/html/body/main/div/div[2]/div[1]/div/h1', xmlDoc).iterateNext().innerText;
        var raw=t;
        var date = t.match(/(?<=: )\d+ \w+/);
        date = moment(date[0]);
        date.set('year',2020);

        //t = xmlDoc.evaluate('//*[@id="main-content"]//div[@class="article"]//p', xmlDoc);
        t = xmlDoc.evaluate('//*[@id="main-content"]//div[@class="article"]//li', xmlDoc);//1 sept

        var i, inl, iva;
        while(i = t.iterateNext()){
        	raw += i.innerText;

        	//var m = [...i.innerText.matchAll(/vårdavdelning på falu\s+lasarett:\s+(\d+)/gi)];
        	var m = [...i.innerText.matchAll(/exklusive\s+intensivvårdsavdelning\):\s+(\d+)/gi)];//30 april
        	if(m.length){
        	    inl = m[0][1]*1;
        	    continue;
        	}
        	
        	//m = [...i.innerText.matchAll(/som får intensivvård:\s+(\d+)/gi)];
        	m = [...i.innerText.matchAll(/intensivvårdsavdelning:\s+(\d+)/gi)];//30 april
        	if(m.length){
        	    iva = m[0][1]*1;
        	    inl +=iva;
        	    break;
        	}
        };


        var raw = raw.substr(0,300);
                
        return [date,inl,iva,raw,this.url];
  }
}



class Stockholm extends Scraper{
	_baseUrl = 'https://www.sll.se/Nyheter';

	get name() {
    return 'Stockholm';
  }

  parse(xmlDoc){
        var a=xmlDoc.evaluate('//*[@id="main-content"]//div[@class="m-search-list"]//a[contains(@href,"lagesrapport")]', xmlDoc).iterateNext();
        var a1=xmlDoc.evaluate('//*[@id="main-content"]//div[@class="m-search-list"]//a[contains(@href,"dagslage")]', xmlDoc).iterateNext();

       var me = this;
  	   var lagesrapport = new StockholmLagesrapport(a.href);
  	   var dagssrapport = new StockholmDagslage(a1.href);
  	    
       return Promise.all([lagesrapport.scrape(), dagssrapport.scrape()])
       .then(values=>{
       	    return values[0][0].isBefore(values[1][0]) ? values[1] : values[0];
       });


  }
}


class StockholmLagesrapport extends Stockholm{

  parse(xmlDoc){
        var t = xmlDoc.evaluate('//*[@id="first-content-container"]/header/h1', xmlDoc).iterateNext().innerText;

        
        var raw=t;
        var date = moment(t.match(/\d+ \w+/)[0]);

        t = xmlDoc.evaluate('//*[@id="first-content-container"]/div[1]', xmlDoc).iterateNext().innerText;

        //var inl = t.match(/(\d+) patienter med covid-19 vårdas i intensivvård vid akutsjukhus. Förutom de som får intensivvård är det (\d+)/);
        var inl = t.match(/vårdas just nu ([a-zåäö0-9]+) patienter.*på akutsjukhus/i); 
        inl = this.ordinalOrNumber(inl[1]);
        var iva = t.match(/(\d+) i intensivvård/i); 
        iva = iva[1]*1;

        var raw = (raw+t).substr(0,300);
                
        return [date,inl,iva,raw,this.url];
  }
}


class StockholmDagslage extends Stockholm{

  parse(xmlDoc){
        var t = xmlDoc.evaluate('//*[@id="first-content-container"]/header/h1', xmlDoc).iterateNext().innerText;
        
        var raw=t;
        var date = moment(t.match(/\d+ \w+/)[0]);
        date.set("year",2021);
        t = xmlDoc.evaluate('//*[@id="first-content-container"]/div[1]', xmlDoc).iterateNext().innerText;

        //var inl = t.match(/(\d+) patienter med covid-19 vårdas i intensivvård vid akutsjukhus. Förutom de som får intensivvård är det (\d+)/);
        var inl = t.match(/Totalt antal patienter med covid-19 i behov av sjukhusvård:\s([a-zåäö1-9]+)\spatienter/i); 
        inl = this.ordinalOrNumber(inl[1]);
        var iva = t.match(/([a-zåäö1-9]+)\spatienter med covid-19 i intensiv/i); 
        iva = this.ordinalOrNumber(iva[1]);

        var raw = (raw+t).substr(0,300);
                
        return [date,inl,iva,raw,this.url];
  }
}

/*
class Gavleborg extends Scraper{
	_baseUrl = 'https://www.regiongavleborg.se/a-o/Smittskydd/A-Y/c/Coronavirus-2019-nCoV/statistik-covid-19/';
	get name() {
        return 'Gävleborg';
      }

  parse(xmlDoc){
        var t = xmlDoc.evaluate('//div[contains(@class,"article__body__main")]/*', xmlDoc);

        var raw="",i,date,inl,iva=0;
        while(i = t.iterateNext()){
        	raw += i.innerText;

        	var m = [...i.innerText.matchAll(/Senast uppdaterad\s(\d+.\d+\s)?(den )?(\d+ \w+)/g)];
        	if(m.length){
        	    date = m[0][3];
        	    continue;
        	}

        	m = [...i.innerText.matchAll(/antal inneliggande patienter bekräftade med covid-19:\s(\d+)/gi)];
        	if(m.length){
        	    inl = m[0][1]*1;
        	    continue;
        	}
        	
        	m = [...i.innerText.matchAll(/Patienter som vårdas på intensiven.*med covid-19:\s(\d+)/g)];
        	if(m.length){
        	    iva += m[0][1]*1;
        	    continue;
        	}
        };

        var raw = raw.substr(0,500);
        var date = moment(date);
                
        return [date,inl,iva,raw,this.url];

  }
}*/

//From: <karin.josefsson@regiongavleborg.se>

class DNSkrapan{

	get url(){
        return'https://api.quickshot-widgets.net/fields/1141';
    }    
	get name() {
		return 'DN';
	  }

  parseJson(result){
  	    var date = moment(result.fields.filter(x=>x.key==="source")[0].value.match(/\d+\/\d+/)[0],"DD/M").format('D MMMM');
        return result.fields.filter(x=>x.key==="list")[0].value.filter(x=>!/totalt/i.test(x.Region)).sort((a,b)=>a.Region<b.Region?-1:1).map(x=>[x.Region,date,x["INLAGDA*"],x["VARAV IVA**"]])
  }

  	do(){
		var me = this;
    	try {
    		this.scrape().then(function(r){me.produceRow(r);},function(r){me.produceError();});
		    
    	} catch(e){
    		console.log(e);
    		mw.produceError();
			
    	} 
	}

	scrape(){
		var me = this;
		return new Promise((resolve,reject)=>{
		$.ajax({
            url : this.url,
            success : function(result){
                try {
			        resolve(me.parseJson(result));
                }catch(e){
                	console.log(e);
                	reject(e);
                }
            }    
        });
		});
    }

     produceRow(result){
     	result.forEach(x=>{
         	var row = document.createElement('tr');
			row.innerHTML = "";
            x.forEach(y=>row.innerHTML += `<td>${y}</td>`);
            document.getElementById("dn").appendChild(row);
     	    }
     	);
     }

     produceError(){
     	var row = document.createElement('tr');
			row.innerHTML = `<td>${this.name}</td>`;
    		row.innerHTML += "<td>Fel!</td><td></td><td></td><td></td>";
    		row.innerHTML += `<td><a href="${this.url}">${this.url}</td>`;
            document.getElementById("p").appendChild(row);		
     }

}


/*
class Kalmar extends Scraper{
	_baseUrl = 'https://www.regionkalmar.se/kontakta-oss/kontakta-sjukvarden/coronaviruset/';

	get name() {
        return 'Kalmar';
  }

  parse(xmlDoc){
  	    var t = xmlDoc.evaluate('/html/body/div[1]/div/div[1]/article/section/p', xmlDoc);

  	    var raw="",i,date,inl,iva=0;
        
        while(i = t.iterateNext()){
        	raw += i.innerText;

        	var m = [...i.innerText.matchAll(/Uppdatering\s(\d+\s\w+)\:\s(\d+)\spersoner bekräftat smittade\,\s(\d+)\spersoner inlagda på sjukhus\, varav\s(\d+)\spå intensivvårdsavdelning/gi)];
        	if(m.length){
        	    date = m[0][1];
        	    inl = m[0][3];
        	    iva = m[0][4];
        	    break;
        	}

        };

        var raw = raw.substr(0,500);
        var date = moment(date);
                
        return [date,inl,iva,raw,this.url];
  }
}
*/

class Kalmar extends Scraper{
	_baseUrl = 'https://www.regionkalmar.se/globalassets/covid19_regionwebben.pdf';
    //_baseUrl = 'https://www.regionkalmar.se/globalassets/covid-19_regionwebben.pdf';
	get name() {
        return 'Kalmar';
  }
  
  parse(items){
  	    items = items[0];
   	    var raw = items.map(x=>x.str).join(''), date, inl=0, iva=0;
        

        for(const i in items) {
        	if(/Antal inneliggande idag/.test(items[i].str)){
        		inl += items[i*1+1].str*1;
        	}

        	if(/Intensivvårdade\s\(med respirator/gi.test(items[i].str)){
        		iva += [...items[i*1+1].str.matchAll(/(\d+)\s\((\d+)\)/gi)][0].splice(1,2)[0]*1;//changes 20201208 .reduce((x,a)=>a*1+x*1);
        	}

        	if(/^Uppdaterad/gi.test(items[i].str)){
        		date = [...items[i].str.matchAll(/Uppdaterad\:\s([0-9-]+)/gi)][0][1];
        		date = moment(date);
        	}
        }

        return [date,inl,iva,raw,this.url];
  }
}



class Uppsala2 extends Scraper{
	_baseUrl = 'https://regionuppsala.se/det-har-gor-vi/vara-verksamheter/halso-och-sjukvard/information-om-coronaviruset/';

	get name() {
    return 'Uppsala2';
  }

  parse(xmlDoc){
        var a=xmlDoc.evaluate('//*[@id="app"]//a[contains(@href,"nulagesbild-covid-19-region-uppsala-excel")]', xmlDoc).iterateNext();
        if(!a)
            a=xmlDoc.evaluate('//*[@id="app"]//a[contains(@href,"covid-19-excel")]', xmlDoc).iterateNext();

       var t = new Uppsala3Sub(a.href.replace("file:///C:/","https://regionuppsala.se/"));

       return t.scrape().then(r=>{
       	   [this.dates,this.inls,this.ivas]=[t.dates,t.inls,t.ivas];
       	   return r;
       });

  }
}


class Uppsala3Sub extends Scraper{
    _baseUrl = '';

	get name() {
    return 'Uppsala';
  }

  parseXls(url){


	return new Promise(function (resolve, reject) {
		JSZipUtils.getBinaryContent(url, function(err, data) {
			if (err) {
				reject(err);
			} else {
				resolve(data);
			}
		});
	}).then(data0=>{
        var data = new Uint8Array(data0);
            var arr = new Array();
            for (var i = 0; i != data.length; ++i) arr[i] = String.fromCharCode(data[i]);
            var bstr = arr.join("");
	      var workbook = XLSX.read(bstr, {
        type: 'binary'
      });

        var json = XLSX.utils.sheet_to_json(workbook.Sheets["Slutenvård per dag"], {range:2});
        this.dates = json.map(x=>moment(x.Datum));
        this.inls = json.map(x=>1*x["Antal patienter"]);
        this.ivas = json.map(x=>1*x["Antal vårdade IVA"]);
        return [this.dates[0],this.inls[0],this.ivas[0],json[0],url];
	});

  }
}


class Uppsala2Sub extends Scraper{
	_baseUrl = 'https://www.regionuppsala.se/Global/Corona/200605-Nul%c3%a4gesbild%20Region%20Uppsala.pdf';

	get name() {
        return 'Uppsala2';
  }

  getpdfelements(pdfUrl){
  	 var pdf = pdfjsLib.getDocument(pdfUrl);
  return pdf.promise.then(function(pdf) { // get all pages text
      var page = pdf.getPage(4);

      var txt = "";var objs=[];
      return page.then(function(page) { // add page promise
        return page.getOperatorList().then(function (ops) {
            for (var i=0; i < ops.fnArray.length; i++) {
                if (ops.fnArray[i] == pdfjsLib.OPS.paintImageXObject) {
                    objs.push(ops.argsArray[i][0])
                }
            }
            return objs;
        }).then(function (objs){
        	return new Promise((resolve,reject)=>{
        		page.objs.get(objs[1],img=>{
        			var canvas = document.createElement('canvas');
        			[canvas.width, canvas.height] = [img.width,img.height];
        			if(img.data.length == img.width*img.height*3){
        				var imageData = [];
        				for (var i = 0; i< img.data.length; i+=3){
        					Array.prototype.push.apply(imageData, [...img.data.slice(i,i+3), 255]);
        				}
        				canvas.getContext("2d").putImageData(new ImageData(new Uint8ClampedArray(imageData),img.width),0,0);
        			}else
    					canvas.getContext("2d").putImageData(new ImageData(img.data,img.width),0,0);

					// create a new img object
					var image = new Image();
					// set the img.src to the canvas data url
					document.getElementById("uppsalaimg").src = canvas.toDataURL();
					if(img.width<1000)
					{
							document.getElementById("uppsalaimg").width=img.width*2;
        					document.getElementById("uppsalaimg").height=img.height*2;

					}
        			resolve(img);
        		});
        	});
        	
        });
      });
    
  });
  }
  
  parse(img){
  	var verticalScan = [], colors=[],colorHist=[];
  	var bitdepth = img.data.length/img.width/img.height;

	var canvas = document.getElementById("uppsalacanvas");
	this.ctx = canvas.getContext("2d");
	this.zoom = img.width<1000 ? 2 : 1;

	canvas.width = img.width * this.zoom;
	canvas.height = img.height * this.zoom;

  	for(var x=0; x<img.width ;x++){
  		verticalScan[x]=[];
  	    for(var y=0; y <img.height;y++){
  	    	var offset = y*img.width*bitdepth+x*bitdepth;
  	    	
  	    	var pixel = img.data[offset]*255*255+img.data[offset+1]*255+img.data[offset+2];
  	    	if(bitdepth==5)
  	    	    pixel = pixel*255 + img.data[offset+2];

  	        verticalScan[x][y]=pixel;
  	        if(colors.indexOf(verticalScan[x][y])===-1){
  	            colors.push(verticalScan[x][y]);
  	            colorHist.push(0);
  	        }
  	        colorHist[colors.indexOf(verticalScan[x][y])]++;
  	    }
  	}
  	var colorTable = colors.map((x,i)=>[x.toString(16),colorHist[i]]).sort((a,b)=>b[1]-a[1]);
  	colors = colorTable.map(x=>parseInt("0x"+x[0]));
  	for(x=0; x<img.width; x++){
  	    for(y=0; y <img.height; y++){
  	    	verticalScan[x][y]=colors.indexOf(verticalScan[x][y]);
  	    }
  	}
  	//verticalScan=verticalScan.splice(41);
    
    document.getElementById("verticalScan").innerText=verticalScan.map((x,i)=>""+i+": "+x.map(y=>y>=10?(y+""):("0"+y)).join(",")).join("\n");
    const colorInl = 2,//bitdepth==4?2:1, //apricot,"fe01ff"1
        colorIva = 8,//,//red, "f3a4eb"4/5
        colorOther = 6;//3; //greyblue,"9189aa"2
        
    const firstBarStartsAt = verticalScan.findIndex(v=>v.some(x=>x==colorIva||x==colorOther||x==colorInl));
    for (var v = firstBarStartsAt; v < firstBarStartsAt+20 && verticalScan[v+1].filter(x=>x==colorIva||x==colorOther||x==colorInl).length == verticalScan[v].filter(x=>x==colorIva||x==colorOther||x==colorInl).length; v++);
    for (v = v+1; v < firstBarStartsAt+20 && verticalScan[v+1].filter(x=>x==colorIva||x==colorOther||x==colorInl).length == verticalScan[v].filter(x=>x==colorIva||x==colorOther||x==colorInl).length; v++);

    const maxBarAndGapWidth=v+2-firstBarStartsAt;

    var bars=[],d=0,vs=[];
    for (v = firstBarStartsAt; v < img.width; v += maxBarAndGapWidth) {
    	var v0=v;
    	while(v>v0-3 && verticalScan[v-1].filter(x=>x==colorIva||x==colorOther||x==colorInl).length == verticalScan[v].filter(x=>x==colorIva||x==colorOther||x==colorInl).length)
    	    v--;
    	vs.push(v);
    	var sample = verticalScan[v].slice(Math.floor(50/600*img.height));
    	var bar = [sample.filter(x=>x==colorInl).length,
    	        sample.filter(x=>x==colorIva).length,
    	        sample.filter(x=>x==colorOther).length];
    	bars.push(bar);
        

        var o = sample.reduceRight((a,x,i)=>(x==colorIva||x==colorOther||x==colorInl)&&a==-1?i:a, -1);
        this.plot(v, o);
        this.plot(v, o-=bar[0]);
        this.plot(v, o-=bar[1]);
        this.plot(v, o-=bar[2]);
    }

    bars = bars.map(b=>
    	    [...b,
    	    b.reduce((a,x)=>a+x),
    	    0//b.reduce((a,x)=>a+(x>0?1:0),0)-1 //space in between bars
    	    ]);
    bars = bars.map(b=>
    	    [...b,
    	    b[3]+b[4]
    	    ]);
    	    
    const maxBar = bars.map(b=>b[5]).reduce((a,b)=>Math.max(a,b));
    bars = bars.map(b=>
    	    [...b,
    	    b[5]/maxBar*127.0+1,
    	    b[1]/maxBar*127.0,
    	    ]);

        var date = this.url.match(/\d{6}/);
        date = moment(date,"YYMMDD");
        var dates = [...Array(bars.length).keys()].map(x=>moment(date).add(-bars.length+1+x,'days'));
        var inls = bars.map(x=>Math.round(x[6])), ivas =bars.map(x=>Math.round(x[7]));
        
    bars = bars.map((b,i) => [vs[i],...b]);

        [this.dates,this.inls,this.ivas]=[dates,inls,ivas];

        return [date,this.inls[this.inls.length-1],this.ivas[this.inls.length-1],null,this.url,null,
        this.dates,
        this.inls,
        this.ivas
        ];
  }

    plot(x,y){
  	if(!x && !Y)
  	return;
  	  this.ctx.beginPath();
      this.ctx.arc(x*this.zoom,y*this.zoom, 2, 0, 2 * Math.PI, false);
      this.ctx.fillStyle = 'pink';
      this.ctx.fill();
//      context.lineWidth = 5;
  //    context.strokeStyle = '#003300';
    //  context.stroke();
  }
}


class Norrbotten2 extends Scraper{
	_baseUrl = 'https://www.norrbotten.se/Halsa-och-sjukvard/Smittskydd-i-Norrbotten/Information-om-nya-coronaviruset/';

	get name() {
    return 'Norrbotten2';
  }

  parse(xmlDoc){
        var a=xmlDoc.evaluate('//*[@id="rs_read_text"]//a[contains(@href,"Veckorapporter%20covid-19")]', xmlDoc).iterateNext();
        var t = new Norrbotten2Sub(a.href);

       return t.scrape().then(r=>{
       	   [this.dates,this.inls,this.ivas]=[t.dates,t.inls,t.ivas];
       	   return r;
       });

  }
}



class Norrbotten2Sub extends Scraper{
    _baseUrl = 'https://www.norrbotten.se/publika/lg/kom/Corona/Veckorapporter%20covid-19/200824%20v%2034%20CoV-19%20rapport.pdf';

	get name() {
    return 'Norrbotten2';
  }

   getpdfelements(pdfUrl){
  	 var pdf = pdfjsLib.getDocument(pdfUrl);
  return pdf.promise.then(function(pdf) { // get all pages text
      var page = pdf.getPage(4);

      var txt = "";var objs=[];
      return page.then(function(page) { // add page promise
        return page.getOperatorList().then(function (ops) {
            for (var i=0; i < ops.fnArray.length; i++) {
                if (ops.fnArray[i] == pdfjsLib.OPS.paintImageXObject) {
                    objs.push(ops.argsArray[i][0])
                }
            }
            return objs;
        }).then(function (objs){
        	return new Promise((resolve,reject)=>{
        		page.objs.get(objs[0],img=>{
        			var canvas = document.createElement('canvas');
        			[canvas.width, canvas.height] = [img.width,img.height];
        			if(img.data.length == img.width*img.height*3){
        				var imageData = [];
        				for (var i = 0; i< img.data.length; i+=3){
        					Array.prototype.push.apply(imageData, [...img.data.slice(i,i+3), 255]);
        				}
        				canvas.getContext("2d").putImageData(new ImageData(new Uint8ClampedArray(imageData),img.width),0,0);
        			}else
    					canvas.getContext("2d").putImageData(new ImageData(img.data,img.width),0,0);

					// create a new img object
					var image = new Image();
					// set the img.src to the canvas data url
					document.getElementById("norrbottenimg").src = canvas.toDataURL();
        			resolve(img);
        		});
        	});
        	
        });
      });
    
  });
  }

  getpptxelements(url) {
  	// 1) get a promise of the content
	var promise = new JSZip.external.Promise(function (resolve, reject) {
		JSZipUtils.getBinaryContent(url, function(err, data) {
			if (err) {
				reject(err);
			} else {
				resolve(data);
			}
		});
	});

	return promise.then(JSZip.loadAsync)                     // 2) chain with the zip promise
	.then(function(zip) {
		return zip.file("ppt/media/image7.png").async("uint8array"); // 3) chain with the text content promise
	})
	.then(function success(data) {  
	    var blob = new Blob([data], {'type': 'image/png'});
        var url = URL.createObjectURL(blob);

		var myImgElement = document.getElementById('norrbottenimg');
		myImgElement.src=url;
        
        return new Promise((resolve,reject)=>{
        	myImgElement.onload=x=>resolve(myImgElement);
        }).then(img=>{
			var w = myImgElement.width, h=myImgElement.height;
			var canvas = document.createElement('canvas');
            [canvas.width, canvas.height] = [w,h];
			var ctx    = canvas.getContext('2d');
			ctx.drawImage( myImgElement, 0, 0 );

			var imgdata = ctx.getImageData(0,0,w,h);
			return imgdata;
        });

	}, function error(e) {
		throw e;
	});

  }

  parse(img){
  	  	var bitdepth = img.data.length/img.width/img.height;
  	  	var verticalScan=[],verticalR=[],verticalA=[],horizontalA=[],horizontalR=[],horizontalScan=[];

        var canvas=document.getElementById("norrbottencanvas");
        this.ctx=canvas.getContext("2d");
        canvas.width=img.width;
        canvas.height=img.height;

		for(var x=0; x<img.width ;x++){
			verticalScan[x] = [];
			for(var y=0; y <img.height;y++){
				var offset = y*img.width*bitdepth+x*bitdepth;

				verticalScan[x][y]=img.data.slice(offset,offset+bitdepth);
                
                if(x==0)
                    horizontalScan[y]=[];
				horizontalScan[y][x]=img.data.slice(offset,offset+bitdepth);
			}
		}

		for(var x=0; x<img.width ;x++){
			verticalR[x] = verticalScan[x]
			    .reduce((a,v)=>[...a].map((e,i)=>e+255-v[i]),
				    [0,0,0,0]);
		}

		for(var x=0; x<img.width ;x++){
			verticalA[x] = this.toPolar(verticalR[x]);
		}

	    for(var y=0; y<img.height; y++){
			horizontalR[y] = horizontalScan[y]
			    .reduce((a,v)=>[...a]
			            .map((e,i)=>e+255-v[i]),
				    [0,0,0,0]);
		}

	    for(var y=0; y<img.height; y++){
			horizontalA[y] = this.toPolar(horizontalR[y]);
		}

        
        var f = s=>this.fftAnalyse(verticalA, 1, 1024, s);
        var shiftV = this.findShift(f,[1.1,20]);

        f = s=>this.fftAnalyse(horizontalA, 2, 512, s);
        var shiftH = this.findShift(f,[5,15]);

        var hstep = shiftV.p[shiftV.I], vstep = shiftH.p[shiftH.I];

        var startX0 = verticalA.findIndex(x=>x[1]<.78);
        var startX1 = [...Array(10).keys()].map(x=>hstep*x+shiftV.shift).find(x=>x>startX0);
        startX0 += hstep/2;

        var startY0 = horizontalA.findIndex(x=>x[1]<.78);
        var startY1 = [...Array(10).keys()].map(x => vstep * x + shiftH.shift).find(x => x > startY0);
        startY0 += vstep/2;

        var result = [], allsamples=[];
        var xx = [...Array(Math.ceil((img.width-startX0)/hstep)).keys()].map(x=>startX0+x*hstep);
        var yy = [...Array(Math.ceil((img.height-startY0)/vstep)).keys()].map(x=>startY0+x*vstep);

        var correctedXIter=0,correctedYIter=0;
        for (var i=0; i < xx.length; i++) {
        	//console.debug(i);
        	var x = xx[i];
            var pair = [];
            var samples = [];

            for (var j=0; j < yy.length; j++) {
            	var y = yy[j];
            	var f5 = this.sample(verticalScan, x, y, 5);
            	var f5a = this.toPolar(f5);
		    	samples.push([x,y,...f5,...f5a]);
    	    }

    	    var resI = [
							samples.findIndex(x => x[8] > 0.120 && x[6] > 6.5),
							samples.findIndex(x => x[8] > 1.07 && x[8] < 1.55 && x[6] > 3)
						];

			if(resI[0]==-1 ||resI[1]==-1)
			    console.log(x);

    	    var res = [samples[resI[0]],samples[resI[1]]];

			if(!res[0] && !res[1])
			    break;

		    //check for white edge pixels

		    if(correctedXIter<2){
		    	correctedXIter++;

				if(i>0 && res[0] && this.toPolar(verticalScan[Math.round(x)-5][Math.round(res[0][1])])[1]==Math.PI/4) {
					xx = [...xx.slice(0,i-1),...xx.slice(i-1).map(v=>v+1)];
					i--;
					continue;
				}

				if(i>0 && res[0] && this.toPolar(verticalScan[Math.round(x)+3][Math.round(res[0][1])])[1]==Math.PI/4) {
					xx = [...xx.slice(0,i-1),...xx.slice(i-1).map(v=>v-1)];
					i--;
					continue;
				}

				if(i>0 && res[1] && this.toPolar(verticalScan[Math.round(x)-4][Math.round(res[1][1])])[1]==Math.PI/4) {
					xx = [...xx.slice(0,i-1),...xx.slice(i-1).map(v=>v+1)];
					i--;
					continue;
				}

				if(i>0 && res[1] && this.toPolar(verticalScan[Math.round(x)+3][Math.round(res[1][1])])[1]==Math.PI/4) {
					xx = [...xx.slice(0,i-1),...xx.slice(i-1).map(v=>v-1)];
					i--;
					continue;
				}

				correctedXIter=0;
		    }

		    if(correctedYIter<2){
		    	correctedYIter++

				if(res[0] && this.toPolar(verticalScan[Math.round(x)][Math.round(res[0][1])-4])[1]==Math.PI/4) {
					yy = [...yy.slice(0,resI[0]-1),...yy.slice(resI[0]-1).map(v=>v+1)];
					i--;
					continue;
				}

				if(res[0] && this.toPolar(verticalScan[Math.round(x)][Math.round(res[0][1])+3])[1]==Math.PI/4) {
					yy = [...yy.slice(0,resI[0]-1),...yy.slice(resI[0]-1).map(v=>v-1)];
					i--;
					continue;
				}

				if(res[1] && this.toPolar(verticalScan[Math.round(x)][Math.round(res[1][1])-3])[1]==Math.PI/4) {
					yy = [...yy.slice(0,resI[1]-1),...yy.slice(resI[1]-1).map(v=>v+1)];
					i--;
					continue;
				}

				if(res[1] && this.toPolar(verticalScan[Math.round(x)][Math.round(res[1][1])+3])[1]==Math.PI/4) {
					yy = [...yy.slice(0,resI[1]-1),...yy.slice(resI[1]-1).map(v=>v-1)];
					i--;
					continue;
				}

				correctedXIter=	correctedYIter=0;
		    }


    	    allsamples.push(samples);
    	    if(!res[1])
    	        res[1]=res[0];

            if(res[0])
    		    this.plot(x, res[0][1]);
            if(res[1])
    		    this.plot(x, res[1][1]);

    	    result.push(res);
        }


        result = result.map(x=>[
									x[0]?[Math.round(52 - (x[0][1] - startY0) / vstep),...x[0]]:[],
									x[1]?[Math.round(52 - (x[1][1] - startY0) / vstep),...x[1]]:[]
								]);

	    this.dates = [...Array(result.length).keys()].map(x=>moment("31 march 2020").add(x, "days")).reverse();
	    this.inls = result.map(x=>x[0][0]+x[1][0]).reverse();
	    this.ivas = result.map(x=>x[1][0]).reverse();
    
        return [this.dates[0],this.inls[0],this.ivas[0],"",this.url,[],this.dates,this.inls,this.ivas];
  }

  fftAnalyse(data, column, size, shift=0){
        var a = data.slice(0+shift,size+shift).map(x=>x[column]);
        var fftA = new ComplexArray(size).map((value, i, n) =>value.real = a[i]).FFT();
        var fA = [...Array(size)].map((x,i)=>Math.sqrt(Math.pow(fftA.real[i],2)+Math.pow(fftA.imag[i],2)));
        fA= {fA: fA, s:[...Array(size).keys()].sort((a,b)=>fA[b]-fA[a]), shift:shift};
        fA.p = fA.s.map(x=>size/x);
        return fA;
  }

  findShift(f,range) {
    var maxT=0,maxI, maxShift;
	for (var s=0; s < 100; s++) {
		var fftVA = f(s);
		var i = [...Array(100).keys()].filter(i=>fftVA.p[i]>range[0] && fftVA.p[i]<range[1])[0];
		var t = fftVA.fA[fftVA.s[i]];
		if(t>maxT){
			maxT=t;
			maxShift=s;
			maxI=i;
		}
	}
	var fftVA = f(maxShift);
	fftVA.I = maxI;
	fftVA.T = maxT;
    return fftVA;
  }

  toPolar(rgba){
  	return [
				rgba.reduce((a,v)=>Math.sqrt(a+v^2),0),
				Math.atan2(rgba[0],rgba[1]),
				Math.atan2(rgba[0],rgba[2]),
				Math.atan2(rgba[0],rgba[3])
			];
  }

  sample(verticalScan, x, y, size) {
  	x=Math.round(x),y=Math.round(y);
  	const i3 = [0,-1,0,1,1];
  	const j3 = [-1,0,0,0,1];
  	const i5 = [0,-1,0,1,-2,-1,0,1,2,-1,0,1,0];
  	const j5 = [-2,-1,-1,-1,0,0,0,0,0,1,1,1,2];

  	const ii = size==5?i5:i3;
  	const jj = size==5?j5:j3;

  	var r = ii.map((v,i)=>verticalScan[x+v][y+jj[i]]);
  	    r= r.reduce((a,v)=>[...a].map((e,i)=>e+255-v[i]),[0,0,0,0]);

  	return r;
  }

  plot(x,y){
  	if(!x && !Y)
  	return;
  	  this.ctx.beginPath();
      this.ctx.arc(x,y, 3, 0, 2 * Math.PI, false);
      this.ctx.fillStyle = 'pink';
      this.ctx.fill();
//      context.lineWidth = 5;
  //    context.strokeStyle = '#003300';
    //  context.stroke();
  }
}

  
var timelineParse =results=>{
	    var scrapers = results
	        .map(result=>result.value)
	        .sort((a,b)=>a.name.localeCompare(b.name));


	    var dateRange = results
	        .filter(result=>result.status=="fulfilled" && result.value.dates && result.value.dates.length>10)
	        .map(result=>result.value);

	    if(!dateRange.length)
	        return;
	    
	    var dateRangeL=Infinity,dateRangeH=0;
	    for(var  i =0; i < dateRange.length; i++)
	        for(var  j =0; j < dateRange[i].dates.length; j++){
	            if (dateRangeL > dateRange[i].dates[j])
	                dateRangeL = dateRange[i].dates[j];
	            if (dateRangeH < dateRange[i].dates[j])
	                dateRangeH = dateRange[i].dates[j];
	        }

	    dateRange = [dateRangeL,dateRangeH];

	    var hRow= scrapers.map(x=>`<th>${x.name}</th>`);
	    document.querySelector("#inls thead").innerHTML = "<th>datum</th>"+hRow.join("");
	    document.querySelector("#ivas thead").innerHTML = "<th>datum</th>"+hRow.join("");

	    var i = 0, d = moment(dateRange[0]); 
        while(d.isSameOrBefore(dateRange[1], 'day')){
    		var rowInl = document.createElement('tr');
    		var rowIva = document.createElement('tr');
			rowInl.innerHTML = `<td>${d.format("DD MMMM")}</td>`;
			rowIva.innerHTML = `<td>${d.format("DD MMMM")}</td>`;

    		scrapers.forEach(x=>{
    			var ii;
				if(x.dates && (ii = x.dates.findIndex(xx=>xx.isSame(d,'day')))>-1 && typeof(x.inls[ii])==="number")
					rowInl.innerHTML += `<td>${(x.inls[ii]+"").replace("NaN","-")}</td>`;
				else
					rowInl.innerHTML += `<td>-</td>`;

				if(x.dates && (ii = x.dates.findIndex(xx=>xx.isSame(d,'day')))>-1 && typeof(x.ivas[ii])==="number")
					rowIva.innerHTML += `<td>${(x.ivas[ii]+"").replace("NaN","-")}</td>`;
				else
					rowIva.innerHTML += `<td>-</td>`;
    		});

			document.querySelector("#inls tbody").appendChild(rowInl);
			document.querySelector("#ivas tbody").appendChild(rowIva);            

			d.add(1,"days");
	    }
	};



var scrapers = [
new Blekinge(),
new Dalarna(),
new Gavleborg(),
new Gotland(),
new Halland(),
new JH(),
new Jonkoping(),
new Kalmar(),
new Kronoberg(),
new Norrbotten(),
new Orebro(),
new Ostergotland(),
new Skane(),
new Sormland(),
new Stockholm(),
new Uppsala2(),
new VG2(),
new Varmland(),
new Vasterbotten(),
new Vasternorrland(),
new Vastmanland(),
 ];


//var scrapers = [new Norrbotten()];
//var scrapers = [new Gavleborg()];

//scrapers.forEach(x=>x.do())

//new DNSkrapan().do();
//new Uppsala2().do();
//new Stockholm().do();
Promise.allSettled(scrapers.map(x=>x.do())).then(timelineParse);

//<script>window.infographicData={"id":159117961,"type":1,"block_id":"e42bb6a1-214a-4448-a0dc-3a7d86da5762","theme_id":215,"user_id":54691386,"team_user_id":190091,"path":"de8d86b3-01ac-42ff-bb4f-91b7f6460464","title":"IVA-VGR-totalt-webb","description":"Antal inneliggande och varav IVA vårdade per dag","tags":"","public":true,"publicAccess":false,"private_link_enabled":0,"thumb":"https:\u002F\u002Finfogram-thumbs-200.s3-eu-west-1.amazonaws.com\u002Fe42bb6a1-214a-4448-a0dc-3a7d86da5762.jpg","embedImageUrl":"https:\u002F\u002Finfogram.io\u002Fp\u002F0edc73bf649d1d43e468b15422e8f372.png","previewImageUrl":"https:\u002F\u002Finfogram.io\u002Fp\u002F5676d8817896a4736e74c7b0650c64ce.png","width":550,"copyright":"","properties":{"tabs":true,"zeropaddingembed":true,"flexTemplateId":"ea0b1b77-3935-4696-8f73-a0c4fce2a8ff","type":"youtube_thumbnail","footerSettings":{"logoType":"custom_logo-infogram","showFooter":true,"customLinkOption":"text","hasCustomLink":false},"publishType":0,"transparent":false,"rtl":false,"language":"en","export_settings":{"showGrid":true,"showValues":true},"whitelabel":true,"noTracking":false,"decimal_separator":".,","embed_button":"enabled","title_link":"infogram","custom_logo":"none","custom_link_url":"","logoName":"Infogram logo","showChartsOnScroll":true,"pro":true},"elements":{"content":{"allowFullscreen":true,"allowToShare":true,"assets":{},"content":{"blockOrder":["fa5ae019-00b4-48f5-8471-5d84560d0ae6"],"blocks":{"fa5ae019-00b4-48f5-8471-5d84560d0ae6":{"design":{"header":{"text":""},"hideFooter":false},"entities":["ee056863-0d4e-4e96-9b41-5c3d884b877f","b9b57061-a9e0-49c1-bdef-710aff5e9af4"]}},"entities":{"b9b57061-a9e0-49c1-bdef-710aff5e9af4":{"filters":{},"height":36,"left":0,"lockAspectRatio":false,"locked":false,"maxHeight":10000,"maxWidth":10000,"minHeight":1,"minWidth":1,"props":{"content":{"blocks":[{"data":{"BOLD":true,"align":"ALIGN_CENTER","ig:color":"{{foregroundColor}}","ig:fontFamily":"{{fontFamily}}","ig:fontSize":"24px","ig:letterSpacing":"{{letterSpacing|0px}}","ig:lineHeight":"{{lineHeight}}"},"depth":0,"entityRanges":[],"inlineStyleRanges":[{"length":10,"offset":0,"style":"ig:lineHeight:{{lineHeight}}"},{"length":10,"offset":0,"style":"ig:color:{{foregroundColor}}"},{"length":10,"offset":0,"style":"ig:fontFamily:{{fontFamily}}"},{"length":10,"offset":0,"style":"ig:letterSpacing:{{letterSpacing|0px}}"},{"length":10,"offset":0,"style":"BOLD"},{"length":10,"offset":0,"style":"ig:fontSize:24px"}],"key":"a57o6","text":"VGR totalt","type":"header-one"}],"entityMap":{}},"contentHTML":"\u003Cdiv class=\"DraftEditor-root\"\u003E\u003Cdiv class=\"DraftEditor-editorContainer\"\u003E\u003Cdiv aria-describedby=\"placeholder-ig_static\" class=\"public-DraftEditor-content\" contenteditable=\"false\" spellcheck=\"false\" style=\"outline:none;user-select:text;-webkit-user-select:text;white-space:pre-wrap;word-wrap:break-word\"\u003E\u003Cdiv data-contents=\"true\"\u003E\u003Ch1 class=\"__ig-alignCenter\" data-block=\"true\" data-editor=\"ig_static\" data-offset-key=\"a57o6-0-0\"\u003E\u003Cdiv data-offset-key=\"a57o6-0-0\" class=\"public-DraftStyleDefault-block public-DraftStyleDefault-ltr\"\u003E\u003Cspan data-offset-key=\"a57o6-0-0\" style=\"font-weight:bold;line-height:36px;color:#464646;font-family:&#x27;Roboto&#x27;;letter-spacing:0px;font-size:24px\"\u003E\u003Cspan data-text=\"true\"\u003EVGR totalt\u003C\u002Fspan\u003E\u003C\u002Fspan\u003E\u003C\u002Fdiv\u003E\u003C\u002Fh1\u003E\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E","customSizing":true,"opacity":1,"overflow":true,"resetFontKerning":true,"scaleHeight":36,"scaleWidth":1276,"scaleX":1,"scaleY":1,"template":"h1","verticalAlign":"top"},"top":7,"transform":{"flipHorizontal":false,"flipVertical":false,"rotate":0},"type":"TEXT","width":1280},"ee056863-0d4e-4e96-9b41-5c3d884b877f":{"filters":{},"height":655,"left":0,"lockAspectRatio":false,"locked":false,"maxHeight":10000,"maxWidth":10000,"minHeight":50,"minWidth":50,"props":{"chartData":{"accessibility":{"description":"Antal inneliggande börjar på 30 den 21:e mars och har en försiktigt accelererad ökning till den 27:e april på 347. Efter det minskade antalet något för att återigen öka till den 4:e maj som också är högsta värdet på 375.\nAntal IVA vårdade var 21:a Mars 12st, och antalet har sedan ökat försiktigt över tid. Sista datumet i grafen, 7:e april, är vi uppe i 91st.","enabled":true,"label":"Antal inneliggande och varav IVA vårdade per dag"},"chart_type_nr":6,"colors":["#6D53DC","#E54D24"],"custom":{"accumulateValues":false,"animation":{"enabled":false},"axis":{"alpha":0.2,"x":{"affix":true,"decimalSeparator":".","grid":false,"groupingSymbol":"none"},"y":{"affix":true}},"categoryLayout":"tilted","decimalSeparator":".","groupingSymbol":"none","hideTabs":false,"labels":{"axis":{"x":{"tick":{"font-size":"19px"},"title":{"font-size":"19px"}},"y":{"tick":{"font-size":"19px"},"title":{"font-size":"19px"}}},"graph":{"item":{"format":{"affix":true},"value":{"font-size":"19px"}}},"legend":{"font-size":"19px"},"sheetSwitch":{"tab":{"font-size":"19px"}},"tooltip":{"format":{"x":{"affix":true},"y":{"affix":true}}}},"showDownload":true,"showLabels":false,"showPoints":true,"smooth":false,"textColor":"{{colors.#4C4C4C}}"},"data":[[["Datum","Antal  inneliggande","Varav  IVA"],["21\u002F3",30,12],["22\u002F3",33,8],["23\u002F3",34,11],["24\u002F3",31,12],["25\u002F3",34,16],["26\u002F3",36,19],["27\u002F3",56,21],["28\u002F3",56,24],["29\u002F3",65,30],["30\u002F3",71,36],["31\u002F3",74,37],["1\u002F4",85,44],["2\u002F4",91,46],["3\u002F4",92,40],["4\u002F4",94,44],["5\u002F4",100,42],["6\u002F4",113,43],["7\u002F4",119,44],["8\u002F4",133,44],["9\u002F4",126,49],["10\u002F4",149,52],["11\u002F4",183,62],["12\u002F4",182,63],["13\u002F4",180,66],["14\u002F4",209,68],["15\u002F4",198,71],["16\u002F4",204,69],["17\u002F4",234,66],["18\u002F4",233,69],["19\u002F4",245,67],["20\u002F4",269,67],["21\u002F4",263,67],["22\u002F4",271,71],["23\u002F4",291,79],["24\u002F4",310,85],["25\u002F4",326,91],["26\u002F4",324,91],["27\u002F4",347,84],["28\u002F4",345,86],["29\u002F4",342,91],["30\u002F4",333,88],["1\u002F5",332,90],["2\u002F5",339,96],["3\u002F5",350,94],["4\u002F5",375,96],["5\u002F5",362,96],["6\u002F5","345","97"],["7\u002F5","338","91"],["8\u002F5","342","91"],["9\u002F5","332","89"],["10\u002F5","342","83"],["11\u002F5","347","86"],["12\u002F5","341","83"],["13\u002F5","330","89"],["14\u002F5","325","84"],["15\u002F5","297","76"],["16\u002F5","299","73"],["17\u002F5","296","76"],["18\u002F5","311","81"],["19\u002F5","303","79"],["20\u002F5","303","79"],["21\u002F5","285","77"],["22\u002F5","309","76"],["23\u002F5","301","66"],["24\u002F5","304","69"],["25\u002F5","322","73"],["26\u002F5","312","73"],["27\u002F5","297","65"],["28\u002F5","278","66"],["29\u002F5","285","67"],["30\u002F5","285","64"],["31\u002F5","302","68"],["1\u002F6","307","66"],["2\u002F6","288","65"],["3\u002F6","284","66"],["4\u002F6","279","62"],["5\u002F6","272","57"],["6\u002F6","249","61"],["7\u002F6","249","65"],["8\u002F6","254","65"],["9\u002F6","227","52"],["10\u002F6","228","57"],["11\u002F6","245","55"]]],"defaultColors":["#8ec3a7","#dc5356","#f0cb69","#5fb7e5","#ab91c5","#6d53dc","#fd6a37","#e54d24"],"defaultColorsHeatmap":[],"modifier":0,"sheetnames":["Sheet 1"],"sheets_settings":[{"colors":["#6D53DC","#E54D24","#f0cb69","#5fb7e5","#ab91c5","#6d53dc","#fd6a37","#e54d24"]}]}},"top":49,"transform":{"flipHorizontal":false,"flipVertical":false,"rotate":0},"type":"CHART","width":1280}},"layouts":{}},"customFonts":{},"design":{"colors":["#8EC3A7","#DC5356","#F0CB69","#5FB7E5","#AB91C5","#6D53DC","#FD6A37","#E54D24"],"defaults":{"backgroundColor":"#ffffff","fontFamily":"Roboto","fontSize":12,"foregroundColor":"#464646","lineHeight":1.5,"textAlign":"ALIGN_LEFT"},"elements":{"IMAGE":{"fillColor":"#8ec3a7"},"SHAPE":{"fillColor":"#8ec3a7","strokeColor":{"ref":"defaults.backgroundColor"}},"TEXT":{"body":{"fontSize":16},"caption":{"fontSize":{"ref":"fontSizes.small"}},"h1":{"fontSize":{"ref":"fontSizes.extraLarge"}},"h2":{"fontSize":36}}},"fontFamilies":{"font1":"Roboto"},"fontSizes":{"extraLarge":72,"extraSmall":8,"large":64,"medium":18,"small":12}},"designDefaults":{"block":{"background":{"color":"{{colors.#FFFFFF}}","filters":{},"galleryImageId":null,"opacity":1}},"entity":{}},"fonts":[],"footerSettings":{"backgroundColor":"#fff","backgroundOpacity":100,"bold":false,"buttonBackgroundColor":"#d51a1a","buttonText":"Share","buttonTextColor":"#ffffff","customLink":"","customLinkOption":"text","fontSize":11,"footerLayout":"text_left-logo_right","footnoteText":"Create and publish your infographic","footnoteType":"shareButton","hasCustomLink":false,"italic":false,"logoColor":"#d51a1a","logoHeight":0,"logoImage":"","logoLink":"","logoName":"Infogram logo","logoType":"custom_logo-infogram","logoWidth":0,"paginationFormat":"x \u002F y","paginationStartWith":1,"showFooter":false,"textColor":"#464646"},"gridSettings":{"columnCount":4,"rowSpacing":10,"whitespacePercent":3},"interactivityHint":false,"interlinkedCharts":false,"language":"sv","pageSize":{"height":720,"width":1281},"schemaVersion":14,"themeId":215,"transition":"slide"},"hash":"fb63e64b8a26f63d8a6453d180d9789d"},"publishedURLId":"1h7g6kdlq9704oy","updatedAt":"2020-06-11T08:03:40.000Z","embed_image_data":{"height":720},"theme":{"createdAt":"2016-04-22T04:54:10.000Z","updatedAt":"2020-01-31T08:25:57.000Z","title":"Amsterdam","usergroup":"","picture":"https:\u002F\u002Fd1m5pq7b4fzvad.cloudfront.net\u002Fthumbnails\u002F0000_default.png","order":30,"public":1,"width":550,"fonts":"Roboto:400,500,700","colors":["#8ec3a7","#dc5356","#f0cb69","#5fb7e5","#ab91c5","#6d53dc","#fd6a37","#e54d24"],"logocolor":"d51a1a","logoImages":[""],"logoUrl":"","showLogo":"","showEmbed":"","embedButtonText":"Share","top":0,"padding":30,"spacing":30,"shrinkMargin":30,"shrinkPadding":0,"spacingElementMin":null,"spacingElementMax":null,"css":"svg .igc-pie-center-text .igc-pie-center-text-node {\n\tfont-family: Roboto, sans-serif;\n\tfont-weight: 500;\n\tfill: #464646;\n\tfont-size: 19px;\n}\n.igc-sheet {\n\tmargin-bottom: 15px;\n}\n.igc-sheets {\n\tmargin-bottom: 15px;\n}\n.igc-sheets .igc-sheet .igc-sheet-label,\n    .igc-sheets .igc-sheet:hover .igc-sheet-label,\n        .igc-sheets .igc-sheet.active .igc-sheet-label {\n\tcolor: rgba(70, 70, 70, 1);\n\tmargin-left: 5px;\n\tfont: 500 13px Roboto, sans-serif;\n}\n.igc-sheets .igc-sheet:hover .igc-sheet-label,.igc-sheets .igc-sheet.active .igc-sheet-label {\n\tcolor: rgba(70, 70, 70, 0.7);\n}\n.igc-sheets .igc-sheet .igc-sheet-ico,\n    .igc-sheets .igc-sheet:hover .igc-sheet-ico {\n\tbackground: rgba(167, 167, 167, 0.3);\n\tborder-color: #464646;\n\ttransition: .2s;\n}\n.igc-sheets .igc-sheet:hover .igc-sheet-ico {\n\tbackground: rgba(167, 167, 167, 1);\n}\n.igc-sheets .igc-sheet.active .igc-sheet-ico {\n\tbackground: #464646;\n}\n.igc-sheets .igc-sheet.active .igc-sheet-ico::after,\n    .igc-sheets .igc-sheet:hover .igc-sheet-ico::after {\n\theight: 6px;\n\twidth: 6px;\n\tleft: 6px;\n\ttop: 6px;\n\tbackground: #fff;\n}\n.igc-textual-figure {\n\tfont: 400 29px Roboto, sans-serif;\n}\n.igc-textual-fact {\n\tcolor: #464646;\n\tline-height: 18px;\n\tfont: 500 15px Roboto, sans-serif;\n}\n.igc-textual-figure .innertext {\n\tline-height: 30px;\n}\n.igc-textual-fact .innertext {\n\tline-height: 19px;\n}\n.igc-textual-icon {\n\tpadding-right: 30px;\n\tpadding-top: 7px;\n}\n.igc-table .igc-table-cell {\n\tfont: 500 13px Roboto, sans-serif;\n}\n.igc-table .igc-table-header {\n\tfont: 500 13px Roboto, sans-serif;\n\tpadding-left: 9px;\n}\n.ig-container {\n\tbackground: #fff;\n}\n.headline {\n\tfont-weight: 400;\n        font-size: 39px;\n        font-family: Roboto;\n\tcolor: #464646;\n\ttext-align: left;\n\tline-height: 40px;\n\tborder-bottom: 5px solid #e8e8e8;\n\tpadding-bottom: 10px;\n}\n.chart-title {\n\tfont: 400 29px Roboto, sans-serif;\n\tcolor: #464646;\n\ttext-align: left;\n\tline-height: 35px;\n}\n.bodytext {\n\tfont: 500 normal 15px Roboto, sans-serif;\n\ttext-align: left;\n\ttext-align: justify;\n\tcolor: #464646;\n\tline-height: 25px;\n}\n.quote {\n\tfont: 400 29px Roboto, sans-serif;\n\tcolor: #464646;\n\tline-height: 35px;\n\ttext-align: left;\n\tbackground: url(\u002Fi\u002Ftemplates\u002F215\u002Fquote.svg) left top no-repeat;\n\tbackground-size: 50px;\n\tpadding-left: 80px;\n\tmin-height: 40px;\n}\n.shrink .quote {\n\tpadding-top: 50px;\n\tpadding-left: 0;\n}\n.quotetitle {\n\tfont: 500 italic 15px Roboto, sans-serif;\n\tcolor: #464646;\n\tmargin-top: 5px;\n\tline-height: 25px;\n}\n.tt_tooltip {\n\tcolor: #fff;\n\tfont: 500 normal 13px Roboto, sans-serif;\n}\n.igc-legend-entry {\n\tmargin-top: 15px;\n}\n.igc-legend {\n\tpadding-top: 10px;\n\tpadding-bottom: 0;\n}\n.footer-bottom {\n\tpadding-top: 15px;\n\toverflow: hidden;\n\tpadding-bottom: 15px;\n}\n.ig-logo {\n\tmargin-top: 0px;\n}\n.ig-separator-line {\n\tbackground: rgba(70, 70, 70, 0.5);\n}\n.heatmap-legend {\n\tbackground: rgba(255, 255, 255, 0.7);\n}\n.heatmap-legend-item,\n.heatmap-label {\n\tcolor: #464646;\n\tfont-size: 13px;\n\tfont-weight: 400;\n\tfont-family: Roboto, sans-serif;\n}\n.igc-graph-pie-piece {\n\tstroke: rgba(255, 255, 255, 0.7);\n}\n.tt_tooltip .tt_value {\n\tfont-weight: 400;\n}\n.tt_tooltip .tt_body {\n\tbackground: #333;\n}\n.tt_tooltip .tt_left {\n\tborder-right: 8px solid #333;\n}\n.tt_tooltip .tt_right {\n\tborder-left: 8px solid #333;\n}\n.igc-tabs .igc-tab-active {\n\tbackground: #fff;\n}\n.igc-tabs .igc-tab .igc-tab-content,\n          .igc-tabs .igc-tab.icon-down:after {\n\tfont-family: Roboto, sans-serif;\n\tcolor: #464646;\n\tfont-weight: 500;\n}\n.igc-tabs .igc-tab,\n          .igc-tab-switcher {\n\tcolor: #464646;\n}\n.igc-tabs.igc-tabs-dropdown .igc-tab-name {\n\tfont-family: Roboto, sans-serif;\n\tcolor: #464646;\n}\n.captiontext {\n\tfont-family: Roboto, sans-serif;\n\tcolor: #464646;\n\tfont-weight: 500;\n}\n.captiontext .innertext {\n\tline-height: 1.5;\n}\n.igc-tab-ico svg path {\n\tfill: #464646;\n}\n.igc-tab-switcher-ico svg path {\n\tfill: #464646;\n}\n.igc-table-search {\n\tcolor: #666;\n\tfont-size: 13px;\n\tfont-weight: 500;\n\tfont-family: Roboto, sans-serif;\n}\n","charts":{"treemap":{"labels":{"value":{"fontFamily":"Roboto, sans-serif"},"name":{"fontWeight":"400","fontFamily":"Roboto, sans-serif"}}},"wordcloud":{"labels":{"fontFamily":"Roboto, sans-serif","fontWeight":"400"}},"table":{"cellBackground":"#fff","headerBackground":"#eee","cellColor":"#333","headerColor":"#333","shapeFill":"8ec3a7"},"legend":{"color":{"label":{"active":"rgb(70, 70, 70)","hover":"rgba(70, 70, 70, 0.7)","inactive":"rgb(70, 70, 70)"},"icon":{"inactive":"rgba(70, 70, 70, 0.2)"}},"layouts":{"bottom":{"legend":{"entry":{"marginTop":"15px"},"marginTop":"10px","marginBottom":"0"}}}},"sheetSwitch":{"style":{"tab":{"font-family":"Roboto, sans-serif","font-weight":500,"font-style":"normal","colors":{"dropdown":{"selectIcon":"#464646","leftSwitcherIcon":"#464646","rightSwitcherIcon":"#464646"}},"font-size":"13px","color":"#464646"}}},"gauge":{"colors":{"background":"#e8e8e8"}},"waterfall":{"colors":"f0cb69 8ec3a7 dc5356"},"candle":{"colors":{"up":"#dc5356","down":"#8ec3a7"}},"barRadial":{"colors":{"background":"#e8e8e8"}},"pictorialBar":{"colors":{"background":"#e8e8e8"},"style":{"graph":{"item":{"value":{"font-family":"PT Sans Narrow, Arial Narrow","font-size":"60px"}}}}},"map":{"countryFill":"#e8e8e8","hotColor":"#8ec3a7","coldColor":"#f9f9f9"}},"chartOptions":{"map":{"countryStroke":"#e8e8e8","countryFill":"#e8e8e8","hotColor":"#8ec3a7","coldColor":"#f9f9f9"}},"chartDefaults":{},"color":{"bg":"#fff","text":"#464646","chart":{"bg":"transparent","text":"#464646"},"element":{"bg":"transparent","text":"#464646"}},"colorPresets":[],"localFonts":{"google":[{"fontFamily":"Roboto","fontWeights":[400,500,700]}],"local":[],"typekit":[]},"font":{"common":{"textAlign":"initial","fontSize":"13","fontStyle":"normal","fontWeight":"500","fontFamily":"Roboto, sans-serif"},"legend":{"fontSize":"13","fontWeight":"500","fontFamily":"Roboto, sans-serif"},"label":{"fontSize":13,"fontWeight":500}},"fontPresets":[],"fontFamilies":["Roboto"],"footerOptions":{"common":{"borderColor":"#dadada","borderWidth":1},"copyrightNotice":{"enabled":false,"fontFamily":"PT Sans Narrow","fontSize":14,"color":"#4b4b4b","fontWeight":400,"fontStyle":"normal"},"shareButton":{"enabled":true,"background":"#d51a1a","text":"Share","color":"#ffffff","fontFamily":"Roboto, Arial, sans-serif","fontSize":11,"fontWeight":400,"fontStyle":"normal","position":"left"},"logo":{"position":"right","enabled":true,"background":"#d51a1a"}},"archived":false,"tabs":true,"zeroPaddingEmbed":true,"freelayoutContents":{"defaults":{"foregroundColor":"#464646","backgroundColor":"#fff","fontFamily":"Roboto","fontSize":12,"lineHeight":1.5,"textAlign":"ALIGN_LEFT"},"fontFamilies":{"font1":"Roboto"},"fontSizes":{"extraLarge":64,"large":48,"medium":18,"small":12},"elements":{"TEXT":{"h1":{"fontSize":"39px","fontFamily":"Roboto","foregroundColor":"#464646"},"h2":{"fontSize":"29px","fontFamily":"Roboto","foregroundColor":"#464646"},"body":{"fontSize":"15px","fontFamily":"Roboto","foregroundColor":"#464646"},"caption":{"fontSize":"13px","fontFamily":"Roboto","foregroundColor":"#464646"}},"SHAPE":{"fillColor":"#8ec3a7","strokeColor":"#8ec3a7"},"IMAGE":{"fillColor":"#8ec3a7"}},"colors":["#8ec3a7","#dc5356","#f0cb69","#5fb7e5","#ab91c5","#6d53dc","#fd6a37","#e54d24"]},"id":215,"thumb":"\u002Fi\u002Ftemplates\u002F215\u002Fdefault-small.jpg","version":1,"parentId":0,"enabledResponsive":true,"enabledFreeLayout":true,"created_at":"2016-04-22T04:54:10.000Z","updated_at":"2020-01-31T08:25:57.000Z"},"embed":"\u003Cscript id=\"infogram_0_de8d86b3-01ac-42ff-bb4f-91b7f6460464\" title=\"IVA-VGR-totalt-webb\" src=\"https:\u002F\u002Fe.infogram.com\u002Fjs\u002Fdist\u002Fembed.js?y3C\" type=\"text\u002Fjavascript\"\u003E\u003C\u002Fscript\u003E","embedIframe":"\u003Ciframe src=\"https:\u002F\u002Fe.infogram.com\u002Fde8d86b3-01ac-42ff-bb4f-91b7f6460464?src=embed\" title=\"IVA-VGR-totalt-webb\" width=\"1281\" height=\"720\" scrolling=\"no\" frameborder=\"0\" style=\"border:none;\" allowfullscreen=\"allowfullscreen\"\u003E\u003C\u002Fiframe\u003E","embedImageResponsive":"\u003Cscript id=\"infogramimg_0_de8d86b3-01ac-42ff-bb4f-91b7f6460464\" title=\"IVA-VGR-totalt-webb\" src=\"https:\u002F\u002Fe.infogram.com\u002Fjs\u002Fdist\u002Fembed.js?N4a\" type=\"text\u002Fjavascript\"\u003E\u003C\u002Fscript\u003E","embedImageIframe":"","embedAMP":"\u003Camp-iframe width=\"1281\" height=\"720\" layout=\"responsive\" sandbox=\"allow-scripts allow-same-origin allow-popups\" resizable allowfullscreen frameborder=\"0\" src=\"https:\u002F\u002Fe.infogram.com\u002Fde8d86b3-01ac-42ff-bb4f-91b7f6460464?src=embed\"\u003E\u003Cdiv style=\"visibility: hidden\" overflow tabindex=0 role=button aria-label=\"Loading...\" placeholder\u003ELoading...\u003C\u002Fdiv\u003E\u003C\u002Famp-iframe\u003E","embedAMPImage":"\u003Camp-iframe width=\"1281\" height=\"720\" layout=\"responsive\" sandbox=\"allow-scripts allow-same-origin allow-popups\" resizable allowfullscreen frameborder=\"0\" src=\"https:\u002F\u002Fe.infogram.com\u002Fde8d86b3-01ac-42ff-bb4f-91b7f6460464?src=embed\"\u003E\u003Cdiv style=\"visibility: hidden\" overflow tabindex=0 role=button aria-label=\"Loading...\" placeholder\u003ELoading...\u003C\u002Fdiv\u003E\u003C\u002Famp-iframe\u003E","embedWordpress":"[infogram id=\"de8d86b3-01ac-42ff-bb4f-91b7f6460464\" prefix=\"Pba\" format=\"interactive\" title=\"IVA-VGR-totalt-webb\"]","embedWordpressImage":"[infogram id=\"de8d86b3-01ac-42ff-bb4f-91b7f6460464\" prefix=\"2Ej\" format=\"image\" title=\"IVA-VGR-totalt-webb\"]","embedAsync":"\u003Cdiv class=\"infogram-embed\" data-id=\"de8d86b3-01ac-42ff-bb4f-91b7f6460464\" data-type=\"interactive\" data-title=\"IVA-VGR-totalt-webb\"\u003E\u003C\u002Fdiv\u003E\u003Cscript\u003E!function(e,i,n,s){var t=\"InfogramEmbeds\",d=e.getElementsByTagName(\"script\")[0];if(window[t]&&window[t].initialized)window[t].process&&window[t].process();else if(!e.getElementById(n)){var o=e.createElement(\"script\");o.async=1,o.id=n,o.src=\"https:\u002F\u002Fe.infogram.com\u002Fjs\u002Fdist\u002Fembed-loader-min.js\",d.parentNode.insertBefore(o,d)}}(document,0,\"infogram-async\");\u003C\u002Fscript\u003E","embedImageAsync":"\u003Cdiv class=\"infogram-embed\" data-id=\"de8d86b3-01ac-42ff-bb4f-91b7f6460464\" data-type=\"image\" data-title=\"IVA-VGR-totalt-webb\"\u003E\u003C\u002Fdiv\u003E\u003Cscript\u003E!function(e,i,n,s){var t=\"InfogramEmbeds\",d=e.getElementsByTagName(\"script\")[0];if(window[t]&&window[t].initialized)window[t].process&&window[t].process();else if(!e.getElementById(n)){var o=e.createElement(\"script\");o.async=1,o.id=n,o.src=\"https:\u002F\u002Fe.infogram.com\u002Fjs\u002Fdist\u002Fembed-loader-min.js\",d.parentNode.insertBefore(o,d)}}(document,0,\"infogram-async\");\u003C\u002Fscript\u003E","indexStatus":false};</script>
