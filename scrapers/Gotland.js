const Scraper = require('../scraper')
const $ = require('jquery');
const moment = require('../moment.js')

class Gotland extends Scraper{
    _baseUrl = 'https://www.gotland.se/nyhetsarkiv';

	get name() {
    return 'Gotland';
  }

  parse(xmlDoc){
        var t=xmlDoc.evaluate('//*[@id="newsItems"]/ul/li/article', xmlDoc);
        var i;
       
        do{
            i = t.iterateNext();
        }while(!i.querySelector('.news-header').innerText.trim().startsWith("Lägesrapport om covid"));
        var raw = i.innerText;

        var date = moment(i.querySelector('.news-date').innerText);
        
       var t = new GotlandSub("https://www.gotland.se/"+i.querySelector('a').href.match(/\d+/)[0]);

       return t.scrape();

  }
}


class GotlandSub extends Gotland {
  parse(xmlDoc){
        var t=xmlDoc.evaluate('//*[@id="content"]/div[contains(@class,"contentTexts")]',xmlDoc);
        var raw = t.iterateNext().innerText.substr(0,1000);
        var date = moment([...raw.matchAll(/Publicerad ([0-9-]+)/g)][0][1]);


        try{
			if(raw.match(/För närvarande vårdas ingen person med sjukdomen covid-19 på Visby lasarett/gi))
				return [date,0,0,raw,this.url];
				
			if(raw.match(/Ingen patient med konstaterat covid-19 vårdas för närvarande på Visby lasarett/gi))
				return [date,0,0,raw,this.url];

			if(raw.match(/På Visby lasarett vårdas just nu ingen patient med anledning av covid-19/gi))
				return [date,0,0,raw,this.url];

            t = [...raw.matchAll(/([a-zåäö]+) person vårdas på Visby lasaretts intensivvårdsavdelning/gi)];
            if(t.length)
			    return [date,this.ordinalOrNumber(t[0][1]),this.ordinalOrNumber(t[0][2]),raw,this.url];
            
            t = [...raw.matchAll(/([a-zåäö]+) person med sjukdomen covid-19 vårdas på Visby lasaretts intensivvårdsavdelning/gi)];
            if(t.length)
			    return [date,this.ordinalOrNumber(t[0][1]),this.ordinalOrNumber(t[0][2]),raw,this.url];

			t = [...raw.matchAll(/På Visby lasarett vårdas för närvarande ([a-zåäö]+|\d+) patienter.*, varav ([a-zåäö]+|\d+)/gi)];
			if(t.length)
			    return [date,this.ordinalOrNumber(t[0][1]),this.ordinalOrNumber(t[0][2]),raw,this.url];

			t = [...raw.matchAll(/På Visby lasarett vårdas ([a-zåäö0-9]+) patient.+samt ([a-zåäö0-9]+) patienter /gi)];
			if(t.length){
    			var t1 = [...raw.matchAll(/Ingen patient har i nuläget behov av intensivvård på grund av covid-19./gi)];
    			    return [date,this.ordinalOrNumber(t[0][1])+this.ordinalOrNumber(t[0][2]),0,raw,this.url];				
			}

            var inl = -1;
			t = [...raw.matchAll(/\s([a-zåäö]+|\d+)\s(person|patient)(.*covid-19)?.*på (Visby lasarett|vårdavdelning)/gi)][0];
			if(t.length)
    			inl = this.ordinalOrNumber(t[1]);

			var iva =0;

			if(!raw.match(/men är inte i behov av i/gi) && !raw.match(/ingen (vårdas )?på i/gi)) {
				var t = [...raw.matchAll(/varav\s([a-zåäö]+|\d+)\spå intensiv/gi)];
				if (t.length)
					iva = this.ordinalOrNumber(t[0][1]);
				else if(inl<0)				    
					return [date,"recode", "recode",raw,this.url];
			}

			return [date,inl, iva,raw,this.url];
        } catch(e){
            return [date,"recode", "recode",raw,this.url];
        }
  }
}


module.exports = Gotland