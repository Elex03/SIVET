const assert=require('node:assert/strict');const fs=require('node:fs');const ts=require('typescript');const {test}=require('node:test');const axios=require('axios');
const storage=new Map();let expired=0;global.sessionStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};global.window={dispatchEvent:event=>{if(event.type==='sivet-session-expired')expired++;}};
require.extensions['.ts']=(module,filename)=>{const source=fs.readFileSync(filename,'utf8').replaceAll('import.meta.env.VITE_API_URL',"'http://api.test/api/v1'").replaceAll('import.meta.env.BASE_URL',"'/'");module._compile(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,filename);};
let refreshes=0;let failRefresh=false;let mode='';let rateCalls=0;const sent=[];
axios.defaults.adapter=async config=>{
  const response={status:200,statusText:'OK',config,headers:{},data:{data:{ok:true}}};
  sent.push({url:config.url,time:Date.now(),timeout:config.timeout});
  if(config.url==='/auth/refresh' && mode==='refresh429'){refreshes++;throw new axios.AxiosError('Limited','ERR_BAD_RESPONSE',config,null,{...response,status:429,headers:{'retry-after':'0'},data:{error:{retryAfterSeconds:0}}});}
  if(config.url==='/auth/refresh'){refreshes++;await new Promise(resolve=>setTimeout(resolve,10));if(failRefresh)throw new axios.AxiosError('Expired','ERR_BAD_REQUEST',config,null,{...response,status:401});return {...response,data:{data:{access_token:'new',refresh_token:'rotated',expires_in:60,refresh_expires_in:3600}}};}
  if(config.headers.get('Authorization')!=='Bearer new')throw new axios.AxiosError('Expired','ERR_BAD_REQUEST',config,null,{...response,status:401});
  if(config.url.startsWith('/rate/')){
    rateCalls++;
    if(mode==='always429' || (mode==='once429' && rateCalls===1) || mode==='gate429')throw new axios.AxiosError('Limited','ERR_BAD_RESPONSE',config,null,{...response,status:429,headers:{'retry-after':mode==='gate429'?'0.03':'0','x-request-id':'REQ-429'},data:{error:{message:'Límite de solicitudes',retryAfterSeconds:0}}});
  }
  if(config.method==='delete' && config.url==='/medicamentos/1')return {...response,status:204,data:''};
  return response;
};
const {apiData}=require('../src/shared/api/client.ts');const {saveTokens,getTokens}=require('../src/shared/api/session.ts');
test('DELETE de medicamento acepta 204 sin exigir un cuerpo data',async()=>{saveTokens({access_token:'new',refresh_token:'first',expires_in:60,refresh_expires_in:3600});assert.equal(await apiData('/medicamentos/1','DELETE'),undefined);});
test('renovaciones concurrentes usan un solo refresh y reemplazan ambos tokens',async()=>{saveTokens({access_token:'old',refresh_token:'first',expires_in:1,refresh_expires_in:3600});refreshes=0;failRefresh=false;const result=await Promise.all(Array.from({length:4},()=>apiData('/inventario')));assert.equal(refreshes,1);assert.ok(result.every(r=>r.ok));assert.equal(getTokens().refresh_token,'rotated');});
test('refresh rechazado elimina la sesión y no reintenta en bucle',async()=>{saveTokens({access_token:'old',refresh_token:'expired',expires_in:1,refresh_expires_in:0});refreshes=0;expired=0;failRefresh=true;await assert.rejects(()=>apiData('/inventario'));assert.equal(getTokens(),null);assert.equal(refreshes,1);assert.equal(expired,1);});
const { retryDelay, pauseApi, waitForApi, cancelApiWaits, getApiPause, getApiDiagnostics, apiStatus } = require('../src/shared/api/apiControl.ts');
const active = () => { mode='';failRefresh=false;rateCalls=0;refreshes=0;saveTokens({access_token:'new',refresh_token:'first',expires_in:60,refresh_expires_in:3600}); };
test('Retry-After acepta segundos, fecha HTTP y respaldo del cuerpo', () => {
  const now=Date.parse('2026-11-02T12:00:00Z');
  assert.equal(retryDelay('3',99,now),3000);
  assert.equal(retryDelay('Mon, 02 Nov 2026 12:00:05 GMT',99,now),5000);
  assert.equal(retryDelay('invalid',2,now),2000);
  assert.equal(retryDelay(undefined,4,now),4000);
});
test('GET limitado se reintenta como máximo dos veces sin refrescar ni cerrar sesión', async () => {
  active(); mode='once429';
  assert.ok((await apiData('/rate/read')).ok); assert.equal(rateCalls,2);
  rateCalls=0; mode='always429'; const before=expired;
  await assert.rejects(()=>apiData('/rate/read'),e=>apiStatus(e)===429);
  assert.equal(rateCalls,3);assert.equal(refreshes,0);assert.equal(expired,before);assert.ok(getTokens());
});
test('POST 429 no se repite y el diagnóstico guarda solo metadatos sin query ni cuerpo', async () => {
  active();mode='always429';
  await assert.rejects(()=>apiData('/rate/write?secret=do-not-log','POST',{password:'do-not-log'}));
  assert.equal(rateCalls,1);assert.equal(refreshes,0);
  const entry=getApiDiagnostics().at(-1);
  assert.equal(entry.path,'/rate/write');assert.equal(entry.method,'POST');assert.equal(entry.status,429);assert.equal(entry.requestId,'REQ-429');
  assert.equal(JSON.stringify(getApiDiagnostics()).includes('do-not-log'),false);
});
test('una pausa compartida frena también las siguientes llamadas concurrentes', async () => {
  active();mode='gate429';await assert.rejects(()=>apiData('/rate/start','POST'));
  const until=getApiPause().until;mode='';const start=sent.length;
  await Promise.all([apiData('/one'),apiData('/two')]);
  assert.ok(sent.slice(start).every(r=>r.time>=until));
});
test('429 durante refresh conserva los tokens y permite renovar después', async () => {
  active();saveTokens({access_token:'old',refresh_token:'first',expires_in:1,refresh_expires_in:3600});mode='refresh429';const before=expired;
  await assert.rejects(()=>apiData('/inventario'),e=>apiStatus(e)===429);
  assert.equal(expired,before);assert.equal(getTokens().refresh_token,'first');
  mode='';assert.ok((await apiData('/inventario')).ok);assert.equal(getTokens().access_token,'new');
});
test('una espera puede cancelarse con señal o globalmente sin enviar la solicitud', async () => {
  active();pauseApi('1',0);const controller=new AbortController();const before=sent.length;
  const request=apiData('/cancelled','GET',undefined,{signal:controller.signal});controller.abort();
  await assert.rejects(()=>request,e=>axios.isCancel(e));assert.equal(sent.length,before);
  const waiting=waitForApi();assert.equal(getApiPause().waiting,1);cancelApiWaits();
  await assert.rejects(()=>waiting,e=>axios.isCancel(e));assert.equal(getApiPause().waiting,0);
});

test('errores indican recurso, conflicto y referencia sin incluir cuerpo enviado', () => {
  const { apiErrorMessage } = require('../src/shared/api/apiErrors.ts');
  const config={method:'post',url:'/lotes/resolver?private=secret',data:{password:'secret'}};
  const error=new axios.AxiosError('Rejected','ERR_BAD_RESPONSE',config,null,{status:409,headers:{'x-request-id':'REQ-123'},data:{error:{code:'LOT_CONFLICT',message:'Fecha incompatible.'}}});
  const message=apiErrorMessage(error);
  assert.match(message,/los lotes/);assert.match(message,/vencimiento/);assert.match(message,/Fecha incompatible/);assert.match(message,/REQ-123/);assert.doesNotMatch(message,/secret/);
});

test('timeout de escritura pide reconciliar y timeout de lectura explica inicio del servidor', () => {
  const { apiErrorMessage } = require('../src/shared/api/apiErrors.ts');
  assert.match(apiErrorMessage(new axios.AxiosError('timeout','ECONNABORTED',{method:'post',url:'/recepciones/borradores'})),/Comprueba el estado del registro/);
  assert.match(apiErrorMessage(new axios.AxiosError('timeout','ECONNABORTED',{method:'get',url:'/inventario'})),/Puede estar iniciándose/);
});

test('aviso lento distingue consultas y guardados y se limpia al terminar', () => {
  const vm=require('node:vm');const scheduled=[];let snapshot;
  const module={exports:{}};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/shared/api/apiActivity.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,require:()=>({useSyncExternalStore:(_,get)=>{snapshot=get();return snapshot;}}),setTimeout:fn=>{scheduled.push(fn);return scheduled.length;},clearTimeout:()=>{}});
  const {startRequest,finishRequest,useApiActivity}=module.exports;
  const read={method:'get',url:'/inventario'},write={method:'post',url:'/recepciones/borradores'};
  startRequest(read);assert.equal(useApiActivity().slow,false);scheduled[0]();assert.equal(useApiActivity().slow,true);assert.equal(snapshot.saving,false);
  startRequest(write);scheduled[1]();assert.equal(useApiActivity().saving,true);
  finishRequest(write);assert.equal(useApiActivity().saving,false);assert.equal(snapshot.slow,true);
  finishRequest(read);assert.equal(useApiActivity().slow,false);
});

test('LOT_EXPIRED conserva mensaje y no recomienda recarga por concurrencia',()=>{
  const {apiErrorMessage}=require('../src/shared/api/apiErrors.ts');
  const error=new axios.AxiosError('expired','ERR_BAD_RESPONSE',{method:'post',url:'/recepciones/3/confirmar'},null,{status:409,headers:{},data:{error:{code:'LOT_EXPIRED',message:'El lote ABC venció el 2020-01-01.'}}});
  const message=apiErrorMessage(error);assert.match(message,/ABC/);assert.match(message,/vencimiento|fechas/);assert.doesNotMatch(message,/Actualiza el registro|entraron en conflicto/);
});

test('lecturas, confirmación y renovación de sesión esperan sin corte de Axios', async () => {
  active(); sent.length=0;
  await apiData('/inventario');
  await apiData('/recepciones/3/confirmar','POST',{version:6});
  saveTokens({access_token:'old',refresh_token:'first',expires_in:1,refresh_expires_in:3600});
  await apiData('/inventario');
  assert.ok(sent.some(r=>r.url==='/auth/refresh'));
  assert.ok(sent.some(r=>r.url==='/recepciones/3/confirmar'));
  assert.ok(sent.every(r=>r.timeout===0));
});