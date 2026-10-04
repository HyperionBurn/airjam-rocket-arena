
const pl = [
  {
    id: "seer",
    name: "Seer v0",
    rank: "Platinum",
    description: "A Platinum-level challenger.",
    modelUrl: "/assets/bot/seer/policy.onnx",
    noticeUrl: "/assets/bot/seer/NOTICE.txt",
    credit: "Seer v0 by Neville Walo · MIT",
    carVisual: "challenger",
    tickSkip: 8,
    scriptedKickoff: !1,
  },
  {
    id: "necto",
    name: "Necto",
    rank: "Diamond",
    description: "A Diamond-level challenger.",
    modelUrl: "/assets/bot/necto/policy.onnx",
    noticeUrl: "/assets/bot/necto/NOTICE.txt",
    credit: "Necto by the Necto team · CC BY-NC-SA 4.0",
    carVisual: "octane-original",
    tickSkip: 8,
    scriptedKickoff: !1,
  },
  {
    id: "nexto",
    name: "Nexto",
    rank: "GC",
    description: "A Grand Champion-level challenger.",
    modelUrl: "/assets/bot/policy.onnx",
    noticeUrl: "/assets/bot/NOTICE.txt",
    credit: "Nexto by the Necto team · CC BY-NC-SA 4.0",
    carVisual: "fennec",
    tickSkip: 8,
    scriptedKickoff: !0,
  },
];

function JA(i) {
  return pl.find((e) => e.id === i);
}

export { JA, pl };
