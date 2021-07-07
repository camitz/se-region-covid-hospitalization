const Scraper = require('../scraper')
const $ = require('jquery');
const moment = require('../moment.js')

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
        var t = xmlDoc.evaluate('//h1[contains(@class,"heading") and contains(@id,"h-Lagesrapport")]', xmlDoc).iterateNext();
        var raw = t.innerText,iva,inl;
        var date = moment(t.innerText.match(/\d\d-\d\d-\d\d/g)[0],"YY-MM-DD");
                
        var t0 = t.parentElement.parentElement.nextElementSibling.nextElementSibling.innerText;
       
        var t2 = [...t0.matchAll(/(\d+)(\sst)?,\singen på IVA/g)][0];
        if(t2)
            return [date,t2[1]*1,0,raw,this.url];

        var t2 = [...t0.matchAll(/(\d+)(\sst)?,\sbåda på IVA/g)][0];
        if(t2)
            return [date,2,2,raw,this.url];

        t2 = [...t0.matchAll(/(\d+)(\sstycken totalt)?(\spatienter)?,? varav ([a-zåäö0-9]+)/g)][0];
        if(t2)
            return [date,t2[1]*1,this.ordinalOrNumber(t2[4]),raw,this.url];
       
        t2 = [...t0.matchAll(/(\d+) stycken på IVA/g)][0];
        if(t2)
            return [date,0,t2[1]*1,raw,this.url];
        
        t2 = [...t0.matchAll(/Smittade patienter under sjukhusvård just nu: (\d+)/g)][0];
        if(t2){
        	var iva = 0, inl = t2[1]*1;
            t2 = [...t0.matchAll(/st, varav (\d+) på IVA/gi)];
			if(t2.length)
				iva = t2[0][1]*1
            return [date,inl,iva,raw,this.url];        	
        }

        throw "Fel";
  }
}
module.exports = JH