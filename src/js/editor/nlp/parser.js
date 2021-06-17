// NLP and Markdown
const nlp = require('compromise');
const chrono = require('chrono-node')
var removeMd = require('remove-markdown');
nlp.extend(require('compromise-dates'));
nlp.extend(require('compromise-numbers'));

function parse(bAddToCalendar) {
  // Get the editor element(s)
  var tb = document.querySelector(".editor");
  var cont = cammy.editor.value();
  let ln = cammy.editor.codemirror.getCursor().line;
  const line = document.querySelectorAll('.CodeMirror-code pre')[ln] ? document.querySelectorAll('.CodeMirror-code pre')[ln].textContent : document.querySelectorAll('.CodeMirror-code pre')[--ln].textContent;
  getMatches(line, ln, bAddToCalendar);
  return ln;
}

function getMatches(line, ln, bAddToCalendar) {
  // Parse for understanding events, reminders, etc.
  var matches = parseKw(line);

  // Check if an activity match is produced
  match = (matches['activity'] && matches['activity'].replace(/^\s/g, "") != "") && matches['date'];
  if (match) {
    setMatch(matches, ln, bAddToCalendar);
  } else {
    formatLine(ln, "none");
  }
}

function parseKw(line) {
  let matches = new Object();

  matches['text'] = line; // set text attribute

  // Setup for nlp
  let doc = nlp(removeMd(line));

  // Get date and time if not already determined

  // Get activity
  matches['activity'] = getActivity(doc);

  doc = nlp(removeMd(line));

  if (!matches['date'])
    matches['date'] = doc.dates().json().length > 0 ? doc.dates().json() : null; // get dates
  return matches;
}

function setMatch(matches, ln, bAddToCalendar, t) {
  if (!t)
    matches['date'].every((d) => {
      if (d.repeat) {
        t = 'orange';
        return false;
      } else {
        t = 'yellow'
      }
      return true;
    });
  formatLine(ln, t, matches, bAddToCalendar); // format the line 
}

function getActivity(doc) {
  doc.dates().delete();
  return doc.match("#Verb * #Noun", { fuzzy: 0.6 }).text() || doc.match("#Noun", { fuzzy: 1 }).text() || doc.match("#Verb", { fuzzy: 1 }).text(); // return the activity 
}

function formatLine(ln, style, matches, bAddToCalendar) {
  document.querySelectorAll('.CodeMirror-code pre').forEach((e) => {
    e.classList.remove('cammy-tf-f');
    ['yellow', 'orange', 'none'].forEach((f) => {
      e.classList.remove(`cammy-tf-${f}-f`);
    });
  });
  let obj = document.querySelectorAll('.CodeMirror-code pre')[ln];
  let cl = obj ? obj.classList : [];
  if (cl.length > 0) {
    cl.add(`cammy-tf-${style}-f`);

    if (bAddToCalendar) addToCalendar(matches);

    obj.onclick = (e) => {
      addToCalendar(matches);
    }
  }
  if (style != 'none') cl.add('cammy-tf-f');
}

function addToCalendar(matches) {
  let obj = new Object();  // create an empty object for data
  obj['text'] = matches['activity']; // set activity

  const days = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
  var dateSet = false;
  var repeating = false;
  recurCode = "RRULE:FREQ=WEEKLY;" + "WKST=SU;BYDAY=";

  matches['date'].forEach((date, i) => {
    if (date.repeat) {
      repeating = true;
      obj['dates'] = formatDate(date.repeat.generated[0].start + "/" + date.repeat.generated[0].end); 
      let day = new Date(date.repeat.generated[0].start).getDay();
      recurCode += days[day] + (i != matches['date'].length - 1 ? "," : "");
      dateSet = true;
    } else {
      if (!dateSet) obj['dates'] = formatDate(matches['date'][0].start + "/" + matches['date'][0].end);

      if (!dateSet && date.unit == 'time')
        dateSet = true;
    }
  });

  if (repeating) obj['recur'] = recurCode;

  let link = new CammyCalendarLink('google', obj).getLink(); // get link from calendar object
  shell.openExternal(link);
}

function formatDate(str) {
  return str.replaceAll(".", "").replaceAll(":", "").replaceAll("-", "");
}
