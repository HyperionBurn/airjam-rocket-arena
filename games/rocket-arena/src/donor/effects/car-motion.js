// Curved refraction informed by Drei transmission; turbulence informed by
// Lucas Bebber's HeatDistortionEffect (Codrops).
// See docs/motion-effects.md for sources, license and visual limitations.
export function createCarMotionEffects(T, scene, renderer) {
  const entries = new Map(),
    size = new T.Vector2();
  const snapshot = new T.Texture();
  snapshot.isFramebufferTexture = true;
  snapshot.generateMipmaps = false;
  snapshot.minFilter = snapshot.magFilter = T.LinearFilter;
  const defaultSnapshotType = snapshot.type;
  let time = 0;
  const heatMaterial = new T.ShaderMaterial({
    uniforms: {
      image: { value: snapshot },
      resolution: { value: size },
      time: { value: 0 },
      strength: { value: 0 },
      radius: { value: 60 },
      projectionScale: { value: new T.Vector2(1, 1) },
    },
    vertexShader: `varying vec3 vNormal, vViewPosition, vLocal;
      void main(){
        vLocal=position; vNormal=normalize(normalMatrix*normal);
        vec4 view=modelViewMatrix*vec4(position,1.);
        vViewPosition=view.xyz; gl_Position=projectionMatrix*view;
      }`,
    fragmentShader: `uniform sampler2D image; uniform vec2 resolution;
      uniform float time,strength,radius; uniform vec2 projectionScale;
      varying vec3 vNormal,vViewPosition,vLocal;
      void main(){
        vec3 view=normalize(-vViewPosition), n=normalize(vNormal);
        float facing=clamp(dot(n,view),0.,1.);
        float rim=pow(1.-facing,3.);
        vec3 waves=sin(vLocal.yzx*13.+time*19.)*.065
          +sin(vLocal.zxy*23.-time*27.)*.035;
        vec3 bent=refract(-view,normalize(n+waves),1./1.12);
        // Curved transmission offset scales with projected bubble size, not DPI.
        vec2 offset=(bent.xy+view.xy)*radius*projectionScale
          /max(20.,-vViewPosition.z)*strength;
        vec2 uv=gl_FragCoord.xy/resolution;
        vec3 background=texture2D(image,clamp(uv+offset,vec2(.001),vec2(.999))).rgb;
        // A narrow, faint rim makes the bubble readable against plain grass.
        background+=vec3(.55,.75,1.)*rim*.075*strength;
        float edge=smoothstep(0.,.12,facing);
        gl_FragColor=vec4(background,edge*min(1.,strength*2.5));
      }`,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  function ribbon(color) {
    const geometry = new T.BufferGeometry();
    geometry.setAttribute(
      "position",
      new T.Float32BufferAttribute(new Float32Array(36 * 18), 3),
    );
    geometry.setAttribute(
      "uv",
      new T.Float32BufferAttribute(new Float32Array(36 * 12), 2),
    );
    const material = new T.ShaderMaterial({
      uniforms: {
        color: { value: new T.Color(color) },
        strength: { value: 0 },
      },
      vertexShader:
        "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader: `uniform vec3 color;uniform float strength;varying vec2 vUv;
        void main(){
          float d=abs(vUv.y), aa=max(fwidth(d),.025);
          float core=1.-smoothstep(.23-aa,.23+aa,d);
          float halo=pow(max(0.,1.-d),2.)*.38;
          float tail=smoothstep(0.,.22,vUv.x);
          gl_FragColor=vec4(mix(color,vec3(1.),core),max(core,halo)*tail*.98*strength);
        }`,
      transparent: true,
      depthWrite: false,
      side: T.DoubleSide,
      toneMapped: false,
    });
    const mesh = new T.Mesh(geometry, material);
    mesh.frustumCulled = false;
    mesh.visible = false;
    scene.add(mesh);
    return { mesh, points: [], strength: 0 };
  }
  function heatParticles() {
    const geometry = new T.BufferGeometry();
    geometry.setAttribute(
      "position",
      new T.Float32BufferAttribute(new Float32Array(24 * 18), 3),
    );
    geometry.setAttribute(
      "uv",
      new T.Float32BufferAttribute(new Float32Array(24 * 12), 2),
    );
    geometry.setAttribute(
      "fade",
      new T.Float32BufferAttribute(new Float32Array(24 * 6), 1),
    );
    const material = new T.ShaderMaterial({
      vertexShader: `attribute float fade; varying vec2 vUv; varying float vFade;
        void main(){vUv=uv;vFade=fade;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `varying vec2 vUv;varying float vFade;
        void main(){
          float d=length(vUv), aa=max(fwidth(d),.015);
          float core=1.-smoothstep(.19-aa,.19+aa,d);
          float halo=pow(max(0.,1.-d),1.9)*.65;
          vec3 ember=mix(vec3(1.,.22,.015),vec3(1.,.72,.06),vFade);
          gl_FragColor=vec4(mix(ember,vec3(1.5,1.35,.85),core),max(core,halo)*vFade);

        }`,
      transparent: true,
      blending: T.AdditiveBlending,
      depthWrite: false,
      side: T.DoubleSide,
      toneMapped: false,
    });
    const mesh = new T.Mesh(geometry, material);
    mesh.name = "Dodge / radial heat burst";
    mesh.frustumCulled = false;
    mesh.visible = false;
    mesh.renderOrder = 101;
    scene.add(mesh);
    return {
      mesh,
      pool: Array.from({ length: 24 }, () => ({
        life: 0,
        total: 0,
        phase: 0,
        size: 0,
        position: new T.Vector3(),
        velocity: new T.Vector3(),
      })),
    };
  }
  const emberAlong = new T.Vector3(),
    emberSide = new T.Vector3(),
    emberView = new T.Vector3(),
    emberPoint = new T.Vector3();
  function burstParticles(e, car) {
    // A stratified 360-degree ring in the car's underside plane, not a sphere.
    const phase = Math.random() * Math.PI * 2;
    e.sparks.pool.forEach((p, i) => {
      const angle =
        phase +
        ((i + (Math.random() - 0.5) * 0.4) * Math.PI * 2) /
          e.sparks.pool.length;
      const speed = 440 + Math.random() * 280;
      p.life = p.total = 0.42 + Math.random() * 0.22;
      p.phase = angle;
      p.size = 1.8 + Math.random() * 2.4;
      p.position
        .set(0, -22, 0)
        .applyQuaternion(car.quaternion)
        .add(car.position);
      p.velocity
        .set(
          Math.cos(angle) * speed,
          (Math.random() - 0.5) * 90,
          Math.sin(angle) * speed,
        )
        .applyQuaternion(car.quaternion);
    });
  }
  function updateParticles(e, car, dt, camera) {
    const sparks = e.sparks;
    const pos = sparks.mesh.geometry.attributes.position,
      uv = sparks.mesh.geometry.attributes.uv,
      fade = sparks.mesh.geometry.attributes.fade;
    let k = 0;
    for (const p of sparks.pool) {
      p.life -= dt;
      if (p.life <= 0) continue;
      p.velocity.multiplyScalar(Math.exp(-dt * 1.3));
      p.position.addScaledVector(p.velocity, dt);

      emberAlong.copy(p.velocity).normalize();
      emberView.subVectors(camera.position, p.position).normalize();
      emberSide.crossVectors(emberAlong, emberView).normalize();
      if (emberSide.lengthSq() < 0.01) emberSide.set(1, 0, 0);
      emberAlong.crossVectors(emberView, emberSide).normalize();
      const opacity = Math.min(1, p.life / 0.16),
        length = p.size * 1.5 + p.velocity.length() * .008;
      for (const [x, y] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ]) {
        emberPoint
          .copy(p.position)
          .addScaledVector(emberSide, x * p.size)
          .addScaledVector(emberAlong, y * length);
        pos.setXYZ(k, emberPoint.x, emberPoint.y, emberPoint.z);
        uv.setXY(k, x, y);
        fade.setX(k, (p.life / p.total) * opacity);
        k++;
      }
    }
    pos.needsUpdate = true;
    uv.needsUpdate = true;
    fade.needsUpdate = true;
    sparks.mesh.geometry.setDrawRange(0, k);
    sparks.mesh.visible = k > 0;
  }
  function entry(car) {
    if (entries.has(car)) return entries.get(car);
    const heat = new T.Mesh(
      new T.SphereGeometry(1, 32, 20),
      heatMaterial.clone(),
    );
    heat.material.uniforms.image.value = snapshot;
    heat.material.uniforms.resolution.value = size;
    heat.name = "Dodge / refractive bubble";
    heat.visible = false;
    heat.renderOrder = 100;
    scene.add(heat);
    heat.onBeforeRender = () => {
      const target = renderer.getRenderTarget?.();
      if (target) size.set(target.width, target.height);
      else renderer.getDrawingBufferSize(size);
      // The v2 scene is HDR; copying it into an unsigned-byte texture is invalid.
      // Keep the original framebuffer refraction in the source buffer's format.
      const type = target?.texture.type ?? defaultSnapshotType;
      if (
        !snapshot.image ||
        snapshot.image.width !== size.x ||
        snapshot.image.height !== size.y ||
        snapshot.type !== type
      ) {
        snapshot.dispose();
        snapshot.type = type;
        snapshot.image = { width: size.x, height: size.y };
        snapshot.needsUpdate = true;
      }
      renderer.copyFramebufferToTexture(snapshot);
    };
    const e = {
      serial: null,
      doubleSerial: null,
      jumpSerial: null,
      heatLife: 0,
      life: 0,
      heat,
      trails: [ribbon(0x8866ff), ribbon(0x668bff)],
      dodge: Array.from({ length: 4 }, (_, i) => {
        const r = ribbon(0x8bdcff);
        r.mesh.name = `Dodge / wheel ${i + 1}`;
        return r;
      }),
      sparks: heatParticles(),
      last: new T.Vector3(),
    };
    entries.set(car, e);
    return e;
  }
  const point = new T.Vector3(),
    side = new T.Vector3(),
    up = new T.Vector3();
  const anchors = Array.from({ length: 4 }, () => new T.Vector3());
  function updateRibbon(r, position, emitting, width, life, dt, camera) {
    // Fast, soft onset and a slightly longer release; independent of frame rate.
    const target = emitting ? 1 : 0;
    r.strength +=
      (target - r.strength) * (1 - Math.exp(-dt / (emitting ? 0.055 : 0.085)));
    r.mesh.material.uniforms.strength.value = r.strength;
    r.points.forEach((p) => (p.age += dt));
    r.points = r.points.filter((p) => p.age < life);
    if (emitting) r.points.unshift({ position: position.clone(), age: 0 });
    if (r.points.length > 37) r.points.length = 37;
    r.width = width; r.life = life;
    rebuildRibbon(r, width, life, camera);
  }
  // AIR JAM PATCH: the camera-dependent half of a ribbon, split out so it can be
  // re-run for each split-screen viewport without advancing the ribbon.
  function rebuildRibbon(r, width, life, camera) {
    // Shared camera-facing cross sections keep ribbon joints continuous in flips.
    const edges = r.points.map((p, i) => {
      const before = r.points[Math.max(0, i - 1)].position,
        after = r.points[Math.min(r.points.length - 1, i + 1)].position;
      side.subVectors(after, before);
      up.subVectors(camera.position, p.position);
      side.cross(up).normalize();
      return side
        .clone()
        .multiplyScalar(width * (0.35 + 0.65 * (1 - p.age / life)));
    });
    const pos = r.mesh.geometry.attributes.position,
      uv = r.mesh.geometry.attributes.uv;
    let k = 0;
    for (let i = 0; i < r.points.length - 1; i++) {
      const a = r.points[i],
        b = r.points[i + 1];
      for (const [p, sign] of [
        [a, -1],
        [a, 1],
        [b, -1],
        [a, 1],
        [b, 1],
        [b, -1],
      ]) {
        const fade = 1 - p.age / life;
        point
          .copy(p.position)
          .addScaledVector(edges[p === a ? i : i + 1], sign);
        pos.setXYZ(k, point.x, point.y, point.z);
        uv.setXY(k, fade, sign);
        k++;
      }
    }
    pos.needsUpdate = true;
    uv.needsUpdate = true;
    r.mesh.geometry.setDrawRange(0, k);
    r.mesh.visible = k > 0 && r.strength > 0.002;
  }
  function update(
    dt,
    cars,
    state,
    layout,
    stride,
    fields,
    camera,
    wheelData = {},
    enabled = true,
  ) {
    dt = Math.min(0.1, Math.max(0, dt));
    time += dt;
    cars.forEach((car, i) => {
      const e = entry(car),
        offset = layout.CARS + i * stride,
        serial = state[offset + fields.DODGE_SERIAL],
        doubleSerial =
          fields.DOUBLE_JUMP_SERIAL === undefined
            ? 0
            : state[offset + fields.DOUBLE_JUMP_SERIAL],
        jumpSerial =
          fields.JUMP_SERIAL === undefined
            ? 0
            : state[offset + fields.JUMP_SERIAL];
      const alive =
        enabled &&
        i < state[layout.NUM_CARS] &&
        state[offset + fields.DEMOED] !== 1;
      const teleported = e.last.distanceToSquared(car.position) > 1000 * 1000;
      if (
        !alive ||
        teleported ||
        serial < e.serial ||
        doubleSerial < e.doubleSerial ||
        jumpSerial < e.jumpSerial
      ) {
        e.life = 0;
        e.heatLife = 0;
        for (const p of e.sparks.pool) p.life = 0;
        for (const r of [...e.trails, ...e.dodge]) {
          r.points.length = 0;
          r.strength = 0;
        }
      }
      const secondJump =
        alive &&
        !teleported &&
        e.serial !== null &&
        (serial > e.serial ||
          (e.doubleSerial !== null && doubleSerial > e.doubleSerial));
      const firstJump =
        alive &&
        !teleported &&
        e.jumpSerial !== null &&
        jumpSerial > e.jumpSerial;
      if (secondJump) {
        e.life = 0.48;
        burstParticles(e, car);
      }
      if (firstJump || secondJump) {
        e.heatLife = 0.48;
        e.heat.position
          .set(0, -22, 0)
          .applyQuaternion(car.quaternion)
          .add(car.position);
        e.heat.quaternion.copy(car.quaternion);
      }
      e.serial = serial;
      e.doubleSerial = doubleSerial;
      e.jumpSerial = jumpSerial;

      e.life = Math.max(0, e.life - dt);
      e.heatLife = Math.max(0, e.heatLife - dt);
      e.heat.visible = alive && e.heatLife > 0;
      const fade = e.heatLife / 0.48,
        radius = 42 + (1 - fade) * 125;
      e.heat.scale.set(radius, radius * 0.8, radius);
      e.heat.material.uniforms.radius.value = radius;
      const projection = camera.projectionMatrix?.elements;
      e.heat.material.uniforms.projectionScale.value.set(
        projection?.[0] ?? 1,
        projection?.[5] ?? 1,
      );
      e.heat.material.uniforms.time.value = time;
      e.heat.material.uniforms.strength.value = fade;
      updateParticles(e, car, dt, camera);
      e.last.copy(car.position);
      for (let j = 0; j < 4; j++) {
        const wheel = wheelData.wheels?.[i]?.[j]?.steer,
          spec = wheelData.specs?.[i]?.[j];
        const anchor = anchors[j];
        if (wheel) {
          wheel.updateWorldMatrix(true, false);
          wheel.getWorldPosition(anchor);
          // The emitter follows the tire's lower edge, including suspension and flips.
          up.set(0, -(spec?.[2] ?? 14) * 0.7, 0).applyQuaternion(
            car.quaternion,
          );
          anchor.add(up);
        } else {
          anchor
            .set(j < 2 ? 49 : -37, -12, j % 2 ? -29 : 29)
            .applyQuaternion(car.quaternion)
            .add(car.position);
        }
        updateRibbon(
          e.dodge[j],
          anchor,
          alive && e.life > 0.12,
          1.5,
          0.22,
          dt,
          camera,
        );
        if (j >= 2) {
          const onGround = state[offset + fields.ON_GROUND] === 1;
          const contact =
            fields.WHEELS === undefined
              ? onGround
              : state[
                  offset + fields.WHEELS + j * (wheelData.stride ?? 3) + 2
                ] === 1;
          const grounded = onGround && contact;
          const trail = e.trails[j - 2];
          // Stop immediately on takeoff; never bridge a jump with an old ribbon.
          if (!grounded) {
            trail.points.length = 0;
            trail.strength = 0;
          }
          updateRibbon(
            trail,
            anchor,
            alive && grounded && state[offset + fields.SUPERSONIC] === 1,
            5,
            0.24,
            dt,
            camera,
          );
        }
      }
    });
  }
  function clear() {
    for (const e of entries.values()) {
      e.serial = null;
      e.doubleSerial = null;
      e.jumpSerial = null;
      e.heatLife = 0;
      e.life = 0;
      e.heat.visible = false;
      e.sparks.mesh.visible = false;
      for (const p of e.sparks.pool) p.life = 0;
      for (const r of [...e.trails, ...e.dodge]) {
        r.points.length = 0;
        r.strength = 0;
        r.mesh.material.uniforms.strength.value = 0;
        r.mesh.visible = false;
      }
    }
  }
  // AIR JAM PATCH: re-orient every camera-facing effect (dodge ribbons, wheel
  // trails, ember quads, the heat bubble's projection) for ONE viewport without
  // advancing time. The geometry is shared, so a split-screen match calls this
  // right before drawing each view. Particle stepping with dt = 0 is a no-op.
  function orient(cars, camera) {
    const projection = camera.projectionMatrix?.elements;
    for (const car of cars) {
      const e = entries.get(car);
      if (!e) continue;
      e.heat.material.uniforms.projectionScale.value.set(projection?.[0] ?? 1, projection?.[5] ?? 1);
      updateParticles(e, car, 0, camera);
      for (const r of [...e.dodge, ...e.trails]) {
        if (r.points.length > 1) rebuildRibbon(r, r.width ?? 1.5, r.life ?? 0.22, camera);
      }
    }
  }
  return {
    update,
    orient,
    clear,
    dispose() {
      clear();
      for (const e of entries.values())
        for (const mesh of [
          e.heat,
          e.sparks.mesh,
          ...e.trails.map((r) => r.mesh),
          ...e.dodge.map((r) => r.mesh),
        ]) {
          scene.remove(mesh);
          mesh.geometry.dispose();
          mesh.material.dispose();
        }
      entries.clear();
      snapshot.dispose();
      heatMaterial.dispose();
    },
  };
}
