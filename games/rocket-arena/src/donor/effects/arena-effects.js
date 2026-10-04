// Event-only effects. One pooled shard draw plus two brief goal rings, no lights/bloom.
export function createArenaEffects(T, scene, { lightweight = false, audioContext, audioOutput } = {}) {
  const capacity = lightweight ? 72 : 120;
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute([
    0,1,0, -0.6,-0.5,0.5, 0.6,-0.5,0.5,
    0,1,0, 0.6,-0.5,0.5, 0,-0.5,-0.7,
    0,1,0, 0,-0.5,-0.7, -0.6,-0.5,0.5,
    -0.6,-0.5,0.5, 0,-0.5,-0.7, 0.6,-0.5,0.5,
  ], 3));
  const material = new T.MeshBasicMaterial({color: 0xffffff, toneMapped: false});
  const shards = new T.InstancedMesh(geometry, material, capacity);
  shards.name = 'Arena / pooled pickup and goal sparks';
  shards.frustumCulled = false; shards.visible = false; shards.count = 0;
  scene.add(shards);
  const marker = new T.Object3D(), tint = new T.Color();
  const pool = Array.from({length:capacity},()=>({life:0,total:0,x:0,y:0,z:0,vx:0,vy:0,vz:0,size:0,color:0}));
  let cursor=0, goalTime=-1, lastPickupSound=-10, noise=null, pending=false;
  const rings = [0,1].map(index => {
    const ring = new T.Mesh(new T.RingGeometry(.93,1,lightweight?32:48), new T.MeshBasicMaterial({color:0xffbe52,transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide,toneMapped:false}));
    ring.name = `Arena / goal shockwave ${index}`; ring.visible=false; scene.add(ring); return ring;
  });
  function sound(kind,big=false) {
    try {
      const ctx=audioContext?.(); if (!ctx || ctx.state!=='running') return;
      const now=ctx.currentTime;
      if(kind==='pickup' && now-lastPickupSound<.055) return;
      if(kind==='pickup')lastPickupSound=now;
      const output=audioOutput();
      const tone=(frequency,end,duration,volume,type='sine',delay=0)=>{
        const oscillator=ctx.createOscillator(), gain=ctx.createGain();
        oscillator.type=type; oscillator.frequency.setValueAtTime(frequency,now+delay);
        oscillator.frequency.exponentialRampToValueAtTime(end,now+delay+duration);
        gain.gain.setValueAtTime(.0001,now+delay); gain.gain.exponentialRampToValueAtTime(volume,now+delay+.01);
        gain.gain.exponentialRampToValueAtTime(.0001,now+delay+duration);
        oscillator.connect(gain).connect(output); oscillator.start(now+delay); oscillator.stop(now+delay+duration+.02);
        oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
      };
      if(kind==='pickup') {
        tone(big?560:760,big?1280:1100,big?.25:.13,big?.10:.065);
        if(big)tone(840,1680,.23,.055,'sine',.04);
      } else {
        tone(145,35,1.25,.25); tone(390,780,.45,.075,'triangle');
        if(!noise){noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);}
        const source=ctx.createBufferSource(), gain=ctx.createGain(), filter=ctx.createBiquadFilter();
        source.buffer=noise;filter.type='lowpass';filter.frequency.value=1500;
        gain.gain.setValueAtTime(.16,now);gain.gain.exponentialRampToValueAtTime(.0001,now+.9);
        source.connect(filter).connect(gain).connect(output);source.start();
        source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
      }
    } catch(error) { /* Audio is optional when the browser has not unlocked it. */ }
  }
  function emit(position,count,big,goal,color) {
    pending=true;
    for(let i=0;i<count;i++){
      const p=pool[cursor++%capacity], angle=Math.random()*Math.PI*2;
      const speed=goal?350+Math.random()*1100:45+Math.random()*(big?150:80);
      Object.assign(p,{life:goal?1+Math.random():.32+Math.random()*.25,x:position.x,y:position.y,z:position.z,vx:Math.cos(angle)*speed,vy:goal?180+Math.random()*1100:80+Math.random()*170,vz:Math.sin(angle)*speed,size:goal?20+Math.random()*38:big?9:5,color});
      p.total=p.life;
    }
  }
  function pickup(position,big,audible=true){emit(position,lightweight?6:10,big,false,0xffd777);if(audible)sound('pickup',big);}
  function goal(position,color){
    emit(position,lightweight?54:96,true,true,color);goalTime=0;
    rings.forEach((ring,i)=>{ring.position.copy(position);ring.position.z+=position.z>0?-15-i*5:15+i*5;ring.material.color.setHex(color);ring.visible=true;});
    sound('goal');
  }
  function update(delta){
    if (!pending && !shards.visible && goalTime < 0) return;
    pending=false;
    let count=0;
    for(const p of pool){
      if(p.life<=0)continue;p.life-=delta;if(p.life<=0)continue;
      p.x+=p.vx*delta;p.y+=p.vy*delta;p.z+=p.vz*delta;p.vy-=250*delta;
      marker.position.set(p.x,Math.max(4,p.y),p.z);marker.rotation.set(p.life*3,p.life*2,p.life);
      marker.scale.setScalar(p.size*Math.min(1,p.life/.25));marker.updateMatrix();
      shards.setMatrixAt(count,marker.matrix);tint.setHex(p.color);shards.setColorAt(count,tint);count++;
    }
    shards.visible=count>0;shards.count=count;
    if(count){shards.instanceMatrix.needsUpdate=true;shards.instanceColor.needsUpdate=true;}
    if(goalTime>=0){goalTime+=delta;rings.forEach((ring,i)=>{const t=goalTime-i*.13;ring.visible=t>0&&t<1.1;if(ring.visible){ring.scale.setScalar(90+t*(i?1550:2200));ring.material.opacity=Math.max(0,(1-t/1.1)*.65);}});if(goalTime>1.3)goalTime=-1;}
  }
  function clear(){pending=false;for(const p of pool)p.life=0;shards.visible=false;shards.count=0;goalTime=-1;for(const ring of rings)ring.visible=false;}
  return {pickup,goal,update,clear,get active(){return pending||shards.visible||goalTime>=0;}};
}
