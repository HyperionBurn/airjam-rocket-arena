/**
 * In-match HUD: scoreboard, kickoff countdown, per-viewport boost/speed/name.
 *
 * Pure presentation over `LocalMatchHud`. It owns no game state and never
 * touches the donor; the director feeds it a fresh snapshot a few times a
 * second. The donor's own HUD is hidden in embedded mode, so this is the only
 * HUD on screen.
 */
import type { CSSProperties } from "react";

import type { LocalMatchHud, LocalMatchHudMark, LocalMatchHudView } from "@/host/local-match";
import "./match-hud.css";

export interface HudSeatInfo {
  name: string;
}

export interface MatchHudProps {
  hud: LocalMatchHud;
  /** Seat info by car index. */
  seats: ReadonlyArray<HudSeatInfo>;
  /** A goal celebration/replay is on screen: hide the per-view tiles. */
  replay?: boolean;
}

const TEAM_NAMES = ["BLUE", "ORANGE"] as const;
/** 1 uu = 1 cm, so 1 uu/s = 0.036 km/h. */
const UU_TO_KPH = 0.036;

const formatClock = (seconds: number): string => {
  const total = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

/**
 * A divider is the shared edge between two tiles. One line per tile edge that
 * is interior to the screen is enough: where two tiles share an edge the lines
 * overlap exactly.
 */
const Dividers = ({ views }: { views: LocalMatchHudView[] }) => {
  const lines: { key: string; style: CSSProperties }[] = [];
  for (const view of views) {
    const rect = view.rect;
    if (!rect) continue;
    if (rect.x > 0) {
      lines.push({ key: `v${view.index}`, style: { left: rect.x - 1, top: rect.y, width: 3, height: rect.height } });
    }
    if (rect.y > 0) {
      lines.push({ key: `h${view.index}`, style: { left: rect.x, top: rect.y - 1, width: rect.width, height: 3 } });
    }
  }
  return (
    <>
      {lines.map((line) => (
        <div key={line.key} className="ra-hud__divider" style={line.style} />
      ))}
    </>
  );
};

/** Ring geometry for the boost gauge (SVG viewBox 0 0 100 100). */
const RING_RADIUS = 42;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;
/** The gauge sweeps 270 degrees, open at the bottom, like a car's dial. */
const RING_SWEEP = 0.75;

const BoostGauge = ({ boost, boosting }: { boost: number; boosting: boolean }) => {
  const arc = RING_LENGTH * RING_SWEEP;
  return (
    <div className="ra-gauge" data-boosting={boosting} data-low={boost < 20}>
      <svg viewBox="0 0 100 100" className="ra-gauge__svg" aria-hidden="true">
        <circle className="ra-gauge__bed" cx="50" cy="50" r="47" />
        <circle
          className="ra-gauge__track"
          cx="50" cy="50" r={RING_RADIUS}
          strokeDasharray={`${arc} ${RING_LENGTH}`}
          transform="rotate(135 50 50)"
        />
        <circle
          className="ra-gauge__fill"
          cx="50" cy="50" r={RING_RADIUS}
          strokeDasharray={`${(arc * boost) / 100} ${RING_LENGTH}`}
          transform="rotate(135 50 50)"
        />
        <circle
          className="ra-gauge__ticks"
          cx="50" cy="50" r={RING_RADIUS + 5}
          strokeDasharray={`1.2 ${arc / 20 - 1.2}`}
          transform="rotate(135 50 50)"
        />
      </svg>
      <div className="ra-gauge__value">{boost}</div>
      <div className="ra-gauge__label">BOOST</div>
    </div>
  );
};

const plateScale = (mark: LocalMatchHudMark): number => Math.max(0.55, Math.min(1.15, 1.35 - mark.distance / 5200));

/**
 * Stack nameplates that would cover each other (cars lined up one behind the other, e.g.
 * at kickoff): the nearest car keeps its spot, farther plates move up until they are free.
 * Returns the vertical offset (px, negative = up) per mark, in the given order.
 */
const declutter = (marks: ReadonlyArray<LocalMatchHudMark>, nameOf: (car: number) => string): number[] => {
  const boxes = marks.map((mark, i) => {
    const scale = plateScale(mark);
    return { i, mark, w: (nameOf(mark.car).length * 7.2 + 26) * scale, h: 20 * scale };
  });
  const placed: { x0: number; x1: number; y0: number; y1: number }[] = [];
  const offsets = new Array<number>(marks.length).fill(0);
  for (const box of [...boxes].sort((a, b) => a.mark.distance - b.mark.distance)) {
    const x0 = box.mark.x - box.w / 2, x1 = box.mark.x + box.w / 2;
    let dy = 0;
    for (let tries = 0; tries < 6; tries += 1) {
      const y1 = box.mark.y + dy, y0 = y1 - box.h;
      const hit = placed.find((p) => x0 < p.x1 && x1 > p.x0 && y0 < p.y1 && y1 > p.y0);
      if (!hit) break;
      dy = hit.y0 - box.mark.y - 2;
    }
    offsets[box.i] = dy;
    placed.push({ x0, x1, y0: box.mark.y + dy - box.h, y1: box.mark.y + dy });
  }
  return offsets;
};

/** A floating nameplate over another car, scaled down with distance. */
const Nameplate = ({ mark, name, ownTeam, lift = 0 }: { mark: LocalMatchHudMark; name: string; ownTeam: number; lift?: number }) => {
  const scale = plateScale(mark);
  return (
    <div
      className="ra-plate"
      data-team={mark.team}
      data-friend={mark.team === ownTeam}
      style={{ left: mark.x, top: mark.y + lift, transform: `translate(-50%, -100%) scale(${scale})` }}
    >
      <span className="ra-plate__dot" />
      {name}
    </div>
  );
};

const Tile = ({ view, name }: { view: LocalMatchHudView; name: string }) => {
  const rect = view.rect;
  if (!rect) return null;
  const color = view.team === 0 ? "var(--ra-blue)" : "var(--ra-orange)";
  const boost = Math.max(0, Math.min(100, Math.round(view.boost)));
  return (
    <div
      className="ra-hud__tile"
      style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
      data-car={view.car}
    >
      <div className="ra-hud__name" style={{ ["--team" as string]: color }}>
        <span className="ra-hud__dot" />
        {name}
      </div>
      <div className="ra-hud__cam">{view.ballCam ? "BALL CAM" : "CAR CAM"}</div>
      <div className="ra-hud__speed">
        {Math.round(view.speed * UU_TO_KPH)}
        <small>KPH</small>
      </div>
      <BoostGauge boost={boost} boosting={view.boosting} />
    </div>
  );
};

export const MatchHud = ({ hud, seats, replay = false }: MatchHudProps) => {
  const clock = formatClock(hud.overtime ? hud.overtimeSeconds : hud.remainingSeconds);
  return (
    <div className="ra-hud" data-replay={replay} aria-live="off">
      <Dividers views={hud.views} />
      {hud.views.map((view) => (
        <Tile key={view.index} view={view} name={seats[view.car]?.name ?? `Player ${view.car + 1}`} />
      ))}
      {!replay
        ? hud.views.flatMap((view) => {
            const marks = view.marks ?? [];
            const nameOf = (car: number): string => seats[car]?.name ?? `Player ${car + 1}`;
            const lifts = declutter(marks, nameOf);
            return marks.map((mark, i) => (
              <Nameplate
                key={`${view.index}-${mark.car}`}
                mark={mark}
                ownTeam={view.team}
                name={nameOf(mark.car)}
                lift={lifts[i]}
              />
            ));
          })
        : null}

      <div className="ra-hud__score">
        <div className="ra-hud__team" data-team="0">
          {hud.blueScore}
        </div>
        <div className="ra-hud__clock" data-overtime={hud.overtime}>
          {hud.overtime ? `OT +${clock}` : clock}
        </div>
        <div className="ra-hud__team" data-team="1">
          {hud.orangeScore}
        </div>
      </div>

      {hud.phase === "kickoff" && hud.countdown > 0 ? (
        <div className="ra-hud__banner" key={hud.countdown}>
          <div className="ra-hud__countdown">{hud.countdown}</div>
        </div>
      ) : null}

      {hud.phase === "ended" ? (
        <div className="ra-hud__banner">
          <div className="ra-hud__result">
            {hud.winner === null ? "DRAW" : `${TEAM_NAMES[hud.winner]} WINS`}
            <small>
              {hud.blueScore} - {hud.orangeScore}
            </small>
          </div>
        </div>
      ) : null}
    </div>
  );
};
