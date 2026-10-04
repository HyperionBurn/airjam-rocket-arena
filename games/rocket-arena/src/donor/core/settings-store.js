
function readStoredValue(i) {
  try {
    const current = localStorage.getItem(i);
    if (current !== null || !i.startsWith("rocket-arena")) return current;
    // Carry existing local preferences across the product rename.
    return localStorage.getItem(i.replace(/^rocket-arena/, "car-soccer"));
  } catch {
    return null;
  }
}

function createSettingsStore(i, e, t) {
  const n = () => {
    const r = e(),
      s = readStoredValue(i);
    if (!s) return r;
    try {
      const a = JSON.parse(s);
      return isRecord(a) ? (t(r, a), r) : e();
    } catch {
      return e();
    }
  };
  return {
    key: i,
    defaults: e,
    load: n,
    loadInto(r) {
      return Object.assign(r, n());
    },
    save(r) {
      try {
        localStorage.setItem(i, JSON.stringify(r));
      } catch {}
    },
    clear() {
      try {
        localStorage.removeItem(i);
      } catch {}
    },
  };
}

function isRecord(i) {
  return typeof i == "object" && i !== null && !Array.isArray(i);
}

function readBoolean(i, e) {
  return typeof i == "boolean" ? i : e;
}

function readNumber(i, e, t = {}) {
  if (typeof i != "number" || !Number.isFinite(i)) return e;
  let n = i;
  return (
    t.integer && (n = Math.round(n)),
    t.min !== void 0 && (n = Math.max(t.min, n)),
    t.max !== void 0 && (n = Math.min(t.max, n)),
    n
  );
}

function readChoice(i, e, t) {
  return typeof i == "string" && e.includes(i) ? i : t;
}

function readList(i, e, t) {
  return Array.isArray(i) ? i.filter(e).slice(0, t) : null;
}

export { createSettingsStore, isRecord, readBoolean, readChoice, readList, readNumber };
