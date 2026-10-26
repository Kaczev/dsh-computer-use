// Public MCP target routing with deterministic desktop worker; no browser/input.
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {McpTestClient} from './mcp-test-client.mjs';
import {BrowserLane, isBrowserCall, normalizeTargetArguments} from '../mcp/browser.mjs';
const root=await mkdtemp(path.join(os.tmpdir(),'wcu-target-routing-'));
await mkdir(path.join(root,'mcp'));await mkdir(path.join(root,'scripts'));
for(const name of ['server.mjs','settings.mjs','takeover.mjs','browser.mjs'])
  await writeFile(path.join(root,'mcp',name),await readFile(new URL('../mcp/'+name,import.meta.url)));
await writeFile(path.join(root,'scripts/windows-uia.ps1'),`param([switch]$Persistent)
while($null -ne ($line=[Console]::In.ReadLine())) {
  $r=$line | ConvertFrom-Json
  $result=@{id=$r.id;ok=$true;action=$r.action;args=$r.args;nodeCount=8}
  if($r.action -eq 'list_windows'){$result.windows=@()}
  if($r.action -eq 'screenshot'){$result.screenshot=@{base64='aW1hZ2U=';mimeType='image/png'}}
  [Console]::WriteLine(($result | ConvertTo-Json -Depth 20 -Compress))
}
`);
const c=new McpTestClient(process.execPath,[path.join(root,'mcp/server.mjs')],{env:{...process.env,WCU_BROWSER_LANE:'off',WCU_TEST_NO_TAKEOVER:'1'}});
const call=(name,args)=>c.call('windows_computer_use_'+name,args);
const data=r=>JSON.parse(r.content[0].text);
try {
  await c.init();
  const {tools}=await c.request('tools/list');
  for(const tool of tools)for(const key of ['browserTab','windowTitle','nativeWindowHandle','processId'])
    assert.ok(!tool.inputSchema.required?.includes(key),`${tool.name}: ${key} must be optional`);
  console.log(JSON.stringify({advertisedSchemaChars:JSON.stringify(tools).length}));
  for(const blank of ['', ' \t\n']) {
    assert.equal(isBrowserCall({browserTab:blank}),false);
    for(const name of ['snapshot','accessibility_tree','screenshot']) {
      const r=await call(name,{browserTab:blank,windowTitle:blank,nativeWindowHandle:2888916,processId:14056});
      assert.ok(!r.isError,JSON.stringify(r));
      assert.equal(data(r).args.nativeWindowHandle,2888916);
      assert.equal(data(r).args.processId,14056);
      assert.ok(!Object.hasOwn(data(r).args,'browserTab'));
      assert.ok(!Object.hasOwn(data(r).args,'windowTitle'));
    }
  }
  for(const name of ['snapshot','accessibility_tree','screenshot'])assert.ok(!(await call(name,{nativeWindowHandle:2888916})).isError);
  for(const args of [
    {browserTab:'t123',nativeWindowHandle:2888916},
    {browserTab:'t123',processId:14056},
    {browserTab:'t123',windowTitle:'Desktop'},
    {elementId:'t123:57',nativeWindowHandle:2888916},
    {elementId:'web:t123:57',windowTitle:'Desktop'},
    {browserTab:'t123',elementId:'uia:rt:42-1'},
    {elementId:'t123:57',x:0,y:-1}
  ]) {
    const name=args.elementId?'element_info':'screenshot';
    // element_info intentionally has no browserTab property: test the helper below.
    if(args.browserTab&&args.elementId)continue;
    const r=await call(name,args);assert.equal(r.isError,true);
    assert.match(r.content[0].text,/INVALID_ARGUMENTS: Conflicting targets:/);
    for(const [key,value] of Object.entries(args))assert.ok(r.content[0].text.includes(`${key}=${JSON.stringify(value)}`));
  }
  const empty=await call('screenshot',{browserTab:'t123',windowTitle:'  '});
  assert.match(empty.content[0].text,/BROWSER_LANE_UNAVAILABLE/);
  assert.doesNotMatch(empty.content[0].text,/Conflicting targets/);
  const padded=(name,args)=>Object.fromEntries(Object.keys(tools.find(t=>t.name==='windows_computer_use_'+name).inputSchema.properties).map(key=>[key,Object.hasOwn(args,key)?args[key]:null]));
  for(const tool of tools)for(const [key,property] of Object.entries(tool.inputSchema.properties)) {
    if(!tool.inputSchema.required?.includes(key)) {
      assert.ok(property.type.includes('null'),`${tool.name}.${key}: strict-provider placeholder`);
      if(property.enum)assert.ok(property.enum.includes(null));
    }
  }
  for(const args of [{elementId:'new-tab',value:'https://example.com'},padded('set_value',{elementId:'new-tab',value:'https://example.com'})]) {
    const r=await call('set_value',args);
    assert.match(r.content[0].text,/BROWSER_LANE_UNAVAILABLE/,'Valid browser call must reach browser dispatch');
    assert.doesNotMatch(r.content[0].text,/INVALID_ARGUMENTS/);
  }
  for(const name of ['snapshot','accessibility_tree','screenshot']) {
    const browser=await call(name,padded(name,{browserTab:'t123'}));
    assert.match(browser.content[0].text,/BROWSER_LANE_UNAVAILABLE/);
    const desktop=await call(name,padded(name,{nativeWindowHandle:2888916}));
    assert.ok(!desktop.isError,JSON.stringify(desktop));
    assert.equal(data(desktop).args.nativeWindowHandle,2888916);
    for(const key of Object.keys(tools.find(t=>t.name==='windows_computer_use_'+name).inputSchema.properties))
      assert.notEqual(data(desktop).args[key],null,`${name}.${key}`);
    assert.equal(data(desktop).args.activate,false,'null applies the same default as omission');
  }
  const desktopSet=await call('set_value',padded('set_value',{elementId:'uia:rt:42-1',value:'hello',nativeWindowHandle:2888916}));
  assert.ok(!desktopSet.isError,JSON.stringify(desktopSet));
  assert.equal(data(desktopSet).args.value,'hello');
  const conflict=await call('set_value',padded('set_value',{elementId:'new-tab',value:'https://example.com',processId:6860,nativeWindowHandle:14356610}));
  assert.match(conflict.content[0].text,/INVALID_ARGUMENTS: Conflicting targets/);
  for(const key of ['elementId','value']) {
    const r=await call('set_value',{elementId:'new-tab',value:'https://example.com',[key]:null});
    assert.match(r.content[0].text,/INVALID_ARGUMENTS/,'Required arguments still reject null');
  }
  const discovery=await call('tools',{operation:null,names:null});
  assert.ok(!discovery.isError);
  for(const args of [{browserTab:0},{nativeWindowHandle:0},{processId:'6860'},{nativeWindowHandle:1.5}]) {
    const r=await call('screenshot',args);assert.equal(r.isError,true);assert.match(r.content[0].text,/INVALID_ARGUMENTS/);
  }
  assert.deepEqual(normalizeTargetArguments({browserTab:'',windowTitle:' ',x:0,y:-1}),{x:0,y:-1});
  assert.equal(isBrowserCall({elementId:'t123:57',browserTab:''}),true);
  const lane=new BrowserLane({env:{WCU_BROWSER_LANE:'off'}});
  try {
    await assert.rejects(lane.run('scroll',{browserTab:'t123',elementId:'uia:rt:42-1'}),/Conflicting targets/);
    await assert.rejects(lane.run('screenshot',{browserTab:'t123',windowTitle:' '}),/BROWSER_LANE_UNAVAILABLE/);
  } finally {await lane.close();}
  console.log('PASS optional MCP target fields; blank locators + HWND/PID and HWND-only desktop reads with browser disabled; explicit target conflicts including page IDs; strict numeric/null validation');
} finally {
  c.child.stdin.end();const timer=setTimeout(()=>c.close(),5000);
  if(c.child.exitCode===null)await new Promise(resolve=>c.child.once('exit',resolve));clearTimeout(timer);
  await writeFile(path.join(root,'results.json'),JSON.stringify({transcript:c.transcript,stderr:c.stderr},null,2));
}
