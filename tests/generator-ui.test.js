'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const Core=require('../core.js');

test('daily planning updates live and JSON downloads in chunks',async()=>{
  const elements=new Map();let downloaded;
  function element(id=''){
    const classes=new Set();
    return {id,value:'',textContent:'',disabled:false,dataset:{},style:{},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),toggle:(x,active)=>active?classes.add(x):classes.delete(x)},
      listeners:{},addEventListener(name,listener){this.listeners[name]=listener},setAttribute(){},removeAttribute(){},append(){},before(){},replaceChildren(){},focus(){},close(){},showModal(){},click(){},remove(){}};
  }
  const get=id=>{if(!elements.has(id))elements.set(id,element(id));return elements.get(id)};
  const ctx=vm.createContext({window:{StreamLabCore:Core},document:{getElementById:get,createElement:()=>element(),querySelectorAll:()=>[],body:{append(){}}},localStorage:{removeItem(){}},
    setTimeout:(fn,ms)=>ms===60000?0:setTimeout(fn,ms),clearTimeout,Date,Math,Number,String,Error,JSON,Blob,URL:{createObjectURL(blob){downloaded=blob;return 'blob:test'},revokeObjectURL(){}},TextEncoder,Intl});
  get('plays').value='10000';get('dailyHours').value='8';get('totalPlays').value='100';
  vm.runInContext(fs.readFileSync(require.resolve('../app.js'),'utf8'),ctx);
  assert.equal(get('dailyCapacity').textContent,'480');
  assert.equal(get('estimateMinutes').textContent,'0');
  get('manualUri').value='https://open.spotify.com/track/1234567890123456789012';
  get('manualArtist').value='Artista';get('manualTrack').value='Tema';get('manualDuration').value='200';
  get('manualPane').onsubmit({preventDefault(){}});
  const minutes=get('estimateMinutes').textContent,days8=get('recommendedDays').textContent,average8=get('dailyAverage').textContent;
  assert.notEqual(minutes,'0');
  get('dailyHours').value='2';get('dailyHours').listeners.input();
  assert.equal(get('dailyCapacity').textContent,'120');
  assert.equal(get('estimateMinutes').textContent,minutes);
  assert.ok(Number(get('recommendedDays').textContent)>Number(days8));
  assert.notEqual(get('dailyAverage').textContent,average8);
  get('applyDays').onclick();
  assert.equal(get('download').disabled,false);
  await get('download').onclick();
  assert.equal(JSON.parse(await downloaded.text()).length,10000);
  assert.match(get('generateMessage').textContent,/10\.000 registros listo/);
});
