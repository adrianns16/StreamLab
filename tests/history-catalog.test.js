'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createCatalog,norm}=require('../history-catalog.js');
const row=(track,uri,ms,album='Nectar')=>({master_metadata_track_name:track,master_metadata_album_artist_name:'Joji',master_metadata_album_album_name:album,spotify_track_uri:uri,ms_played:ms});
test('history catalog keeps exact Spotify URIs and estimates duration from common listens',()=>{
  const catalog=createCatalog();
  catalog.add([row('Like You Do','spotify:track:1111111111111111111111',10000),row('Like You Do','spotify:track:1111111111111111111111',200000),row('Like You Do','spotify:track:1111111111111111111111',200100),row('Like You Do','spotify:track:1111111111111111111111',80000)]);
  assert.equal(catalog.size,1);
  assert.deepEqual(catalog.list()[0],{artist:'Joji',album:'Nectar',track:'Like You Do',uri:'spotify:track:1111111111111111111111',duration:200,durationEstimated:true,source:'historial'});
});
test('same title with distinct Spotify IDs remains separate; missing URI and episodes are ignored',()=>{
  const catalog=createCatalog();
  catalog.add([row('Ew','spotify:track:1111111111111111111111',190000),row('Ew','spotify:track:2222222222222222222222',190000),row('Ew',null,190000),null,{episode_name:'Podcast',spotify_episode_uri:'spotify:episode:123'}]);
  assert.equal(catalog.size,2);
  assert.deepEqual(catalog.list().map(s=>s.uri),['spotify:track:1111111111111111111111','spotify:track:2222222222222222222222']);
  assert.equal(norm('Néctar'),'nectar');
});
