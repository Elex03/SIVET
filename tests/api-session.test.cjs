const assert=require('node:assert/strict');const fs=require('node:fs');const ts=require('typescript');const {test}=require('node:test');const axios=require('axios');
const storage=new Map();let expired=0;global.sessionStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};global.window={dispatchEvent:event=>{if(event.type==='sivet-session-expired')expired++;}};
require.extensions['.ts']=(module,filename)=>{const source=fs.readFileSync(filename,'utf8').replaceAll('import.meta.env.VITE_API_URL',"'http://api.test/api/v1'").replaceAll('import.meta.env.BASE_URL',"'/'");module._compile(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,filename);};
let refreshes=0;let failRefresh=false;
axios.defaults.adapter=async config=>{
  const response={status:200,statusText:'OK',config,headers:{},data:{data:{ok:true}}};
  if(config.url==='/auth/refresh'){refreshes++;await new Promise(resolve=>setTimeout(resolve,10));if(failRefresh)throw new axios.AxiosError('Expired','ERR_BAD_REQUEST',config,null,{...response,status:401});return {...response,data:{data:{access_token:'new',refresh_token:'rotated',expires_in:60,refresh_expires_in:3600}}};}
  if(config.headers.get('Authorization')!=='Bearer new')throw new axios.AxiosError('Expired','ERR_BAD_REQUEST',config,null,{...response,status:401});
  return response;
};
const {apiData}=require('../src/shared/api/client.ts');const {saveTokens,getTokens}=require('../src/shared/api/session.ts');
test('renovaciones concurrentes usan un solo refresh y reemplazan ambos tokens',async()=>{saveTokens({access_token:'old',refresh_token:'first',expires_in:1,refresh_expires_in:3600});refreshes=0;failRefresh=false;const result=await Promise.all(Array.from({length:4},()=>apiData('/inventario')));assert.equal(refreshes,1);assert.ok(result.every(r=>r.ok));assert.equal(getTokens().refresh_token,'rotated');});
test('refresh rechazado elimina la sesión y no reintenta en bucle',async()=>{saveTokens({access_token:'old',refresh_token:'expired',expires_in:1,refresh_expires_in:0});refreshes=0;expired=0;failRefresh=true;await assert.rejects(()=>apiData('/inventario'));assert.equal(getTokens(),null);assert.equal(refreshes,1);assert.equal(expired,1);});
