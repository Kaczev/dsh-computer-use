// Dedicated disposable Chromium window. Never uses a user's profile or content.
const { app, BrowserWindow } = require('electron');
const {writeFileSync,readFileSync} = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
app.setPath('userData', process.argv[2]);
app.commandLine.appendSwitch('force-renderer-accessibility');
let window;
app.on('child-process-gone',(_event,details)=>console.error('child-process-gone',JSON.stringify(details)));
app.whenReady().then(async () => {
  window = new BrowserWindow({width:900,height:650,show:false,webPreferences:{sandbox:true}});
  window.webContents.on('render-process-gone',(_event,details)=>console.error('render-process-gone',JSON.stringify(details)));
  const file=path.join(path.dirname(process.argv[2]),'fixture.html');
  writeFileSync(file,`<!doctype html><title>WCU issue18 isolated Chromium fixture</title><main><h1>Cached UIA fixture</h1><label>Search<input aria-label="Fixture search" value="needle value"></label><button>Fixture action</button>${Array.from({length:100},(_,i)=>`<section><h2>Row ${i}</h2><button>Item ${i}</button><p>Content ${i}</p></section>`).join('')}</main>`,'utf8');
  await window.loadURL(pathToFileURL(file).href);
  window.showInactive();
  console.log(JSON.stringify({ready:true,hwnd:window.getNativeWindowHandle().readUInt32LE(),pid:process.pid,chromium:process.versions.chrome,electron:process.versions.electron}));
}).catch(error=>{console.error(error);app.exit(1);});
let last=0;
setInterval(async()=>{
  let command;try{command=JSON.parse(readFileSync(path.join(path.dirname(process.argv[2]),'command.json'),'utf8'));}catch{return;}
  if(command.id===last)return;last=command.id;
  if(command.action==='ping') console.log(JSON.stringify({pong:await window.webContents.executeJavaScript('document.querySelector("input").value')}));
  if(command.action==='quit') app.quit();
},100);
setTimeout(()=>app.quit(),120000);
