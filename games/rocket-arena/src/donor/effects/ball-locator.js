import { _ } from "../core/class-fields.js";
import { Ee, F, Gt, Ht, Pm, bd, dt, il, kd, lt, qt, yd } from "../vendor/three.js";

const kp = 100;

const mS = 1e4;

const gS = 75;

const vS = 120;

const jS = 20;

const _S = 48;

const ES = new F(1, 0, 0);

function yS() {
  const e = document.createElement("canvas");
  ((e.width = 128), (e.height = 128));
  const t = e.getContext("2d");
  if (!t) throw new Error("Could not create the ball locator halo texture");
  const n = t.createRadialGradient(
    128 / 2,
    128 / 2,
    0,
    128 / 2,
    128 / 2,
    128 / 2,
  );
  (n.addColorStop(0, "rgba(0, 0, 0, 0.38)"),
    n.addColorStop(0.28, "rgba(0, 0, 0, 0.31)"),
    n.addColorStop(0.58, "rgba(0, 0, 0, 0.16)"),
    n.addColorStop(0.82, "rgba(0, 0, 0, 0.045)"),
    n.addColorStop(1, "rgba(0, 0, 0, 0)"),
    (t.fillStyle = n),
    t.fillRect(0, 0, 128, 128));
  const r = new bd(e);
  ((r.colorSpace = Ht), (r.minFilter = qt), (r.magFilter = qt));
  const s = new Pm(
    new yd({
      map: r,
      transparent: !0,
      depthTest: !1,
      depthWrite: !1,
      toneMapped: !1,
    }),
  );
  return (
    (s.name = "ball-locator-clarity-halo"),
    s.scale.setScalar(_S),
    (s.renderOrder = 9),
    s
  );
}

function xS() {
  return new lt({
    color: 12764618,
    emissive: 4474699,
    emissiveIntensity: 0.5,
    metalness: 0.1,
    roughness: 0.52,
    transparent: !0,
    opacity: 0.92,
    depthTest: !1,
    depthWrite: !1,
  });
}

function CS() {
  const i = new il();
  (i.moveTo(-7, -2.4),
    i.lineTo(1.5, -2.4),
    i.lineTo(1.5, -5.2),
    i.lineTo(8, 0),
    i.lineTo(1.5, 5.2),
    i.lineTo(1.5, 2.4),
    i.lineTo(-7, 2.4),
    i.closePath());
  const e = new kd(i, {
    depth: 4,
    bevelEnabled: !0,
    bevelSegments: 2,
    bevelSize: 0.7,
    bevelThickness: 0.7,
    curveSegments: 2,
  });
  e.translate(0, 0, -2);
  const t = new Ee(e, xS());
  return ((t.name = "ball-locator-arrow"), (t.renderOrder = 10), t);
}

class BallLocator {
  constructor() {
    _(this, "object", new dt());
    _(this, "clarityHalo", yS());
    _(this, "visual", CS());
    _(this, "direction", new F());
    ((this.object.name = "ball-locator"),
      (this.object.visible = !1),
      this.object.add(this.clarityHalo),
      this.object.add(this.visual));
  }
  update(e, t, n) {
    if (n || !(e != null && e.visible)) {
      this.object.visible = !1;
      return;
    }
    this.direction.subVectors(t.position, e.position);
    const r = this.direction.length();
    if (r < 1e-4) {
      this.object.visible = !1;
      return;
    }
    this.direction.multiplyScalar(1 / r);
    const s = Gt.clamp((r - kp) / (mS - kp), 0, 1),
      a = Gt.lerp(gS, vS, s);
    ((this.object.visible = !0),
      this.object.position.copy(e.position).addScaledVector(this.direction, a),
      (this.object.position.y += jS),
      this.object.quaternion.setFromUnitVectors(ES, this.direction));
  }
}

export { BallLocator };
