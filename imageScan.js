const ImageWrapper = require('./imageWrapper.js');
const PCA = require('pca-js');

class ImageScan{
	constructor(img){
		this._img = img;
		this.generateScan();
	}

	get canvas(){
		return this._canvas;
	}

	generateScan() {
		let img = this._img;
		const bitdepth = 4;

		var verticalScan = new Array(this.width);
		var colors = [];

		for(var x=0; x<img.width ;x++){
			verticalScan[x] = new Array(this.heigth);

		    for(var y=0; y <img.height;y++){
				var offset = (img.height-y-1) * img.width*bitdepth + x*bitdepth; //Offset into image data, flipped y-axis.
				
				var pixel = img.imageData.data[offset]*255*255 + img.imageData.data[offset+1]*255 + img.imageData.data[offset+2]; //24 bit color value

				verticalScan[x][y] = pixel;

				//Build color list table and histogram
				if(colors.indexOf(verticalScan[x][y]) === - 1){ 
					colors.push(verticalScan[x][y]);
					this.colorHist.push(0);
				}

				this.colorHist[colors.indexOf(verticalScan[x][y])]++;
		    }
		}

		var colorTable = colors.map((x,i)=>[x.toString(16), this.colorHist[i]]).sort((a,b)=>b[1]-a[1]); //Build ordered mapping into histogram of hex-strings.
		colors = colorTable.map(x => parseInt("0x"+x[0]));  //Order colors accordingly.

		for(x=0; x<img.width; x++){
		    for(y=0; y <img.height; y++){
				verticalScan[x][y] = colors.indexOf(verticalScan[x][y]); //Map scan into colortable.
		    }
		}

		this._verticalScan = verticalScan;
		this._colors = colors;
		this._colorTable = colorTable;
	}

	_colorHist = [];
}

module.exports = ImageScan

