'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const Core=require('../core.js'),Zip=require('../zip.js'),{deflateRawSync}=require('node:zlib');
const song={track:'Fantasma',artist:'Gustavo Cerati',album:'Siempre es hoy',uri:'spotify:track:2xuDoEEK7tfZMh5Y7gOoTg',duration:193,plays:10};
const options={mode:'perSong',start:'2020-01-01T00:00:00Z',end:'2020-01-03T00:00:00Z'};
test('combined totals are exact and differ by at most one',()=>{
  assert.deepEqual(Core.counts([song,song,song],'total',100),[34,33,33]);
  assert.equal(Core.inspect([song,song,song],{...options,mode:'total',total:100}).total,100);
  assert.ok(Core.inspect([song,song,song],{...options,mode:'total',total:2}).issues.length);
});
test('generation preserves count, duration, URI and non-overlapping UTC dates',()=>{
  const rows=Core.generate([song,{...song,track:'Otra',duration:240,plays:3}],options);
  assert.equal(rows.length,13);assert.equal(rows.filter(r=>r.master_metadata_track_name==='Otra').length,3);
  assert.equal(rows.reduce((sum,r)=>sum+r.ms_played,0),(1930+720)*1000);
  let end=Date.parse(options.start);
  for(const row of rows){assert.match(row.ts,/Z$/);assert.equal(row.spotify_track_uri,song.uri);assert.ok(Date.parse(row.ts)-row.ms_played>=end);end=Date.parse(row.ts)}
  assert.ok(end<=Date.parse(options.end));
  assert.equal(Core.estimateBytes([song],options),Buffer.byteLength(JSON.stringify(Core.generate([song],options)))+1);
});
test('invalid dates, URI, duration, fractions and oversized totals block export',()=>{
  for(const mutation of [{uri:null},{duration:0},{duration:NaN},{plays:1.5},{plays:30001},{artist:''}])assert.throws(()=>Core.generate([{...song,...mutation}],options));
  for(const change of [{start:'not-a-date'},{end:options.start},{end:'2099-01-01'},{end:'2020-01-01T00:01:00Z'}])assert.throws(()=>Core.generate([song],{...options,...change}));
});
test('30,000 records fit a calculated period and songs are interleaved',()=>{
  assert.equal(Core.MAX_RECORDS,30000);
  const plan=Core.planDays(30000*193000,8);
  assert.deepEqual(plan,{minimum:68,recommended:202});
  assert.equal(Core.planDays(30000*193000,24).recommended,68);
  assert.throws(()=>Core.planDays(1000,0));
  const opts={mode:'total',total:30000,start:'2020-01-01T00:00:00Z',end:'2020-07-21T00:00:00Z'};
  const rows=Core.generate([song,{...song,track:'Otra canción'}],opts);
  assert.equal(rows.length,30000);
  assert.deepEqual(rows.slice(0,4).map(r=>r.master_metadata_track_name),['Fantasma','Otra canción','Fantasma','Otra canción']);
  assert.ok(Date.parse(rows.at(-1).ts)<=Date.parse(opts.end));
  assert.ok(Core.inspect([song],{...opts,total:30001}).issues.some(x=>x.includes('30000')));
});
test('filenames cannot introduce paths or extra JSON extensions',()=>{
  assert.equal(Core.cleanFilename('../a/b.json'),'_a_b.json');
  assert.equal(Core.cleanFilename(''), 'historial_simulado.json');
});
test('calculator deduplicates across inputs and handles null records safely',()=>{
  const rows=Core.generate([song],options),a=Core.accumulator();
  Core.consume(a,rows);Core.consume(a,[rows[0],null,{}, {...rows[0],ms_played:null}]);
  assert.equal(a.records,14);assert.equal(a.valid,10);assert.equal(a.duplicates,1);assert.equal(a.ignored,3);
  const b=Core.accumulator();Core.consume(b,[rows[0],rows[0]],false);assert.equal(b.valid,2);assert.equal(b.duplicates,1);
});
test('calendar day averages use UTC boundaries and report missing dates',()=>{
  const r=Core.generate([song],options)[0],a=Core.accumulator();
  Core.consume(a,[{...r,ts:'2020-01-01T23:59:00Z'},{...r,ts:'2020-01-02T00:01:00Z'},{...r,ts:'invalid',spotify_track_uri:null,ms_played:0}]);
  assert.equal(Core.daySpan(a),2);assert.equal(a.invalidDates,1);assert.equal(a.missingUris,1);assert.equal(a.zeroDuration,1);
});
function archive(content,method=0,corrupt=false,claimedSize=null){
  const name=Buffer.from('history.json'),raw=Buffer.from(content),packed=method===8?deflateRawSync(raw):raw,crc=Zip.crc32(raw);
  const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50);local.writeUInt16LE(method,8);local.writeUInt32LE(crc,14);local.writeUInt32LE(packed.length,18);local.writeUInt32LE(claimedSize??raw.length,22);local.writeUInt16LE(name.length,26);
  const central=Buffer.alloc(46);central.writeUInt32LE(0x02014b50);central.writeUInt16LE(method,10);central.writeUInt32LE(corrupt?0:crc,16);central.writeUInt32LE(packed.length,20);central.writeUInt32LE(claimedSize??raw.length,24);central.writeUInt16LE(name.length,28);
  const end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(1,8);end.writeUInt16LE(1,10);end.writeUInt32LE(46+name.length,12);end.writeUInt32LE(30+name.length+packed.length,16);
  return new Blob([local,name,packed,central,name,end]);
}
async function readZip(blob,budget={bytes:0}){const result=[];for await(const entry of Zip.jsonEntries(blob,budget))result.push(entry);return result}
test('ZIP Store and Deflate parse the same content',async()=>{
  const json=JSON.stringify(Core.generate([song],options));
  for(const method of [0,8])assert.equal((await readZip(archive(json,method)))[0][1],json);
});
test('corrupt, truncated and oversized ZIP entries fail explicitly',async()=>{
  await assert.rejects(readZip(archive('[]',0,true)),/dañado/);
  await assert.rejects(readZip(new Blob(['bad zip'])),/inválido/);
  await assert.rejects(readZip(archive('[]',0,false,101*1024*1024)),/100 MB/);
  await assert.rejects(readZip(archive('[]'),{bytes:100*1024*1024}),/100 MB/);
  await assert.rejects(readZip(archive('a'.repeat(10000),8,false,1)),/tamaño permitido/);
});
