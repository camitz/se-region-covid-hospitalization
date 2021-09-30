const Scraper = require('../scraper')
const $ = require('jquery');
const moment = require('../moment.js')
const pdfjsLib = require('pdfjs-dist')
const tesseract = require('tesseract.js')

class Gotland extends Scraper{
    _baseUrl = 'https://www.gotland.se/statistikcovid19';

	get name() {
    return 'Gotland';
  }

  parse(xmlDoc){
       var t=xmlDoc.evaluate("//*[@id='contentContainer']//a[contains(text(),'Veckorapport om covid')]", xmlDoc).iterateNext();
       var h = t.href;
               
       var t = new GotlandSub(h);

       return t.scrape();

  }
}




class GotlandSub extends Scraper{
	_baseUrl = 'https://www.gotland.se/';

	get name() {
        return 'Uppsala';
  }

  contenttype = "pdf";

  getpdfelements(pdfUrl){
  	 var pdf = pdfjsLib.getDocument(pdfUrl);
  return pdf.promise.then(function(pdf) { // get all pages text
      var page = pdf.getPage(1);

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
        		page.objs.get(objs[3],img=>{
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

					// set the img.src to the canvas data url
					document.getElementById("gotlandimg").src = canvas.toDataURL();
        			resolve(img);
        		});
        	});
        	
        });
      });
    
  });
  }
  
  parse(img){
	var x_axis_img = this.getImagePortion(document.getElementById("gotlandimg"),0,0,100,100);

	var canvas = document.createElement('canvas');
	[canvas.width, canvas.height] = [100,100];

	document.getElementById("gotlandyaxis").src = x_axis_img.toDataURL();

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

  getImagePortion(imgObj, startX, startY, newWidth, newHeight) {
	/* the parameters: - the image element - the new width - the new height - the x point we start taking pixels - the y point we start taking pixels - the ratio */
	//set up canvas for thumbnail
	var tnCanvas = document.createElement('canvas');
	var tnCanvasContext = tnCanvas.getContext('2d');
	tnCanvas.width = newWidth; tnCanvas.height = newHeight;

	/* use the sourceCanvas to duplicate the entire image. This step was crucial for iOS4 and under devices. Follow the link at the end of this post to see what happens when you don�t do this */
	var bufferCanvas = document.createElement('canvas');
	var bufferContext = bufferCanvas.getContext('2d');
	bufferCanvas.width = imgObj.naturalWidth;
	bufferCanvas.height = imgObj.naturalHeight;
	bufferContext.drawImage(imgObj, 0, 0);

	/* now we use the drawImage method to take the pixels from our bufferCanvas and draw them into our thumbnail canvas */
	try {
		tnCanvasContext.drawImage(bufferCanvas, startX, startY, newWidth, newHeight, 0, 0, newWidth, newHeight);
	} catch (e) { 
		console.log(e);
	}
	return tnCanvas;
}
}


module.exports = Gotland