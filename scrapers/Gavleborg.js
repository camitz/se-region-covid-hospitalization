
class Gavleborg extends Scraper{
    _baseUrl = '';

	get name() {
    return 'Gävleborg';
  }

  parseS3mail(){

		var s3 = new AWS.S3({
		  apiVersion: '2006-03-01',
		  params: {Bucket: 'fhmbelaggningse'}
		});

		return s3.listObjectsV2({Bucket: 'fhmbelaggningse'}).promise().then(data=> {
			  var items = data.Contents.filter(x=>moment(x.LastModified).add(7,'days').isAfter(moment())).map(x=>x.Key);
			  return Promise.all(items.map(key=>s3.getObject({Bucket: 'fhmbelaggningse',Key:key}).promise()));
			})
			.then(objs=>{
				var from = objs.map(x=>x.Body.toString().match(/From:\s.*/i)[0]);
				var subjectRegex = /Subject:.*Statistik_Region_G=E4vleborg_Patienter_v=E5rdade_i_slutenv/;
				var t = objs.filter(x=>x.Body.toString().match(subjectRegex));
				if(!t.length)
				    return[moment(),'-','-',null];
				    
				t = t.sort((a,b)=>a.LastModified<b.LastModified?1:-1)[0].Body.toString();

				var raw =t.match(/Content-Type: application\/octet-stream;[\n\r]*\s*name.*CovidData.csv(.*[\n\r]{2}){7}[\n\r]{2}([\s\S]+)[\n\r]{3}/m)[2];
				var raw = atob(raw);

			    t = raw.split("\n").map(x=>x.split(",")).filter(x=>x.length==3);
			    t=t.slice(65);
			    var date = moment(t[t.length-1][0]);
			    var inl = t[t.length-1][1]*1;
			    var iva = t[t.length-1][2]*1;

			    this.dates = t.map(x=>moment(x[0]));
			    this.inls = t.map(x=>x[1]*1);
			    this.ivas = t.map(x=>x[2]*1);

			    return [date, inl, iva, raw];
			});
  }
}

/*
class Gavleborg extends Scraper{
	_baseUrl = 'https://www.regiongavleborg.se/a-o/Smittskydd/A-Y/c/Coronavirus-2019-nCoV/statistik-covid-19/';
	get name() {
        return 'Gävleborg';
      }

  parse(xmlDoc){
        var t = xmlDoc.evaluate('//div[contains(@class,"article__body__main")]/*', xmlDoc);

        var raw="",i,date,inl,iva=0;
        while(i = t.iterateNext()){
        	raw += i.innerText;

        	var m = [...i.innerText.matchAll(/Senast uppdaterad\s(\d+.\d+\s)?(den )?(\d+ \w+)/g)];
        	if(m.length){
        	    date = m[0][3];
        	    continue;
        	}

        	m = [...i.innerText.matchAll(/antal inneliggande patienter bekräftade med covid-19:\s(\d+)/gi)];
        	if(m.length){
        	    inl = m[0][1]*1;
        	    continue;
        	}
        	
        	m = [...i.innerText.matchAll(/Patienter som vårdas på intensiven.*med covid-19:\s(\d+)/g)];
        	if(m.length){
        	    iva += m[0][1]*1;
        	    continue;
        	}
        };

        var raw = raw.substr(0,500);
        var date = moment(date);
                
        return [date,inl,iva,raw,this.url];

  }
}*/

//From: <karin.josefsson@regiongavleborg.se>
