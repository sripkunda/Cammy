const { ipcRenderer, remote, shell } = require("electron");
const EasyMDE = require("easymde");

const options = {
  element: document.getElementsByClassName("editor")[0],
  autofocus: true,
  toolbar: false,
  status: false,
  forceSync: true,
  spellcheck: false
};

const cammy = new CammyEditor(options, 0);

// Parse and update content whenever an action happens in the editor window
document.onkeyup = () => { cammy.updateState(); }
document.onclick = () => { cammy.updateState(); }

cammy.editor.codemirror.on("change", function(){
  cammy.updateSaveState(); 
});

// Electron event handlers
ipcRenderer.on('savecontent', (e, args) => {
  ipcRenderer.send('save', {content: cammy.getContent(), path: args.path}); 
});

ipcRenderer.on('setcontent', (e, args) => {
  cammy.setContent(args.content); 
});

ipcRenderer.on('colorThemeChanged', (e, args) => {
  CammyEditor.setColorTheme(args.theme); 
});

ipcRenderer.on('editorModeChanged', (e, args) => {
  CammyEditor.setEditorMode(args.mode); 
});

ipcRenderer.on('addToCalendar', (e, args) => {
  cammy.updateState(true);
});
