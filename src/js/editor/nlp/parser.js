// Data
const keywords = require("./js/editor/data/parseContent.json");
const formats = require("./js/editor/data/formats.json");

// NLP and Markdown
const nlp = require('compromise');
var removeMd = require('remove-markdown');
nlp.extend(require('compromise-dates'));
nlp.extend(require('compromise-numbers'));

function parse() {
  // Get the editor element(s)
  var tb = document.querySelector(".editor");
  var cont = cammy.editor.value();
  let ln = cammy.editor.codemirror.getCursor().line;
  const line = document.querySelectorAll('.CodeMirror-code pre')[ln] ? document.querySelectorAll('.CodeMirror-code pre')[ln].textContent : document.querySelectorAll('.CodeMirror-code pre')[--ln].textContent;
  getMatches(line, ln);
  return ln; 
}

function getMatches(line, ln)
{
  // Parse for understanding events, reminders, etc.
  var matches = parseKw(line, keywords);

  // Check if an activity match is produced
  match = (matches['activity'] && matches['activity'].replace(/^\s/g, "") != "") && matches['date'];
  if (match)
  {
    setMatch(matches, ln);
  } else {
    formatLine(ln, "none");
  }
}

function parseKw(line, kw)
{
  let matches = new Object();
  // Get information first from keywords
  Object.keys(kw).forEach((i) => {
    matches[i] = [];
    kw[i].words.every((w) => {
      if (line.indexOf(w.word.substr(0, Math.abs(w.lazyLength - w.word.length))) > -1 || (w.word.ignore && line.indexOf(w.word.replaceAll(w.word.ignore, "").substr(0, Math.abs(w.lazyLength - w.word.length))) > -1))
      {
        matches[i][0] = (w.word);
        return false;
      }
      return true;
    });
  });

  // Set repeating (for events)
  matches['repeats'] = matches['repeats'].length > 0 ? true : false;

  // Setup for nlp
  
  let doc = nlp(removeMd(line));

  // Get date and time if not already determined

  // Get activity
  matches['activity'] = getActivity(doc);

  doc = nlp(removeMd(line));
  
  if (!matches['date'])
    matches['date'] = doc.dates().format("{month} {date-ordinal} {time}").out('array')[0];

  return matches;
}

function setMatch(matches, ln, t)
{
  console.clear();
  console.log(matches);
  if (!t) Object.keys(formats).forEach((f) => {if (matches[formats[f].key] == formats[f].value) t = f;});
  formatLine(ln, t);
}

function formatLine(ln, style)
{
  document.querySelectorAll('.CodeMirror-code pre').forEach((e) => {
    e.classList.remove('cammy-tf-f');
    Object.keys(formats).forEach((f) => {
      e.classList.remove(`cammy-tf-${f}-f`);
    });
  });

  let cl = document.querySelectorAll('.CodeMirror-code pre')[ln] ? document.querySelectorAll('.CodeMirror-code pre')[ln].classList : [];
  if (cl.length > 0) {
    cl.add(`cammy-tf-${style}-f`); 
    if (style != 'none') cl.add('cammy-tf-f'); 
  }
}

function getActivity(doc)
{
  doc.dates().delete();
  return doc.match("#Verb * #Noun", {fuzzy: 0.6}).text() || doc.match("#Noun", {fuzzy: 1}).text() || doc.match("#Verb", {fuzzy: 1}).text();
}
