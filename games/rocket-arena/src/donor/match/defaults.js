
const qM = {
  mode: "freeplay",
  phase: "playing",
  blueScore: 0,
  orangeScore: 0,
  remainingSeconds: 300,
  overtime: !1,
  overtimeSeconds: 0,
  countdown: 0,
  winner: null,
  scorer: null,
  paused: !1,
};

function sm(i, e) {
  const t = Math.max(0, e ? Math.ceil(i) : Math.floor(i));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}

export { qM, sm };
