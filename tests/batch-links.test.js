'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const Batch=require('../batch-links.js'),Zip=require('../zip.js');
const track='1234567890123456789012',album='ABCDEFGHIJKLMNOPQRSTUV';
test('extracts distinct tracks and albums with optional metadata and durations',()=>{
  const data=Batch.extract(`1. Alone Again | The Weeknd | After Hours | 4:10 | https://open.spotify.com/track/${track}?si=abc\nspotify:track:${track}\nhttps://open.spotify.com/album/${album}`);
  assert.equal(data.tracks.length,1);assert.equal(data.albums.length,1);
  assert.equal(data.tracks[0].duration,250);assert.equal(data.tracks[0].track,'Alone Again');
  assert.equal(data.tracks[0].uri,'spotify:track:'+track);
});
function docx(entries){
  const parts=[],central=[];let offset=0;
  for(const [path,text] of Object.entries(entries)){
    const name=Buffer.from(path),body=Buffer.from(text),crc=Zip.crc32(body),local=Buffer.alloc(30),dir=Buffer.alloc(46);
    local.writeUInt32LE(0x04034b50);local.writeUInt32LE(crc,14);local.writeUInt32LE(body.length,18);local.writeUInt32LE(body.length,22);local.writeUInt16LE(name.length,26);
    dir.writeUInt32LE(0x02014b50);dir.writeUInt32LE(crc,16);dir.writeUInt32LE(body.length,20);dir.writeUInt32LE(body.length,24);dir.writeUInt16LE(name.length,28);dir.writeUInt32LE(offset,42);
    parts.push(local,name,body);central.push(dir,name);offset+=30+name.length+body.length;
  }
  const size=central.reduce((sum,b)=>sum+b.length,0),end=Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50);end.writeUInt16LE(Object.keys(entries).length,8);end.writeUInt16LE(Object.keys(entries).length,10);end.writeUInt32LE(size,12);end.writeUInt32LE(offset,16);
  const blob=new Blob([...parts,...central,end]);return {name:'lista.docx',size:blob.size,arrayBuffer:()=>blob.arrayBuffer()};
}
test('reads text and hyperlink targets from a DOCX locally',async()=>{
  const file=docx({'word/document.xml':`<w:document><w:p><w:r><w:t>https://open.spotify.com/track/${track}</w:t></w:r></w:p></w:document>`,
    'word/_rels/document.xml.rels':`<Relationships><Relationship Target="https://open.spotify.com/album/${album}?si=foo&amp;bar=1"/></Relationships>`});
  const found=Batch.extract(await Batch.readFile(file));assert.equal(found.tracks.length,1);assert.equal(found.albums.length,1);
  await assert.rejects(Batch.readFile({name:'list.pdf',size:5}),/PDF/);
});
