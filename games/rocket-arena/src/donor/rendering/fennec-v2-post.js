import {Ae,Lt,qn,er,qt,ll,nl} from '../vendor/three.js';
import {FENNEC_V2_POST} from './fennec-v2-post-shaders.js';
import {maskCarBloom} from './bloom-mask.js';
const vertexShader='varying vec2 vUV; void main(){vUV=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
// V2's HDR resolve, three-scale bloom, FXAA and neutral output transform.
export class FennecV2Post {
  constructor(renderer){
    this.renderer=renderer;this.size=new Ae();this.targets=[];this.materials={};
    this.black=new nl(new Uint8Array([0,0,0,255]),1,1);this.black.needsUpdate=true;
    const hdr=renderer.extensions.has('EXT_color_buffer_float');
    for(let i=0;i<7;i++)this.targets.push(new qn(1,1,{...(hdr?{type:er}:{}),minFilter:qt,magFilter:qt,depthBuffer:i===0,stencilBuffer:false}));
    for(const [name,fragmentShader] of Object.entries(FENNEC_V2_POST))this.materials[name]=new Lt({precision:'highp',vertexShader,fragmentShader:name==='extractFragment'?maskCarBloom(fragmentShader):fragmentShader,depthTest:false,depthWrite:false,toneMapped:false,uniforms:{
      uSource:{value:null},uTexel:{value:new Ae()},uDirection:{value:new Ae()},uThreshold:{value:.60},
      uExposure:{value:1.07},uBloomStrength:{value:.19},uBloom:{value:null},uBloomWide:{value:null},uBloomHalo:{value:null},
    }});
    this.quad=new ll(this.materials.postFragment);
    if(!hdr)this.materials.extractFragment.uniforms.uThreshold.value=.7;
  }
  render(scene,camera,low=false){
    const r=this.renderer,[main,a,b,c,d,e,f]=this.targets;
    // AIR JAM PATCH: a split-screen view renders at its own rectangle size.
    if(this.sizeOverride)this.size.set(this.sizeOverride.x,this.sizeOverride.y);else r.getDrawingBufferSize(this.size);
    // Heat refraction copies the scene during its transparent pass. WebGL cannot
    // copy an unresolved multisample framebuffer; v2's final FXAA smooths edges.
    if(main.width!==this.size.x||main.height!==this.size.y){
      main.setSize(this.size.x,this.size.y);
    }
    // Resize on quality changes too; release High-only storage on lower presets.
    for(const [level,pair] of [[2,[a,b]],[3,[c,d]],[4,[e,f]]])for(const target of pair)target.setSize(low && level>2?1:Math.max(1,this.size.x>>level),low && level>2?1:Math.max(1,this.size.y>>level));
    const previous=r.getRenderTarget(),autoClear=r.autoClear;
    try {
    r.setRenderTarget(main);r.render(scene,camera);
    // Every following pass is an opaque full-screen replacement with no depth
    // test. Clearing it first only spends bandwidth; retain the scene's clear.
    r.autoClear=false;
    const pass=(name,input,target)=>{
      const material=this.materials[name];material.uniforms.uSource.value=input.texture;
      material.uniforms.uTexel.value.set(1/input.width,1/input.height);
      this.quad.material=material;r.setRenderTarget(target);this.quad.render(r);
    };
    const blur=(input,temp,radius)=>{
      this.materials.blurFragment.uniforms.uDirection.value.set(radius/input.width,0);pass('blurFragment',input,temp);
      this.materials.blurFragment.uniforms.uDirection.value.set(0,radius/input.height);pass('blurFragment',temp,input);
    };
    pass('extractFragment',main,a);blur(a,b,1);
    if(!low){
      pass('downsampleFragment',a,c);blur(c,d,1.5);
      pass('downsampleFragment',c,e);blur(e,f,1.7);
    }
    const uniforms=this.materials.postFragment.uniforms;
    uniforms.uBloom.value=a.texture;uniforms.uBloomWide.value=low?this.black:c.texture;uniforms.uBloomHalo.value=low?this.black:e.texture;
    pass('postFragment',main,previous);
    } finally { r.autoClear=autoClear;r.setRenderTarget(previous); }
  }
  dispose(){this.targets.forEach(target=>target.dispose());Object.values(this.materials).forEach(material=>material.dispose());this.black.dispose();this.quad.dispose();}
}
