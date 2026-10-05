/** Blue Ice components (see ../../design.md) shared by the host, phone and board screens. */
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import QRCode from "qrcode";

import type { GameDef, PublicState } from "./api";

type Player = PublicState["players"][number];
type Standing = PublicState["standings"][number];

declare global {
  interface Window {
    BlueIce?: {
      Wordmark: (options: { lines?: string[]; width?: number; impact?: { line: number; char: number }; seed?: number; crack?: boolean; bleed?: boolean }) => SVGSVGElement;
    };
  }
}

export const style = (vars: Record<string, string | number>): CSSProperties => vars as CSSProperties;

const prefersReducedMotion = (): boolean => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

/* ------------------------------------------------------------- brand pieces --- */

/** A player is a square initial: no colours, no emoji. */
export const Avatar = ({ player, size = 40, solid }: { player: { name?: string; connected?: boolean }; size?: number; solid?: boolean }) => (
  <div className={`sq${solid ? " sq--solid" : ""}${player.connected === false ? " sq--off" : ""}`} style={style({ "--size": `${size}px` })} aria-hidden="true">
    {(player.name ?? "?").trim().charAt(0) || "?"}
  </div>
);

export const Mark = () => <img className="mark" src="/blue-ice/gdg-mark-frost.svg" alt="GDG" />;

export const Tag = ({ children, solid }: { children: ReactNode; solid?: boolean }) => <span className={`tag${solid ? " tag--solid" : ""}`}>{children}</span>;

export const Label = ({ children, className = "" }: { children: ReactNode; className?: string }) => <div className={`label ${className}`.trim()}>{children}</div>;

/** The 2px measuring rule with its ticks. */
export const Ruler = ({ ticks = 48, every = 8 }: { ticks?: number; every?: number }) => (
  <svg className="rule" viewBox={`0 0 ${ticks * 10} 14`} preserveAspectRatio="none" aria-hidden="true">
    <line x1="0" x2={ticks * 10} y1="1" y2="1" vectorEffect="non-scaling-stroke" stroke="var(--rule)" strokeWidth="2" />
    {Array.from({ length: ticks + 1 }, (_, t) => {
      const x = Math.min(ticks * 10 - 0.5, Math.max(0.5, t * 10));
      return <line key={t} x1={x} x2={x} y1="1" y2={t % every === 0 ? 13 : 7} vectorEffect="non-scaling-stroke" stroke="var(--rule)" strokeWidth="1" />;
    })}
  </svg>
);

/**
 * The event name, struck once. Arrives whole and cracks from the impact after
 * 300ms; under reduced motion it is cracked straight away. The generator lives in
 * /blue-ice/blue-ice.js and measures real glyphs, so wait for the fonts first.
 */
export const Wordmark = ({ lines = ["hello,", "world!"], impact, fill = false }: { lines?: string[]; impact?: { line: number; char: number }; fill?: boolean }) => {
  const host = useRef<HTMLDivElement>(null);
  const key = lines.join("|");
  useEffect(() => {
    let live = true;
    let timer = 0;
    const build = (crack: boolean): void => {
      const target = host.current;
      if (!live || !target || !window.BlueIce) return;
      try {
        const svg = window.BlueIce.Wordmark({ lines: key.split("|"), width: 1000, impact: impact ?? { line: 0, char: key.split("|")[0]!.length - 1 }, crack });
        svg.removeAttribute("width");
        svg.removeAttribute("height");
        svg.setAttribute("preserveAspectRatio", "xMinYMid meet");
        target.replaceChildren(svg);
      } catch {
        /* the fracture is decoration; the page works without it */
      }
    };
    const ready = document.fonts?.load ? Promise.all([document.fonts.load("900 100px Archivo"), document.fonts.ready]) : Promise.resolve();
    void ready.then(() => {
      if (!live) return;
      if (prefersReducedMotion()) {
        build(true);
        return;
      }
      build(false);
      timer = window.setTimeout(() => build(true), 300);
    });
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return <div ref={host} className={`wm${fill ? " wm--fill" : ""}`} role="img" aria-label={lines.join(" ")} />;
};

/** The one bracketed line on a layout, fitted to its container (never above `max` em). */
export const Display = ({ text, max = 6 }: { text: string; max?: number }) => {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState<number | null>(null);
  const label = `<${text}>`;
  useLayoutEffect(() => {
    const fit = (): void => {
      const box = outer.current;
      const span = inner.current;
      if (!box || !span) return;
      const em = parseFloat(getComputedStyle(box).fontSize) || 16;
      // Text width scales linearly with font size, so one step from the current size lands on the fit.
      const current = parseFloat(getComputedStyle(span).fontSize) || 40;
      const width = span.getBoundingClientRect().width || 1;
      const next = Math.min((box.clientWidth / width) * current, max * em);
      setSize((previous) => (previous !== null && Math.abs(previous - next) < 0.5 ? previous : next));
    };
    fit();
    // Measure again once the real face (at the widened stretch) has loaded.
    void (document.fonts?.load ? document.fonts.load("900 100px Archivo").then(fit) : Promise.resolve());
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
    if (outer.current) observer?.observe(outer.current);
    return () => observer?.disconnect();
  }, [label, max]);
  return (
    <div ref={outer} className="display" aria-label={label}>
      <span ref={inner} style={size ? { fontSize: `${size}px` } : { fontSize: "40px", visibility: "hidden" }}>{label}</span>
    </div>
  );
};

/** Club name and bracket mark, a hairline, then a label row. */
export const Header = ({ labels }: { labels: ReactNode[] }) => (
  <header className="head">
    <div className="top">
      <div className="mono">
        GDG on Campus<br />
        University of Birmingham Dubai
      </div>
      <Mark />
    </div>
    <hr className="hairline" />
    <div className="row3 label">{labels.map((item, index) => <span key={index}>{item}</span>)}</div>
  </header>
);

export const Footer = ({ left }: { left?: string }) => (
  <footer className="foot">
    <hr className="hairline" />
    <div className="row2 mono">
      <span>{left ?? "Arcade stall. Free. Everyone welcome."}</span>
      <span className="mono--code">print("hello, world!")</span>
    </div>
  </footer>
);

/* ------------------------------------------------------------ cover art --- */

const hash = (text: string): number => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
};

/**
 * Original cover art in two inks, frost on cobalt, one struck point per game.
 * Known games get their own composition; anything else a stable one from its id.
 */
export const GameArt = ({ game }: { game: Pick<GameDef, "id"> }) => {
  const rays = (cx: number, cy: number, n: number, seed: number) =>
    Array.from({ length: n }, (_, i) => {
      const a = ((i + 0.15 + ((hash(`${seed}${i}`) % 70) / 100)) / n) * Math.PI * 2;
      const len = 70 + (hash(`${seed}-${i}`) % 210);
      return <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(a) * len} y2={cy + Math.sin(a) * len} stroke="#EAF2FF" strokeOpacity={0.55 - len / 700} strokeWidth="1.4" />;
    });
  let shapes: ReactNode;
  if (game.id === "rocket-arena") {
    shapes = (
      <>
        {rays(210, 118, 14, 3)}
        <circle cx="210" cy="118" r="30" fill="#F3F8FF" />
        {[58, 96, 150].map((r) => (
          <circle key={r} cx="210" cy="118" r={r} fill="none" stroke="#EAF2FF" strokeOpacity={0.5 - r / 400} strokeWidth="1.4" strokeDasharray={r > 90 ? "70 24" : undefined} />
        ))}
        <path d="M0 282 Q150 232 300 262" fill="none" stroke="#CFE0FF" strokeWidth="2" />
        <path d="M0 300 Q150 250 300 280" fill="none" stroke="#CFE0FF" strokeOpacity="0.4" strokeWidth="2" />
      </>
    );
  } else if (game.id === "turbo-kart") {
    shapes = (
      <>
        {[0, 1, 2, 3, 4].map((n) => (
          <path key={n} d={`M-20 ${190 + n * 36} L150 ${80 + n * 36} L320 ${190 + n * 36}`} fill="none" stroke={n === 2 ? "#F3F8FF" : "#CFE0FF"} strokeOpacity={n === 2 ? 1 : 0.4} strokeWidth={n === 2 ? 12 : 2} />
        ))}
        {[0, 1, 2].map((r) =>
          [0, 1, 2].map((c) => ((r + c) % 2 === 0 ? <rect key={`${r}${c}`} x={224 + c * 18} y={22 + r * 18} width="18" height="18" fill="#F3F8FF" /> : <rect key={`${r}${c}`} x={224 + c * 18} y={22 + r * 18} width="18" height="18" fill="none" stroke="#CFE0FF" strokeOpacity="0.5" />)),
        )}
      </>
    );
  } else if (game.id === "air-brawl") {
    shapes = (
      <>
        {rays(110, 90, 12, 7)}
        <polygon points="40,210 250,186 262,212 52,238" fill="#F3F8FF" />
        <polygon points="96,256 280,242 286,262 100,276" fill="#CFE0FF" fillOpacity="0.5" />
        <polygon points="-10,168 120,158 126,172 -10,184" fill="#CFE0FF" fillOpacity="0.3" />
        <circle cx="110" cy="90" r="7" fill="#F3F8FF" />
      </>
    );
  } else {
    const h = hash(game.id);
    shapes = (
      <>
        {rays(80 + (h % 140), 90 + ((h >> 4) % 70), 12, h)}
        <circle cx={80 + (h % 140)} cy={90 + ((h >> 4) % 70)} r="8" fill="#F3F8FF" />
        <circle cx="150" cy="200" r={60 + ((h >> 8) % 40)} fill="none" stroke="#CFE0FF" strokeOpacity="0.4" strokeWidth="2" />
      </>
    );
  }
  return (
    <svg viewBox="0 0 300 225" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="300" height="225" fill="#142FB0" />
      {shapes}
    </svg>
  );
};

/** A cover tile. A real button when it can be chosen. */
export const Tile = ({ game, focus, onClick }: { game: GameDef; focus?: boolean; onClick?: () => void }) => {
  const body = (
    <>
      <GameArt game={game} />
      <span className="cap">
        <span className="nm">{game.name}</span>
        <span className="meta label">{game.minPlayers}–{game.maxPlayers} players · {game.minutes} min</span>
      </span>
    </>
  );
  const className = `tile${focus ? " tile--focus" : ""}`;
  return onClick ? <button className={className} onClick={onClick}>{body}</button> : <div className={className}>{body}</div>;
};

/* ------------------------------------------------------------------ misc --- */

export const Qr = ({ value }: { value: string }) => {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    void QRCode.toDataURL(value, { margin: 0, width: 512, color: { dark: "#0A1B66", light: "#F3F8FF" }, errorCorrectionLevel: "M" }).then((url) => {
      if (live) setSrc(url);
    });
    return () => {
      live = false;
    };
  }, [value]);
  return <div className="qr">{src ? <img src={src} alt={`QR code to join: ${value}`} /> : <div style={{ width: 160, height: 160 }} />}</div>;
};

export const ordinal = (rank: number): string => {
  const mod100 = rank % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${rank}th`;
  return `${rank}${["th", "st", "nd", "rd"][rank % 10] ?? "th"}`;
};

export const points = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/** The night's standings as a plain ranked list; first place is the one solid shape. */
export const Board = ({ standings, players, limit }: { standings: Standing[]; players: Player[]; limit?: number }) => {
  const byId = new Map(players.map((player) => [player.id, player]));
  const rows = limit ? standings.slice(0, limit) : standings;
  return (
    <div className="list">
      {rows.map((row) => {
        const player = byId.get(row.playerId);
        if (!player) return null;
        return (
          <div key={row.playerId} className={`rank rank--${row.rank}`}>
            <div className="pos num">{String(row.rank).padStart(2, "0")}</div>
            <Avatar player={player} size={34} />
            <div className="nm">{player.name}</div>
            <div className="move num">{row.climb > 0 ? `+${row.climb}` : row.climb < 0 ? `−${-row.climb}` : ""}</div>
            <div className="pts num">{points(row.points)}</div>
          </div>
        );
      })}
    </div>
  );
};

export const gameOf = (games: GameDef[], id: string): GameDef | undefined => games.find((game) => game.id === id);

