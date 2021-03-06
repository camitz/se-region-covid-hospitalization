const Scraper = require('../scraper')
const $ = require('jquery');
const moment = require('../moment.js')

class Stockholm extends Scraper{
	_baseUrl = 'https://www.sll.se/Nyheter';

	get name() {
    return 'Stockholm';
  }

  parse(xmlDoc){
        var a=xmlDoc.evaluate('//*[@id="main-content"]//div[@class="m-search-list"]//a[contains(@href,"lagesrapport-om")]', xmlDoc).iterateNext();
        var a1=xmlDoc.evaluate('//*[@id="main-content"]//div[@class="m-search-list"]//a[contains(@href,"dagslage-covid")]', xmlDoc).iterateNext();

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
module.exports = Stockholm