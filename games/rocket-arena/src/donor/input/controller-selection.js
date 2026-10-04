import { createSettingsStore, readNumber } from "../core/settings-store.js";

const Od = createSettingsStore(
  "rocket-arena.controller.v1",
  () => ({ id: null, index: null }),
  (i, e) => {
    (typeof e.id == "string" && e.id.length > 0 && (i.id = e.id),
      typeof e.index == "number" &&
        Number.isFinite(e.index) &&
        e.index >= 0 &&
        (i.index = readNumber(e.index, 0, { min: 0, integer: !0 })));
  },
);

let so;

const GA = new Set();

function OA() {
  var i;
  try {
    return typeof navigator > "u"
      ? []
      : (((i = navigator.getGamepads) == null ? void 0 : i.call(navigator)) ??
          []);
  } catch {
    return [];
  }
}

function Hd() {
  return (so ?? (so = Od.load()), { ...so });
}

function $C(i) {
  const e = Hd(),
    t = i ? { id: i.id, index: i.index } : { id: null, index: null };
  if (!(e.id === t.id && e.index === t.index)) {
    if (((so = t), GA.clear(), i))
      for (const n of OA())
        n != null &&
          n.connected &&
          n.id === i.id &&
          n.index !== i.index &&
          GA.add(n.index);
    (Od.save(t),
      typeof window < "u" &&
        window.dispatchEvent(new Event("controllerselectionchanged")));
  }
}

function Ks() {
  const i = Hd(),
    e = OA().filter((a) => !!(a != null && a.connected));
  if (i.id === null)
    return e.find((a) => a.mapping === "standard") ?? e[0] ?? null;
  const t = e.filter((a) => a.id === i.id),
    n = t.find((a) => a.index === i.index);
  if (n) {
    for (const a of t) a.index !== n.index && GA.add(a.index);
    return n;
  }
  const r = t.filter((a) => !GA.has(a.index));
  if (r.length !== 1) return null;
  const s = r[0];
  return ((so = { id: s.id, index: s.index }), Od.save(so), s);
}

export { $C, Hd, Ks, OA };
