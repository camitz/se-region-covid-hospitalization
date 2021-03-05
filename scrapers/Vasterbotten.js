
class Vasterbotten extends Scraper{
    _baseUrl = 'https://coronarapportering.regionvasterbotten.se/CoronaRVBuppdat.csv';

  	get name() {
    return 'Västerbotten';
  }


  parseCsv(csv){
  	    csv = csv.substr(csv.indexOf("Datum;Bekr"));
  	    csv = csv.substr(csv.indexOf("\n")+1);

  	    var raw = $.csv.toArrays(csv);
  	    raw=raw.map(x=>x[0].split(";"));

        this.dates = raw.map(x=>moment(x[0])).reverse();
        this.inls = raw.map(x=>x[2]*1).reverse();
        this.ivas = raw.map(x=>x[3]*1).reverse();

        raw = raw[raw.length-1];
        var date = moment(raw[0]);
        
        var inl = raw[2]*1;
        var iva = raw[3]*1;

        return [date,inl,iva,raw];
  }
}

