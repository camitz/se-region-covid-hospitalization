const Scraper = require('../scraper')
const $ = require('jquery');
const moment = require('../moment.js')
const ImageWrapper = require('../imageWrapper.js')
const ImageScan = require('../imageScan.js')
const pdfjsLib = require('pdfjs-dist')
const Tesseract = require('tesseract.js')

class Gotland extends Scraper{
    _baseUrl = 'https://www.gotland.se/statistikcovid19';

	get name() {
    return 'Gotland';
  }

  parse(xmlDoc){
       var t=xmlDoc.evaluate("//*[@id='contentContainer']//a[contains(text(),'Veckorapport om covid')]", xmlDoc).iterateNext();
       var h = t.href;

       var t = new GotlandSub(h);
	   var p = t.scrape();

       return p;//.then(r=>{r[4] = h; return r;});
  }
}




class GotlandSub extends Scraper{
	_baseUrl = 'https://www.gotland.se/';

	get name() {
        return 'Gotland';
  }

  contenttype = "pdf";

  getpdfelements(pdfUrl){
  	 var pdf = pdfjsLib.getDocument(pdfUrl);
	  return pdf.promise.then(function(pdf) { // get all pages text
		  var graphIndex = 2;

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
					page.objs.get(objs[graphIndex],img=>{
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
	var legendImg = img.portion(260,629,50,200);
	legendImg.putToDom(document.getElementById("gotlandlegend"));

	var legendScan = new ImageScan(legendImg, {sortColortable: false});

	var graphDim = [185, 258, 720, 350]; //originX, originY, graphWidth, graphHeight

	var xaxisImg = img.portion(graphDim[0], graphDim[1] - 181, graphDim[2], 180);
	xaxisImg.putToDom(document.getElementById("gotlandxaxis"));

	var yaxisImg = img.portion(graphDim[0] - 57, graphDim[1]-15, 57, graphDim[3]);
	yaxisImg.putToDom(document.getElementById("gotlandyaxis"));

	var graphImg = img.portion(...graphDim);
	graphImg.putToDom(document.getElementById("gotlandgraph"));


	var graphScan = new ImageScan(graphImg, {colorTable: legendScan.colorTable});

	var yaxisScan = new ImageScan(yaxisImg);
	var yTickPos = yaxisScan.verticalScan[47].reduce((a,e,i)=>{if(e>0)a.push(i-15);return a;},[]);
	
	var xaxisScan = new ImageScan(xaxisImg);
	var xTickPos = xaxisScan.horizontalScan[xaxisImg.height-6].reduce((a,e,i)=>{if(e>0 && (a.length==0 || a[a.length-1]<i-5))a.push(i);return a;},[]);


    document.getElementById("verticalScan").innerText=graphScan.verticalScan.map((x,i)=>""+i+": "+x.map(y=>y>=10?(y+""):("0"+y)).join(",")).join("\n");

	var extractData = function(ocrResults){
		console.log(graphScan);
		this.dates = ocrResults[0].map(d=>moment(d));

		var maxYLabel = parseInt(ocrResults[1][0].text)
		var maxLabeledTickYPos = yTickPos.map(y=>Math.abs(y-yaxisImg.height+ocrResults[1][0].ypos));
		maxLabeledTickYPos  = maxLabeledTickYPos.lastIndexOf(Math.min(...maxLabeledTickYPos));
		maxLabeledTickYPos = yTickPos[maxLabeledTickYPos];
		
		var barScans = xTickPos.splice(0,this.dates.length)
				.map(x=>graphScan.verticalScan[x].reduce((a,e,i) => {
			switch(e){
				case 1: 
					a[0] += 1.0/maxLabeledTickYPos*maxYLabel; break;
				case 2: 
					a[1] += 1.0/maxLabeledTickYPos*maxYLabel; break;
				case 3: 
					a[2] += 1.0/maxLabeledTickYPos*maxYLabel; break;
				case 4: 
					a[3] += 1.0/maxLabeledTickYPos*maxYLabel; break;
			}
			return a;
		},[0,0,0,0]));
		
		this.ivas = barScans.map(x=>Math.round(x[0]+x[2],0));
		this.ivas.reverse();
		this.inls = barScans.map((x,i)=>Math.round(x[1]+x[3],0) + this.ivas[i]);
		this.inls.reverse();
        return [this.dates[0],this.inls[0],this.ivas[0],null,this.url];
	}

	return Promise.all([
			Tesseract.recognize(
			  xaxisImg.rotate(-Math.PI/4).canvas,
			  'eng',
			  { logger: m => console.log(m) }
			).then(result => {
			  console.log(result);
			  return result.data.lines.map(x=>x.text.replace("\n",""));
			}),
			Tesseract.recognize(
			  yaxisImg.portion(0,0,43,graphDim[3]).canvas,
			  'eng',
			  { logger: m => console.log(m) }
			).then(result => {
			  console.log(result);
			  return result.data.lines.map(x=>{return {text:x.text.replace("\n",""),ypos:(x.bbox.y0+x.bbox.y1)/2};});
			})]).then(((extractData, parser, results)=>{
				console.log(results.length);
				return extractData.bind(parser)(results);
			}).bind(undefined, extractData, this));
  }

}


module.exports = Gotland