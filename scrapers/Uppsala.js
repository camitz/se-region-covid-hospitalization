const Scraper = require('../scraper')
const $ = require('jquery');
const moment = require('../moment.js')
const JSZipUtils = require('jszip-utils')
const XLSX = require('xlsx')
const pdfjsLib = require('pdfjs-dist')

class Uppsala extends Scraper{
    _baseUrl = 'https://via.tt.se/json/v2/releases?publisher=3235664';

	get name() {
    return 'Uppsala';
  }

  parseJson(result){
        var raw = result.releases.filter(x=>x.title.startsWith("Covid") && x.title.indexOf("Läget")>-1)[0];
        var date = moment(raw.title.match(/(\d\d? \w+)/gi)[0]);
        
        var t = document.createElement("div");
        t.innerHTML=raw.body;
        t= [...t.innerText.matchAll(/(\d+) personer med .+covid\s?-19\D+(\d+)/gi)][0];

        var inl = t[1]*1;
        var iva = t[2]*1;

        raw = (raw.title+raw.body).substr(0,300);
        

        return [date,inl,iva,raw];
  }
}



class Uppsala2 extends Scraper{
	_baseUrl = 'https://regionuppsala.se/det-har-gor-vi/vara-verksamheter/halso-och-sjukvard/information-om-coronaviruset/';

	get name() {
    return 'Uppsala2';
  }

  parse(xmlDoc){
       var a=xmlDoc.evaluate('//*[@id="app"]//a[contains(@href,"nulagesbild-covid-19-region-uppsala.xlsx")]', xmlDoc).iterateNext();
//        if(!a)
  //          a=xmlDoc.evaluate('//*[@id="app"]//a[contains(@href,"covid-19-excel")]', xmlDoc).iterateNext();

       var t = new Uppsala3Sub(a.href.replace("file:///C:/","https://regionuppsala.se/"));

       return t.scrape().then(r=>{
       	   [this.dates,this.inls,this.ivas]=[t.dates,t.inls,t.ivas];
       	   return r;
       });

  }
}


class Uppsala3Sub extends Scraper{
    _baseUrl = '';

	get name() {
    return 'Uppsala';
  }

  parseXls(url){


	return new Promise(function (resolve, reject) {
		JSZipUtils.getBinaryContent(url, function(err, data) {
			if (err) {
				reject(err);
			} else {
				resolve(data);
			}
		});
	}).then(data0=>{
        var data = new Uint8Array(data0);
            var arr = new Array();
            for (var i = 0; i != data.length; ++i) arr[i] = String.fromCharCode(data[i]);
            var bstr = arr.join("");
	      var workbook = XLSX.read(bstr, {
        type: 'binary'
      });

		var d = moment("1900-01-01").add(43888-1, "days");
        var json = XLSX.utils.sheet_to_json(workbook.Sheets["Slutenvård"], {range:2});
        this.dates = json.map(x=>moment(d.add(x.Datum-43888-1,"days")));
        this.inls = json.map(x=>1*x["Antal patienter"]);
        this.ivas = json.map(x=>1*x["Antal vårdade IVA"]);
        return [this.dates[0],this.inls[0],this.ivas[0],json[0],url];
	});

  }
}



class Uppsala2Sub extends Scraper{
	_baseUrl = 'https://www.regionuppsala.se/Global/Corona/200605-Nul%c3%a4gesbild%20Region%20Uppsala.pdf';

	get name() {
        return 'Uppsala2';
  }

  getpdfelements(pdfUrl){
  	 var pdf = pdfjsLib.getDocument(pdfUrl);
  return pdf.promise.then(function(pdf) { // get all pages text
      var page = pdf.getPage(4);

      var txt = "";var objs=[];
      return page.then(function(page) { // add page promise
        return page.getOperatorList().then(function (ops) {
            for (var i=0; i < ops.fnArray.length; i++) {
                if (ops.fnArray[i] == pdfjsLib.OPS.paintImageXObject) {
                    objs.push(ops.argsArray[i][0])
                }
            }
            return objs;
        }).then(function (objs){
        	return new Promise((resolve,reject)=>{
        		page.objs.get(objs[1],img=>{
        			var canvas = document.createElement('canvas');
        			[canvas.width, canvas.height] = [img.width,img.height];
        			if(img.data.length == img.width*img.height*3){
        				var imageData = [];
        				for (var i = 0; i< img.data.length; i+=3){
        					Array.prototype.push.apply(imageData, [...img.data.slice(i,i+3), 255]);
        				}
        				canvas.getContext("2d").putImageData(new ImageData(new Uint8ClampedArray(imageData),img.width),0,0);
        			}else
    					canvas.getContext("2d").putImageData(new ImageData(img.data,img.width),0,0);

					// create a new img object
					var image = new Image();
					// set the img.src to the canvas data url
					document.getElementById("uppsalaimg").src = canvas.toDataURL();
					if(img.width<1000)
					{
							document.getElementById("uppsalaimg").width=img.width*2;
        					document.getElementById("uppsalaimg").height=img.height*2;

					}
        			resolve(img);
        		});
        	});
        	
        });
      });
    
  });
  }
  
  parse(img){
  	var verticalScan = [], colors=[],colorHist=[];
  	var bitdepth = img.data.length/img.width/img.height;

	var canvas = document.getElementById("uppsalacanvas");
	this.ctx = canvas.getContext("2d");
	this.zoom = img.width<1000 ? 2 : 1;

	canvas.width = img.width * this.zoom;
	canvas.height = img.height * this.zoom;

  	for(var x=0; x<img.width ;x++){
  		verticalScan[x]=[];
  	    for(var y=0; y <img.height;y++){
  	    	var offset = y*img.width*bitdepth+x*bitdepth;
  	    	
  	    	var pixel = img.data[offset]*255*255+img.data[offset+1]*255+img.data[offset+2];
  	    	if(bitdepth==5)
  	    	    pixel = pixel*255 + img.data[offset+2];

  	        verticalScan[x][y]=pixel;
  	        if(colors.indexOf(verticalScan[x][y])===-1){
  	            colors.push(verticalScan[x][y]);
  	            colorHist.push(0);
  	        }
  	        colorHist[colors.indexOf(verticalScan[x][y])]++;
  	    }
  	}
  	var colorTable = colors.map((x,i)=>[x.toString(16),colorHist[i]]).sort((a,b)=>b[1]-a[1]);
  	colors = colorTable.map(x=>parseInt("0x"+x[0]));
  	for(x=0; x<img.width; x++){
  	    for(y=0; y <img.height; y++){
  	    	verticalScan[x][y]=colors.indexOf(verticalScan[x][y]);
  	    }
  	}
  	//verticalScan=verticalScan.splice(41);
    
    document.getElementById("verticalScan").innerText=verticalScan.map((x,i)=>""+i+": "+x.map(y=>y>=10?(y+""):("0"+y)).join(",")).join("\n");
    const colorInl = 2,//bitdepth==4?2:1, //apricot,"fe01ff"1
        colorIva = 8,//,//red, "f3a4eb"4/5
        colorOther = 6;//3; //greyblue,"9189aa"2
        
    const firstBarStartsAt = verticalScan.findIndex(v=>v.some(x=>x==colorIva||x==colorOther||x==colorInl));
    for (var v = firstBarStartsAt; v < firstBarStartsAt+20 && verticalScan[v+1].filter(x=>x==colorIva||x==colorOther||x==colorInl).length == verticalScan[v].filter(x=>x==colorIva||x==colorOther||x==colorInl).length; v++);
    for (v = v+1; v < firstBarStartsAt+20 && verticalScan[v+1].filter(x=>x==colorIva||x==colorOther||x==colorInl).length == verticalScan[v].filter(x=>x==colorIva||x==colorOther||x==colorInl).length; v++);

    const maxBarAndGapWidth=v+2-firstBarStartsAt;

    var bars=[],d=0,vs=[];
    for (v = firstBarStartsAt; v < img.width; v += maxBarAndGapWidth) {
    	var v0=v;
    	while(v>v0-3 && verticalScan[v-1].filter(x=>x==colorIva||x==colorOther||x==colorInl).length == verticalScan[v].filter(x=>x==colorIva||x==colorOther||x==colorInl).length)
    	    v--;
    	vs.push(v);
    	var sample = verticalScan[v].slice(Math.floor(50/600*img.height));
    	var bar = [sample.filter(x=>x==colorInl).length,
    	        sample.filter(x=>x==colorIva).length,
    	        sample.filter(x=>x==colorOther).length];
    	bars.push(bar);
        

        var o = sample.reduceRight((a,x,i)=>(x==colorIva||x==colorOther||x==colorInl)&&a==-1?i:a, -1);
        this.plot(v, o);
        this.plot(v, o-=bar[0]);
        this.plot(v, o-=bar[1]);
        this.plot(v, o-=bar[2]);
    }

    bars = bars.map(b=>
    	    [...b,
    	    b.reduce((a,x)=>a+x),
    	    0//b.reduce((a,x)=>a+(x>0?1:0),0)-1 //space in between bars
    	    ]);
    bars = bars.map(b=>
    	    [...b,
    	    b[3]+b[4]
    	    ]);
    	    
    const maxBar = bars.map(b=>b[5]).reduce((a,b)=>Math.max(a,b));
    bars = bars.map(b=>
    	    [...b,
    	    b[5]/maxBar*127.0+1,
    	    b[1]/maxBar*127.0,
    	    ]);

        var date = this.url.match(/\d{6}/);
        date = moment(date,"YYMMDD");
        var dates = [...Array(bars.length).keys()].map(x=>moment(date).add(-bars.length+1+x,'days'));
        var inls = bars.map(x=>Math.round(x[6])), ivas =bars.map(x=>Math.round(x[7]));
        
    bars = bars.map((b,i) => [vs[i],...b]);

        [this.dates,this.inls,this.ivas]=[dates,inls,ivas];

        return [date,this.inls[this.inls.length-1],this.ivas[this.inls.length-1],null,this.url,null,
        this.dates,
        this.inls,
        this.ivas
        ];
  }

    plot(x,y){
  	if(!x && !Y)
  	return;
  	  this.ctx.beginPath();
      this.ctx.arc(x*this.zoom,y*this.zoom, 2, 0, 2 * Math.PI, false);
      this.ctx.fillStyle = 'pink';
      this.ctx.fill();
//      context.lineWidth = 5;
  //    context.strokeStyle = '#003300';
    //  context.stroke();
  }
}
module.exports = Uppsala2