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
module.exports = JH