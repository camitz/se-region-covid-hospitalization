const Scraper = require('../scraper')
const $ = require('jquery');
const moment = require('../moment.js')

class Varmland extends Scraper{
    _baseUrl = 'https://www.regionvarmland.se/halsa-och-vard/coronavirus---covid-19/aktuellt-lage-i-varmland--covid-19/';

	get name() {
        return 'Värmland';
	}
	
  parse(xmlDoc) {
        var node = xmlDoc.evaluate('//main//div[contains(@class,"sv-text-portlet")]//*', xmlDoc);

       var raw = "",t, inl=null, iva=null,date;

       while(t = node.iterateNext()){
			var m = [...t.innerText.matchAll(/Lägesbild\s(den)?\s(\d+\s[a-z]+)/gi)];
			if(m.length){
				raw+=t.innerText;
				date = moment(m[0][2]);
				date.set("year",2022);
				break;
            }
       }

       while(t = node.iterateNext()){
			var m = [...t.innerText.matchAll(/(\d+)\spatienter\svarav\s(\d+)\spå intensiv/gi)];
			if(m.length){
				raw+=t.innerText;
				inl = m[0][1]*1;
				iva = m[0][2]*1;
				break;
            }
       }

       if(!raw)
           throw("Nothing registered")


        return [date,inl,iva,raw];
  }
}


/*
class Varmland extends Scraper{
    _baseUrl = 'https://www.regionvarmland.se/halsa-och-vard/coronavirus---covid-19/aktuellt-lage-i-varmland--covid-19/';

	get name() {
    return 'Värmland';
  }
  parse(xmlDoc){
        var raws=[],i,dates=[],inls=[],ivas=[];


        var t = xmlDoc.evaluate('//div[@class="EditorContent"]//h2', xmlDoc);

        while(i = t.iterateNext()) {
        	if(/Lägesbild\s[a-zåäö]+\s(den)?/gi.test(i.innerText)){
				var raw="",i,date,inl=-1,iva=-1,m;
				m = [...i.innerText.matchAll(/(den)?\s(\d+\s\w+)/gi)];
				if(m.length){
					raw+=i.innerText;
					date = m[0][2];
				}

                
				while (i=i.nextElementSibling){
					m = [...i.innerText.matchAll(/(\d+)\sinneliggande patienter som vårdas för covid-19 varav\s(\d+)\svårdas på IVA/gi)];
					if(m.length){
						raw+=i.innerText;
						inl = m[0][1]*1;
						iva = m[0][2]*1;
						continue;
					}
        	

					m = [...i.innerText.matchAll(/uppdatera\w\s(\d+ \w+)/gi)];
					if(m.length){
						raw+=i.innerText;
						date = m[0][1];
						break;
					}


					m = [...i.innerText.matchAll(/(\d+)+ patienter(,\svarav\s(\d+)\spå IVA)?/gi)];
					if(m.length && inl<0){
						iva=inl=0;
						for(const m1 in m){
							raw+=i.innerText;
							inl += m[m1][1]*1;
							if(m[m1].length>=4 && m[m1][3])
							    iva += m[m1][3]*1;
						}
					}

					if(i.tagName=="H2")
					    break;
				}

				raws.push(raw);
				dates.push(date);
				inls.push(inl);
				ivas.push(iva);

        	}
        };

        
        [this.dates,this.inls,this.ivas]=[dates.map(x=>moment(x).set('year',2020)).reverse(),inls.reverse(),ivas.reverse()];

        var l = this.dates.length-1;
        return [this.dates[l],this.inls[l],this.ivas[l],raw,this.url,raws,dates,inls,ivas];
  }
}
*/

module.exports = Varmland
