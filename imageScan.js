const ImageWrapper = require('./imageWrapper.js');
const PCA = require('pca-js');

class ImageScan{
	constructor(img, settings){
		this._img = img;
		this._settings = settings;
		this.generateScan();
	}

	get verticalScan(){
		return this._verticalScan;
	}

	get horizontalScan(){
		return this._horizontalScan;
	}

	get colorTable(){
		return this._colorTable16;
	}

	generateScan() {
		let img = this._img;
		const bitdepth = 4;

		var verticalScan = new Array(this.width), horizontalScan = new Array(this.height)
		var colors = [];
		var colorHist = [];

		if (this._settings?.colorTable) {
			colors = this._settings.colorTable.map(x=>x[0]).map(x => parseInt("0x"+x));
			colorHist = new Array(colors.length).fill(0);
		}


		for(var y=0; y <img.height;y++)
			horizontalScan[y] = new Array(this.width);

		for(var x=0; x<img.width ;x++){
			verticalScan[x] = new Array(this.height);

		    for(var y=0; y <img.height;y++){
				var offset = ((img.height-y-1) * img.width + x) * bitdepth; //Offset into image data, flipped y-axis.
				
				var pixel = img.imageData.data[offset]*256*256 + img.imageData.data[offset+1]*256 + img.imageData.data[offset+2]; //24 bit color value

				verticalScan[x][y] = pixel;
				horizontalScan[y][x] = pixel;

				//Build color list table and histogram
				if(colors.indexOf(pixel) === - 1) {
					colors.push(verticalScan[x][y]);
					colorHist.push(0);
				}

				colorHist[colors.indexOf(pixel)]++;
		    }
		}

		var colorTable = colors.map((x,i)=>[x.toString(16).padStart(6,"0"), colorHist[i]]);//Build ordered mapping into histogram of hex-strings.
		if (!this._settings?.colorTable) { //Sort by frequency, only if colortable not provided.
			colorTable = colorTable.sort((a,b)=>b[1]-a[1]);
			colors = colorTable.map(x => parseInt("0x"+x[0]));  //Order colors accordingly.
		}

		for(x=0; x<img.width; x++){
		    for(y=0; y <img.height; y++){
				verticalScan[x][y] = colors.indexOf(verticalScan[x][y]); //Map scan into colortable.
				horizontalScan[y][x] = colors.indexOf(horizontalScan[y][x]);
		    }
		}

		//pca
		var pcaData = colorTable.map(x => [parseInt("0x"+x[0][0]+x[0][1]), parseInt("0x"+x[0][2]+x[0][3]), parseInt("0x"+x[0][4]+x[0][5])]);
		var vectors = PCA.getEigenVectors(pcaData);
		var adData = PCA.computeAdjustedData(pcaData, vectors[0]);
		var norm = [Math.min(adData.adjustedData[0]), Math.max(adData.adjustedData[0])];

		this._colorTablePCA = adData.adjustedData[0].map((k, i) => [k/(norm[1]-norm[0])+norm[0], colorTable[i][1]]);

		this._verticalScan = verticalScan;
		this._horizontalScan = horizontalScan;
		this._colors32 = colors;
		this._colorTable16 = colorTable;
	}

	_colorHist = [];
}

module.exports = ImageScan

