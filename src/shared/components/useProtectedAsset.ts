import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
export default function useProtectedAsset(source?:string) {
  const [asset,setAsset]=useState<{source?:string;url:string;mime:string;error:boolean}>({url:'',mime:'',error:false});
  useEffect(()=>{
    if(!source?.startsWith('api:'))return;
    const controller=new AbortController();let url='';
    void apiClient.get<Blob>(source.slice(4),{responseType:'blob',signal:controller.signal}).then(response=>{url=URL.createObjectURL(response.data);setAsset({source,url,mime:response.data.type,error:false});}).catch(()=>{if(!controller.signal.aborted)setAsset({source,url:'',mime:'',error:true});});
    return()=>{controller.abort();if(url)URL.revokeObjectURL(url);};
  },[source]);
  return source?.startsWith('api:') ? asset.source===source?asset:{url:'',mime:'',error:false} : {url:source || '',mime:'',error:false};
}
