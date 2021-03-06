const Scraper = require('../scraper')
const $ = require('jquery');
const moment = require('../moment.js')

class Kronoberg extends Scraper{
    _baseUrl = 'http://www.regionkronoberg.se/corona';

	get name() {
    return 'Kronoberg';
  }

  parse(xmlDoc){
        var table = xmlDoc.evaluate('//*[@id="content"]/div[1]/div', xmlDoc).iterateNext();
        var t = table.querySelectorAll('table td')[4].innerText;
        var raw = table.innerText.substr(0,300);

        var p = table.querySelector('p');

        var sel = "p~*", date = "";
        while(!date)
             date = table.querySelector(sel).innerText.match(/\d\d\d\d-\d\d-\d\d/), sel+="~*";
        
        date= moment(date[0]);

        var inl = t.match(/\d+/)[0]*1;
        var iva = t.match(/(?<=\()\d+/)[0]*1;

        return [date,inl,iva,raw];
  }
}

module.exports = Kronoberg