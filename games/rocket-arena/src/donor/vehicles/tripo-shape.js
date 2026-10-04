// A small, continuous rear-to-front taper; authored material coordinates stay
// untouched so the glass and rim lights follow the reshaped shell exactly.
export function shapeTripo(body, wheels, { Box3, Vector3 }) {
  const bounds=new Box3().setFromObject(body,true),length=bounds.max.x-bounds.min.x;
  const taper=x=>1.035-.09*(x-bounds.min.x)/length;
  const rake=x=>-2*(x-bounds.min.x)/length;
  const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
  // Slightly tucked upper shoulders give both end views a soft trapezoid.
  // The center panels, lower body width, spoiler and wheels keep their fit.
  const endWedge=([x,y])=>1-.045*smooth(.24,.43,Math.abs(x))*smooth(-.08,.13,y)*(1-smooth(.145,.20,y));
  const frontArch=([x,y,z])=>smooth(.17,.28,x)*(1-smooth(.43,.50,x))*(1-smooth(.055,.10,y))*smooth(.12,.18,Math.abs(z));
  const sideBlend=([x,y,z])=>smooth(-.27,-.19,x)*(1-smooth(.20,.28,x))*(1-smooth(.045,.080,y))*smooth(.115,.14,Math.abs(z));
  const deckLift=([x,y,z])=>.037*smooth(-.44,-.34,x)*(1-smooth(-.20,-.12,x))*smooth(.025,.075,y)*(1-smooth(.135,.205,y))*(1-smooth(.15,.23,Math.abs(z)));
  for(const mesh of body.children){
    const geometry=mesh.geometry,p=geometry.attributes.position,n=geometry.attributes.normal;
    const source=geometry.attributes._surface_position,fit=mesh.material.uniforms.uSurfaceFitScale.value;
    for(let i=0;i<p.count;i++){
      const authored=[source.getX(i)/145,(source.getY(i)+17)/145-.2275390625,source.getZ(i)/145];
      const blend=sideBlend(authored),lift=deckLift(authored);
      const x=p.getX(i),y=p.getY(i)+lift*145*fit.y;
      // Retain a sub-pixel depth separation between scan folds; collapsing
      // both layers onto the identical plane produces coplanar flicker.
      const z=p.getZ(i)+(Math.sign(authored[2])*.195-authored[2])*(blend*.98)*145*fit.z,width=taper(x);
      if(n){
        // Adjust deck normals to the smooth rise, and resolve the broad side
        // recess as one planar panel on each side before the global taper.
        const e=.0001,a=[...authored],b=[...authored];a[0]+=e;b[2]+=e;
        const dx=(deckLift(a)-lift)/e*fit.y/fit.x,dz=(deckLift(b)-lift)/e*fit.y/fit.z;
        const normal=new Vector3(n.getX(i)-dx*n.getY(i),n.getY(i),n.getZ(i)-dz*n.getY(i)).normalize();
        const normalBlend=blend;
        normal.lerp(new Vector3(0,0,Math.sign(authored[2])),normalBlend).normalize();
        n.setXYZ(i,normal.x,normal.y,normal.z);
      }
      const wedge=endWedge(authored);
      const arch=frontArch(authored);
      p.setXYZ(i,x-4.5*arch,y+rake(x)-1.2*arch,z*width*wedge);
      if(n){
        const normal=new Vector3(n.getX(i)+2/length*n.getY(i)+.09/length*z*n.getZ(i)/width,n.getY(i),n.getZ(i)/width).normalize();
        const e=.0001,a=[...authored],b=[...authored];a[0]+=e;b[1]+=e;
        const dx=(endWedge(a)-wedge)/(e*145*fit.x),dy=(endWedge(b)-wedge)/(e*145*fit.y);
        const wedged=new Vector3(normal.x-z*width*normal.z*dx/wedge,normal.y-z*width*normal.z*dy/wedge,normal.z/wedge).normalize();
        n.setXYZ(i,wedged.x,wedged.y,wedged.z);
      }
    }
    p.needsUpdate=true;if(n)n.needsUpdate=true;
    geometry.computeBoundingBox();geometry.computeBoundingSphere();
  }
  wheels.forEach((wheel,i)=>{
    const box=new Box3().setFromObject(wheel,true),center=box.getCenter(new Vector3());
    const scale=i<2?.88:.90, radius=(box.max.y-box.min.y)/2;
    for(const mesh of wheel.children){
      mesh.geometry.translate(-center.x,-center.y,-center.z);
      mesh.geometry.scale(scale,scale,scale);
      // Lower the smaller front wheel's axle by its radius reduction, keeping
      // the tire's bottom at the same contact height.
      mesh.geometry.translate(center.x-(i<2?4.5:0),center.y-radius*(1-scale),center.z*taper(center.x));
    }
  });
}
