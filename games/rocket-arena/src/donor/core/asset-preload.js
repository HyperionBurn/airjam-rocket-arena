
const mC = "/assets/app-icon-512-DPODCpjJ.webp";

const gC = "modulepreload";

const vC = function (i) {
    return "/" + i;
  };

const Bf = {};

const d0 = function (e, t, n) {
    let r = Promise.resolve();
    if (t && t.length > 0) {
      document.getElementsByTagName("link");
      const a = document.querySelector("meta[property=csp-nonce]"),
        o =
          (a == null ? void 0 : a.nonce) ||
          (a == null ? void 0 : a.getAttribute("nonce"));
      r = Promise.allSettled(
        t.map((A) => {
          if (((A = vC(A)), A in Bf)) return;
          Bf[A] = !0;
          const l = A.endsWith(".css"),
            c = l ? '[rel="stylesheet"]' : "";
          if (document.querySelector(`link[href="${A}"]${c}`)) return;
          const h = document.createElement("link");
          if (
            ((h.rel = l ? "stylesheet" : gC),
            l || (h.as = "script"),
            (h.crossOrigin = ""),
            (h.href = A),
            o && h.setAttribute("nonce", o),
            document.head.appendChild(h),
            l)
          )
            return new Promise((d, u) => {
              (h.addEventListener("load", d),
                h.addEventListener("error", () =>
                  u(new Error(`Unable to preload CSS for ${A}`)),
                ));
            });
        }),
      );
    }
    function s(a) {
      const o = new Event("vite:preloadError", { cancelable: !0 });
      if (((o.payload = a), window.dispatchEvent(o), !o.defaultPrevented))
        throw a;
    }
    return r.then((a) => {
      for (const o of a || []) o.status === "rejected" && s(o.reason);
      return e().catch(s);
    });
  };

export { d0, mC };
