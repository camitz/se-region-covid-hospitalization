
class Halland extends Scraper{
    _baseUrl = 'https://www.regionhalland.se/om-region-halland/smittskydd/information-om-det-nya-coronaviruset/laget-i-halland-covid-19/';

	get name() {
    return 'Halland';
  }

  parse(xmlDoc){
        var raw = xmlDoc.evaluate('//*[@id="main"]//time',xmlDoc,null,XPathResult.STRING_TYPE ).stringValue;


        var date = moment(raw);

        var check = xmlDoc.evaluate('//*[@id="main"]/article/table[1]/tbody/tr[4]/td[1]',xmlDoc,null,XPathResult.STRING_TYPE ).stringValue;

        if(!check.startsWith("Inlagda på Hallands sjukhus"))
            throw "Halland failed check."

        var inl = xmlDoc.evaluate('//*[@id="main"]/article/table[1]/tbody/tr[4]/td[2]',xmlDoc,null,XPathResult.STRING_TYPE ).stringValue;
        inl=inl.match(/\d+/)[0]*1;

        var iva = xmlDoc.evaluate('//*[@id="main"]/article/table[1]/tbody/tr[5]/td[2]',xmlDoc,null,XPathResult.STRING_TYPE ).stringValue;        
        iva=iva.match(/\d+/)[0]*1;
        
        var raw = xmlDoc.evaluate('//*[@id="main"]/article/table[1]',xmlDoc,null,XPathResult.STRING_TYPE ).stringValue;

        return [date,inl,iva,raw];
  }
}
