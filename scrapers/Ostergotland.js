const Scraper = require('../scraper')
const AWS = require('aws-sdk')
require('../awsCreds.js')(AWS)
const $ = require('jquery');
const moment = require('../moment.js')

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
					    return m && /RegionOstergotland Covid19/.test(this.b64DecodeUnicode(m[1]))
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
module.exports = Ostergotland