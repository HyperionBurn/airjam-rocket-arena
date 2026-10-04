import { _ } from "../core/class-fields.js";
import { Am } from "./actions.js";
import { WM, lm } from "./observations.js";

class NextoAgent {
  constructor() {
    _(this, "outputNames", ["logits"]);
  }
  initialInputs() {
    return lm({
      query: new Float32Array(32),
      entities: new Float32Array(37 * 24),
      mask: new Float32Array(37),
    });
  }
  build(e, t, n, r, s) {
    return lm(WM(e, t, n, r, s));
  }
  decode(e) {
    const t = e.logits;
    if (!t || t.length !== Am.length)
      throw new Error("Nexto returned an invalid action layout.");
    let n = 0;
    for (let r = 0; r < t.length; r++) {
      if (!Number.isFinite(t[r]))
        throw new Error("Nexto produced an invalid action.");
      t[r] > t[n] && (n = r);
    }
    return { ...Am[n] };
  }
  reset() {}
}

export { NextoAgent };
