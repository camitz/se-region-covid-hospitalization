const Scraper = require('../scraper')
const $ = require('jquery');
const moment = require('../moment.js')

class DNSkrapan{

	get url(){
        return'https://api.quickshot-widgets.net/fields/1141';
    }    
	get name() {
		return 'DN';
	  }

  parseJson(result){
  	    var date = moment(result.fields.filter(x=>x.key==="source")[0].value.match(/\d+\/\d+/)[0],"DD/M").format('D MMMM');
        return result.fields.filter(x=>x.key==="list")[0].value.filter(x=>!/totalt/i.test(x.Region)).sort((a,b)=>a.Region<b.Region?-1:1).map(x=>[x.Region,date,x["INLAGDA*"],x["VARAV IVA**"]])
  }

  	do(){
		var me = this;
    	try {
    		this.scrape().then(function(r){me.produceRow(r);},function(r){me.produceError();});
		    
    	} catch(e){
    		console.log(e);
    		mw.produceError();
			
    	} 
	}

	scrape(){
		var me = this;
		return new Promise((resolve,reject)=>{
		$.ajax({
            url : this.url,
            success : function(result){
                try {
			        resolve(me.parseJson(result));
                }catch(e){
                	console.log(e);
                	reject(e);
                }
            }    
        });
		});
    }

     produceRow(result){
     	result.forEach(x=>{
         	var row = document.createElement('tr');
			row.innerHTML = "";
            x.forEach(y=>row.innerHTML += `<td>${y}</td>`);
            document.getElementById("dn").appendChild(row);
     	    }
     	);
     }

     produceError(){
     	var row = document.createElement('tr');
			row.innerHTML = `<td>${this.name}</td>`;
    		row.innerHTML += "<td>Fel!</td><td></td><td></td><td></td>";
    		row.innerHTML += `<td><a href="${this.url}">${this.url}</td>`;
            document.getElementById("p").appendChild(row);		
     }

}

module.exports = DNSkrapa