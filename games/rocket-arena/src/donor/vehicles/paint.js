import { PEARL_COLORS } from "../materials/pearl.js";
import { createCarMaterialSet } from "../materials/car.js";
import { vn } from "../rendering/theme-materials.js";
import { daylightMaterialTypes, getDaylightReflection } from "./imported-models.js";

const Zb = PEARL_COLORS.orange;

const rp = new Map();

function ul(i, e = Zb) {
  const key = `${e.primary}/${e.realisticPrimary ?? e.primary}/${e.pearl ?? e.primary}`;
  if (!rp.has(key)) {
    rp.set(key, createCarMaterialSet(daylightMaterialTypes, e, getDaylightReflection(), vn));
  }
  return rp.get(key);
}

export { ul };
