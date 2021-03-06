const Scraper = require('../scraper')
const AWS = require('aws-sdk')
require('../awsCreds.js')(AWS)
const $ = require('jquery');
const moment = require('../moment.js')
const libxmljs = require('libxmljs')

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
				    .filter(x=>this.b64DecodeUnicode(x.Body.toString().match(subjectRegex)[1]).match(/Beläggningsstatistik för Region Ö/));
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
*/module.exports = Orebro