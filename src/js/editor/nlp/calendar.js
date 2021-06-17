const path = require('path')
const calendarLinks = require(path.join(__dirname + "/js/editor/data/calendarLinks.json"));

class CammyCalendarLink {
    type;
    link;

    constructor(type, dat) {
        this.type = type;
        const cLin = calendarLinks[type];
        const format = cLin.format;
        const baseURL = cLin.base;

        var link = baseURL + "&";

        Object.keys(format).forEach((f, i) => {
            let val = dat[f];
            if (format[f].required && !val) throw Error("Required calendar field is missing!");
            if (format[f].capitalization && format[f].capitalization == 'title') {
                val = val.split(' ');
                val.forEach((w, i) => {
                    val[i] = w.charAt(0).toUpperCase() + w.substr(1);
                }); 
                val = val.join(' ');
            }
            if (val) link += format[f].param + "=" + encodeURIComponent(val) + "&";
        });
        this.link = link;
    }
    getLink() {
        return this.link;
    }
}
