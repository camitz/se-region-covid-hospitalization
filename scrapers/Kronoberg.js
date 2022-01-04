const Scraper = require('../scraper')
const $ = require('jquery');
const moment = require('../moment.js')

class Kronoberg extends Scraper{
    _baseUrl = 'https://www.regionkronoberg.se/halsa-vard-tandvard/coronavirus/smittskyddslakarens-rapporter/';

	get name() {
    return 'Kronoberg';
  }

	parse(xmlDoc){
       var a = xmlDoc.evaluate('//*[@id="content"]//a[@class="arrow"]', xmlDoc).iterateNext();
       var t = new KronobergSub(a.href);

       return t.scrape();
  }
}


class KronobergSub extends Scraper{
    _baseUrl = 'https://www.regionkronoberg.se/halsa-vard-tandvard/coronavirus/smittskyddslakarens-rapporter/';

	get name() {
    return 'Kronoberg';
  }
	
  parse(items) {
	var date = (items[1][0].str + items[1][1].str).match(/[\d-]+/);
	date = moment(date[0]);
	
	var inl = items[1][4].str.match(/Inneliggande patienter: (\d+), varav (\d+)/);
	var iva = inl[2]*1;
	inl = inl[1]*1;

	var raw = items[1].map(x=>x.str).join("\n");

	return [date,inl,iva,raw,this.url];        	
  }
}

module.exports = Kronoberg