/* Extract Spotify links locally from pasted text and small documents. */
(function(root){
  'use strict';
  const LINK=/(?:https?:\/\/(?:open|play)\.spotify\.com\/(track|album)\/|spotify:(track|album):)([A-Za-z0-9]{22})(?:\?[^\s<>"']*)?/gi;
  const escapeXml=s=>s.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi,entity=>{
    const named={'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>'}[entity.toLowerCase()];
    if(named)return named;
    const hex=entity[2].toLowerCase()==='x',code=parseInt(entity.slice(hex?3:2,-1),hex?16:10);
    return code<=0x10ffff?String.fromCodePoint(code):entity;
  });
  function extract(text){
    const tracks=[],albums=[],seen=new Set();
    for(const line of String(text).split(/\r?\n/)){
      LINK.lastIndex=0;let match;
      const found=[];
      while((match=LINK.exec(line))!==null){
        const type=match[1]||match[2],id=match[3],key=type+':'+id;
        if(seen.has(key))continue;
        seen.add(key);found.push({type,id,uri:`spotify:${type}:${id}`,url:`https://open.spotify.com/${type}/${id}`});
      }
      for(const entry of found){
        if(entry.type==='album'){albums.push(entry);continue}
        let track='',artist='',album='',duration=0;
        if(found.length===1){
          const parts=line.replace(LINK,'').replace(/^\s*(?:[-•*]|\d+[.)])\s*/,'').split('|').map(s=>s.trim()).filter(Boolean);
          if(parts.length>=3){[track,artist,album]=parts;const time=parts[3]||'';const m=/^(\d{1,3}):(\d{2})$/.exec(time);if(m&&Number(m[2])<60)duration=Number(m[1])*60+Number(m[2]);else if(/^\d{1,5}$/.test(time))duration=Number(time)}
        }
        tracks.push({...entry,track,artist,album,duration});
      }
    }
    return {tracks,albums};
  }
  async function readFile(file){
    if(!file||file.size>5*1024*1024)throw Error('Elige un archivo de hasta 5 MB.');
    const name=file.name||'';
    if(/\.(txt|md|csv|json)$/i.test(name))return file.text();
    if(!/\.docx$/i.test(name))throw Error('Usa TXT, MD, CSV, JSON o DOCX. Para PDF, copia y pega su texto.');
    const zip=root.StreamLabZip||(typeof module!=='undefined'&&module.exports?require('./zip.js'):null);
    if(!zip)throw Error('No se pudo abrir el documento DOCX.');
    let document='',relationships='';const budget={bytes:95*1024*1024};
    for await(const [entry,content] of zip.textEntries(file,budget,n=>n==='word/document.xml'||n==='word/_rels/document.xml.rels')){
      if(budget.bytes>100*1024*1024)throw Error('El documento descomprimido es demasiado grande.');
      if(entry==='word/document.xml')document=content;else relationships=content;
    }
    if(!document)throw Error('El DOCX no contiene texto legible.');
    const external=[];
    for(const m of relationships.matchAll(/<Relationship\b[^>]*\bTarget="([^"]+)"[^>]*>/gi))if(/spotify\.com|spotify:(?:album|track):/i.test(m[1]))external.push(escapeXml(m[1]));
    const visible=escapeXml(document.replace(/<w:(?:br|p|tab)\b[^>]*>/g,'\n').replace(/<[^>]*>/g,''));
    return visible+'\n'+external.join('\n');
  }
  const api={extract,readFile};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.StreamLabBatch=api;
})(globalThis);
