const Scraper = require('../scraper')
const $ = require('jquery');
const moment = require('../moment.js')

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
            t1 = [...raw.matchAll(/(\d\d?\s+\w+):\s(\d+).+?\.\s\s?Av dessa får\s+([a-zåäö]+|\d+)/gi)];
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

module.exports = Sormland
