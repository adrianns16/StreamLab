'use strict';
const $=id=>document.getElementById(id);const state={songs:[],artist:null,album:null};const fmt=n=>Math.round(n).toLocaleString('es-EC');const msg=(id,s)=>$(id).textContent=s;const local=d=>new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);$('start').value=local(new Date(Date.now()-7*86400000));$('end').value=local(new Date());
let artistRequest=0,albumRequest=0;
const Spotify=window.StreamLabSpotify;
let catalogReady=false;
function setSpotifyStatus(message,ready=false){
  catalogReady=ready;msg('spotifyStatus',message);
  $('disconnectSpotify').classList.toggle('hidden',!Spotify.hasSession());
  $('findArtists').disabled=!ready;
}
async function checkSpotify(){
  if(!Spotify.hasSession()){setSpotifyStatus('Conecta tu cuenta para buscar artistas y obtener enlaces exactos.');return}
  setSpotifyStatus('Comprobando acceso al catálogo de Spotify…');
  try{const user=await Spotify.verify();setSpotifyStatus('Conectado: '+user.name+' · Catálogo disponible'+(user.product?' · '+user.product:''),true)}
  catch(error){setSpotifyStatus(error.message+' Puedes reconectar con la cuenta autorizada.');}
}
$('connectSpotify').onclick=()=>Spotify.connect().catch(error=>setSpotifyStatus(error.message));
$('disconnectSpotify').onclick=()=>{Spotify.clear();setSpotifyStatus('Sesión desconectada. Puedes volver a conectar otra cuenta.');};
Spotify.callback().then(checkSpotify).catch(error=>{setSpotifyStatus(error.message);});
function spotify(value){const s=value.trim();if(!s)return null;let m=s.match(/^spotify:(track|album):([a-zA-Z0-9]{22})$/);if(!m)m=s.match(/^https:\/\/(?:open\.)?spotify\.com\/(?:intl-[a-z]{2}\/)?(track|album)\/([a-zA-Z0-9]{22})(?:[/?#].*)?$/i);if(!m)throw Error('Pega un enlace de canción o álbum de open.spotify.com.');return {type:m[1].toLowerCase(),id:m[2],url:`https://open.spotify.com/${m[1].toLowerCase()}/${m[2]}`,uri:`spotify:${m[1].toLowerCase()}:${m[2]}`}}
function el(tag,className,text){const n=document.createElement(tag);if(className)n.className=className;if(text!=null)n.textContent=text;return n}
function item(container,title,detail,art,action,label){const row=el('div','result'),info=el('div','result-info');if(art){const img=el('img');img.src=art;img.alt='';img.loading='lazy';row.appendChild(img)}info.append(el('strong','',title),el('small','',detail));const b=el('button','secondary',label);b.type='button';b.onclick=action;row.append(info,b);container.append(row)}
function spotifyTrack(x,album){
  return {artist:(x.artists||[]).map(a=>a.name).join(', '),album:album?.name||x.album?.name||'',track:x.name||'',duration:Math.round((x.duration_ms||0)/1000),uri:x.uri||'spotify:track:'+x.id,art:album?.images?.[0]?.url||x.album?.images?.[0]?.url||'',source:'Spotify'};
}
async function pages(path){
  const items=[];let next=path;
  while(next){const data=await Spotify.api(next);items.push(...(data.items||[]));next=data.next?new URL(data.next).pathname.replace(/^\/v1/,'/')+new URL(data.next).search:null;if(items.length>1000)break}
  return items;
}
const Core = window.StreamLabCore;
let linkIndex = -1, undoSongs = null;
const options = () => ({mode: ($('repeatTotal').checked?'total':'perSong'), total: $('totalPlays').value, start: $('start').value, end: $('end').value});
// Remove drafts written by earlier versions. Each new visit starts with an empty selection.
try { localStorage.removeItem('streamlab.draft.v1'); } catch {}
function addSong(s) {
  if (!s.track || !s.artist) throw Error('La canción necesita título y artista.');
  if (state.songs.some(x => s.uri && x.uri ? x.uri === s.uri : x.track === s.track && x.artist === s.artist && x.album === s.album)) {
    msg('searchMessage','«'+s.track+'» ya está en tu selección. Puedes ajustar sus reproducciones.'); return;
  }
  if (state.songs.length >= 500) { msg('searchMessage','La selección admite hasta 500 canciones.'); return; }
  state.songs.push({...s,plays:Number($('plays').value)||10});
  renderQueue(); msg('searchMessage','«'+s.track+'» añadida.');
}
function renderQueue() {
  const box=$('queue'), allocated=Core.counts(state.songs,($('repeatTotal').checked?'total':'perSong'),$('totalPlays').value);
  box.replaceChildren();
  if (!state.songs.length) box.append(el('p','muted','Agrega canciones para empezar.'));
  state.songs.forEach((s,i)=>{
    const row=el('div','queue-item');
    if(s.art){const img=el('img');img.src=s.art;img.alt='';img.loading='lazy';row.append(img)}
    const info=el('div','queue-info');
    info.append(el('strong','',s.track),el('small','',s.artist+' · '+(s.album||'Sin álbum')+' · '+Math.floor(s.duration/60)+':'+String(s.duration%60).padStart(2,'0')+(s.durationEstimated?' · duración estimada':'')));
    const input=el('input');input.type='number';input.min='1';input.max=String(Core.MAX_RECORDS);input.value=allocated[i];input.disabled=$('repeatTotal').checked;input.setAttribute('aria-label','Reproducciones de '+s.track);
    input.addEventListener('input',()=>{s.plays=Number(input.value);renderTotals()});
    const remove=el('button','','Quitar');remove.type='button';remove.setAttribute('aria-label','Quitar '+s.track);remove.onclick=()=>{undoSongs=[...state.songs];state.songs.splice(i,1);renderQueue()};
    const link=el('button','',s.uri?'Revisar / enlace':'Añadir enlace');link.type='button';link.setAttribute('aria-label','Asignar enlace de Spotify a '+s.track);
    link.onclick=()=>{linkIndex=i;msg('linkSong',s.track+' · '+s.artist);$('queueUri').value=s.uri||'';for(const [id,key] of [['editTrack','track'],['editArtist','artist'],['editAlbum','album'],['editDuration','duration']])$(id).value=s[key]||'';msg('linkError','');$('linkDialog').showModal();$('queueUri').focus()};
    const actions=el('div','queue-actions');actions.append(link,remove);row.append(info,input,actions);box.append(row);
  });
  $('queueCount').textContent=state.songs.length;
  $('undoQueue').classList.toggle('hidden',!undoSongs);
  renderTotals();
}
function renderTotals() {
  const report=Core.inspect(state.songs,options());
  $('estimatePlays').textContent=Number.isFinite(report.total)?fmt(report.total):'—';
  $('estimateMinutes').textContent=Number.isFinite(report.milliseconds)?fmt(report.milliseconds/60000):'—';
  const hours=Number($('dailyHours').value), days=$('daysEstimate');
  let recommended=0;
  if(!state.songs.length || !Number.isFinite(report.milliseconds) || report.milliseconds<=0 || !Number.isInteger(report.total) || report.total<1 || report.total>Core.MAX_RECORDS || report.allocated.some(n=>!Number.isInteger(n)||n<1)){
    days.textContent='Añade canciones con duraciones válidas para calcular el plazo.';
  } else if(!Number.isInteger(hours) || hours<1 || hours>24){
    days.textContent='Elige entre 1 y 24 horas por día.';
  } else {
    const plan=Core.planDays(report.milliseconds,hours);recommended=plan.recommended;
    days.textContent=`Mínimo continuo: ${fmt(plan.minimum)} ${plan.minimum===1?'día':'días'} a 24 h/día. Recomendado: ${fmt(recommended)} ${recommended===1?'día':'días'} a ${hours} h/día, unos ${fmt(report.total/recommended)} registros diarios. El JSON distribuye las fechas durante todo el período; esto no garantiza aceptación en stats.fm.`;
  }
  $('applyDays').disabled=!recommended;
  const bytes=Core.estimateBytes(state.songs,options());
  $('estimateSize').textContent='Tamaño aproximado: '+(bytes/1024).toLocaleString('es-EC',{maximumFractionDigits:1})+' KB · JSON compacto · Horas: '+(report.milliseconds/3600000||0).toLocaleString('es-EC',{maximumFractionDigits:1});
  $('download').disabled=report.issues.length>0;
  $('preview').disabled=report.issues.length>0;
  $('jsonPreview').classList.add('hidden');
  const list=$('validationList');list.replaceChildren();
  if(!report.issues.length)list.append(el('li','ready','Todo listo: enlaces, cantidades y período revisados.'));
  else for(const issue of report.issues.slice(0,8))list.append(el('li','',issue));
  const estimated=state.songs.filter(song=>song.durationEstimated).length;
  if(report.issues.length>8)list.append(el('li','',`Y ${report.issues.length-8} avisos más. Revisa las canciones de la lista.`));
  msg('generateMessage','');
}
const undo=el('button','text-btn hidden','Deshacer');undo.id='undoQueue';undo.type='button';undo.onclick=()=>{if(undoSongs){state.songs=undoSongs;undoSongs=null;renderQueue()}};$('clearQueue').before(undo);
$('linkForm').onsubmit=e=>{e.preventDefault();try{const parsed=spotify($('queueUri').value);if(!parsed||parsed.type!=='track')throw Error('Pega el enlace de una canción, no de un álbum.');if(state.songs.some((s,i)=>i!==linkIndex&&s.uri===parsed.uri))throw Error('Este enlace ya está asignado a otra canción de tu selección.');Object.assign(state.songs[linkIndex],{uri:parsed.uri,track:$('editTrack').value.trim(),artist:$('editArtist').value.trim(),album:$('editAlbum').value.trim(),duration:Number($('editDuration').value),durationEstimated:false});$('linkDialog').close();renderQueue()}catch(error){msg('linkError',error.message)}};
$('closeLink').onclick=()=>$('linkDialog').close();
$('repeatTotal').onchange=()=>{$('totalControl').classList.toggle('hidden',!$('repeatTotal').checked);$('perSongControl').classList.toggle('hidden',$('repeatTotal').checked);renderQueue()};
$('totalPlays').addEventListener('input',renderQueue);
$('dailyHours').addEventListener('input',renderTotals);
$('applyDays').onclick=()=>{const report=Core.inspect(state.songs,options()),hours=Number($('dailyHours').value);try{if(!Number.isInteger(report.total)||report.total<1||report.total>Core.MAX_RECORDS||report.allocated.some(n=>!Number.isInteger(n)||n<1))throw Error('Revisa la cantidad de reproducciones.');const days=Core.planDays(report.milliseconds,hours).recommended;if(!days)throw Error('Añade canciones con duración válida.');const now=new Date();$('end').value=local(now);$('start').value=local(new Date(now.getTime()-days*86400000));renderTotals()}catch(error){msg('generateMessage',error.message)}};
for(const id of ['start','end'])$(id).addEventListener('input',renderTotals);
document.querySelectorAll('[data-days]').forEach(button=>button.onclick=()=>{$('end').value=local(new Date());$('start').value=local(new Date(Date.now()-Number(button.dataset.days)*86400000));renderTotals()});

$('plays').addEventListener('change',()=>{const n=Number($('plays').value);if(!Number.isInteger(n)||n<1||n>Core.MAX_RECORDS){msg('generateMessage','Introduce de 1 a 30.000 reproducciones.');return}state.songs.forEach(s=>s.plays=n);renderQueue()});$('clearQueue').onclick=()=>{undoSongs=state.songs.length?[...state.songs]:undoSongs;state.songs=[];renderQueue()};document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('selected',t===b));for(const mode of ['search','link'])$(mode+'Pane').classList.toggle('hidden',mode!==b.dataset.mode);msg('searchMessage','')});
$('findArtists').onclick=async()=>{
 const name=$('artistSearch').value.trim();if(name.length<2){msg('searchMessage','Escribe al menos dos letras del artista.');return}
 const request=++artistRequest;albumRequest++;msg('searchMessage','Buscando artistas en Spotify…');$('artistResults').replaceChildren();$('albumSelect').disabled=true;$('trackResults').replaceChildren();
 try{const data=await Spotify.api('/search?'+new URLSearchParams({q:name,type:'artist',limit:'20'}));if(request!==artistRequest)return;const artists=data.artists?.items||[];if(!artists.length)throw Error('No encontré artistas. Prueba otro nombre.');for(const x of artists)item($('artistResults'),x.name,x.genres?.slice(0,2).join(' · ')||'Spotify',x.images?.[0]?.url,()=>chooseArtist(x),'Elegir');msg('searchMessage',artists.length+' artistas encontrados en Spotify.')}
 catch(error){msg('searchMessage',error.message)}
};
$('artistSearch').addEventListener('keydown',e=>{if(e.key==='Enter')$('findArtists').click()});
async function chooseArtist(x){
 const request=++artistRequest;albumRequest++;state.artist=x;state.album=null;$('artistResults').replaceChildren(el('p','muted','Artista: '+x.name));$('albumSelect').replaceChildren(new Option('Cargando álbumes…',''));$('albumSelect').disabled=true;$('trackResults').replaceChildren();msg('searchMessage','Buscando álbumes en Spotify…');
 try{const albums=await pages('/artists/'+encodeURIComponent(x.id)+'/albums?'+new URLSearchParams({include_groups:'album,single',limit:'50'}));if(request!==artistRequest)return;const seen=new Set();$('albumSelect').replaceChildren(new Option('Elige un álbum',''));for(const album of albums){if(seen.has(album.id))continue;seen.add(album.id);$('albumSelect').add(new Option(album.name+(album.release_date?' · '+album.release_date.slice(0,4):''),album.id))}if(!seen.size)throw Error('Spotify no devolvió álbumes de este artista.');$('albumSelect').disabled=false;msg('searchMessage',seen.size+' álbumes disponibles.')}
 catch(error){msg('searchMessage',error.message)}
}
async function showAlbum(id,box=$('trackResults')){
 const request=++albumRequest;box.replaceChildren();msg('searchMessage','Cargando canciones y enlaces exactos…');
 try{
  const album=await Spotify.api('/albums/'+encodeURIComponent(id));const tracks=await pages('/albums/'+encodeURIComponent(id)+'/tracks?limit=50');if(request!==albumRequest)return;
  if(!tracks.length)throw Error('Spotify no devolvió canciones de este álbum.');state.album=album;
  const all=el('button','add','+ Agregar todo el álbum');all.type='button';all.onclick=()=>{let added=0;for(const track of tracks){const length=state.songs.length;addSong(spotifyTrack(track,album));if(state.songs.length>length)added++}msg('searchMessage',added+' canciones añadidas con su enlace exacto de Spotify.')};box.append(all);
  for(const track of tracks)item(box,track.name,(track.artists||[]).map(x=>x.name).join(', ')+' · '+Math.round(track.duration_ms/60000)+' min · Spotify',album.images?.[0]?.url,()=>addSong(spotifyTrack(track,album)),'+ Añadir');
  msg('searchMessage',tracks.length+' canciones encontradas en Spotify. Enlaces exactos listos.');
 }catch(error){msg('searchMessage',error.message)}
}
$('albumSelect').onchange=()=>{if($('albumSelect').value)showAlbum($('albumSelect').value)};
$('manualPane').onsubmit=e=>{e.preventDefault();try{const p=spotify($('manualUri').value);if(!p||p.type!=='track')throw Error('Para una canción, pega un enlace de canción.');addSong({artist:$('manualArtist').value.trim(),album:$('manualAlbum').value.trim(),track:$('manualTrack').value.trim(),duration:Number($('manualDuration').value),uri:p?.uri||null,art:'',source:'manual'});$('manualTrack').value='';$('manualUri').value='';$('spotifyUrl').value='';$('manualPane').classList.add('hidden')}catch(err){msg('searchMessage',err.message)}};
$('resolveUrl').onclick=async()=>{
 let p;try{p=spotify($('spotifyUrl').value);if(!p)throw Error('Pega un enlace de Spotify.')}catch(error){msg('searchMessage',error.message);return}
 const box=$('linkResult');box.replaceChildren();$('manualPane').classList.add('hidden');$('verifySpotify').href=p.url;msg('searchMessage','Leyendo el enlace en Spotify…');
 try{
  if(p.type==='album'){await showAlbum(p.id,box);return}
  const track=await Spotify.api('/tracks/'+p.id);const song=spotifyTrack(track);item(box,song.track,song.artist+' · '+song.album+' · Spotify',song.art,()=>addSong(song),'+ Añadir');msg('searchMessage','Canción y enlace exacto obtenidos de Spotify. Pulsa «+ Añadir».');
 }catch(error){
  if(p.type==='track'){
   $('manualArtist').value='';$('manualAlbum').value='';$('manualTrack').value='';$('manualDuration').value='';$('manualUri').value=p.url;$('manualPane').classList.remove('hidden');
   msg('searchMessage',error.message+' Puedes introducir manualmente el artista, título y duración de esta canción.');
  }else msg('searchMessage',error.message+' Para cargar todas las canciones de un álbum debes disponer de acceso al catálogo de Spotify.');
 }
};
function cleanFilename(name){return Core.cleanFilename(name)}
$('download').onclick=()=>{
  try {
    const records=Core.generate(state.songs,options());
    const blob=new Blob([JSON.stringify(records)],{type:'application/json'}),url=URL.createObjectURL(blob);
    const a=el('a');a.href=url;a.download=cleanFilename($('filename').value);document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
    msg('generateMessage','Descargado: '+fmt(records.length)+' registros simulados · '+(blob.size/1024).toFixed(1)+' KB.');
  } catch(error){msg('generateMessage',error.message)}
};
$('preview').onclick=()=>{try{$('jsonPreview').textContent=JSON.stringify(Core.generate(state.songs,options()).slice(0,3),null,2);$('jsonPreview').classList.remove('hidden')}catch(error){msg('generateMessage',error.message)}};
// Keep request responses from overwriting a newer selection: while resolving, disable its button.
for(const id of ['findArtists','resolveUrl']) {
  const button=$(id), action=button.onclick;
  button.onclick=async()=>{button.disabled=true;button.setAttribute('aria-busy','true');try{await action()}finally{button.disabled=false;button.removeAttribute('aria-busy')}};
}
renderQueue();

