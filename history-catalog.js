/* Index Spotify track URIs locally from an extended streaming history. */
(function(root){
  'use strict';
  const uriPattern=/^spotify:track:[A-Za-z0-9]{22}$/;
  const norm=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
  function createCatalog(){
    const songs=new Map();
    return {
      add(rows){
        for(const row of rows){
          if(!row||!uriPattern.test(row.spotify_track_uri||''))continue;
          const artist=row.master_metadata_album_artist_name,album=row.master_metadata_album_album_name,track=row.master_metadata_track_name;
          if(!artist||!album||!track)continue;
          const key=JSON.stringify([artist,album,track,row.spotify_track_uri]);
          let song=songs.get(key);
          if(!song){
            if(songs.size>=100000)throw Error('El historial contiene demasiadas canciones diferentes. Carga menos archivos.');
            song={artist,album,track,uri:row.spotify_track_uri,durations:new Map()};songs.set(key,song);
          }
          const seconds=Math.round(Number(row.ms_played)/1000);
          if(Number.isInteger(seconds)&&seconds>=30&&seconds<=36000) song.durations.set(seconds,(song.durations.get(seconds)||0)+1);
        }
      },
      get size(){return songs.size},
      list(){return [...songs.values()].map(({durations,...song})=>{
        const best=[...durations].sort((a,b)=>b[1]-a[1]||b[0]-a[0])[0];
        return {...song,duration:best?best[0]:0,durationEstimated:true,source:'historial'};
      })}
    };
  }
  const api={createCatalog,norm};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.StreamLabHistory=api;
})(globalThis);
