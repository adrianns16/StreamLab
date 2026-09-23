'use strict';
const $=id=>document.getElementById(id);
const fmt=n=>Math.round(n).toLocaleString('es-EC');
const decimal=n=>n.toLocaleString('es-EC',{maximumFractionDigits:1});
const msg=(id,s)=>$(id).textContent=s;
function el(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!=null)node.textContent=text;return node}
const Core=window.StreamLabCore;
let busy=false,lastReport=null;
const pause=()=>new Promise(resolve=>setTimeout(resolve,0));
async function* entries(file,budget){
  if(/\.zip$/i.test(file.name)){yield* StreamLabZip.jsonEntries(file,budget);return}
  if(!/\.json$/i.test(file.name))throw Error('Selecciona archivos .json o .zip.');
  budget.bytes+=file.size;
  if(budget.bytes>100*1024*1024)throw Error('El conjunto supera 100 MB. Analiza menos archivos.');
  yield [file.name,await file.text()];
}
async function analyze(files){
  if(busy||!files.length)return;
  if(files.length>100){msg('fileMessage','Selecciona hasta 100 archivos por análisis.');return}
  busy=true;lastReport=null;$('fileSummary').classList.add('hidden');$('historyFiles').disabled=true;$('dedupe').disabled=true;
  const progress=$('readProgress');progress.classList.remove('hidden');progress.max=files.length;progress.value=0;
  const a=Core.accumulator(),budget={bytes:0},dedupe=$('dedupe').checked;let entryCount=0;
  try{
    for(const file of files){
      if(file.size>50*1024*1024)throw Error('«'+file.name+'» supera 50 MB.');
      for await(const [name,content]of entries(file,budget)){
        msg('fileMessage','Leyendo «'+name+'» en tu dispositivo…');await pause();
        let data;try{data=JSON.parse(content.replace(/^\uFEFF/,''))}catch{throw Error('«'+name+'» no es JSON válido.')}
        if(!Array.isArray(data))throw Error('«'+name+'» no contiene una lista de registros.');
        if(a.records+data.length>1000000)throw Error('Máximo un millón de registros por análisis. Divide los archivos.');
        for(let i=0;i<data.length;i+=5000){Core.consume(a,data.slice(i,i+5000),dedupe);await pause()}
        entryCount++;
      }
      progress.value++;
    }
    render(a,dedupe);
    lastReport={files:files.map(f=>f.name),jsonFiles:entryCount,totalRecords:a.records,analyzedSongRecords:a.valid,omittedRecords:a.ignored,
      duplicateCandidates:a.duplicates,duplicatesExcluded:dedupe,recordsWithoutDate:a.invalidDates,recordsWithoutSpotifyURI:a.missingUris,
      zeroDurationRecords:a.zeroDuration,minutes:a.minutes,songs:a.songs.size,artists:a.artists.size,albums:a.albums.size,activeDaysUTC:a.days.size,
      startUTC:Number.isFinite(a.minDate)?new Date(a.minDate).toISOString():null,endUTC:Number.isFinite(a.maxDate)?new Date(a.maxDate).toISOString():null,
      note:'Resumen local de registros. No confirma aceptación ni reproducciones en stats.fm.',topSongs:[...a.songs.values()].sort((x,y)=>y.n-x.n).slice(0,20)};
    $('fileSummary').classList.remove('hidden');msg('fileMessage',`${files.length} archivo(s) · ${entryCount} JSON · ${fmt(a.records)} registros leídos. ${!a.valid?'No hay registros de canciones analizables.':''}`);
  }catch(error){msg('fileMessage',error.message+' No se muestran resultados parciales.')}
  finally{busy=false;$('historyFiles').disabled=false;$('dedupe').disabled=false;progress.classList.add('hidden');$('historyFiles').value=''}
}
function render(a,dedupe){
  const values={realPlays:a.valid,realMinutes:a.minutes,realSongs:a.songs.size,realArtists:a.artists.size,realAlbums:a.albums.size,realHours:a.minutes/60,realDays:a.days.size};
  for(const [id,value]of Object.entries(values))$(id).textContent=fmt(value);
  const span=Core.daySpan(a),canAverage=span>0&&a.invalidDates===0;
  $('realAvg').textContent=$('avgPlays').textContent=canAverage?decimal(a.valid/span):'—';
  $('avgMinutes').textContent=canAverage?decimal(a.minutes/span):'—';
  const utc=d=>new Date(d).toLocaleDateString('es-EC',{timeZone:'UTC'});
  $('dateRange').textContent=span?`Período UTC: ${utc(a.minDate)} – ${utc(a.maxDate)} · ${span} días calendario, incluidos los días sin registros.${canAverage?'':' Faltan fechas: no se calcula el promedio.'}`:'Sin fechas válidas: no se puede calcular el período ni el promedio.';
  const box=$('topSongs');box.replaceChildren();
  for(const song of [...a.songs.values()].sort((x,y)=>y.n-x.n).slice(0,10)){
    const row=el('div');row.append(el('strong','',song.title+' · '+song.artist),el('span','',fmt(song.n)+' registros'));box.append(row);
  }
  if(!a.songs.size)box.append(el('p','muted','Sin canciones para mostrar.'));
  const notes=$('diagnostics');notes.replaceChildren(el('strong','','Revisión del archivo'));
  const list=el('ul');
  for(const line of [
    `${fmt(a.records)} registros en los archivos; ${fmt(a.valid)} registros de canciones analizados.`,
    `${fmt(a.duplicates)} duplicados detectados (${dedupe?'excluidos':'incluidos'}).`,
    `${fmt(a.ignored)} registros omitidos: podcasts, datos incompletos o duración inválida.`,
    `${fmt(a.invalidDates)} sin fecha con zona horaria válida; ${fmt(a.missingUris)} sin URI válida de Spotify.`,
    `${fmt(a.zeroDuration)} con duración cero (incluidos en el recuento de registros).`
  ])list.append(el('li','',line));
  notes.append(list);
}
$('historyFiles').onchange=e=>analyze([...e.target.files]);
const drop=document.querySelector('.drop');
for(const event of ['dragenter','dragover'])drop.addEventListener(event,e=>{e.preventDefault();if(!busy)drop.classList.add('dragover')});
for(const event of ['dragleave','drop'])drop.addEventListener(event,e=>{e.preventDefault();drop.classList.remove('dragover')});
drop.addEventListener('drop',e=>analyze([...e.dataTransfer.files]));
$('exportReport').onclick=()=>{if(!lastReport)return;const url=URL.createObjectURL(new Blob([JSON.stringify(lastReport,null,2)],{type:'application/json'}));const a=el('a');a.href=url;a.download='resumen_streamlab.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)};
