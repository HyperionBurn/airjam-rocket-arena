
const wA = Object.freeze({
  throttle: 0,
  steer: 0,
  pitch: 0,
  yaw: 0,
  roll: 0,
  jump: !1,
  boost: !1,
  handbrake: !1,
});

function Eg(i) {
  return [
    i.throttle,
    i.steer,
    i.pitch,
    i.yaw,
    i.roll,
    +i.jump,
    +i.boost,
    +i.handbrake,
  ];
}

function ed(i) {
  return {
    throttle: i[0],
    steer: i[1],
    pitch: i[2],
    yaw: i[3],
    roll: i[4],
    jump: i[5] > 0,
    boost: i[6] > 0,
    handbrake: i[7] > 0,
  };
}

const Am = (() => {
  const i = [];
  for (const e of [-1, 0, 1])
    for (const t of [-1, 0, 1])
      for (const n of [0, 1])
        for (const r of [0, 1])
          (n === 1 && e !== 1) || i.push(ed([e || n, t, 0, t, 0, 0, n, r]));
  for (const e of [-1, 0, 1])
    for (const t of [-1, 0, 1])
      for (const n of [-1, 0, 1])
        for (const r of [0, 1])
          for (const s of [0, 1]) {
            if ((r === 1 && t !== 0) || (e === 0 && n === 0 && r === 0))
              continue;
            const a = r === 1 && (e !== 0 || t !== 0 || n !== 0);
            i.push(ed([s, t, e, t, n, r, s, +a]));
          }
  return i.map((e) => Object.freeze(e));
})();

export { Am, Eg, ed, wA };
