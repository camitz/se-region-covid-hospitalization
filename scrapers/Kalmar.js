const Scraper = require('../scraper')
const $ = require('jquery');
const moment = require('../moment.js')
const pdfjsLib = require('pdfjs-dist')

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
module.exports = Kalmar