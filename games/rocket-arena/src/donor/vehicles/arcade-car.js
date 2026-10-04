import { PEARL_COLORS } from "../materials/pearl.js";
import { $d } from "./flat-car.js";

const n1 = PEARL_COLORS.orange;

function r1(i) {
  return i === "flat-car" ? n1 : $d;
}

export { r1 };
