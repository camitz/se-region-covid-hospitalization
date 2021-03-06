const Scraper = require('../scraper')
const $ = require('jquery');
const moment = require('../moment.js')

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
module.exports = Vastmanland