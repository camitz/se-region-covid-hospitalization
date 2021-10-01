
class ImageWrapper{
	constructor(img){
		if (img.tagName=="CANVAS")
		{
			this._canvas = img;
			[this.width, this.height] = [img.width,img.height];

			return;
		}

		img = this.toBitDepth4(img);

		this._imageData = new ImageData(img.data, img.width);
        [this.width, this.height] = [img.width, img.height];

		this._canvas = document.createElement('canvas');
		[this._canvas.width, this._canvas.height] = [img.width,img.height];
		this._canvas.getContext("2d").putImageData(this._imageData, 0, 0);
	}

	get canvas(){
		return this._canvas;
	}

	get imageData(){
		return this._imageData ?? (this._imageData = this._canvas.getContext("2d").getImageData(0,0,this.width,this.height));
	}

	toBitDepth4(img) {
		if(img.data.length == img.width*img.height*3){
			var img1 = {data:[], width:img.width, height:img.height};
			for (var i = 0; i< img.data.length; i+=3){
				Array.prototype.push.apply(img1.data, [...img.data.slice(i,i+3), 255]);
			}

			img1.data = new Uint8ClampedArray(img1.data);
			img = img1;
		}
		
		return img;
	}

	portion(...dim) {
		if (dim.length == 2)
			dim = [0,0,...dim];
		
		var startX, startY, newWidth, newHeight;
		[startX, startY, newWidth, newHeight] = dim;
		startY = this.height - startY - newHeight;

		/* the parameters: - the image element - the new width - the new height - the x point we start taking pixels - the y point we start taking pixels - the ratio */
		//set up canvas for thumbnail
		var tnCanvas = document.createElement('canvas');
		tnCanvas.width = newWidth; tnCanvas.height = newHeight;

		/* use the sourceCanvas to duplicate the entire image. This step was crucial for iOS4 and under devices. Follow the link at the end of this post to see what happens when you don�t do this */
		var bufferCanvas = document.createElement('canvas');
		bufferCanvas.width = this.width;
		bufferCanvas.height = this.height;
		bufferCanvas.getContext('2d').drawImage(this.canvas, 0, 0);

		/* now we use the drawImage method to take the pixels from our bufferCanvas and draw them into our thumbnail canvas */
		try {
			tnCanvas.getContext('2d').drawImage(bufferCanvas, startX, startY, newWidth, newHeight, 0, 0, newWidth, newHeight);
		} catch (e) { 
			console.log(e);
		}
		return new ImageWrapper(tnCanvas);
	}

	rotate(degree) { 
		var tnCanvas = document.createElement('canvas');
		var r = Math.sqrt(this.width*this.width+this.height*this.height);
		tnCanvas.width = r;
		tnCanvas.height = r;

		var context = tnCanvas.getContext('2d');

		// save the current co-ordinate system 
		// before we screw with it
		context.save(); 

		// move to the middle of where we want to draw our image
		context.translate(r/2, r/2);

		// rotate around that point, converting our 
		// angle from degrees to radians 
		context.rotate(degree);

		// draw it up and to the left by half the width
		// and height of the image 
		context.drawImage(this.canvas, -r/2, -r/8);

		// and restore the co-ords to how they were when we began
		context.restore(); 
		return new ImageWrapper(tnCanvas);
	}

	putToDom(el) {
		el.src = this.canvas.toDataURL();	
	}
}

module.exports = ImageWrapper