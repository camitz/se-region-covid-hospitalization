const Scraper = require('../scraper')
const $ = require('jquery');
const moment = require('../moment.js')


class Blekinge extends Scraper{
    _baseUrl = 'https://regionblekinge.se/halsa-och-vard/for-vardgivare/smittskyddsenheten/information-om-coronaviruset.html';

	get name() {
    return 'Blekinge';
  }

  parse(xmlDoc) {
        var raw = xmlDoc.evaluate('//*[@id="svid12_2cd827be170f3b15ca913afb"]/div[2]//table', xmlDoc).iterateNext();
        raw = "<table>"+raw.innerHTML+"</table>";

        var node = xmlDoc.evaluate('//*[@id="svid12_2cd827be170f3b15ca913afb"]/div[2]//table/tbody/tr/td', xmlDoc);
        var t = node.iterateNext();
        var t = node.iterateNext();

        var inl = t.innerText.match(/\d+/)[0]*1;
        var iva = t.innerText.match(/\((\d+)/)[1];

        var date = xmlDoc.evaluate('//*[@id="svid12_2cd827be170f3b15ca913af1"]//h2', xmlDoc).iterateNext().innerText.match(/den (\d{1,2} \w+)/)[1];
        date = moment(date);

        return [date,inl,iva,raw];
  }
}

module.exports = Blekinge
