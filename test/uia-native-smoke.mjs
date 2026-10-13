import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {McpTestClient} from './mcp-test-client.mjs';
const artifacts=path.resolve(process.argv[2]);await mkdir(artifacts,{recursive:true});
const fixture=spawn('powershell.exe',['-NoProfile','-Sta','-File',path.join(import.meta.dirname,'uia-native-fixture.ps1'),artifacts],{windowsHide:true,stdio:['ignore','pipe','pipe']});
let state={},buffer='',stderr='';
fixture.stderr.on('data',b=>stderr+=b);
fixture.stdout.on('data',b=>{buffer+=b;let end;while((end=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,end);buffer=buffer.slice(end+1);try{Object.assign(state,JSON.parse(line));}catch{}}});
const client=new McpTestClient(process.execPath,[path.join(import.meta.dirname,'../mcp/server.mjs')],{env:{...process.env,WCU_INDICATOR:'0',WINDOWS_CU_POWERSHELL:process.env.WINDOWS_CU_POWERSHELL||'powershell.exe'}});
const results=[];
async function call(action,args){const start=performance.now();const r=await client.call('windows_computer_use_'+action,args);assert.ok(!r.isError,JSON.stringify(r));const data=JSON.parse(r.content[0].text);results.push({action,args,result:data,wallMs:Math.round(performance.now()-start)});return data;}
try{
  const started=performance.now();await client.init();
  for(let i=0;i<300&&!state.ready;i++){assert.equal(fixture.exitCode,null,stderr);await delay(100);}
  assert.ok(state.ready,JSON.stringify({state,stderr,exitCode:fixture.exitCode,waitedMs:Math.round(performance.now()-started)}));
  console.log('NATIVE_STARTUP '+JSON.stringify({durationMs:Math.round(performance.now()-started),state}));
  const target={nativeWindowHandle:state.hwnd};
  const tree=await call('accessibility_tree',{...target,detailLevel:'full',maxDepth:5});
  assert.equal(tree.targetResponsive,true);assert.ok(tree.nodeCount>=3,JSON.stringify(tree));
  const find=await call('find',{...target,query:'native needle'});assert.ok(find.results.length>0);assert.ok(find.results[0].patterns.includes('Value'));
  await writeFile(path.join(artifacts,'native-command.json'),JSON.stringify({id:1,action:'hang'}));
  for(let i=0;i<30&&!state.hanging;i++)await delay(50);assert.equal(state.hanging,true);
  const start=performance.now();
  const refused=await call('activate_window',target);assert.equal(refused.activated,false);assert.equal(refused.targetResponsive,false);assert.ok(refused.warning);assert.ok(refused.window.name);assert.ok(refused.window.boundingBox);assert.equal(refused.window.source,'win32');
  const stopped=await call('snapshot',{...target,includeScreenshot:false,captureWindow:true});assert.equal(stopped.truncationReason,'targetUnresponsive');assert.equal(stopped.nodeCount,0);
  assert.ok(performance.now()-start<1800,'Hung window entered UIA or activation');
  for(let i=0;i<80&&!state.recovered;i++)await delay(50);assert.equal(state.recovered,true);
  const recovered=await call('accessibility_tree',{...target,maxDepth:5});assert.equal(recovered.targetResponsive,true);assert.ok(recovered.nodeCount>=3);
  console.log('PASS real WinForms cached value/patterns, WM_NULL hung-window circuit break, activation metadata/warning and recovery; no physical input');
}finally{
  await writeFile(path.join(artifacts,'results.json'),JSON.stringify({state,results,stderr},null,2)+'\n');
  await writeFile(path.join(artifacts,'native-command.json'),JSON.stringify({id:100,action:'quit'}));client.child.stdin.end();
  for(let i=0;i<70&&(fixture.exitCode===null||client.child.exitCode===null);i++)await delay(100);
  if(fixture.exitCode===null)fixture.kill();if(client.child.exitCode===null)client.child.kill();
}
