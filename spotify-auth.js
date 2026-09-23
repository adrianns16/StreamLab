'use strict';
window.StreamLabSpotify=(()=>{
  const clientId=window.STREAMLAB_SPOTIFY_CLIENT_ID||'';
  const redirectUri=new URL('generator.html',location.href).href.split(/[?#]/)[0];
  const tokenKey='streamlab.spotify.pkce.token.v2';
  const pendingKey='streamlab.spotify.pkce.pending.v2';
  let token=null,refreshing=null;
  try{token=JSON.parse(sessionStorage.getItem(tokenKey)||'null')}catch{sessionStorage.removeItem(tokenKey)}
  function clear(){token=null;refreshing=null;sessionStorage.removeItem(tokenKey);sessionStorage.removeItem(pendingKey)}
  const b64=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
  async function connect(){
    if(!clientId)throw Error('Falta el Client ID de Spotify.');
    if(!crypto.subtle)throw Error('Abre la web por HTTPS. Spotify necesita una conexión segura.');
    const verifier=b64(crypto.getRandomValues(new Uint8Array(64))),state=b64(crypto.getRandomValues(new Uint8Array(24)));
    const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier));
    sessionStorage.setItem(pendingKey,JSON.stringify({verifier,state,redirectUri,created:Date.now()}));
    const url=new URL('https://accounts.spotify.com/authorize');
    url.search=new URLSearchParams({response_type:'code',client_id:clientId,redirect_uri:redirectUri,code_challenge_method:'S256',code_challenge:b64(new Uint8Array(digest)),state,scope:'user-read-private',show_dialog:'true'}).toString();
    location.assign(url.href);
  }
  async function tokenRequest(fields){
    const res=await fetch('https://accounts.spotify.com/api/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:clientId,...fields})});
    if(!res.ok)throw Error(`Spotify rechazó la autorización (${res.status}). Comprueba el Client ID y la Redirect URI exacta: ${redirectUri}`);
    const data=await res.json();
    if(!data.access_token)throw Error('Spotify no devolvió un token de acceso.');
    token={access:data.access_token,refresh:data.refresh_token||token?.refresh||null,expires:Date.now()+Math.max(1,Number(data.expires_in)-60)*1000};
    sessionStorage.setItem(tokenKey,JSON.stringify(token));
  }
  async function callback(){
    const url=new URL(location.href),code=url.searchParams.get('code'),error=url.searchParams.get('error');
    if(!code&&!error)return false;
    const state=url.searchParams.get('state');
    for(const param of ['code','state','error'])url.searchParams.delete(param);
    history.replaceState(null,'',url);
    const saved=sessionStorage.getItem(pendingKey);sessionStorage.removeItem(pendingKey);
    if(error)throw Error('Spotify no autorizó la conexión: '+error);
    let pending;try{pending=JSON.parse(saved)}catch{}
    if(!pending||pending.state!==state||pending.redirectUri!==redirectUri||Date.now()-pending.created>600000)throw Error('La respuesta de Spotify no coincide con este inicio de sesión. Vuelve a conectar.');
    await tokenRequest({grant_type:'authorization_code',code,redirect_uri:redirectUri,code_verifier:pending.verifier});
    return true;
  }
  async function getAccess(){
    if(!token)return null;
    if(Date.now()<token.expires)return token.access;
    if(!token.refresh){clear();return null}
    if(!refreshing)refreshing=tokenRequest({grant_type:'refresh_token',refresh_token:token.refresh}).catch(error=>{clear();throw error}).finally(()=>{refreshing=null});
    await refreshing;return token.access;
  }
  function fail(status,detail,path){
    const endpoint=new URL('https://api.spotify.com/v1'+path).pathname.replace('/v1','');
    const error=new Error(status===403?`Spotify devolvió 403 en ${endpoint}: autorizaste StreamLab, pero Spotify bloqueó esta consulta. En la app del Client ID ${clientId}, comprueba que la cuenta que acabas de elegir esté añadida en Settings → Users Management con su correo exacto y que la cuenta propietaria tenga Premium. Después desconecta y vuelve a conectar.${detail?' Respuesta de Spotify: '+detail:''}`:status===429?'Spotify limitó temporalmente las consultas (429). Espera y vuelve a probar.':status===401?'La sesión de Spotify caducó (401). Vuelve a conectar.':`Spotify devolvió ${status} en ${endpoint}${detail?': '+detail:''}.`);
    error.status=status;error.endpoint=endpoint;return error;
  }
  async function api(path){
    let access=await getAccess();
    if(!access)throw Error('Conecta Spotify para buscar en su catálogo.');
    const query=async bearer=>fetch('https://api.spotify.com/v1'+path,{headers:{Authorization:'Bearer '+bearer}});
    let res=await query(access);
    if(res.status===401&&token?.refresh){token.expires=0;access=await getAccess();if(access)res=await query(access)}
    if(!res.ok){let detail='';try{detail=(await res.json()).error?.message||''}catch{}if(res.status===401)clear();throw fail(res.status,detail,path)}
    return res.json();
  }
  async function verify(){
    const profile=await api('/me');
    // A valid OAuth login alone is insufficient: a development-mode user may still see 403.
    await api('/search?'+new URLSearchParams({q:'music',type:'artist',limit:'1'}));
    return {name:profile.display_name||profile.id||'Cuenta Spotify',product:profile.product||''};
  }
  return {connect,callback,api,verify,clear,hasSession:()=>Boolean(token),redirectUri,clientId};
})();
