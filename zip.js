/* Local ZIP reader with streamed decompression, size limits and CRC checks. */
(function(root){
  'use strict';
  const LIMIT=100*1024*1024;
  const table=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;return n>>>0});
  function crc32(bytes){let crc=0xffffffff;for(const byte of bytes)crc=table[(crc^byte)&255]^(crc>>>8);return (crc^0xffffffff)>>>0}
  async function* jsonEntries(file,budget){
    const buffer=await file.arrayBuffer(),view=new DataView(buffer),decoder=new TextDecoder('utf-8',{fatal:true});
    const u16=p=>view.getUint16(p,true),u32=p=>view.getUint32(p,true);
    let end=-1;
    for(let i=buffer.byteLength-22;i>=Math.max(0,buffer.byteLength-65557);i--){if(u32(i)===0x06054b50&&i+22+u16(i+20)===buffer.byteLength){end=i;break}}
    if(end<0)throw Error('ZIP incompleto o inválido. Extrae sus JSON y súbelos directamente.');
    if(u16(end+4)||u16(end+6)||u16(end+8)!==u16(end+10)||u16(end+10)===65535)throw Error('ZIP dividido o ZIP64 no compatible. Extrae los JSON.');
    const count=u16(end+10);let pos=u32(end+16),found=0;
    if(count>2000)throw Error('El ZIP contiene demasiadas entradas. Selecciona los JSON por separado.');
    for(let i=0;i<count;i++){
      if(pos+46>end||u32(pos)!==0x02014b50)throw Error('Directorio ZIP dañado.');
      const flags=u16(pos+8),method=u16(pos+10),crc=u32(pos+16),compressed=u32(pos+20),size=u32(pos+24),nameLength=u16(pos+28),extra=u16(pos+30),comment=u16(pos+32),local=u32(pos+42);
      if(pos+46+nameLength+extra+comment>end)throw Error('Directorio ZIP incompleto.');
      const name=decoder.decode(new Uint8Array(buffer,pos+46,nameLength));pos+=46+nameLength+extra+comment;
      if(!/\.json$/i.test(name)||name.split('/').some(part=>part.startsWith('.')||part==='__MACOSX'))continue;
      if(flags&1)throw Error('El ZIP tiene contraseña. Extrae sus archivos JSON.');
      if(size===0xffffffff||local===0xffffffff)throw Error('ZIP64 no compatible. Extrae los JSON.');
      if(size>LIMIT-budget.bytes)throw Error('El contenido supera 100 MB descomprimidos. Analiza menos archivos a la vez.');
      if(local+30>buffer.byteLength||u32(local)!==0x04034b50)throw Error('Cabecera ZIP dañada.');
      const offset=local+30+u16(local+26)+u16(local+28);
      if(offset+compressed>buffer.byteLength)throw Error('Datos ZIP incompletos.');
      let bytes=new Uint8Array(buffer,offset,compressed);
      if(method===8){
        if(typeof DecompressionStream==='undefined')throw Error('Este navegador no admite descomprimir el ZIP. Extrae sus JSON.');
        let stream;try{stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))}catch{throw Error('Compresión no compatible en este navegador. Extrae los JSON.')}
        const reader=stream.getReader(),chunks=[];let length=0;
        try{while(true){const {value,done}=await reader.read();if(done)break;length+=value.length;if(length>size||length>LIMIT-budget.bytes)throw Error('El ZIP supera el tamaño permitido.');chunks.push(value)}}catch(error){await reader.cancel().catch(()=>{});throw error}
        bytes=new Uint8Array(length);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length}
      }else if(method!==0)throw Error('Compresión no compatible. Extrae los JSON.');
      if(bytes.length!==size||crc32(bytes)!==crc)throw Error('«'+name+'» está dañado. Vuelve a descargar el ZIP.');
      budget.bytes+=bytes.length;found++;
      yield [name,decoder.decode(bytes)];
    }
    if(!found)throw Error('No hay archivos JSON dentro de «'+file.name+'».');
  }
  const api={jsonEntries,crc32};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.StreamLabZip=api;
})(globalThis);
