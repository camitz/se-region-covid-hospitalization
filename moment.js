let moment = require('moment');

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

module.exports = moment;