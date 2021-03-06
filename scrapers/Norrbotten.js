const Scraper = require('../scraper')
const $ = require('jquery');
const moment = require('../moment.js')
const pdfjsLib = require('pdfjs-dist')

class Norrbotten extends Scraper{
    _baseUrl = 'https://www.google.com/';

	get name() {
    return 'Norrbotten';
  }

  parse(xmlDoc){
  	    var me = this;
  	    var weekly = new Norrbotten2();
  	    
       return Promise.all([
           weekly.scrape().then(function(v){
           	[this.dates,this.ivas,this.inls]=[weekly.dates,weekly.ivas,weekly.inls];
           	return v;
           }.bind(this),weekly), (new NorrbottenDaily()).scrape()
       ]).then(values=>{
       	console.log(values);
       	return values[1];
       });
  }
}



class NorrbottenDaily extends Scraper{
    _baseUrl = 'https://www.norrbotten.se/sv/Halsa-och-sjukvard/Smittskydd-i-Norrbotten/Information-om-nya-coronaviruset/';

	get name() {
    return 'Norrbotten';
  }

  parse(xmlDoc){
        var t = xmlDoc.evaluate('//*[@id="rs_read_text"]/div[2]/*', xmlDoc);

        var raw="",i,date,inl,iva,m;
        while(i = t.iterateNext()){
        	raw += i.innerText;


        	m = [...i.innerText.matchAll(/vårdas\s(\d+)\spersoner med covid-19 på sjukhus i länet,\s(varav\s)?(\d+)/gi)];
        	if(m.length){
        	    inl = m[0][1]*1;
        	    iva = m[0][3]*1;
        	    continue;
        	}
        	

        	m = [...i.innerText.matchAll(/Uppdaterat\s(\d+ \w+)/g)];
        	if(m.length){
        	    date = m[0][1];
        	    break;
        	}
        };

        var raw = raw.substr(0,300);
        var date = moment(date);
                
        return [date,inl,iva,raw,this.url];
  }
}


class Norrbotten2 extends Scraper{
	_baseUrl = 'https://www.norrbotten.se/Halsa-och-sjukvard/Smittskydd-i-Norrbotten/Information-om-nya-coronaviruset/';

	get name() {
    return 'Norrbotten2';
  }

  parse(xmlDoc){
        var a=xmlDoc.evaluate('//*[@id="rs_read_text"]//a[contains(@href,"Veckorapporter%20covid-19")]', xmlDoc).iterateNext();
        var t = new Norrbotten2Sub(a.href);

       return t.scrape().then(r=>{
       	   [this.dates,this.inls,this.ivas]=[t.dates,t.inls,t.ivas];
       	   return r;
       });

  }
}



class Norrbotten2Sub extends Scraper{
    _baseUrl = 'https://www.norrbotten.se/publika/lg/kom/Corona/Veckorapporter%20covid-19/200824%20v%2034%20CoV-19%20rapport.pdf';

	get name() {
    return 'Norrbotten2';
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
        		page.objs.get(objs[0],img=>{
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
					document.getElementById("norrbottenimg").src = canvas.toDataURL();
        			resolve(img);
        		});
        	});
        	
        });
      });
    
  });
  }

  getpptxelements(url) {
  	// 1) get a promise of the content
	var promise = new JSZip.external.Promise(function (resolve, reject) {
		JSZipUtils.getBinaryContent(url, function(err, data) {
			if (err) {
				reject(err);
			} else {
				resolve(data);
			}
		});
	});

	return promise.then(JSZip.loadAsync)                     // 2) chain with the zip promise
	.then(function(zip) {
		return zip.file("ppt/media/image7.png").async("uint8array"); // 3) chain with the text content promise
	})
	.then(function success(data) {  
	    var blob = new Blob([data], {'type': 'image/png'});
        var url = URL.createObjectURL(blob);

		var myImgElement = document.getElementById('norrbottenimg');
		myImgElement.src=url;
        
        return new Promise((resolve,reject)=>{
        	myImgElement.onload=x=>resolve(myImgElement);
        }).then(img=>{
			var w = myImgElement.width, h=myImgElement.height;
			var canvas = document.createElement('canvas');
            [canvas.width, canvas.height] = [w,h];
			var ctx    = canvas.getContext('2d');
			ctx.drawImage( myImgElement, 0, 0 );

			var imgdata = ctx.getImageData(0,0,w,h);
			return imgdata;
        });

	}, function error(e) {
		throw e;
	});

  }

  parse(img){
  	  	var bitdepth = img.data.length/img.width/img.height;
  	  	var verticalScan=[],verticalR=[],verticalA=[],horizontalA=[],horizontalR=[],horizontalScan=[];

        var canvas=document.getElementById("norrbottencanvas");
        this.ctx=canvas.getContext("2d");
        canvas.width=img.width;
        canvas.height=img.height;

		for(var x=0; x<img.width ;x++){
			verticalScan[x] = [];
			for(var y=0; y <img.height;y++){
				var offset = y*img.width*bitdepth+x*bitdepth;

				verticalScan[x][y]=img.data.slice(offset,offset+bitdepth);
                
                if(x==0)
                    horizontalScan[y]=[];
				horizontalScan[y][x]=img.data.slice(offset,offset+bitdepth);
			}
		}

		for(var x=0; x<img.width ;x++){
			verticalR[x] = verticalScan[x]
			    .reduce((a,v)=>[...a].map((e,i)=>e+255-v[i]),
				    [0,0,0,0]);
		}

		for(var x=0; x<img.width ;x++){
			verticalA[x] = this.toPolar(verticalR[x]);
		}

	    for(var y=0; y<img.height; y++){
			horizontalR[y] = horizontalScan[y]
			    .reduce((a,v)=>[...a]
			            .map((e,i)=>e+255-v[i]),
				    [0,0,0,0]);
		}

	    for(var y=0; y<img.height; y++){
			horizontalA[y] = this.toPolar(horizontalR[y]);
		}

        
        var f = s=>this.fftAnalyse(verticalA, 1, 1024, s);
        var shiftV = this.findShift(f,[1.1,20]);

        f = s=>this.fftAnalyse(horizontalA, 2, 512, s);
        var shiftH = this.findShift(f,[5,15]);

        var hstep = shiftV.p[shiftV.I], vstep = shiftH.p[shiftH.I];

        var startX0 = verticalA.findIndex(x=>x[1]<.78);
        var startX1 = [...Array(10).keys()].map(x=>hstep*x+shiftV.shift).find(x=>x>startX0);
        startX0 += hstep/2;

        var startY0 = horizontalA.findIndex(x=>x[1]<.78);
        var startY1 = [...Array(10).keys()].map(x => vstep * x + shiftH.shift).find(x => x > startY0);
        startY0 += vstep/2;

        var result = [], allsamples=[];
        var xx = [...Array(Math.ceil((img.width-startX0)/hstep)).keys()].map(x=>startX0+x*hstep);
        var yy = [...Array(Math.ceil((img.height-startY0)/vstep)).keys()].map(x=>startY0+x*vstep);

        var correctedXIter=0,correctedYIter=0;
        for (var i=0; i < xx.length; i++) {
        	//console.debug(i);
        	var x = xx[i];
            var pair = [];
            var samples = [];

            for (var j=0; j < yy.length; j++) {
            	var y = yy[j];
            	var f5 = this.sample(verticalScan, x, y, 5);
            	var f5a = this.toPolar(f5);
		    	samples.push([x,y,...f5,...f5a]);
    	    }

    	    var resI = [
							samples.findIndex(x => x[8] > 0.120 && x[6] > 6.5),
							samples.findIndex(x => x[8] > 1.07 && x[8] < 1.55 && x[6] > 3)
						];

			if(resI[0]==-1 ||resI[1]==-1)
			    console.log(x);

    	    var res = [samples[resI[0]],samples[resI[1]]];

			if(!res[0] && !res[1])
			    break;

		    //check for white edge pixels

		    if(correctedXIter<2){
		    	correctedXIter++;

				if(i>0 && res[0] && this.toPolar(verticalScan[Math.round(x)-5][Math.round(res[0][1])])[1]==Math.PI/4) {
					xx = [...xx.slice(0,i-1),...xx.slice(i-1).map(v=>v+1)];
					i--;
					continue;
				}

				if(i>0 && res[0] && this.toPolar(verticalScan[Math.round(x)+3][Math.round(res[0][1])])[1]==Math.PI/4) {
					xx = [...xx.slice(0,i-1),...xx.slice(i-1).map(v=>v-1)];
					i--;
					continue;
				}

				if(i>0 && res[1] && this.toPolar(verticalScan[Math.round(x)-4][Math.round(res[1][1])])[1]==Math.PI/4) {
					xx = [...xx.slice(0,i-1),...xx.slice(i-1).map(v=>v+1)];
					i--;
					continue;
				}

				if(i>0 && res[1] && this.toPolar(verticalScan[Math.round(x)+3][Math.round(res[1][1])])[1]==Math.PI/4) {
					xx = [...xx.slice(0,i-1),...xx.slice(i-1).map(v=>v-1)];
					i--;
					continue;
				}

				correctedXIter=0;
		    }

		    if(correctedYIter<2){
		    	correctedYIter++

				if(res[0] && this.toPolar(verticalScan[Math.round(x)][Math.round(res[0][1])-4])[1]==Math.PI/4) {
					yy = [...yy.slice(0,resI[0]-1),...yy.slice(resI[0]-1).map(v=>v+1)];
					i--;
					continue;
				}

				if(res[0] && this.toPolar(verticalScan[Math.round(x)][Math.round(res[0][1])+3])[1]==Math.PI/4) {
					yy = [...yy.slice(0,resI[0]-1),...yy.slice(resI[0]-1).map(v=>v-1)];
					i--;
					continue;
				}

				if(res[1] && this.toPolar(verticalScan[Math.round(x)][Math.round(res[1][1])-3])[1]==Math.PI/4) {
					yy = [...yy.slice(0,resI[1]-1),...yy.slice(resI[1]-1).map(v=>v+1)];
					i--;
					continue;
				}

				if(res[1] && this.toPolar(verticalScan[Math.round(x)][Math.round(res[1][1])+3])[1]==Math.PI/4) {
					yy = [...yy.slice(0,resI[1]-1),...yy.slice(resI[1]-1).map(v=>v-1)];
					i--;
					continue;
				}

				correctedXIter=	correctedYIter=0;
		    }


    	    allsamples.push(samples);
    	    if(!res[1])
    	        res[1]=res[0];

            if(res[0])
    		    this.plot(x, res[0][1]);
            if(res[1])
    		    this.plot(x, res[1][1]);

    	    result.push(res);
        }


        result = result.map(x=>[
									x[0]?[Math.round(52 - (x[0][1] - startY0) / vstep),...x[0]]:[],
									x[1]?[Math.round(52 - (x[1][1] - startY0) / vstep),...x[1]]:[]
								]);

	    this.dates = [...Array(result.length).keys()].map(x=>moment("31 march 2020").add(x, "days")).reverse();
	    this.inls = result.map(x=>x[0][0]+x[1][0]).reverse();
	    this.ivas = result.map(x=>x[1][0]).reverse();
    
        return [this.dates[0],this.inls[0],this.ivas[0],"",this.url,[],this.dates,this.inls,this.ivas];
  }

  fftAnalyse(data, column, size, shift=0){
        var a = data.slice(0+shift,size+shift).map(x=>x[column]);
        var fftA = new ComplexArray(size).map((value, i, n) =>value.real = a[i]).FFT();
        var fA = [...Array(size)].map((x,i)=>Math.sqrt(Math.pow(fftA.real[i],2)+Math.pow(fftA.imag[i],2)));
        fA= {fA: fA, s:[...Array(size).keys()].sort((a,b)=>fA[b]-fA[a]), shift:shift};
        fA.p = fA.s.map(x=>size/x);
        return fA;
  }

  findShift(f,range) {
    var maxT=0,maxI, maxShift;
	for (var s=0; s < 100; s++) {
		var fftVA = f(s);
		var i = [...Array(100).keys()].filter(i=>fftVA.p[i]>range[0] && fftVA.p[i]<range[1])[0];
		var t = fftVA.fA[fftVA.s[i]];
		if(t>maxT){
			maxT=t;
			maxShift=s;
			maxI=i;
		}
	}
	var fftVA = f(maxShift);
	fftVA.I = maxI;
	fftVA.T = maxT;
    return fftVA;
  }

  toPolar(rgba){
  	return [
				rgba.reduce((a,v)=>Math.sqrt(a+v^2),0),
				Math.atan2(rgba[0],rgba[1]),
				Math.atan2(rgba[0],rgba[2]),
				Math.atan2(rgba[0],rgba[3])
			];
  }

  sample(verticalScan, x, y, size) {
  	x=Math.round(x),y=Math.round(y);
  	const i3 = [0,-1,0,1,1];
  	const j3 = [-1,0,0,0,1];
  	const i5 = [0,-1,0,1,-2,-1,0,1,2,-1,0,1,0];
  	const j5 = [-2,-1,-1,-1,0,0,0,0,0,1,1,1,2];

  	const ii = size==5?i5:i3;
  	const jj = size==5?j5:j3;

  	var r = ii.map((v,i)=>verticalScan[x+v][y+jj[i]]);
  	    r= r.reduce((a,v)=>[...a].map((e,i)=>e+255-v[i]),[0,0,0,0]);

  	return r;
  }

  plot(x,y){
  	if(!x && !Y)
  	return;
  	  this.ctx.beginPath();
      this.ctx.arc(x,y, 3, 0, 2 * Math.PI, false);
      this.ctx.fillStyle = 'pink';
      this.ctx.fill();
//      context.lineWidth = 5;
  //    context.strokeStyle = '#003300';
    //  context.stroke();
  }
}module.exports = Norrbotten