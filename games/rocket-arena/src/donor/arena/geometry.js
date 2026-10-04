import { createReferenceGoal } from "./goal-visuals.js";
import { createParkCity } from "./park-city.js";
import { createParkLandscape } from "./park-landscape.js";
import { loadParkProps } from "./park-props.js";
import { Lm as InstancedMesh, It as Object3D, xr as Box3 } from "../vendor/three.js";
import { ho as GLTFLoader } from "../vendor/gltf-loader.js";
import { createParkFlags } from "./park-flags.js";
import { createParkTurfMaterial } from "../materials/park-lighting.js";
import { PARK_ART, createParkBackdrop, createParkBankMaterial, createParkBoostPad, createParkFence, createParkHorizon, createParkScenery, createParkTrees, mapParkBankUVs, paintParkPadMarks, paintParkPitch } from "./park.js";
import { Ao, Ct, Ee, F, Gi, Hm, Hs, Ht, Ke, Lt, Ne, Nm, Qt, Tn, Ur, Ut, Wa, Xt, Zm, bd, ci, cn, dt, jn, li, lt, pr, qt, ui, zm } from "../vendor/three.js";
import { hb, hl } from "../vendor/buffer-geometry-utils.js";
import { Ji, Vi, vn } from "../rendering/theme-materials.js";
import { daylightMaterialTypes, daylightReflectionReady, getDaylightReflection } from "../vehicles/imported-models.js";

const SS = 120.507;

const wS = 86.6994;

const MS = 38.6591;

const BS = 13.8757;

const kS = 20.755;

const TS = { length: SS, width: wS, height: MS, forward: BS, up: kS };

function RS(i = TS) {
  const e = new Wa(
    new Nm(new Tn(i.length, i.height, i.width)),
    new Gi({
      color: 16777215,
      transparent: !0,
      opacity: 0.9,
      depthTest: !0,
      depthWrite: !1,
    }),
  );
  return (
    (e.name = "car-hitbox"),
    e.position.set(i.forward, i.up, 0),
    (e.renderOrder = 100),
    (e.visible = !1),
    e
  );
}

const PS = new Set(["Basalt", "Concrete", "Inner fascia", "Tier deck"]);

const hi = 2844350;

const di = 16750126;

function IS(i) {
  if (i instanceof lt)
    if (i.name.startsWith("Seat ")) {
      const e = i.name === "Seat silver" || i.name === "Seat teal";
      (i.color.setHex(e ? di : hi),
        i.color.multiplyScalar(i.name === "Seat silver" ? 0.7 : 0.65));
    } else
      (i.name === "Cyan" || i.name === "Amber") &&
        (i.color.setHex(i.name === "Cyan" ? hi : di), i.emissive.copy(i.color));
}

const LS = {
  Basalt: 2436921,
  Concrete: 7433570,
  "Inner fascia": 2702664,
  "Tier deck": 4937303,
  Titanium: 7831675,
  Canopy: 9602673,
  "Seat petrol": hi,
  "Seat silver": di,
  "Seat teal": di,
  "Seat ochre": hi,
};

function FS(i) {
  if (!(i instanceof lt)) return;
  if (i.name === "Cyan" || i.name === "Amber") {
    (i.color.setHex(i.name === "Cyan" ? hi : di),
      i.emissive.copy(i.color),
      (i.emissiveIntensity = 0.4),
      (i.roughness = 0.9),
      (i.metalness = 0));
    return;
  }
  const e = LS[i.name];
  e !== void 0 &&
    (i.color.setHex(e),
    i.name.startsWith("Seat ") &&
      i.color.multiplyScalar(i.name === "Seat silver" ? 0.7 : 0.65),
    (i.metalness = 0),
    (i.roughness = 0.95),
    (i.envMapIntensity = 0.2));
}

function DS(i) {
  const e = i.name.split(" / ")[0];
  if (!(i instanceof lt) || !PS.has(e)) return i;
  const t = new Zm();
  (Qt.prototype.copy.call(t, i),
    t.color.copy(i.color),
    t.emissive.copy(i.emissive),
    Object.assign(t, {
      emissiveIntensity: i.emissiveIntensity,
      flatShading: i.flatShading,
      fog: i.fog,
      wireframe: i.wireframe,
      wireframeLinewidth: i.wireframeLinewidth,
    }),
    (t.userData = { ...i.userData, stadiumFlatStructure: !0 }),
    (t.onBeforeCompile = i.onBeforeCompile));
  const n = i.customProgramCacheKey.bind(i);
  return (
    (t.customProgramCacheKey = () => `stadium-flat-structure-v1/${n()}`),
    t
  );
}

const Fi = 8192;

const Di = 10240;

const dr = 1536;

const Ri = 1920;

const hg = new WeakMap();

function NS(i) {
  let e = i >>> 0;
  return () => (
    (e = (Math.imul(e, 1664525) + 1013904223) >>> 0),
    e / 4294967296
  );
}

function dg(i, e) {
  const t = document.createElement("canvas");
  ((t.width = i), (t.height = e));
  const n = t.getContext("2d");
  if (!n)
    throw new Error("A 2D canvas is required to generate the stadium turf.");
  return { canvas: t, context: n };
}

const parkTypes = {
  InstancedMesh, Object3D, Box3,
  Group: dt, Mesh: Ee, BufferGeometry: Ct, Float32BufferAttribute: Ke,
  MeshBasicMaterial: cn, ShaderMaterial: Lt, AdditiveBlending: li, BoxGeometry: Tn, CylinderGeometry: Xt,
  SphereGeometry: Ur, Vector3: F, Quaternion: jn, Color: Ne,
  DoubleSide: Ut, SRGBColorSpace: Ht, MirroredRepeatWrapping: 1002,
  RepeatWrapping: 1000, ClampToEdgeWrapping: 1001,
};

function Tp(artwork) {
  const { canvas, context } = dg(dr, Ri);
  paintParkPitch(canvas, context, artwork);
  const texture = new bd(canvas);
  texture.name = "Park / painted checker turf and regulation markings";
  texture.colorSpace = Ht; texture.minFilter = pr; texture.magFilter = qt;
  texture.anisotropy = 4;
  return texture;
}

function GS() {
  const group = new dt(); group.name = "Park / competition turf";
  const texture = Tp();
  const material = createParkTurfMaterial(daylightMaterialTypes, texture);
  const surface = new Ee(new ui(Fi, Di), material);
  surface.name = "Park / painted playing surface";
  surface.rotation.x = -Math.PI / 2;
  group.add(surface);
  hg.set(group, [{ texture, base: texture.image }]);
  return group;
}

async function loadParkArt(turf) {
  const loader = new Ao();
  const exteriorReady = Promise.all([
    loader.loadAsync(PARK_ART.city), loader.loadAsync(PARK_ART.landShade),
    loader.loadAsync(PARK_ART.landscapeDetail), loader.loadAsync(PARK_ART.landscapeReflection),
    loader.loadAsync(PARK_ART.frozenWater),
    loadParkProps(parkTypes, url => new GLTFLoader().loadAsync(url)),
  ]);
  const [panorama, grass, trees, horizon, detail, flags, groundAO, exterior] = await Promise.all([
    loader.loadAsync(PARK_ART.panorama), loader.loadAsync(PARK_ART.pitch),
    loader.loadAsync(PARK_ART.trees), loader.loadAsync(PARK_ART.horizon), loader.loadAsync(PARK_ART.detail),
    loader.loadAsync(PARK_ART.flags),
    loader.loadAsync('/assets/sketchfab/fennec-v2/ground-ao.webp'),
    exteriorReady,
  ]);
  for (const item of hg.get(turf) ?? []) {
    paintParkPitch(item.base, item.base.getContext("2d"), grass.image);
    item.texture.needsUpdate = true;
  }
  grass.dispose();
  detail.wrapS = detail.wrapT = ci;
  detail.colorSpace = Ht; detail.anisotropy = 2;
  turf.getObjectByName("Park / painted playing surface").material.userData.parkGround.detail.value = detail;
  groundAO.colorSpace='';groundAO.flipY=false;
  turf.getObjectByName("Park / painted playing surface").material.userData.parkGround.v2GroundAO.value=groundAO;
  const [cityAtlas, landShade, landDetail, landReflection, frozenWater, props] = exterior;
  landDetail.wrapS = landDetail.wrapT = ci;
  landDetail.colorSpace = Ht; landDetail.anisotropy = 2;
  landReflection.colorSpace = Ht;
  landReflection.wrapS = parkTypes.MirroredRepeatWrapping;
  frozenWater.wrapS = frozenWater.wrapT = ci;
  frozenWater.colorSpace = ''; frozenWater.anisotropy = 1;
  const group = new dt();
  group.add(
    createParkBackdrop(parkTypes, panorama), createParkHorizon(parkTypes, horizon),
    createParkCity(parkTypes, landReflection, cityAtlas), createParkTrees(parkTypes, trees),
    createParkFlags(parkTypes, flags),
    createParkLandscape(parkTypes, landReflection, landDetail, landShade, frozenWater), props,
  );
  return group;
}
// Shared low-poly pad templates: baked vertex shading, one draw per visible pad.
function arcadeBoostPad(big, active) {
  return createParkBoostPad(parkTypes, big, active);
}

function OS(i, e) {
  for (const t of hg.get(i) ?? []) HS(t, e);
}

function HS(i, e) {
  const signature = e.map(pad => `${pad.pos[0]},${pad.pos[1]},${pad.isBig}`).join(";");
  if (signature === i.padSignature) return;
  const { canvas, context } = dg(dr, Ri);
  context.drawImage(i.base, 0, 0);
  paintParkPadMarks(canvas, context, e);
  i.texture.image = canvas; i.texture.needsUpdate = true; i.padSignature = signature;
}

const US = 5120;

const ja = 280;

const WA = "/assets/arena/stadium";

const ug = new Ne(hi);

const fg = new Ne(di);

function Vh(i) {
  const e = i.positions.length / 3;
  if (
    !Number.isInteger(e) ||
    i.normals.length !== e * 3 ||
    i.uv.length !== e * 2
  )
    throw new Error(
      "Baked stadium boundary has inconsistent vertex attributes",
    );
  const t = new Ct();
  return (
    t.setAttribute("position", new Ke(i.positions, 3)),
    t.setAttribute("normal", new Ke(i.normals, 3)),
    t.setAttribute("uv", new Ke(i.uv, 2)),
    t.setIndex(i.indices),
    t.computeBoundingSphere(),
    t
  );
}

function qS(i) {
  const e = [
      { positions: [], normals: [], uv: [], indices: [] },
      { positions: [], normals: [], uv: [], indices: [] },
    ],
    t = (n) => [
      ...i.positions.slice(n * 3, n * 3 + 3),
      ...i.normals.slice(n * 3, n * 3 + 3),
      ...i.uv.slice(n * 2, n * 2 + 2),
    ];
  for (let n = 0; n < i.indices.length; n += 3) {
    const r = [t(i.indices[n]), t(i.indices[n + 1]), t(i.indices[n + 2])];
    for (let s = 0; s < 2; s++) {
      const a = [];
      for (let A = 0; A < 3; A++) {
        const l = r[A],
          c = r[(A + 1) % 3],
          h = s === 0 ? l[1] <= ja : l[1] >= ja,
          d = s === 0 ? c[1] <= ja : c[1] >= ja;
        if ((h && a.push(l), h !== d)) {
          const u = (ja - l[1]) / (c[1] - l[1]);
          a.push(l.map((p, v) => p + (c[v] - p) * u));
        }
      }
      const o = e[s];
      for (let A = 1; A < a.length - 1; A++)
        for (const l of [a[0], a[A], a[A + 1]])
          (o.indices.push(o.positions.length / 3),
            o.positions.push(...l.slice(0, 3)),
            o.normals.push(...l.slice(3, 6)),
            o.uv.push(...l.slice(6, 8)));
    }
  }
  return e;
}

function $S(i) {
  const e = i.filter((n) => n.indices.length > 0).map(Vh),
    t = hl(e);
  for (const n of e) n.dispose();
  if (!t) throw new Error("Baked stadium geometry could not be assembled");
  return t;
}

async function zS() {
  const loader = new Ao();
  getDaylightReflection();
  const [albedo, reflection] = await Promise.all([
    loader.loadAsync(PARK_ART.bank), daylightReflectionReady,
  ]);
  return createParkBankMaterial(parkTypes, albedo, reflection);
}

function VS() {
  const i = new cn({
    color: 16777215,
    transparent: !0,
    opacity: 1,
    depthWrite: !1,
    side: Ut,
    toneMapped: !1,
    forceSinglePass: !0,
  });
  return (
    (i.name =
      "Stadium · transparent large-hexagon enclosure"),
    (i.onBeforeCompile = (e) => {
      ((e.uniforms.goalBlue = { value: ug }),
        (e.uniforms.goalOrange = { value: fg }),
        (e.vertexShader = e.vertexShader
          .replace(
            "#include <common>",
            `
      #include <common>
      varying vec3 vBoundaryPosition;
      varying vec3 vBoundaryNormal;
    `,
          )
          .replace(
            "#include <begin_vertex>",
            `
      #include <begin_vertex>
      vBoundaryPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      vBoundaryNormal = normalize(mat3(modelMatrix) * normal);
    `,
          )),
        (e.fragmentShader = e.fragmentShader
          .replace(
            "#include <common>",
            `
      #include <common>
      varying vec3 vBoundaryPosition;
      varying vec3 vBoundaryNormal;
      uniform vec3 goalBlue;
      uniform vec3 goalOrange;
      float goalHexGrid(vec2 p, float spacing) {
        vec2 q=p/spacing,h=vec2(1.,1.7320508);
        vec2 a=mod(q,h)-h*.5,b=mod(q-h*.5,h)-h*.5;
        vec2 g=dot(a,a)<dot(b,b)?a:b;
        float edge=.5-max(abs(g.x),dot(abs(g),vec2(.5,.8660254)));
        float aa=max(fwidth(edge),.009);
        float wire=1.-smoothstep(.012-aa*.4,.012+aa,edge);
        // Distant threads fade rather than aliasing into bright dots.
        return wire*(1.-smoothstep(.10,.40,aa));
      }
      float wallHexGrid(vec3 p, vec3 n) {
        // Blend projections around the curved corners without adding geometry.
        vec3 weights=pow(abs(n),vec3(8.));
        weights/=max(dot(weights,vec3(1.)),.0001);
        return dot(weights,vec3(goalHexGrid(p.zy,500.),
          goalHexGrid(p.xz,500.),goalHexGrid(p.xy,500.)));
      }
    `,
          )
          .replace(
            "#include <color_fragment>",
            `
      #include <color_fragment>
      vec3 p = vBoundaryPosition;
      vec3 normal = normalize(vBoundaryNormal);
      vec3 view = normalize(cameraPosition - p);
      float facing = abs(dot(normal, view));
      float range = distance(cameraPosition, p);
      float distanceFade = 1.0 - smoothstep(3500.0, 13000.0, range) * .45;
      float hexagons = wallHexGrid(p, normal);
      vec3 tint = vec3(.58, .73, .78);
      float alpha = hexagons * .32 * distanceFade * (.75 + .25 * facing);
      if (abs(p.z) > 5340.0) {
        vec2 netUV=abs(normal.z)>.5?p.xy:(abs(normal.y)>.5?p.xz:p.zy);
        float honeycomb=goalHexGrid(netUV,36.);
        tint = mix(vec3(.48,.65,.71),mix(goalBlue,goalOrange,step(0.,p.z)),.16);
        alpha = honeycomb * .42 * distanceFade;
      }
      alpha *= 1. - smoothstep(2100., 3000., cameraPosition.y) * .90;
      diffuseColor.rgb = tint;
      diffuseColor.a = alpha;
    `,
          )));
    }),
    (i.customProgramCacheKey = () => "park-continuous-net-v5-wall-ceiling-hexagons"),
    i
  );
}
function Pp(root, side) {
  root.add(createReferenceGoal(parkTypes, getDaylightReflection(), side));
}
async function WS() {
  const [i, e] = await Promise.all([
    fetch(`${WA}/continuous-boundary.json.gz`),
    zS(),
  ]);
  if (!i.ok)
    throw new Error(`Continuous stadium boundary could not load (${i.status})`);
  const t = await new Response(i.body.pipeThrough(new DecompressionStream('gzip'))).json();
  if (t.version !== 1 || !t.lower || !t.upper || !t.goal || !t.ceiling)
    throw new Error(
      "Continuous stadium boundary asset has an unsupported format",
    );
  const [n, r] = qS(t.goal),
    s = new dt();
  s.name = "Stadium · continuous playing enclosure";
  const a = Vh(n);
  a.deleteAttribute("normal");
  const o = hb(a, 1e-4);
  (a.dispose(), o.computeVertexNormals());
  const A = Vh(t.lower),
    l = hl([A, o]);
  if ((A.dispose(), o.dispose(), !l))
    throw new Error("Field and goal banks could not be assembled");
  mapParkBankUVs(l);
  const c = new Ee(l, e);
  ((c.name = "Continuous field and recessed goal banks · arc-length UVs"),
    (c.receiveShadow = !0));
  const h = new Ee($S([t.upper, t.ceiling, r]), VS());
  return (
    (h.name = "Continuous corner / wall / ceiling · single-pass grid"),
    (h.userData.bloomOccluder = !1),
    s.add(c, h, createParkFence(parkTypes)),
    Pp(s, -1),
    Pp(s, 1),
    (s.userData.continuousBoundaryAsset = `${WA}/continuous-boundary.json`),
    (s.userData.bakeMetrics = t.metrics),
    Ji(s),
    s
  );
}

function XS(i) {
  return vn(Ip(Vi(i, "arcade")), Ip(Vi(i, "realistic")));
}

function Ip(i) {
  const e = i.clone();
  return (
    (e.name = `${i.name} / field side`),
    (e.userData.fieldSideOnly = !0),
    (e.onBeforeCompile = (t) => {
      ((t.vertexShader = t.vertexShader
        .replace(
          "#include <common>",
          `
      #include <common>
      varying vec2 vStadiumPoint;
    `,
        )
        .replace(
          "#include <begin_vertex>",
          `
      #include <begin_vertex>
      vStadiumPoint = (modelMatrix * vec4(position, 1.0)).xz;
    `,
        )),
        (t.fragmentShader = t.fragmentShader
          .replace(
            "#include <common>",
            `
      #include <common>
      varying vec2 vStadiumPoint;
    `,
          )
          .replace(
            "#include <clipping_planes_fragment>",
            `
      #include <clipping_planes_fragment>
      // Evaluate per fragment: long rails cross the rounded corner region,
      // where interpolating vertex-side tests would leave their centers visible.
      vec2 stadiumCore = clamp(vStadiumPoint, vec2(-3150.0, -4800.0), vec2(3150.0, 4800.0));
      vec2 stadiumOutward = vStadiumPoint - stadiumCore;
      if (dot(cameraPosition.xz - vStadiumPoint, stadiumOutward) > 0.0) discard;
    `,
          )));
    }),
    (e.customProgramCacheKey = () => "stadium-field-side-decoration-v2"),
    e
  );
}

// One opaque, alpha-tested batch replaces thousands of tiny seat faces.
// The original export stores each seat as eight vertices (base + backrest).
function makeRoundCrowd(seats, lightweight) {
  const positions = [], corners = [], uv = [], colors = [], indices = [];
  const center = new F(), point = new F(), low = new F(), high = new F();
  for (const mesh of seats) {
    const source = mesh.geometry.getAttribute("position");
    const color = new Ne(LS[mesh.material.name] ?? 0xbad9e2);
    const stride = lightweight ? 16 : 8;
    for (let start = 0; start + 7 < source.count; start += stride) {
      center.set(0, 0, 0);
      low.set(Infinity, Infinity, Infinity); high.set(-Infinity, -Infinity, -Infinity);
      for (let k = 0; k < 8; k++) {
        point.fromBufferAttribute(source, start + k).applyMatrix4(mesh.matrixWorld);
        center.add(point); low.min(point); high.max(point);
      }
      // Petrol material also contains long painted strips, not spectators.
      if (high.x - low.x > 80 || high.z - low.z > 80 || high.y - low.y < 20 || high.y - low.y > 80) continue;
      center.multiplyScalar(1 / 8);
      center.y += 29;
      const base = positions.length / 3;
      const shade = 0.72 + ((start / 8) % 5) * 0.055;
      for (const [x, y] of [[-1,-1], [1,-1], [1,1], [-1,1]]) {
        positions.push(center.x, center.y, center.z);
        corners.push(x * 28, y * 38);
        uv.push((x + 1) / 2, (y + 1) / 2);
        colors.push(color.r * shade, color.g * shade, color.b * shade);
      }
      indices.push(base, base+1, base+2, base, base+2, base+3);
    }
  }
  const { canvas, context } = dg(64, 64);
  const gradient = context.createRadialGradient(25, 19, 2, 32, 32, 32);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.65, "#d5e2ec");
  gradient.addColorStop(1, "#78899e");
  context.fillStyle = gradient;
  context.beginPath(); context.ellipse(32, 32, 27, 30, 0, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#243248";
  for (const x of [24, 39]) { context.beginPath(); context.ellipse(x, 26, 2, 3, 0, 0, Math.PI * 2); context.fill(); }
  const map = new bd(canvas); map.colorSpace = Ht;
  const material = new cn({ map, vertexColors: true, alphaTest: 0.5 });
  material.name = "Round crowd / single batch";
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = "attribute vec2 crowdCorner;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace("#include <project_vertex>", `
      vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
      mvPosition.xy += crowdCorner;
      gl_Position = projectionMatrix * mvPosition;
    `);
  };
  material.customProgramCacheKey = () => "round-crowd-v1";
  const geometry = new Ct();
  geometry.setAttribute("position", new Ke(positions, 3));
  geometry.setAttribute("crowdCorner", new Ke(corners, 2));
  geometry.setAttribute("uv", new Ke(uv, 2));
  geometry.setAttribute("color", new Ke(colors, 3));
  geometry.setIndex(indices); geometry.computeBoundingSphere();
  geometry.boundingSphere.radius += 50;
  const crowd = new Ee(geometry, material);
  crowd.name = "Stadium / round spectators";
  return crowd;
}

async function JS() {
  return createParkScenery(parkTypes);
}

function KS() {
  // Replaced by the loaded painted panorama before the first frame.
  return new dt();
}

export { GS, JS, KS, OS, RS, WS, arcadeBoostPad, loadParkArt };
