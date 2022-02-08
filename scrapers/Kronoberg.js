const Scraper = require('../scraper')
const $ = require('jquery');
const moment = require('../moment.js')

class Kronoberg extends Scraper{
    _baseUrl = 'https://www.regionkronoberg.se/halsa-vard-tandvard/coronavirus/';

	get name() {
    return 'Kronoberg';
  }

	parse(xmlDoc){
    var t = xmlDoc.evaluate('//*[@class="editor-content"]//h2', xmlDoc);
    var i, date=[];
    do{
      i = t.iterateNext();
    }while(!i.innerText.match(/Statistik om covid-19/));

    do{
      i = i.nextSibling;
      if(i.innerText) 
        date = [...i.innerText.matchAll(/Uppdaterad:\s(\d{4}-\d{2}-\d{2})/g)]; 
    }while (!date.length); 

    date = moment(date[0][1]);

    do{
      i = i.nextSibling;
    }while (i.tagName!="TABLE") 

    i = i.querySelector("tr:nth-child(2) td:nth-child(2)");

    var inl = [...i.innerText.matchAll(/(\d+)\s\((\d+)\)/g)];
    var iva = inl[0][2]*1;
    inl = inl[0][1]*1;

    return [date,inl,iva,""];
}
}


module.exports = Kronoberg