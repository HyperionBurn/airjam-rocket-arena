/**
 * In-match HUD: scoreboard, kickoff countdown, per-viewport boost/speed/name.
 *
 * Pure presentation over `LocalMatchHud`. It owns no game state and never
 * touches the donor; the director feeds it a fresh snapshot a few times a
 * second. The donor's own HUD is hidden in embedded mode, so this is the only
 * HUD on screen.
 */
import type { CSSProperties } from "react";

import type { LocalMatchHud, LocalMatchHudView } from "@/host/local-match";
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
      <div className="ra-hud__boost" data-boosting={view.boosting}>
        <div className="ra-hud__boost-value">{boost}</div>
        <div className="ra-hud__boost-bar">
          <div className="ra-hud__boost-fill" style={{ width: `${boost}%` }} />
        </div>
      </div>
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
