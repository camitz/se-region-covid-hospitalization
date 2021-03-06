const Scraper = require('../scraper')
const $ = require('jquery');
const moment = require('../moment.js')

class Vasternorrland extends Scraper{
		//_baseUrl = "https://www.rvn.se/sv/Vard-o-halsa/coronavirus---for-dig-som-vill-veta-mer/statistik-och-fakta/";
		_baseUrl = "https://www.rvn.se/sv/Vard-o-halsa/coronavirus---covid-19/statistik-och-fakta/";

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
module.exports = Vasternorrland