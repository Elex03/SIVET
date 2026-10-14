// Credentials are supplied via stdin and are never written to disk or logged.
async function main() {
  let input='';for await(const chunk of process.stdin)input+=chunk;
  const accounts=JSON.parse(input);
  for(const account of accounts) {
    const login=await fetch('https://sivet-backend-n8fv.onrender.com/api/v1/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(account)});
    const body=await login.json();if(!login.ok){console.log(account.username,'LOGIN',login.status,body.message);continue;}
    const headers={Authorization:'Bearer '+body.data.access_token};
    const me=await fetch('https://sivet-backend-n8fv.onrender.com/api/v1/auth/me',{headers});const profile=(await me.json()).data;
    console.log(account.username,'PROFILE',me.status,profile?.rol);
    for(const path of profile?.rol==='PREPARADOR'?['/solicitudes']:['/medicamentos','/inventario','/solicitudes','/movimientos','/notificaciones','/actividad',...(profile?.rol==='ADMIN'||profile?.rol==='BODEGA'?['/recepciones']:[])]) {
      const response=await fetch('https://sivet-backend-n8fv.onrender.com/api/v1'+path+'?limit=1',{headers});const data=await response.json();console.log(path,response.status,'total',data.total,'fields',data.data?.[0]?Object.keys(data.data[0]).join(','):'empty');
      if(path==='/solicitudes'&&data.data?.length){const detail=await fetch('https://sivet-backend-n8fv.onrender.com/api/v1/solicitudes/'+data.data[0].id_solicitud,{headers});const d=(await detail.json()).data;console.log('request detail',detail.status,'fields',Object.keys(d||{}).join(','),'preparation',JSON.stringify(d?.preparaciones?.map(p=>({state:p.estado,cycle:p.ciclo,details:p.detalles?.length}))));}
    }
    await fetch('https://sivet-backend-n8fv.onrender.com/api/v1/auth/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refresh_token:body.data.refresh_token})});
  }
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
