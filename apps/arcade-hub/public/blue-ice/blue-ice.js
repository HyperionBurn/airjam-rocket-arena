/* @ds-bundle: {"format":4,"namespace":"BlueIce","components":[{"name":"Wordmark"},{"name":"Button"},{"name":"Tag"},{"name":"FactGrid"},{"name":"Ruler"},{"name":"Annotation"}]} */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";

  function el(tag, attrs, parent, text) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  }
  function h(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  var uid = 0;

  // Wordmark: the event name, fitted to `width` and struck once.
  function Wordmark(opts) {
    opts = opts || {};
    var lines = opts.lines || ["hello,", "world!"];
    var width = opts.width || 960;
    var impact = opts.impact || { line: 0, char: lines[0].length - 1 };
    var seed = opts.seed == null ? 20261006 : opts.seed;
    var stretch = opts.stretch || 82;
    var crack = opts.crack !== false;
    var bleed = !!opts.bleed;
    var id = "bi" + (++uid);

    var svg = el("svg", { xmlns: NS, class: "bi-wordmark", role: "img", "aria-label": lines.join(" ") });
    var defs = el("defs", {}, svg);
    var words = el("g", { id: id + "-t" }, defs);
    var style = "font-family:var(--font-display);font-weight:900;letter-spacing:-0.05em;font-variation-settings:'wdth' " + stretch + ";fill:var(--text)";

    // measure in a hidden svg so fonts and stretch are the real ones
    var probeSvg = el("svg", { width: 10, height: 10, style: "position:absolute;visibility:hidden" });
    document.body.appendChild(probeSvg);
    var widest = 0;
    lines.forEach(function (l) {
      var t = el("text", { "font-size": 100, style: style }, probeSvg, l);
      widest = Math.max(widest, t.getBBox().width);
    });
    var fs = 100 * width / (widest || 1);
    var y0 = Math.round(fs * 0.735), lead = Math.round(fs * 0.86);
    var halo = el("g", {}, defs);
    lines.forEach(function (l, i) {
      el("text", { x: -fs * 0.035, y: y0 + i * lead, "font-size": fs.toFixed(2), style: style }, words, l);
      el("text", { x: -fs * 0.035, y: y0 + i * lead, "font-size": fs.toFixed(2), style: style.replace("fill:var(--text)", "fill:var(--bloom)") }, halo, l);
    });
    var height = Math.ceil(y0 + (lines.length - 1) * lead + fs * 0.06);
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);

    // locate the impact glyph through a measurement copy
    var m = el("text", { x: -fs * 0.035, y: y0 + impact.line * lead, "font-size": fs.toFixed(2), style: style }, probeSvg, lines[impact.line]);
    var box = m.getExtentOfChar(Math.min(impact.char, lines[impact.line].length - 1));
    var P = { x: box.x + box.width * 0.5, y: box.y + box.height * 0.7 };
    probeSvg.remove();

    var glow = el("filter", { id: id + "-f", x: "-20%", y: "-30%", width: "140%", height: "160%" }, defs);
    el("feGaussianBlur", { stdDeviation: (fs * 0.085).toFixed(1) }, glow);
    var grad = el("radialGradient", { id: id + "-b" }, defs);
    el("stop", { offset: "0", style: "stop-color:var(--bloom);stop-opacity:.5" }, grad);
    el("stop", { offset: ".45", style: "stop-color:var(--bloom);stop-opacity:.16" }, grad);
    el("stop", { offset: "1", style: "stop-color:var(--bloom);stop-opacity:0" }, grad);

    var shards = el("g", {}, svg);
    el("circle", { cx: P.x, cy: P.y, r: (fs * 1.6).toFixed(1), fill: "url(#" + id + "-b)" }, svg);
    halo.setAttribute("id", id + "-h");
    el("use", { href: "#" + id + "-h", filter: "url(#" + id + "-f)", opacity: ".6" }, svg);
    var textG = el("g", {}, svg), crackG = el("g", {}, svg);
    if (!bleed) {
      var box = el("clipPath", { id: id + "-box" }, defs);
      el("rect", { x: 0, y: 0, width: width, height: height }, box);
      [shards, textG, crackG].forEach(function (g) { g.setAttribute("clip-path", "url(#" + id + "-box)"); });
    }

    if (!crack) {
      el("use", { href: "#" + id + "-t" }, textG);
      return svg;
    }

    var R = rng(seed), RAYS = 24, k, i;
    var s = fs / 300; // the poster's fracture was tuned at a 300px wordmark
    var radii = [0, 16, 38, 70, 115, 178, 262, 380, 545, 780, 1150, 2600].map(function (r) { return r * s; });
    var angles = [];
    for (i = 0; i < RAYS; i++) angles.push((i + 0.1 + R() * 0.8) / RAYS * Math.PI * 2);
    var pt = [];
    for (k = 0; k < radii.length; k++) {
      pt[k] = [];
      for (i = 0; i < RAYS; i++) {
        if (k === 0) { pt[k][i] = { x: P.x, y: P.y }; continue; }
        var r = radii[k] * (0.82 + R() * 0.36), a = angles[i] + (R() - 0.5) * 0.06;
        pt[k][i] = { x: P.x + Math.cos(a) * r, y: P.y + Math.sin(a) * r };
      }
    }
    var ringP = [1, 1, 1, 0.95, 0.85, 0.7, 0.55, 0.4, 0.28, 0.16, 0, 0];
    var ring = pt.map(function (_, kk) { return angles.map(function () { return kk > 0 && R() < ringP[kk]; }); });
    var rayEnd = angles.map(function () { return 6 + Math.floor(R() * 6); });
    function fmt(p) { return "M" + p.map(function (q) { return q.x.toFixed(2) + " " + q.y.toFixed(2); }).join("L"); }
    var n = 0;
    for (k = 0; k < radii.length - 1; k++) {
      for (i = 0; i < RAYS; i++) {
        var j = (i + 1) % RAYS;
        var poly = k === 0 ? [pt[0][i], pt[1][i], pt[1][j]] : [pt[k][i], pt[k + 1][i], pt[k + 1][j], pt[k][j]];
        var pieces = [poly], diag = null;
        if (k >= 1 && k <= 3) {
          if (R() < 0.5) { pieces = [[poly[0], poly[1], poly[2]], [poly[0], poly[2], poly[3]]]; diag = [poly[0], poly[2]]; }
          else { pieces = [[poly[0], poly[1], poly[3]], [poly[1], poly[2], poly[3]]]; diag = [poly[1], poly[3]]; }
        }
        for (var pi = 0; pi < pieces.length; pi++) {
          var pc = pieces[pi];
          var cx = 0, cy = 0;
          pc.forEach(function (p) { cx += p.x; cy += p.y; });
          cx /= pc.length; cy /= pc.length;
          var dx = cx - P.x, dy = cy - P.y, dist = Math.hypot(dx, dy) || 1, ds = dist / s;
          var push = s * (6.5 * Math.exp(-ds / 120) + 1.6 * Math.exp(-ds / 420) + R() * 0.8 * Math.exp(-ds / 300));
          var rot = (R() - 0.5) * 1.6 * Math.exp(-ds / 260);
          var tf = "translate(" + (dx / dist * push).toFixed(2) + " " + (dy / dist * push).toFixed(2) + ") rotate(" + rot.toFixed(3) + " " + cx.toFixed(1) + " " + cy.toFixed(1) + ")";
          var d = fmt(pc) + "Z";
          var near = Math.exp(-ds / 70);
          el("path", { d: d, transform: tf, style: "fill:var(--frost);fill-opacity:" + (R() * 0.06 * Math.exp(-ds / 350) + Math.exp(-ds / 40) * 0.3).toFixed(3) }, shards);
          var cp = el("clipPath", { id: id + "-c" + n }, defs);
          el("path", { d: d }, cp);
          var g = el("g", { transform: tf }, textG);
          el("use", { href: "#" + id + "-t", "clip-path": "url(#" + id + "-c" + n + ")" }, g);
          n++;
          var op = Math.max(0.12, 1 - k * 0.1).toFixed(2), sw = (Math.max(0.7, 1.9 - k * 0.13) * Math.max(0.6, s)).toFixed(2);
          var cs = "stroke:var(--crack);fill:none;stroke-linecap:round;stroke-width:" + sw + ";stroke-opacity:" + op;
          if (pi === 0) {
            if (k + 1 <= rayEnd[i]) el("path", { d: fmt([pt[k][i], pt[k + 1][i]]), transform: tf, style: cs }, crackG);
            if (ring[k + 1][i]) el("path", { d: fmt([pt[k + 1][i], pt[k + 1][j]]), transform: tf, style: cs }, crackG);
          }
          if (pi === 1 && diag) el("path", { d: fmt(diag), transform: tf, style: "stroke:var(--crack);fill:none;stroke-width:.8;stroke-opacity:.7" }, crackG);
        }
      }
    }
    svg.impact = P;
    return svg;
  }

  function Button(opts) {
    opts = opts || {};
    var b = h(opts.href ? "a" : "button", "bi-button" + (opts.variant === "outline" ? " bi-button--outline" : ""), opts.label || "<RSVP>");
    if (opts.href) b.href = opts.href; else b.type = "button";
    return b;
  }

  function Tag(text) { return h("span", "bi-tag", text); }

  function FactGrid(facts) {
    var root = h("dl", "bi-facts");
    root.appendChild(Ruler({ ticks: 48 }));
    (facts || []).forEach(function (f) {
      var c = h("div", "bi-facts__cell");
      c.appendChild(h("dt", "bi-label", f.label));
      c.appendChild(h("dd", "bi-facts__main", f.value));
      if (f.note) c.appendChild(h("dd", "bi-facts__note", f.note));
      root.appendChild(c);
    });
    return root;
  }

  function Ruler(opts) {
    opts = opts || {};
    var count = opts.ticks || 48, every = opts.every || 8;
    var svg = el("svg", { class: "bi-ruler", viewBox: "0 0 " + count * 10 + " 14", preserveAspectRatio: "none", "aria-hidden": "true" });
    el("line", { x1: 0, x2: count * 10, y1: 1, y2: 1, "vector-effect": "non-scaling-stroke", style: "stroke:var(--rule);stroke-width:2" }, svg);
    for (var t = 0; t <= count; t++) {
      var x = Math.min(count * 10 - 0.5, Math.max(0.5, t * 10));
      el("line", { x1: x, x2: x, y1: 1, y2: t % every === 0 ? 13 : 7, "vector-effect": "non-scaling-stroke", style: "stroke:var(--rule);stroke-width:1" }, svg);
    }
    return svg;
  }

  function Annotation(opts) {
    opts = opts || {};
    var a = h("figure", "bi-annot");
    a.appendChild(h("span", "bi-annot__ring"));
    a.appendChild(h("span", "bi-annot__leader"));
    var cap = h("figcaption", "bi-label", opts.label || "FIG. 1  POINT OF IMPACT");
    a.appendChild(cap);
    return a;
  }

  window.BlueIce = { Wordmark: Wordmark, Button: Button, Tag: Tag, FactGrid: FactGrid, Ruler: Ruler, Annotation: Annotation };
})();
