/**
 * Physical gamepads (Xbox, PlayStation, anything the browser reports with the
 * "standard" layout) as players of their own.
 *
 * A controller plugged into, or paired with, the projector machine joins the room
 * like a phone does: it appears in the lobby, picks team and car, readies up, and
 * drives with Rocket League's default bindings. It reuses the whole phone pipeline
 * (lobby, seating, input sources, ball-cam toggle, haptics) by producing the same
 * raw payload a phone publishes, so the match code does not know the difference.
 *
 *   mapPadToInput   pure: one frame of buttons/axes -> controls + button edges
 *   createGamepadHub  polls `navigator.getGamepads()`, owns per-pad lobby state
 *
 * Bindings (standard layout; Xbox name / PlayStation name):
 *   left stick     steer on the ground, pitch + yaw in the air
 *   RT / R2, LT / L2   accelerate / reverse (analog)
 *   A / Cross      jump (press again to double jump; press with the stick to flip)
 *   B / Circle, RB / R1   boost
 *   X / Square, LB / L1   powerslide on the ground, air roll in the air
 *   Y / Triangle, R3      toggle ball cam
 *   In the lobby:  A or Start = ready, B = not ready, LB / RB = team, D-pad left/right = car
 */

import { GARAGE_CARS } from "@/lobby/settings";
import type { HapticPattern } from "@/host/haptics";

/* ----------------------------------------------------------------- mapping */

/** What the hub needs from a browser `Gamepad`: nothing it cannot fake in a test. */
export interface PadSnapshot {
  index: number;
  id: string;
  connected: boolean;
  /** `"standard"` when the browser recognised the layout. */
  mapping: string;
  axes: ReadonlyArray<number>;
  buttons: ReadonlyArray<{ pressed: boolean; value: number }>;
}

export const BUTTON = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  LT: 6,
  RT: 7,
  BACK: 8,
  START: 9,
  L3: 10,
  R3: 11,
  UP: 12,
  DOWN: 13,
  LEFT: 14,
  RIGHT: 15,
} as const;

/** Radial deadzone: stick drift is rejected as a circle, so diagonals stay intact. */
export const STICK_DEADZONE = 0.12;
/** Triggers below this read as released (analog triggers rest slightly above zero). */
export const TRIGGER_DEADZONE = 0.05;

const clamp = (value: number, low: number, high: number): number => (value < low ? low : value > high ? high : value);

/** Radial deadzone with the live band rescaled back to 0..1 (full push is still exactly 1). */
export const shapePadStick = (rawX: number, rawY: number, deadzone = STICK_DEADZONE): { x: number; y: number } => {
  const x = Number.isFinite(rawX) ? rawX : 0;
  const y = Number.isFinite(rawY) ? rawY : 0;
  const magnitude = Math.hypot(x, y);
  if (magnitude <= deadzone) return { x: 0, y: 0 };
  const scaled = Math.min(1, (magnitude - deadzone) / (1 - deadzone));
  return { x: (x / magnitude) * scaled, y: (y / magnitude) * scaled };
};

const trigger = (pad: PadSnapshot, index: number): number => {
  const button = pad.buttons[index];
  if (!button) return 0;
  const value = button.value > 0 ? button.value : button.pressed ? 1 : 0;
  return value < TRIGGER_DEADZONE ? 0 : Math.min(1, (value - TRIGGER_DEADZONE) / (1 - TRIGGER_DEADZONE));
};

const held = (pad: PadSnapshot, index: number): boolean => Boolean(pad.buttons[index]?.pressed);

export interface PadControls {
  stick: { x: number; y: number };
  throttle: number;
  jump: boolean;
  boost: boolean;
  /** Powerslide on the ground, air roll in the air (the donor's single `handbrake` field). */
  handbrake: boolean;
}

/** One frame of the pad as game controls. Pure. */
export const mapPadToControls = (pad: PadSnapshot): PadControls => {
  const stick = shapePadStick(pad.axes[0] ?? 0, -(pad.axes[1] ?? 0));
  return {
    stick,
    throttle: clamp(trigger(pad, BUTTON.RT) - trigger(pad, BUTTON.LT), -1, 1),
    jump: held(pad, BUTTON.A),
    boost: held(pad, BUTTON.B) || held(pad, BUTTON.RB),
    handbrake: held(pad, BUTTON.X) || held(pad, BUTTON.LB),
  };
};

/** The browser's `gamepad.id` -> a short label for the lobby roster. */
export const padFamily = (id: string): "Xbox" | "PS" | "Pad" => {
  const lower = id.toLowerCase();
  if (/xbox|xinput|microsoft|045e/.test(lower)) return "Xbox";
  if (/playstation|dualsense|dualshock|sony|054c|wireless controller/.test(lower)) return "PS";
  return "Pad";
};

/* --------------------------------------------------------------------- hub */

export type PadTeam = "auto" | "blue" | "orange";
const TEAM_CYCLE: readonly PadTeam[] = ["auto", "blue", "orange"];

/** The raw payload a pad publishes: the phone's fields, plus the trigger throttle. */
export interface PadPayload {
  stick: { x: number; y: number };
  throttle: number;
  jump: boolean;
  boost: boolean;
  handbrake: boolean;
  airRoll: boolean;
  ballCamPresses: number;
  lobby: { ready: boolean; team: PadTeam; name: string; carId: string | null };
}

export interface PadPlayer {
  id: string;
  label: string;
}

interface PadState {
  index: number;
  label: string;
  ready: boolean;
  team: PadTeam;
  carIndex: number;
  ballCam: number;
  /** Buttons held on the previous poll, for press edges. */
  prev: boolean[];
  payload: PadPayload;
  connected: boolean;
}

export interface GamepadHubOptions {
  /** Where to find the pads. Defaults to `navigator.getGamepads`. */
  getPads?: () => ReadonlyArray<PadSnapshot | null>;
  /** The lobby phase, so lobby buttons do nothing during a match. */
  getPhase?: () => string;
  /** Poll interval for the background timer (ms). Reads also poll on demand. */
  intervalMs?: number;
  now?: () => number;
}

export interface GamepadHub {
  /** Connected pads as players. Stable ids (`gp-<index>`), so a reconnect keeps its seat. */
  players(): PadPlayer[];
  /** The latest payload for a pad id, or null if it is not a pad or has gone. */
  read(id: string): PadPayload | null;
  isPad(id: string): boolean;
  /** Called when a pad connects or disconnects. Returns the unsubscribe. */
  subscribe(listener: () => void): () => void;
  /** Rumble a pad for a game event. No-op where the browser has no actuator. */
  rumble(id: string, pattern: HapticPattern): void;
  setPhaseSource(getPhase: () => string): void;
  dispose(): void;
}

export const PAD_ID_PREFIX = "gp-";
export const isPadId = (id: string): boolean => id.startsWith(PAD_ID_PREFIX);

const RUMBLE: Record<HapticPattern, { duration: number; strong: number; weak: number }> = {
  light: { duration: 70, strong: 0.0, weak: 0.5 },
  medium: { duration: 120, strong: 0.45, weak: 0.4 },
  heavy: { duration: 260, strong: 1, weak: 0.7 },
  success: { duration: 420, strong: 0.6, weak: 1 },
  failure: { duration: 300, strong: 0.7, weak: 0.15 },
};

const browserPads = (): ReadonlyArray<PadSnapshot | null> => {
  if (typeof navigator === "undefined" || typeof navigator.getGamepads !== "function") return [];
  try {
    return Array.from(navigator.getGamepads()) as unknown as ReadonlyArray<PadSnapshot | null>;
  } catch {
    return [];
  }
};

export const createGamepadHub = (options: GamepadHubOptions = {}): GamepadHub => {
  const getPads = options.getPads ?? browserPads;
  const now = options.now ?? (() => (typeof performance !== "undefined" ? performance.now() : Date.now()));
  let getPhase: () => string = options.getPhase ?? (() => "lobby");
  const states = new Map<string, PadState>();
  const listeners = new Set<() => void>();
  let lastPoll = Number.NEGATIVE_INFINITY;
  let timer: ReturnType<typeof setInterval> | null = null;

  const notify = (): void => {
    for (const listener of listeners) listener();
  };

  const labelFor = (pad: PadSnapshot): string => {
    const family = padFamily(pad.id);
    // Number within the family so two Xbox pads read "Xbox 1" and "Xbox 2".
    let ordinal = 1;
    for (const state of states.values()) {
      if (state.index !== pad.index && state.label.startsWith(family) && state.index < pad.index) ordinal += 1;
    }
    return `${family} ${ordinal}`;
  };

  const press = (state: PadState, pad: PadSnapshot, button: number): boolean =>
    Boolean(pad.buttons[button]?.pressed) && !state.prev[button];

  /** Lobby buttons. Only between matches: in a match they are game controls. */
  const lobbyInput = (state: PadState, pad: PadSnapshot): void => {
    if (press(state, pad, BUTTON.A) || press(state, pad, BUTTON.START)) state.ready = !state.ready;
    if (press(state, pad, BUTTON.B)) state.ready = false;
    if (press(state, pad, BUTTON.RB)) state.team = TEAM_CYCLE[(TEAM_CYCLE.indexOf(state.team) + 1) % TEAM_CYCLE.length]!;
    if (press(state, pad, BUTTON.LB)) {
      state.team = TEAM_CYCLE[(TEAM_CYCLE.indexOf(state.team) + TEAM_CYCLE.length - 1) % TEAM_CYCLE.length]!;
    }
    const cars = GARAGE_CARS.length;
    if (press(state, pad, BUTTON.RIGHT)) state.carIndex = (state.carIndex + 1) % cars;
    if (press(state, pad, BUTTON.LEFT)) state.carIndex = (state.carIndex + cars - 1) % cars;
  };

  const poll = (): void => {
    lastPoll = now();
    const seen = new Set<string>();
    let roster = false;
    const inLobby = getPhase() !== "playing";

    for (const pad of getPads()) {
      if (!pad || !pad.connected) continue;
      const id = `${PAD_ID_PREFIX}${pad.index}`;
      seen.add(id);
      let state = states.get(id);
      if (!state || !state.connected) {
        // A returning pad keeps its lobby choices (team, car, ready) like a phone does.
        state = state ?? {
          index: pad.index,
          label: "",
          ready: false,
          team: "auto",
          carIndex: 0,
          ballCam: 0,
          prev: [],
          connected: true,
          payload: undefined as unknown as PadPayload,
        };
        state.connected = true;
        state.label = labelFor(pad);
        states.set(id, state);
        roster = true;
      }

      if (inLobby) lobbyInput(state, pad);
      if (press(state, pad, BUTTON.Y) || press(state, pad, BUTTON.R3)) state.ballCam += 1;

      const controls = mapPadToControls(pad);
      state.payload = {
        stick: controls.stick,
        throttle: controls.throttle,
        jump: controls.jump,
        boost: controls.boost,
        handbrake: controls.handbrake,
        airRoll: controls.handbrake,
        ballCamPresses: state.ballCam,
        lobby: {
          ready: state.ready,
          team: state.team,
          name: state.label,
          carId: GARAGE_CARS[state.carIndex]?.id ?? null,
        },
      };
      state.prev = pad.buttons.map((button) => Boolean(button?.pressed));
    }

    for (const [id, state] of states) {
      if (!seen.has(id) && state.connected) {
        state.connected = false;
        // A pad that drops reads as released, never as a held button.
        if (state.payload) {
          state.payload = { ...state.payload, stick: { x: 0, y: 0 }, throttle: 0, jump: false, boost: false, handbrake: false, airRoll: false };
        }
        roster = true;
      }
    }
    if (roster) notify();
  };

  // A background poll keeps lobby presses and connects flowing; the match reads
  // on demand (below) so a physics tick never sees a stale frame.
  const ensureTimer = (): void => {
    if (timer !== null || typeof setInterval !== "function") return;
    timer = setInterval(poll, options.intervalMs ?? 16);
  };
  ensureTimer();

  return {
    players: () =>
      [...states.entries()].filter(([, state]) => state.connected).map(([id, state]) => ({ id, label: state.label })),
    read: (id) => {
      // Poll first: a pad that connected since the last tick has no state yet.
      if (now() - lastPoll > 2) poll();
      return states.get(id)?.payload ?? null;
    },
    isPad: isPadId,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    rumble: (id, pattern) => {
      const state = states.get(id);
      if (!state?.connected) return;
      const pad = getPads().find((candidate) => candidate?.index === state.index) as
        | (PadSnapshot & { vibrationActuator?: { playEffect?: (type: string, params: object) => Promise<unknown> } })
        | null
        | undefined;
      const effect = RUMBLE[pattern];
      try {
        void pad?.vibrationActuator?.playEffect?.("dual-rumble", {
          startDelay: 0,
          duration: effect.duration,
          strongMagnitude: effect.strong,
          weakMagnitude: effect.weak,
        });
      } catch {
        /* No actuator, or the browser refused: rumble is a nicety. */
      }
    },
    setPhaseSource: (source) => {
      getPhase = source;
    },
    dispose: () => {
      if (timer !== null) clearInterval(timer);
      timer = null;
      listeners.clear();
    },
  };
};

/** One hub for the page: gamepads are a page-level resource. */
let singleton: GamepadHub | null = null;
export const getGamepadHub = (): GamepadHub => {
  singleton ??= createGamepadHub();
  return singleton;
};
