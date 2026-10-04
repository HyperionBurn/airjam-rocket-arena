
var xg = Object.defineProperty;

var Cg = (i, e, t) =>
  e in i
    ? xg(i, e, { enumerable: !0, configurable: !0, writable: !0, value: t })
    : (i[e] = t);

var _ = (i, e, t) => Cg(i, typeof e != "symbol" ? e + "" : e, t);

export { _ };
