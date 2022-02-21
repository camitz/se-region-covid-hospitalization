const Scraper = require('../scraper')
const $ = require('jquery');
const moment = require('../moment.js')


class Skane extends Scraper{
    _baseUrl = 'https://www.google.com/';

	get name() {
    return 'Skåne';
  }

  parse(xmlDoc){
  	    var me = this;
  	    var weekly = new SkaneWeekly();
  	    
       return Promise.all([
           weekly.scrape().then(function(v){
           	[this.dates,this.ivas,this.inls]=[weekly.dates,weekly.ivas,weekly.inls];
           	return v;
           }.bind(this),weekly), (new SkaneDaily()).scrape()
       ]).then(values=>{
       	console.log(values);
       	return values[1];
       });
  }
}



class SkaneWeekly extends Skane{
    _baseUrl = 'https://www.skane.se/digitala-rapporter/lagesbild-covid-19-i-skane/fordjupad-lagesbild/';


  parse(xmlDoc){
              var t = xmlDoc.evaluate('//script', xmlDoc);

        var raw="",i,date,inl,iva,m;
        while(i = t.iterateNext()){
        	if(i.innerText.indexOf('chart-block-seven-170352')===-1)
        	    continue;

            var excelData;
            var script = i.innerText;
            script = script.substring(0,script.indexOf("var categories")).substr(script.indexOf("var excelData")+4);
            try{
            	eval(script);
            }catch{
            }

            var l = excelData.Categories.length;
            date = excelData.Categories[l-1].name;
            this.dates = excelData.Categories.map(x=>moment(x.name));

            var f= x=>isNaN(x)?0:(x*1);
            iva = excelData.Series[1].data[l-1];
            this.ivas = excelData.Series[1].data;
            inl = excelData.Series[0].data[l-1]+iva;
            this.inls = excelData.Series[0].data.map((x,i)=>x+this.ivas[i]);

            raw = script;
            
            break;
        };

        date = moment(date);
                
        return [date,inl,iva,raw,this.url];
  }
}


class SkaneDaily extends Skane{
    _baseUrl = 'https://www.skane.se/digitala-rapporter/lagesbild-covid-19-i-skane/inledning/';

  parse(xmlDoc){
              var t = xmlDoc.evaluate('//script', xmlDoc);

        var raw="",i,week,inl,iva,m;
        while(i = t.iterateNext()){
        	if(i.innerText.indexOf('chart-block-seven-177937')===-1)
        	    continue;

            var excelData;
            var script = i.innerText;
            script = script.substring(0,script.indexOf("var categories")).substr(script.indexOf("var excelData")+4);
            try{
            	eval(script);
            }catch{
            }

            var l = excelData.Categories.length;
            week = excelData.Categories[l-1].name;
            this.dates = excelData.Categories.map(x=>moment(x.name));

            var f= x=>isNaN(x)?0:(x*1);
            iva = excelData.Series[1].data[l-1];
            this.ivas = excelData.Series[1].data;
            inl = excelData.Series[0].data[l-1]+iva;
            this.inls = excelData.Series[0].data.map((x,i)=>x+this.ivas[i]);

            raw = script;
            
            break;
        };

        var date = moment().day("Tuesday").isoWeek(week);
                
        return [date,inl,iva,raw,this.url];
  }
}

module.exports = Skane
