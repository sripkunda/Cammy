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
            const val = dat[f];
            if (format[f].required && !val) throw Error("Required calendar field is missing!");
            if (val) link += format[f].param + "=" + val.replaceAll(" ", "%20") + "&";
        });
        this.link = link;
    }
    getLink() {
        return this.link;
    }
}
