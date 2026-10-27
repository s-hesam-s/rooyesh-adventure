import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import http from 'node:http';
import net from 'node:net';
async function freePort(){const s=net.createServer();s.listen(0,'127.0.0.1');await once(s,'listening');const port=s.address().port;await new Promise(resolve=>s.close(resolve));return port;}
test('local server serves offline assets and restricts methods and file access',async()=>{
 const port=await freePort(),child=spawn(process.execPath,['scripts/server.mjs','--port='+port],{cwd:new URL('../',import.meta.url),stdio:['ignore','pipe','pipe']});
 try{
  await Promise.race([once(child.stdout,'data'),new Promise((_,reject)=>{const t=setTimeout(()=>reject(new Error('Startup timeout')),5000);t.unref();})]);
  const base='http://127.0.0.1:'+port;
  const res=await fetch(base);assert.equal(res.status,200);assert.match(await res.text(),/lang="fa" dir="rtl"/);assert.ok(res.headers.get('content-security-policy'));
  for(const file of ['/src/main.js','/style.css','/assets/fonts/Vazirmatn.woff2','/assets/mark.svg'])assert.equal((await fetch(base+file)).status,200,file);
  assert.equal((await fetch(base+'/health')).status,200);
  assert.equal((await fetch(base,{method:'POST'})).status,405);
  assert.equal((await fetch(base+'/package.json')).status,404);
  assert.equal((await fetch(base+'/missing')).status,404);
  const raw=(path,host)=>new Promise((resolve,reject)=>{const req=http.get({hostname:'127.0.0.1',port,path,headers:host?{Host:host}:undefined},response=>{response.resume();resolve(response.statusCode);});req.on('error',reject);});
  assert.equal(await raw('/%2e%2e%2fscripts/server.mjs'),403);
  assert.equal(await raw('/%5c..%5cpackage.json'),403);
  assert.equal(await raw('/%zz'),400);
  assert.equal(await raw('/','example.test'),403);
 }finally{child.kill();await once(child,'exit');}
});
