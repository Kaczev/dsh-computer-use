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
  for(const args of [{browserTab:0},{browserTab:null},{nativeWindowHandle:0},{processId:null}]) {
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
