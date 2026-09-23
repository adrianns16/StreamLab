'use strict';
const $=id=>document.getElementById(id);const state={songs:[],artist:null,album:null};const fmt=n=>Math.round(n).toLocaleString('es-EC');const msg=(id,s)=>$(id).textContent=s;const local=d=>new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);$('start').value=local(new Date(Date.now()-7*86400000));$('end').value=local(new Date());
function api(path){return new Promise((resolve,reject)=>{const cb='slcb_'+Math.random().toString(36).slice(2),script=document.createElement('script');let done=false;const finish=(err,data)=>{if(done)return;done=true;clearTimeout(timer);script.remove();delete window[cb];err?reject(err):resolve(data)};window[cb]=d=>finish(null,d);script.src='https://itunes.apple.com/'+path+(path.includes('?')?'&':'?')+'callback='+cb;script.onerror=()=>finish(Error('No se pudo conectar al catálogo. Revisa tu conexión.'));const timer=setTimeout(()=>finish(Error('La búsqueda tardó demasiado. Prueba de nuevo.')),12000);document.head.appendChild(script)})}
let artistRequest=0,albumRequest=0;
const search=(term,entity,limit=30)=>api('search?media=music&country=US&term='+encodeURIComponent(term)+'&entity='+entity+'&limit='+limit);const lookup=(id,entity)=>api('lookup?id='+encodeURIComponent(id)+'&entity='+entity+'&limit=200');
function spotify(value){const s=value.trim();if(!s)return null;let m=s.match(/^spotify:(track|album):([a-zA-Z0-9]{22})$/);if(!m)m=s.match(/^https:\/\/(?:open\.)?spotify\.com\/(?:intl-[a-z]{2}\/)?(track|album)\/([a-zA-Z0-9]{22})(?:[/?#].*)?$/i);if(!m)throw Error('Pega un enlace de canción o álbum de open.spotify.com.');return {type:m[1].toLowerCase(),id:m[2],url:`https://open.spotify.com/${m[1].toLowerCase()}/${m[2]}`,uri:`spotify:${m[1].toLowerCase()}:${m[2]}`}}
function el(tag,className,text){const n=document.createElement(tag);if(className)n.className=className;if(text!=null)n.textContent=text;return n}
function item(container,title,detail,art,action,label){const row=el('div','result'),info=el('div','result-info');if(art){const img=el('img');img.src=art;img.alt='';img.loading='lazy';row.appendChild(img)}info.append(el('strong','',title),el('small','',detail));const b=el('button','secondary',label);b.type='button';b.onclick=action;row.append(info,b);container.append(row)}
function songFromITunes(x){return {artist:x.artistName||'',album:x.collectionName||'',track:x.trackName||'',duration:Math.round((x.trackTimeMillis||0)/1000),uri:null,art:x.artworkUrl100||'',source:'iTunes'}}
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
  if(estimated)list.append(el('li','',`${estimated} duración(es) estimada(s) desde el historial. Revisa los segundos de cada canción antes de descargar.`));
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

$('plays').addEventListener('change',()=>{const n=Number($('plays').value);if(!Number.isInteger(n)||n<1||n>Core.MAX_RECORDS){msg('generateMessage','Introduce de 1 a 30.000 reproducciones.');return}state.songs.forEach(s=>s.plays=n);renderQueue()});$('clearQueue').onclick=()=>{undoSongs=state.songs.length?[...state.songs]:undoSongs;state.songs=[];renderQueue()};document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('selected',t===b));for(const mode of ['search','link','history'])$(mode+'Pane').classList.toggle('hidden',mode!==b.dataset.mode);msg('searchMessage','')});
$('findArtists').onclick=async()=>{const name=$('artistSearch').value.trim();if(name.length<2){msg('searchMessage','Escribe al menos dos letras del artista.');return}artistRequest++;albumRequest++;msg('searchMessage','Buscando artistas…');$('artistResults').replaceChildren();$('albumSelect').disabled=true;$('trackResults').replaceChildren();try{const data=await search(name,'musicArtist',20),artists=(data.results||[]).filter(x=>x.wrapperType==='artist');if(!artists.length)throw Error('No encontré artistas. Prueba otro nombre.');for(const x of artists)item($('artistResults'),x.artistName,x.primaryGenreName||'Artista',null,()=>chooseArtist(x),'Elegir');msg('searchMessage',artists.length+' artistas encontrados.')}catch(e){msg('searchMessage',e.message)}};$('artistSearch').addEventListener('keydown',e=>{if(e.key==='Enter')$('findArtists').click()});
async function chooseArtist(x){const request=++artistRequest;albumRequest++;state.artist=x;state.album=null;$('artistResults').replaceChildren(el('p','muted','Artista: '+x.artistName));$('albumSelect').replaceChildren(new Option('Cargando álbumes…',''));$('albumSelect').disabled=true;$('trackResults').replaceChildren();msg('searchMessage','Buscando álbumes…');try{const data=await lookup(x.artistId,'album');if(request!==artistRequest)return;const albums=(data.results||[]).filter(a=>a.wrapperType==='collection'&&a.collectionType==='Album'),seen=new Set();$('albumSelect').replaceChildren(new Option('Elige un álbum',''));for(const a of albums){if(seen.has(a.collectionId))continue;seen.add(a.collectionId);$('albumSelect').add(new Option(a.collectionName+(a.releaseDate?' · '+a.releaseDate.slice(0,4):''),a.collectionId))}if(!seen.size)throw Error('No encontré álbumes. Prueba con «Pegar enlace».');$('albumSelect').disabled=false;msg('searchMessage',seen.size+' álbumes disponibles.')}catch(e){msg('searchMessage',e.message)}}
$('albumSelect').onchange=async()=>{const id=$('albumSelect').value,request=++albumRequest;if(!id)return;$('trackResults').replaceChildren();msg('searchMessage','Cargando canciones…');try{const data=await lookup(id,'song');if(request!==albumRequest)return;const songs=(data.results||[]).filter(x=>x.wrapperType==='track'&&x.kind==='song'&&String(x.collectionId)===id);if(!songs.length)throw Error('No encontré canciones de este álbum.');state.album=data.results.find(x=>x.wrapperType==='collection');const all=el('button','add','+ Agregar todo el álbum');all.type='button';all.onclick=()=>{for(const song of songs)addSong(songFromITunes(song));msg('searchMessage',songs.length+' canciones añadidas. Copia los enlaces exactos con el botón «Enlace» de cada canción.')};$('trackResults').append(all);for(const song of songs)item($('trackResults'),song.trackName,(song.artistName||state.artist.artistName)+' · '+Math.round(song.trackTimeMillis/60000)+' min',song.artworkUrl100,()=>addSong(songFromITunes(song)),'+ Añadir');msg('searchMessage',songs.length+' canciones encontradas.')}catch(e){msg('searchMessage',e.message)}};
$('manualPane').onsubmit=e=>{e.preventDefault();try{const p=spotify($('manualUri').value);if(!p||p.type!=='track')throw Error('Para una canción, pega un enlace de canción.');addSong({artist:$('manualArtist').value.trim(),album:$('manualAlbum').value.trim(),track:$('manualTrack').value.trim(),duration:Number($('manualDuration').value),uri:p?.uri||null,art:'',source:'manual'});$('manualTrack').value='';$('manualUri').value='';$('spotifyUrl').value='';$('manualPane').classList.add('hidden')}catch(err){msg('searchMessage',err.message)}};
async function spotifyOembed(p){const response=await fetch('https://open.spotify.com/oembed?url='+encodeURIComponent(p.url));if(!response.ok)throw Error('Spotify no devolvió los datos del enlace.');return response.json()}
$('resolveUrl').onclick=async()=>{let p;try{p=spotify($('spotifyUrl').value);if(!p)throw Error('Pega un enlace de Spotify.')}catch(e){msg('searchMessage',e.message);return}const box=$('linkResult');box.replaceChildren();$('manualPane').classList.add('hidden');$('verifySpotify').href=p.url;msg('searchMessage','Leyendo el enlace…');try{const data=await spotifyOembed(p);const title=(data.title||'').trim();if(!title)throw Error('El enlace no devolvió un título.');if(p.type==='track'){$('manualArtist').value='';$('manualAlbum').value='';$('manualTrack').value=title;$('manualDuration').value='';$('manualUri').value=p.url;$('manualPane').classList.remove('hidden');item(box,title,'Título obtenido del enlace de Spotify. Revisa el artista y la duración.',data.thumbnail_url,()=>{$('manualTrack').focus()},'Revisar');msg('searchMessage','Solo el título viene del enlace. Completa los otros datos o elige una coincidencia correcta de la lista.');try{const r=await search(title,'song',40);const clean=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();const candidates=(r.results||[]).filter(x=>x.kind==='song'&&clean(x.trackName)===clean(title)).slice(0,12);if(candidates.length){box.append(el('p','hint','Posibles coincidencias de otro catálogo. Elige solo si reconoces al artista y álbum.'));for(const c of candidates)item(box,c.trackName,c.artistName+' · '+c.collectionName,c.artworkUrl100,()=>{$('manualArtist').value=c.artistName||'';$('manualAlbum').value=c.collectionName||'';$('manualDuration').value=c.trackTimeMillis?Math.round(c.trackTimeMillis/1000):'';$('manualTrack').value=title;$('manualPane').classList.remove('hidden');msg('searchMessage','Seleccionaste «'+c.trackName+'» de '+c.artistName+'. Confirma que corresponda al enlace de Spotify.');$('manualArtist').focus()},'Usar datos')}}catch{msg('searchMessage','No se cargaron sugerencias. Escribe el artista, el álbum y la duración de la versión enlazada.')}}else{const r=await search(title,'album',20);const albums=(r.results||[]).filter(x=>x.wrapperType==='collection'&&x.collectionName.toLowerCase()===title.toLowerCase());if(!albums.length){item(box,title,'Busca este álbum por artista para seleccionar canciones.',data.thumbnail_url,()=>{$('artistSearch').value=data.author_name||'';document.querySelector('[data-mode="search"]').click();if($('artistSearch').value)$('findArtists').click()},'Buscar');msg('searchMessage','No encontré una coincidencia exacta de este álbum.');return}for(const a of albums.slice(0,8))item(box,a.collectionName,a.artistName,a.artworkUrl100,async()=>{document.querySelector('[data-mode="search"]').click();state.artist={artistId:a.artistId,artistName:a.artistName};$('artistResults').replaceChildren(el('p','muted','Artista: '+a.artistName));await chooseArtist(state.artist);$('albumSelect').value=String(a.collectionId);$('albumSelect').dispatchEvent(new Event('change'))},'Ver canciones');msg('searchMessage','Elige el álbum correcto para ver sus canciones.')}}catch(e){if(p.type==='track'){$('manualArtist').value='';$('manualAlbum').value='';$('manualTrack').value='';$('manualDuration').value='';$('manualUri').value=p.url;$('manualPane').classList.remove('hidden')}msg('searchMessage','No pude completar automáticamente los datos. Escribe el título y artista del enlace antes de añadir. '+e.message)}};
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

// The personal catalog exists only in memory and is never sent to a server.
let historyTracks=[];
function addHistorySongs(songs){
  let added=0;
  for(const song of songs){
    if(state.songs.length>=500)break;
    if(state.songs.some(s=>s.uri===song.uri))continue;
    state.songs.push({...song,plays:Number($('plays').value)||10});added++;
  }
  renderQueue();
  msg('historyMessage',added?`${added} canción(es) añadida(s) con su URI de Spotify. Revisa las duraciones estimadas.`:'No se añadieron canciones nuevas (o llegaste al límite de 500).');
}
function showHistoryAlbum(){
  const artist=$('historyArtist').value,album=$('historyAlbum').value,box=$('historyTracks');
  box.replaceChildren();
  if(!artist||!album)return;
  const tracks=historyTracks.filter(s=>s.artist===artist&&s.album===album).sort((a,b)=>a.track.localeCompare(b.track,'es'));
  if(!tracks.length)return;
  const all=el('button','add',`+ Añadir las ${tracks.length} canciones del álbum`);
  all.type='button';all.onclick=()=>addHistorySongs(tracks);box.append(all);
  for(const track of tracks)item(box,track.track,`${track.artist} · ${track.duration?`${Math.floor(track.duration/60)}:${String(track.duration%60).padStart(2,'0')} aprox.`:'duración pendiente'} · ${track.uri.slice(-7)}`,null,()=>addHistorySongs([track]),'+ Añadir');
}
$('historyArtist').onchange=()=>{
  const artist=$('historyArtist').value,albums=[...new Set(historyTracks.filter(s=>s.artist===artist).map(s=>s.album))].sort((a,b)=>a.localeCompare(b,'es'));
  $('historyAlbum').replaceChildren(new Option('Elige un álbum',''));
  for(const album of albums)$('historyAlbum').add(new Option(album,album));
  $('historyAlbum').disabled=!albums.length;$('historyTracks').replaceChildren();
};
$('historyAlbum').onchange=showHistoryAlbum;
$('historyFiles').onchange=async event=>{
  const files=[...event.target.files],budget={bytes:0},catalog=StreamLabHistory.createCatalog();
  historyTracks=[];$('historyArtist').replaceChildren(new Option('Cargando historial…',''));
  $('historyArtist').disabled=$('historyAlbum').disabled=true;$('historyAlbum').replaceChildren(new Option('Elige un artista',''));
  $('historyTracks').replaceChildren();
  if(!files.length)return;
  $('historyFiles').disabled=true;msg('historyMessage','Leyendo historial en este dispositivo…');
  try{
    if(files.length>100)throw Error('Selecciona hasta 100 archivos por vez.');
    let records=0;
    for(const file of files){
      if(file.size>50*1024*1024)throw Error(`«${file.name}» supera 50 MB.`);
      if(!/\.(json|zip)$/i.test(file.name))throw Error('Selecciona archivos JSON o ZIP.');
      if(/\.json$/i.test(file.name)){
        budget.bytes+=file.size;
        if(budget.bytes>100*1024*1024)throw Error('El conjunto supera 100 MB. Selecciona menos archivos.');
      }
      const entries=/\.zip$/i.test(file.name)?StreamLabZip.jsonEntries(file,budget):(async function*(){yield[file.name,await file.text()]})();
      for await(const [name,content]of entries){
        let rows;try{rows=JSON.parse(content.replace(/^\uFEFF/,''))}catch{throw Error(`«${name}» no es JSON válido.`)}
        if(!Array.isArray(rows)){if(/\.zip$/i.test(file.name))continue;throw Error(`«${name}» no contiene una lista de reproducciones.`)}
        records+=rows.length;
        if(records>1000000)throw Error('El historial supera un millón de registros. Selecciona menos archivos.');
        for(let i=0;i<rows.length;i+=5000){catalog.add(rows.slice(i,i+5000));await new Promise(resolve=>setTimeout(resolve,0))}
      }
    }
    historyTracks=catalog.list();
    if(!historyTracks.length)throw Error('No encontré canciones con URI de Spotify. Usa el historial extendido (endsong.json).');
    $('historyArtist').replaceChildren(new Option('Elige un artista',''));
    for(const artist of [...new Set(historyTracks.map(s=>s.artist))].sort((a,b)=>a.localeCompare(b,'es')))$('historyArtist').add(new Option(artist,artist));
    $('historyArtist').disabled=false;
    msg('historyMessage',`${historyTracks.length} canciones con enlace encontradas en tu historial. Elige artista y álbum.`);
  }catch(error){historyTracks=[];$('historyArtist').replaceChildren(new Option('Carga un historial válido',''));msg('historyMessage',error.message)}
  finally{$('historyFiles').disabled=false;event.target.value=''}
};
$('matchHistoryAlbum').onclick=async()=>{
  if(!historyTracks.length){msg('historyMessage','Primero carga un historial con canciones y URI.');return}
  let album;try{album=spotify($('historyAlbumUrl').value);if(!album||album.type!=='album')throw Error('Pega un enlace de álbum de Spotify.')}catch(error){msg('historyMessage',error.message);return}
  $('matchHistoryAlbum').disabled=true;msg('historyMessage','Buscando ese álbum dentro de tu historial…');
  try{
    const metadata=await spotifyOembed(album),title=StreamLabHistory.norm(metadata.title),artist=StreamLabHistory.norm(metadata.author_name);
    const matches=[...new Map(historyTracks.filter(s=>StreamLabHistory.norm(s.album)===title&&(!artist||StreamLabHistory.norm(s.artist)===artist)).map(s=>[JSON.stringify([s.artist,s.album]),s])).values()];
    if(matches.length===1){
      $('historyArtist').value=matches[0].artist;$('historyArtist').dispatchEvent(new Event('change'));
      $('historyAlbum').value=matches[0].album;showHistoryAlbum();
      msg('historyMessage',`Encontré «${matches[0].album}» de ${matches[0].artist}. Revisa sus canciones y añádelas.`);
    }else if(matches.length>1){
      msg('historyMessage','Hay varios álbumes con ese nombre. Elige el artista y el álbum en los menús para confirmar la versión.');
    }else{
      msg('historyMessage',`No encontré «${metadata.title||'ese álbum'}» de ${metadata.author_name||'ese artista'} en tu historial. Prueba a elegirlo en los menús o pega los enlaces de sus canciones.`);
    }
  }catch(error){msg('historyMessage','No pude leer el título del enlace. Elige artista y álbum en los menús. '+error.message)}
  finally{$('matchHistoryAlbum').disabled=false}
};
