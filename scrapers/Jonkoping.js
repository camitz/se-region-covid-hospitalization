
/*
class Jonkoping extends Scraper{
    _baseUrl = 'https://www.rjl.se/api/minanyheterlistblockitemapi?minanyhetertags=407&sincendays=500&listpage=51359&skipcache=true';

	get name() {
    return 'Jönköping';
  }

  parseJson(result){
        var raw = result.filter(x=>x.Heading.startsWith("Uppdatering om covid"))[0];
        //var t = RegExp('(\\d+)\\D+(\\d+ \\w+) \\d+.+?\\. ('+this.ordinals.reverse().join('|')+')').exec(raw.Preamble.toLowerCase());
        
        var date = moment(raw.MachineReadablePublishDateTimeString);

        var inl = raw.Preamble.match(/^(\d+)/)[1]*1;
        var iva = raw.Preamble.match(/([0-9a-zåäö]+) av patie/i)[1];
        iva = this.ordinalOrNumber(iva);

        return [date,inl,iva,raw.Preamble];
  }
}
*/

class Jonkoping extends Scraper{
    _baseUrl = 'https://www.rjl.se/om-oss/pressrum/aktuell-statistik-covid-19-i-jonkopings-lan/';

	get name() {
    return 'Jönköping';
  }

  parse(xmlDoc){
        var node = xmlDoc.evaluate('//*[@id="main-content"]//p[@class="main-intro"]', xmlDoc).iterateNext();
        var raw = "<table>"+node.nextElementSibling.querySelector("table").innerHTML+"</table>";

        var rows = node.nextElementSibling.querySelectorAll("table:first-of-type tr");

        this.dates = [...rows].map(x=>moment(x.children[0].innerText)).slice(1).reverse();
        this.inls = [...rows].map(x=>x.children[1].innerText*1).slice(1).reverse();
        this.ivas = [...rows].map(x=>x.children[2].innerText=='-' ? 0 : x.children[2].innerText*1).slice(1).reverse();

        return [this.dates[this.dates.length-1],this.inls[this.dates.length-1],this.ivas[this.dates.length-1],raw.substr(0,300)];  
  }
}

