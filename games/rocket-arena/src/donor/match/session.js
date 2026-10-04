import { _ } from "../core/class-fields.js";

const Is = 120;

const am = 5 * 60 * Is;

const om = 3 * Is;

const zM = 3 * Is;

class MatchSession {
  constructor() {
    _(this, "state", {
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
    });
    _(this, "remaining", am);
    _(this, "overtimeTicks", 0);
    _(this, "phaseTicks", 0);
    _(this, "clockStarted", !1);
  }
  start() {
    (Object.assign(this.state, {
      mode: "match",
      phase: "kickoff",
      blueScore: 0,
      orangeScore: 0,
      remainingSeconds: 300,
      overtime: !1,
      overtimeSeconds: 0,
      countdown: 3,
      winner: null,
      scorer: null,
      paused: !1,
    }),
      (this.remaining = am),
      (this.overtimeTicks = 0),
      (this.phaseTicks = om),
      (this.clockStarted = !1));
  }
  leave() {
    ((this.state.mode = "freeplay"),
      (this.state.phase = "playing"),
      (this.state.paused = !1));
  }
  tick({ goal: e = 0, ballOnGround: t = !1, kickoffTouched: n = !1 } = {}) {
    const r = this.state;
    return r.mode !== "match" || r.paused || r.phase === "ended"
      ? "none"
      : r.phase === "kickoff"
        ? (this.phaseTicks--,
          (r.countdown = Math.ceil(this.phaseTicks / Is)),
          this.phaseTicks <= 0 && (r.phase = "playing"),
          "none")
        : r.phase === "goal"
          ? --this.phaseTicks > 0
            ? "none"
            : r.winner !== null
              ? this.end()
              : (this.remaining === 0 && (r.overtime = !0), this.kickoff())
          : (this.clockStarted || (this.clockStarted = n),
            this.clockStarted &&
              (r.overtime
                ? (r.overtimeSeconds = ++this.overtimeTicks / Is)
                : ((this.remaining = Math.max(0, this.remaining - 1)),
                  (r.remainingSeconds = this.remaining / Is))),
            e === 1 || e === 2
              ? ((r.scorer = e === 1 ? 0 : 1),
                r.scorer === 0 ? r.blueScore++ : r.orangeScore++,
                (r.phase = "goal"),
                (this.phaseTicks = zM),
                (r.overtime ||
                  (this.remaining === 0 && r.blueScore !== r.orangeScore)) &&
                  (r.winner = r.blueScore > r.orangeScore ? 0 : 1),
                "none")
              : !r.overtime && this.remaining === 0 && t
                ? r.blueScore === r.orangeScore
                  ? ((r.overtime = !0), this.kickoff())
                  : ((r.winner = r.blueScore > r.orangeScore ? 0 : 1),
                    this.end())
                : "none");
  }
  kickoff() {
    return (
      (this.state.phase = "kickoff"),
      (this.state.scorer = null),
      (this.state.countdown = 3),
      (this.phaseTicks = om),
      (this.clockStarted = !1),
      "kickoff"
    );
  }
  end() {
    return ((this.state.phase = "ended"), "ended");
  }
}

export { MatchSession };
