
AWS.config.region = 'eu-north-1'; // Region
AWS.config.credentials = new AWS.Credentials('AKIAUQDSUWQ4Z55VNFPI', 'kpDmVzfJrjRcr4uhSMzcOPycZhkYST4B3Uj2Vp2J');



String.prototype.b64DecodeUnicode = function() {
		// Going backwards: from bytestream, to percent-encoding, to original string.
		return decodeURIComponent(atob(this.replace("?=","")).split('').map(function(c) {
			return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
		}).join(''));
	};

moment.locale('sv');
var momentPrototype = moment;
moment = function(s, format = false){
	if(!s)
		return momentPrototype(s, format);

	if(typeof(s)==="string"){
		s=s.replace(/\s/," ");
		if(/[a-z]{3,}/gi.test(s)){
			s=s.replace(/[a-z]{3,}/gi, (m,p1)=>m.substr(0,3).replace("okt","oct").replace("maj","may"));
		}
	}
	return momentPrototype(s, format);
}

$.ajaxPrefilter( function (options) {
  if (options.crossDomain && jQuery.support.cors) {
	var http = (window.location.protocol === 'http:' ? 'http:' : 'https:');
	//var providers = ['//cors-anywhere.herokuapp.com/',"//cors-proxy.htmldriven.com/?url=","//cors.corsproxy.io/url=","//thingproxy.freeboard.io/fetch/"];
	//options.url = http + providers[3] + options.url;
	options.url = http + '//cors-anywhere.herokuapp.com/' + options.url;
  }
});

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

		var scrapers = [
		new Blekinge(),
		new Dalarna(),
		new Gavleborg(),
		new Gotland(),
		new Halland(),
		new JH(),
		new Jonkoping(),
		new Kalmar(),
		new Kronoberg(),
		new Norrbotten(),
		new Orebro(),
		new Ostergotland(),
		new Skane(),
		new Sormland(),
		new Stockholm(),
		new Uppsala2(),
		new VG2(),
		new Varmland(),
		new Vasterbotten(),
		new Vasternorrland(),
		new Vastmanland(),
		 ];


		var scrapers = [new Dalarna(), new VG2(),new  Dalarna(), new Gotland(), new Jonkoping()];
		//var scrapers = [new Vasternorrland()];

		//scrapers.forEach(x=>x.do())

		//new DNSkrapan().do();
		//new Uppsala2().do();
		//new Stockholm().do();
		Promise.allSettled(scrapers.map(x=>x.do())).then(this.timelineParse);

		//<script>window.infographicData={"id":159117961,"type":1,"block_id":"e42bb6a1-214a-4448-a0dc-3a7d86da5762","theme_id":215,"user_id":54691386,"team_user_id":190091,"path":"de8d86b3-01ac-42ff-bb4f-91b7f6460464","title":"IVA-VGR-totalt-webb","description":"Antal inneliggande och varav IVA vårdade per dag","tags":"","public":true,"publicAccess":false,"private_link_enabled":0,"thumb":"https:\u002F\u002Finfogram-thumbs-200.s3-eu-west-1.amazonaws.com\u002Fe42bb6a1-214a-4448-a0dc-3a7d86da5762.jpg","embedImageUrl":"https:\u002F\u002Finfogram.io\u002Fp\u002F0edc73bf649d1d43e468b15422e8f372.png","previewImageUrl":"https:\u002F\u002Finfogram.io\u002Fp\u002F5676d8817896a4736e74c7b0650c64ce.png","width":550,"copyright":"","properties":{"tabs":true,"zeropaddingembed":true,"flexTemplateId":"ea0b1b77-3935-4696-8f73-a0c4fce2a8ff","type":"youtube_thumbnail","footerSettings":{"logoType":"custom_logo-infogram","showFooter":true,"customLinkOption":"text","hasCustomLink":false},"publishType":0,"transparent":false,"rtl":false,"language":"en","export_settings":{"showGrid":true,"showValues":true},"whitelabel":true,"noTracking":false,"decimal_separator":".,","embed_button":"enabled","title_link":"infogram","custom_logo":"none","custom_link_url":"","logoName":"Infogram logo","showChartsOnScroll":true,"pro":true},"elements":{"content":{"allowFullscreen":true,"allowToShare":true,"assets":{},"content":{"blockOrder":["fa5ae019-00b4-48f5-8471-5d84560d0ae6"],"blocks":{"fa5ae019-00b4-48f5-8471-5d84560d0ae6":{"design":{"header":{"text":""},"hideFooter":false},"entities":["ee056863-0d4e-4e96-9b41-5c3d884b877f","b9b57061-a9e0-49c1-bdef-710aff5e9af4"]}},"entities":{"b9b57061-a9e0-49c1-bdef-710aff5e9af4":{"filters":{},"height":36,"left":0,"lockAspectRatio":false,"locked":false,"maxHeight":10000,"maxWidth":10000,"minHeight":1,"minWidth":1,"props":{"content":{"blocks":[{"data":{"BOLD":true,"align":"ALIGN_CENTER","ig:color":"{{foregroundColor}}","ig:fontFamily":"{{fontFamily}}","ig:fontSize":"24px","ig:letterSpacing":"{{letterSpacing|0px}}","ig:lineHeight":"{{lineHeight}}"},"depth":0,"entityRanges":[],"inlineStyleRanges":[{"length":10,"offset":0,"style":"ig:lineHeight:{{lineHeight}}"},{"length":10,"offset":0,"style":"ig:color:{{foregroundColor}}"},{"length":10,"offset":0,"style":"ig:fontFamily:{{fontFamily}}"},{"length":10,"offset":0,"style":"ig:letterSpacing:{{letterSpacing|0px}}"},{"length":10,"offset":0,"style":"BOLD"},{"length":10,"offset":0,"style":"ig:fontSize:24px"}],"key":"a57o6","text":"VGR totalt","type":"header-one"}],"entityMap":{}},"contentHTML":"\u003Cdiv class=\"DraftEditor-root\"\u003E\u003Cdiv class=\"DraftEditor-editorContainer\"\u003E\u003Cdiv aria-describedby=\"placeholder-ig_static\" class=\"public-DraftEditor-content\" contenteditable=\"false\" spellcheck=\"false\" style=\"outline:none;user-select:text;-webkit-user-select:text;white-space:pre-wrap;word-wrap:break-word\"\u003E\u003Cdiv data-contents=\"true\"\u003E\u003Ch1 class=\"__ig-alignCenter\" data-block=\"true\" data-editor=\"ig_static\" data-offset-key=\"a57o6-0-0\"\u003E\u003Cdiv data-offset-key=\"a57o6-0-0\" class=\"public-DraftStyleDefault-block public-DraftStyleDefault-ltr\"\u003E\u003Cspan data-offset-key=\"a57o6-0-0\" style=\"font-weight:bold;line-height:36px;color:#464646;font-family:&#x27;Roboto&#x27;;letter-spacing:0px;font-size:24px\"\u003E\u003Cspan data-text=\"true\"\u003EVGR totalt\u003C\u002Fspan\u003E\u003C\u002Fspan\u003E\u003C\u002Fdiv\u003E\u003C\u002Fh1\u003E\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E","customSizing":true,"opacity":1,"overflow":true,"resetFontKerning":true,"scaleHeight":36,"scaleWidth":1276,"scaleX":1,"scaleY":1,"template":"h1","verticalAlign":"top"},"top":7,"transform":{"flipHorizontal":false,"flipVertical":false,"rotate":0},"type":"TEXT","width":1280},"ee056863-0d4e-4e96-9b41-5c3d884b877f":{"filters":{},"height":655,"left":0,"lockAspectRatio":false,"locked":false,"maxHeight":10000,"maxWidth":10000,"minHeight":50,"minWidth":50,"props":{"chartData":{"accessibility":{"description":"Antal inneliggande börjar på 30 den 21:e mars och har en försiktigt accelererad ökning till den 27:e april på 347. Efter det minskade antalet något för att återigen öka till den 4:e maj som också är högsta värdet på 375.\nAntal IVA vårdade var 21:a Mars 12st, och antalet har sedan ökat försiktigt över tid. Sista datumet i grafen, 7:e april, är vi uppe i 91st.","enabled":true,"label":"Antal inneliggande och varav IVA vårdade per dag"},"chart_type_nr":6,"colors":["#6D53DC","#E54D24"],"custom":{"accumulateValues":false,"animation":{"enabled":false},"axis":{"alpha":0.2,"x":{"affix":true,"decimalSeparator":".","grid":false,"groupingSymbol":"none"},"y":{"affix":true}},"categoryLayout":"tilted","decimalSeparator":".","groupingSymbol":"none","hideTabs":false,"labels":{"axis":{"x":{"tick":{"font-size":"19px"},"title":{"font-size":"19px"}},"y":{"tick":{"font-size":"19px"},"title":{"font-size":"19px"}}},"graph":{"item":{"format":{"affix":true},"value":{"font-size":"19px"}}},"legend":{"font-size":"19px"},"sheetSwitch":{"tab":{"font-size":"19px"}},"tooltip":{"format":{"x":{"affix":true},"y":{"affix":true}}}},"showDownload":true,"showLabels":false,"showPoints":true,"smooth":false,"textColor":"{{colors.#4C4C4C}}"},"data":[[["Datum","Antal  inneliggande","Varav  IVA"],["21\u002F3",30,12],["22\u002F3",33,8],["23\u002F3",34,11],["24\u002F3",31,12],["25\u002F3",34,16],["26\u002F3",36,19],["27\u002F3",56,21],["28\u002F3",56,24],["29\u002F3",65,30],["30\u002F3",71,36],["31\u002F3",74,37],["1\u002F4",85,44],["2\u002F4",91,46],["3\u002F4",92,40],["4\u002F4",94,44],["5\u002F4",100,42],["6\u002F4",113,43],["7\u002F4",119,44],["8\u002F4",133,44],["9\u002F4",126,49],["10\u002F4",149,52],["11\u002F4",183,62],["12\u002F4",182,63],["13\u002F4",180,66],["14\u002F4",209,68],["15\u002F4",198,71],["16\u002F4",204,69],["17\u002F4",234,66],["18\u002F4",233,69],["19\u002F4",245,67],["20\u002F4",269,67],["21\u002F4",263,67],["22\u002F4",271,71],["23\u002F4",291,79],["24\u002F4",310,85],["25\u002F4",326,91],["26\u002F4",324,91],["27\u002F4",347,84],["28\u002F4",345,86],["29\u002F4",342,91],["30\u002F4",333,88],["1\u002F5",332,90],["2\u002F5",339,96],["3\u002F5",350,94],["4\u002F5",375,96],["5\u002F5",362,96],["6\u002F5","345","97"],["7\u002F5","338","91"],["8\u002F5","342","91"],["9\u002F5","332","89"],["10\u002F5","342","83"],["11\u002F5","347","86"],["12\u002F5","341","83"],["13\u002F5","330","89"],["14\u002F5","325","84"],["15\u002F5","297","76"],["16\u002F5","299","73"],["17\u002F5","296","76"],["18\u002F5","311","81"],["19\u002F5","303","79"],["20\u002F5","303","79"],["21\u002F5","285","77"],["22\u002F5","309","76"],["23\u002F5","301","66"],["24\u002F5","304","69"],["25\u002F5","322","73"],["26\u002F5","312","73"],["27\u002F5","297","65"],["28\u002F5","278","66"],["29\u002F5","285","67"],["30\u002F5","285","64"],["31\u002F5","302","68"],["1\u002F6","307","66"],["2\u002F6","288","65"],["3\u002F6","284","66"],["4\u002F6","279","62"],["5\u002F6","272","57"],["6\u002F6","249","61"],["7\u002F6","249","65"],["8\u002F6","254","65"],["9\u002F6","227","52"],["10\u002F6","228","57"],["11\u002F6","245","55"]]],"defaultColors":["#8ec3a7","#dc5356","#f0cb69","#5fb7e5","#ab91c5","#6d53dc","#fd6a37","#e54d24"],"defaultColorsHeatmap":[],"modifier":0,"sheetnames":["Sheet 1"],"sheets_settings":[{"colors":["#6D53DC","#E54D24","#f0cb69","#5fb7e5","#ab91c5","#6d53dc","#fd6a37","#e54d24"]}]}},"top":49,"transform":{"flipHorizontal":false,"flipVertical":false,"rotate":0},"type":"CHART","width":1280}},"layouts":{}},"customFonts":{},"design":{"colors":["#8EC3A7","#DC5356","#F0CB69","#5FB7E5","#AB91C5","#6D53DC","#FD6A37","#E54D24"],"defaults":{"backgroundColor":"#ffffff","fontFamily":"Roboto","fontSize":12,"foregroundColor":"#464646","lineHeight":1.5,"textAlign":"ALIGN_LEFT"},"elements":{"IMAGE":{"fillColor":"#8ec3a7"},"SHAPE":{"fillColor":"#8ec3a7","strokeColor":{"ref":"defaults.backgroundColor"}},"TEXT":{"body":{"fontSize":16},"caption":{"fontSize":{"ref":"fontSizes.small"}},"h1":{"fontSize":{"ref":"fontSizes.extraLarge"}},"h2":{"fontSize":36}}},"fontFamilies":{"font1":"Roboto"},"fontSizes":{"extraLarge":72,"extraSmall":8,"large":64,"medium":18,"small":12}},"designDefaults":{"block":{"background":{"color":"{{colors.#FFFFFF}}","filters":{},"galleryImageId":null,"opacity":1}},"entity":{}},"fonts":[],"footerSettings":{"backgroundColor":"#fff","backgroundOpacity":100,"bold":false,"buttonBackgroundColor":"#d51a1a","buttonText":"Share","buttonTextColor":"#ffffff","customLink":"","customLinkOption":"text","fontSize":11,"footerLayout":"text_left-logo_right","footnoteText":"Create and publish your infographic","footnoteType":"shareButton","hasCustomLink":false,"italic":false,"logoColor":"#d51a1a","logoHeight":0,"logoImage":"","logoLink":"","logoName":"Infogram logo","logoType":"custom_logo-infogram","logoWidth":0,"paginationFormat":"x \u002F y","paginationStartWith":1,"showFooter":false,"textColor":"#464646"},"gridSettings":{"columnCount":4,"rowSpacing":10,"whitespacePercent":3},"interactivityHint":false,"interlinkedCharts":false,"language":"sv","pageSize":{"height":720,"width":1281},"schemaVersion":14,"themeId":215,"transition":"slide"},"hash":"fb63e64b8a26f63d8a6453d180d9789d"},"publishedURLId":"1h7g6kdlq9704oy","updatedAt":"2020-06-11T08:03:40.000Z","embed_image_data":{"height":720},"theme":{"createdAt":"2016-04-22T04:54:10.000Z","updatedAt":"2020-01-31T08:25:57.000Z","title":"Amsterdam","usergroup":"","picture":"https:\u002F\u002Fd1m5pq7b4fzvad.cloudfront.net\u002Fthumbnails\u002F0000_default.png","order":30,"public":1,"width":550,"fonts":"Roboto:400,500,700","colors":["#8ec3a7","#dc5356","#f0cb69","#5fb7e5","#ab91c5","#6d53dc","#fd6a37","#e54d24"],"logocolor":"d51a1a","logoImages":[""],"logoUrl":"","showLogo":"","showEmbed":"","embedButtonText":"Share","top":0,"padding":30,"spacing":30,"shrinkMargin":30,"shrinkPadding":0,"spacingElementMin":null,"spacingElementMax":null,"css":"svg .igc-pie-center-text .igc-pie-center-text-node {\n\tfont-family: Roboto, sans-serif;\n\tfont-weight: 500;\n\tfill: #464646;\n\tfont-size: 19px;\n}\n.igc-sheet {\n\tmargin-bottom: 15px;\n}\n.igc-sheets {\n\tmargin-bottom: 15px;\n}\n.igc-sheets .igc-sheet .igc-sheet-label,\n    .igc-sheets .igc-sheet:hover .igc-sheet-label,\n        .igc-sheets .igc-sheet.active .igc-sheet-label {\n\tcolor: rgba(70, 70, 70, 1);\n\tmargin-left: 5px;\n\tfont: 500 13px Roboto, sans-serif;\n}\n.igc-sheets .igc-sheet:hover .igc-sheet-label,.igc-sheets .igc-sheet.active .igc-sheet-label {\n\tcolor: rgba(70, 70, 70, 0.7);\n}\n.igc-sheets .igc-sheet .igc-sheet-ico,\n    .igc-sheets .igc-sheet:hover .igc-sheet-ico {\n\tbackground: rgba(167, 167, 167, 0.3);\n\tborder-color: #464646;\n\ttransition: .2s;\n}\n.igc-sheets .igc-sheet:hover .igc-sheet-ico {\n\tbackground: rgba(167, 167, 167, 1);\n}\n.igc-sheets .igc-sheet.active .igc-sheet-ico {\n\tbackground: #464646;\n}\n.igc-sheets .igc-sheet.active .igc-sheet-ico::after,\n    .igc-sheets .igc-sheet:hover .igc-sheet-ico::after {\n\theight: 6px;\n\twidth: 6px;\n\tleft: 6px;\n\ttop: 6px;\n\tbackground: #fff;\n}\n.igc-textual-figure {\n\tfont: 400 29px Roboto, sans-serif;\n}\n.igc-textual-fact {\n\tcolor: #464646;\n\tline-height: 18px;\n\tfont: 500 15px Roboto, sans-serif;\n}\n.igc-textual-figure .innertext {\n\tline-height: 30px;\n}\n.igc-textual-fact .innertext {\n\tline-height: 19px;\n}\n.igc-textual-icon {\n\tpadding-right: 30px;\n\tpadding-top: 7px;\n}\n.igc-table .igc-table-cell {\n\tfont: 500 13px Roboto, sans-serif;\n}\n.igc-table .igc-table-header {\n\tfont: 500 13px Roboto, sans-serif;\n\tpadding-left: 9px;\n}\n.ig-container {\n\tbackground: #fff;\n}\n.headline {\n\tfont-weight: 400;\n        font-size: 39px;\n        font-family: Roboto;\n\tcolor: #464646;\n\ttext-align: left;\n\tline-height: 40px;\n\tborder-bottom: 5px solid #e8e8e8;\n\tpadding-bottom: 10px;\n}\n.chart-title {\n\tfont: 400 29px Roboto, sans-serif;\n\tcolor: #464646;\n\ttext-align: left;\n\tline-height: 35px;\n}\n.bodytext {\n\tfont: 500 normal 15px Roboto, sans-serif;\n\ttext-align: left;\n\ttext-align: justify;\n\tcolor: #464646;\n\tline-height: 25px;\n}\n.quote {\n\tfont: 400 29px Roboto, sans-serif;\n\tcolor: #464646;\n\tline-height: 35px;\n\ttext-align: left;\n\tbackground: url(\u002Fi\u002Ftemplates\u002F215\u002Fquote.svg) left top no-repeat;\n\tbackground-size: 50px;\n\tpadding-left: 80px;\n\tmin-height: 40px;\n}\n.shrink .quote {\n\tpadding-top: 50px;\n\tpadding-left: 0;\n}\n.quotetitle {\n\tfont: 500 italic 15px Roboto, sans-serif;\n\tcolor: #464646;\n\tmargin-top: 5px;\n\tline-height: 25px;\n}\n.tt_tooltip {\n\tcolor: #fff;\n\tfont: 500 normal 13px Roboto, sans-serif;\n}\n.igc-legend-entry {\n\tmargin-top: 15px;\n}\n.igc-legend {\n\tpadding-top: 10px;\n\tpadding-bottom: 0;\n}\n.footer-bottom {\n\tpadding-top: 15px;\n\toverflow: hidden;\n\tpadding-bottom: 15px;\n}\n.ig-logo {\n\tmargin-top: 0px;\n}\n.ig-separator-line {\n\tbackground: rgba(70, 70, 70, 0.5);\n}\n.heatmap-legend {\n\tbackground: rgba(255, 255, 255, 0.7);\n}\n.heatmap-legend-item,\n.heatmap-label {\n\tcolor: #464646;\n\tfont-size: 13px;\n\tfont-weight: 400;\n\tfont-family: Roboto, sans-serif;\n}\n.igc-graph-pie-piece {\n\tstroke: rgba(255, 255, 255, 0.7);\n}\n.tt_tooltip .tt_value {\n\tfont-weight: 400;\n}\n.tt_tooltip .tt_body {\n\tbackground: #333;\n}\n.tt_tooltip .tt_left {\n\tborder-right: 8px solid #333;\n}\n.tt_tooltip .tt_right {\n\tborder-left: 8px solid #333;\n}\n.igc-tabs .igc-tab-active {\n\tbackground: #fff;\n}\n.igc-tabs .igc-tab .igc-tab-content,\n          .igc-tabs .igc-tab.icon-down:after {\n\tfont-family: Roboto, sans-serif;\n\tcolor: #464646;\n\tfont-weight: 500;\n}\n.igc-tabs .igc-tab,\n          .igc-tab-switcher {\n\tcolor: #464646;\n}\n.igc-tabs.igc-tabs-dropdown .igc-tab-name {\n\tfont-family: Roboto, sans-serif;\n\tcolor: #464646;\n}\n.captiontext {\n\tfont-family: Roboto, sans-serif;\n\tcolor: #464646;\n\tfont-weight: 500;\n}\n.captiontext .innertext {\n\tline-height: 1.5;\n}\n.igc-tab-ico svg path {\n\tfill: #464646;\n}\n.igc-tab-switcher-ico svg path {\n\tfill: #464646;\n}\n.igc-table-search {\n\tcolor: #666;\n\tfont-size: 13px;\n\tfont-weight: 500;\n\tfont-family: Roboto, sans-serif;\n}\n","charts":{"treemap":{"labels":{"value":{"fontFamily":"Roboto, sans-serif"},"name":{"fontWeight":"400","fontFamily":"Roboto, sans-serif"}}},"wordcloud":{"labels":{"fontFamily":"Roboto, sans-serif","fontWeight":"400"}},"table":{"cellBackground":"#fff","headerBackground":"#eee","cellColor":"#333","headerColor":"#333","shapeFill":"8ec3a7"},"legend":{"color":{"label":{"active":"rgb(70, 70, 70)","hover":"rgba(70, 70, 70, 0.7)","inactive":"rgb(70, 70, 70)"},"icon":{"inactive":"rgba(70, 70, 70, 0.2)"}},"layouts":{"bottom":{"legend":{"entry":{"marginTop":"15px"},"marginTop":"10px","marginBottom":"0"}}}},"sheetSwitch":{"style":{"tab":{"font-family":"Roboto, sans-serif","font-weight":500,"font-style":"normal","colors":{"dropdown":{"selectIcon":"#464646","leftSwitcherIcon":"#464646","rightSwitcherIcon":"#464646"}},"font-size":"13px","color":"#464646"}}},"gauge":{"colors":{"background":"#e8e8e8"}},"waterfall":{"colors":"f0cb69 8ec3a7 dc5356"},"candle":{"colors":{"up":"#dc5356","down":"#8ec3a7"}},"barRadial":{"colors":{"background":"#e8e8e8"}},"pictorialBar":{"colors":{"background":"#e8e8e8"},"style":{"graph":{"item":{"value":{"font-family":"PT Sans Narrow, Arial Narrow","font-size":"60px"}}}}},"map":{"countryFill":"#e8e8e8","hotColor":"#8ec3a7","coldColor":"#f9f9f9"}},"chartOptions":{"map":{"countryStroke":"#e8e8e8","countryFill":"#e8e8e8","hotColor":"#8ec3a7","coldColor":"#f9f9f9"}},"chartDefaults":{},"color":{"bg":"#fff","text":"#464646","chart":{"bg":"transparent","text":"#464646"},"element":{"bg":"transparent","text":"#464646"}},"colorPresets":[],"localFonts":{"google":[{"fontFamily":"Roboto","fontWeights":[400,500,700]}],"local":[],"typekit":[]},"font":{"common":{"textAlign":"initial","fontSize":"13","fontStyle":"normal","fontWeight":"500","fontFamily":"Roboto, sans-serif"},"legend":{"fontSize":"13","fontWeight":"500","fontFamily":"Roboto, sans-serif"},"label":{"fontSize":13,"fontWeight":500}},"fontPresets":[],"fontFamilies":["Roboto"],"footerOptions":{"common":{"borderColor":"#dadada","borderWidth":1},"copyrightNotice":{"enabled":false,"fontFamily":"PT Sans Narrow","fontSize":14,"color":"#4b4b4b","fontWeight":400,"fontStyle":"normal"},"shareButton":{"enabled":true,"background":"#d51a1a","text":"Share","color":"#ffffff","fontFamily":"Roboto, Arial, sans-serif","fontSize":11,"fontWeight":400,"fontStyle":"normal","position":"left"},"logo":{"position":"right","enabled":true,"background":"#d51a1a"}},"archived":false,"tabs":true,"zeroPaddingEmbed":true,"freelayoutContents":{"defaults":{"foregroundColor":"#464646","backgroundColor":"#fff","fontFamily":"Roboto","fontSize":12,"lineHeight":1.5,"textAlign":"ALIGN_LEFT"},"fontFamilies":{"font1":"Roboto"},"fontSizes":{"extraLarge":64,"large":48,"medium":18,"small":12},"elements":{"TEXT":{"h1":{"fontSize":"39px","fontFamily":"Roboto","foregroundColor":"#464646"},"h2":{"fontSize":"29px","fontFamily":"Roboto","foregroundColor":"#464646"},"body":{"fontSize":"15px","fontFamily":"Roboto","foregroundColor":"#464646"},"caption":{"fontSize":"13px","fontFamily":"Roboto","foregroundColor":"#464646"}},"SHAPE":{"fillColor":"#8ec3a7","strokeColor":"#8ec3a7"},"IMAGE":{"fillColor":"#8ec3a7"}},"colors":["#8ec3a7","#dc5356","#f0cb69","#5fb7e5","#ab91c5","#6d53dc","#fd6a37","#e54d24"]},"id":215,"thumb":"\u002Fi\u002Ftemplates\u002F215\u002Fdefault-small.jpg","version":1,"parentId":0,"enabledResponsive":true,"enabledFreeLayout":true,"created_at":"2016-04-22T04:54:10.000Z","updated_at":"2020-01-31T08:25:57.000Z"},"embed":"\u003Cscript id=\"infogram_0_de8d86b3-01ac-42ff-bb4f-91b7f6460464\" title=\"IVA-VGR-totalt-webb\" src=\"https:\u002F\u002Fe.infogram.com\u002Fjs\u002Fdist\u002Fembed.js?y3C\" type=\"text\u002Fjavascript\"\u003E\u003C\u002Fscript\u003E","embedIframe":"\u003Ciframe src=\"https:\u002F\u002Fe.infogram.com\u002Fde8d86b3-01ac-42ff-bb4f-91b7f6460464?src=embed\" title=\"IVA-VGR-totalt-webb\" width=\"1281\" height=\"720\" scrolling=\"no\" frameborder=\"0\" style=\"border:none;\" allowfullscreen=\"allowfullscreen\"\u003E\u003C\u002Fiframe\u003E","embedImageResponsive":"\u003Cscript id=\"infogramimg_0_de8d86b3-01ac-42ff-bb4f-91b7f6460464\" title=\"IVA-VGR-totalt-webb\" src=\"https:\u002F\u002Fe.infogram.com\u002Fjs\u002Fdist\u002Fembed.js?N4a\" type=\"text\u002Fjavascript\"\u003E\u003C\u002Fscript\u003E","embedImageIframe":"","embedAMP":"\u003Camp-iframe width=\"1281\" height=\"720\" layout=\"responsive\" sandbox=\"allow-scripts allow-same-origin allow-popups\" resizable allowfullscreen frameborder=\"0\" src=\"https:\u002F\u002Fe.infogram.com\u002Fde8d86b3-01ac-42ff-bb4f-91b7f6460464?src=embed\"\u003E\u003Cdiv style=\"visibility: hidden\" overflow tabindex=0 role=button aria-label=\"Loading...\" placeholder\u003ELoading...\u003C\u002Fdiv\u003E\u003C\u002Famp-iframe\u003E","embedAMPImage":"\u003Camp-iframe width=\"1281\" height=\"720\" layout=\"responsive\" sandbox=\"allow-scripts allow-same-origin allow-popups\" resizable allowfullscreen frameborder=\"0\" src=\"https:\u002F\u002Fe.infogram.com\u002Fde8d86b3-01ac-42ff-bb4f-91b7f6460464?src=embed\"\u003E\u003Cdiv style=\"visibility: hidden\" overflow tabindex=0 role=button aria-label=\"Loading...\" placeholder\u003ELoading...\u003C\u002Fdiv\u003E\u003C\u002Famp-iframe\u003E","embedWordpress":"[infogram id=\"de8d86b3-01ac-42ff-bb4f-91b7f6460464\" prefix=\"Pba\" format=\"interactive\" title=\"IVA-VGR-totalt-webb\"]","embedWordpressImage":"[infogram id=\"de8d86b3-01ac-42ff-bb4f-91b7f6460464\" prefix=\"2Ej\" format=\"image\" title=\"IVA-VGR-totalt-webb\"]","embedAsync":"\u003Cdiv class=\"infogram-embed\" data-id=\"de8d86b3-01ac-42ff-bb4f-91b7f6460464\" data-type=\"interactive\" data-title=\"IVA-VGR-totalt-webb\"\u003E\u003C\u002Fdiv\u003E\u003Cscript\u003E!function(e,i,n,s){var t=\"InfogramEmbeds\",d=e.getElementsByTagName(\"script\")[0];if(window[t]&&window[t].initialized)window[t].process&&window[t].process();else if(!e.getElementById(n)){var o=e.createElement(\"script\");o.async=1,o.id=n,o.src=\"https:\u002F\u002Fe.infogram.com\u002Fjs\u002Fdist\u002Fembed-loader-min.js\",d.parentNode.insertBefore(o,d)}}(document,0,\"infogram-async\");\u003C\u002Fscript\u003E","embedImageAsync":"\u003Cdiv class=\"infogram-embed\" data-id=\"de8d86b3-01ac-42ff-bb4f-91b7f6460464\" data-type=\"image\" data-title=\"IVA-VGR-totalt-webb\"\u003E\u003C\u002Fdiv\u003E\u003Cscript\u003E!function(e,i,n,s){var t=\"InfogramEmbeds\",d=e.getElementsByTagName(\"script\")[0];if(window[t]&&window[t].initialized)window[t].process&&window[t].process();else if(!e.getElementById(n)){var o=e.createElement(\"script\");o.async=1,o.id=n,o.src=\"https:\u002F\u002Fe.infogram.com\u002Fjs\u002Fdist\u002Fembed-loader-min.js\",d.parentNode.insertBefore(o,d)}}(document,0,\"infogram-async\");\u003C\u002Fscript\u003E","indexStatus":false};</script>
    }
}

new ScraperApp().scrapeAll();
