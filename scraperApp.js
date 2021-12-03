require('./scraper');
const scrapers = require('./scrapers');
const moment = require('./moment.js')

class ScraperApp {
	constructor(){

	}

     timelineParse(results) {
	    var scrapers = results
	        .map(result=>result.value)
	        .sort((a,b)=>a.name.localeCompare(b.name));


	    var dateRange = results
	        .filter(result=>result.status=="fulfilled" && result.value.dates && result.value.dates.length>10)
	        .map(result=>result.value);

	    if(!dateRange.length)
	        return;
	    
	    var dateRangeL=Infinity,dateRangeH=0;
	    for(var  i =0; i < dateRange.length; i++)
	        for(var  j =0; j < dateRange[i].dates.length; j++){
	            if (dateRangeL > dateRange[i].dates[j])
	                dateRangeL = dateRange[i].dates[j];
	            if (dateRangeH < dateRange[i].dates[j])
	                dateRangeH = dateRange[i].dates[j];
	        }

	    dateRange = [dateRangeL,dateRangeH];

	    var hRow= scrapers.map(x=>`<th>${x.name}</th>`);
	    document.querySelector("#inls thead").innerHTML = "<th>datum</th>"+hRow.join("");
	    document.querySelector("#ivas thead").innerHTML = "<th>datum</th>"+hRow.join("");

	    var i = 0, d = moment(dateRange[0]);
        while(d.isSameOrBefore(dateRange[1], 'day')){
    		var rowInl = document.createElement('tr');
    		var rowIva = document.createElement('tr');
			rowInl.innerHTML = `<td>${d.format("DD MMMM")}</td>`;
			rowIva.innerHTML = `<td>${d.format("DD MMMM")}</td>`;

    		scrapers.forEach(x=>{
    			var ii;
				if(x.dates && (ii = x.dates.findIndex(xx=>xx.isSame(d,'day')))>-1 && typeof(x.inls[ii])==="number")
					rowInl.innerHTML += `<td>${(x.inls[ii]+"").replace("NaN","-")}</td>`;
				else
					rowInl.innerHTML += `<td>-</td>`;

				if(x.dates && (ii = x.dates.findIndex(xx=>xx.isSame(d,'day')))>-1 && typeof(x.ivas[ii])==="number")
					rowIva.innerHTML += `<td>${(x.ivas[ii]+"").replace("NaN","-")}</td>`;
				else
					rowIva.innerHTML += `<td>-</td>`;
    		});

			document.querySelector("#inls tbody").appendChild(rowInl);
			document.querySelector("#ivas tbody").appendChild(rowIva);

			d.add(1,"days");
	    }
	}

    scrapeAll(){

		var allScrapers = [
		new scrapers.Blekinge(),
		new scrapers.Dalarna(),
		new scrapers.Gavleborg(),
		new scrapers.Gotland(),
		new scrapers.Halland(),
		new scrapers.JH(),
		new scrapers.Jonkoping(),
		new scrapers.Kalmar(),
		new scrapers.Kronoberg(),
		new scrapers.Norrbotten(),
		new scrapers.Orebro(),
		new scrapers.Ostergotland(),
		new scrapers.Skane(),
		new scrapers.Sormland(),
		new scrapers.Stockholm(),
//		new scrapers.Uppsala2(),
		new scrapers.VG2(),
		new scrapers.Varmland(),
		new scrapers.Vasterbotten(),
		new scrapers.Vasternorrland(),
		new scrapers.Vastmanland()
		 ];

		var uppsalaScraper = new scrapers.Uppsala2().do();
//		var allScrapers = [new scrapers.Gotland()];

		//scrapers.forEach(x=>x.do())

		//new DNSkrapan().do();
		//new Uppsala2().do();
		//new Stockholm().do();
		Promise.allSettled([...allScrapers.map(x=>x.do()), uppsalaScraper]);//.then(this.timelineParse);

    }
}

if (typeof window !== 'undefined')
{
	window.ScraperApp = ScraperApp
}

module.exports = ScraperApp
