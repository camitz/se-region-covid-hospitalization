const Scraper = require('../scraper')
const $ = require('jquery');
const moment = require('../moment.js')

class VG2 extends Scraper{
    _baseUrl = 'https://e.infogram.com/1pyyqv6pym1kd0c3w23qk6jj0ety91y3nwp?src=embed';

	get name() {
    return 'Västra götaland';
  }

  parse(xmlDoc){       
        var t = xmlDoc.evaluate('//script', xmlDoc);

        var raw="",i,date,inl,iva,m;
        while(i = t.iterateNext()){
        	if(i.innerText.indexOf('window.infographicData')===-1)
        	    continue;

            try{
            	eval(i.innerText);
            }catch{
            }

            var dataObject = window.infographicData;            
            var key = Object.keys(dataObject.elements.content.content.entities)[1];
            dataObject = dataObject.elements.content.content.entities[key];
            dataObject=dataObject.props.chartData.data[0].slice(1);
            var l = dataObject.length;
            
            this.dates = dataObject.map(x=>moment(x[0].replace("-"," ")).set("year",2020));
            this.inls = dataObject.map(x=>x[2]*1);
            this.ivas = dataObject.map(x=>x[1]*1);

			var raw = JSON.stringify(dataObject).replaceAll("SAKNAS","na").replaceAll("#na!","na");

			return [this.dates[l-1],this.inls[l-1],this.ivas[l-1],"",
			        this.url, i.innerText,this.dates,
				this.inls,
				this.ivas,
			];
        };
  }
}


class VG extends Scraper{
    _baseUrl = 'https://www.vgregion.se/covid-19-corona/statistik-covid-19-i-vastra-gotaland/';

	get name() {
    return 'Västra götaland';
  }

  parse(){
        var t = xmlDoc.evaluate('//*[@id="main-content"]/div[1]/div[1]/div/div//p', xmlDoc);

        var raw="",i,date,inl,iva;
        while(i = t.iterateNext()){
        	var m = [...i.innerText.matchAll(/Den\s(\d+\s\w+)\skl\.\s[0-9:]+\sfanns det totalt\s(\d+)\sinneliggande patienter med positiv covid-19, varav\s(\d+)/gi)];
        	if(m.length){
            	raw += i.innerText;
               date = m[0][1];
               inl = m[0][2]*1;
               iva = m[0][3]*1;
        	    break;
        	}

        };

        var raw = raw.substr(0,300);
        var date = moment(date);
                
        return [date,inl,iva,raw,this.url];
  }
}

module.exports = VG2