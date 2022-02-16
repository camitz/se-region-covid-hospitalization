const Scraper = require('../scraper')
const $ = require('jquery');
const moment = require('../moment.js')


class Blekinge extends Scraper{
    _baseUrl = 'https://regionblekinge.se/halsa-och-vard/for-vardgivare/smittskyddsenheten/covid-19-aktuellt-lage-i-region-blekinge.html';

	get name() {
    return 'Blekinge';
  }

  parse(xmlDoc) {
        var raw = xmlDoc.evaluate('//*[@id="svid12_205b7bc717dc2b0f42df36f2"]/div[2]//table', xmlDoc).iterateNext();
        raw = raw.innerText;

        var node = xmlDoc.evaluate('//*[@id="svid12_205b7bc717dc2b0f42df36f2"]/div[2]//table/tbody/tr[2]', xmlDoc);
        var t = node.iterateNext();

        var inl = t.children[1].innerText.match(/\d+/)[0]*1;
        var iva = t.children[1].innerText.match(/\((\d+)/)[1];

        var date = moment(t.children[0].innerText);
        date.set("year",moment().get("year"))

        return [date,inl,iva,raw];
  }
}

module.exports = Blekinge
