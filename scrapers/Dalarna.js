const Scraper = require('../scraper')
const $ = require('jquery');
const moment = require('../moment.js')

class Dalarna extends Scraper{
    _baseUrl = 'https://www.regiondalarna.se/';

	get name() {
    return 'Dalarna';
  }

  parse(xmlDoc){
        var t=xmlDoc.evaluate('//*[@id="pills-news"]/div/a', xmlDoc);
        var i;
        do{
            i = t.iterateNext();
        }while(i.href.indexOf("lagesrapport-covid")===-1&&i.href.indexOf("covid-19-siffror")===-1);

       var t = new DalarnaSub(i.href);

       return t.scrape();

  }
}


class DalarnaSub extends Dalarna{
    _baseUrl='https://www.regiondalarna.se';

  parse(xmlDoc){
        var t = xmlDoc.evaluate('/html/body/main/div/div[2]/div[1]/div/h1', xmlDoc).iterateNext().innerText;
        var raw=t;
        var date = t.match(/(?<=:\s?)\d+ \w+/);
        date = moment(date[0]);
        date.set('year',2020);

        //t = xmlDoc.evaluate('//*[@id="main-content"]//div[@class="article"]//p', xmlDoc);
        t = xmlDoc.evaluate('//*[@id="main-content"]//div[@class="article"]//li', xmlDoc);//1 sept

        var i, inl=0, iva=0;
        while(i = t.iterateNext()){
        	raw += i.innerText;

        	//var m = [...i.innerText.matchAll(/vårdavdelning på falu\s+lasarett:\s+(\d+)/gi)];
        	var m = [...i.innerText.matchAll(/exklusive\s+intensivvårdsavdelning\):\s+(\d+)/gi)];//30 april
        	if(m.length){
        	    inl = m[0][1]*1;
        	    continue;
        	}
        	
        	//m = [...i.innerText.matchAll(/som får intensivvård:\s+(\d+)/gi)];
        	m = [...i.innerText.matchAll(/intensivvårdsavdelning \w+:\s+(\d+)/gi)];//30 april
        	if(m.length){
        	    iva += m[0][1]*1;
        	    continue;
        	}
        };


        var raw = raw.substr(0,300);
                
        return [date,inl+iva,iva,raw,this.url];
  }
}


module.exports = Dalarna