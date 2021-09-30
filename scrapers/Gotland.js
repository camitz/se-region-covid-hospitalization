const Scraper = require('../scraper')
const $ = require('jquery');
const moment = require('../moment.js')
const ImageWrapper = require('../imageWrapper.js')
const ImageScan = require('../imageScan.js')
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
					var graphImage = new ImageWrapper(img);
					graphImage.putToDom(document.getElementById("gotlandimg"));
        			resolve(graphImage);
        		});
        	});
        	
        });
      });
    
  });
  }
  
  parse(img){

	var graphDim = [177, 480, 700, 300]; //originX, originY, graphWidth, graphHeight

	var xaxisImg = img.portion(graphDim[0], graphDim[1] - 181, graphDim[2], 180);
	xaxisImg.putToDom(document.getElementById("gotlandxaxis"));

	var yaxisImg = img.portion(graphDim[0] - 57, graphDim[1]-15, 57, graphDim[3]);
	yaxisImg.putToDom(document.getElementById("gotlandyaxis"));

	var graphImg = img.portion(...graphDim);
	graphImg.putToDom(document.getElementById("gotlandgraph"));

	var scan = new ImageScan(graphImg);

	var verticalScan = [], colors=[],colorHist=[];
  	var bitdepth = img.data.length/img.width/img.height;

	var canvas = document.getElementById("uppsalacanvas");
	this.ctx = canvas.getContext("2d");
	this.zoom = img.width<1000 ? 2 : 1;

	canvas.width = img.width * this.zoom;
	canvas.height = img.height * this.zoom;

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


module.exports = Gotland