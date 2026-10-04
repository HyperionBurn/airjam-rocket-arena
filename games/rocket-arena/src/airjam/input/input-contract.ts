/**
 * The Air Jam input contract for Rocket Arena.
 *
 * This module owns the ONE declaration of what a phone publishes, and the ONE
 * declaration of how the Air Jam `InputManager` must be told to treat each
 * field. Both live here so the controller UI worker (publishing side) and the
 * host loop (reading side) cannot drift apart.
 *
 * ---------------------------------------------------------------------------
 * WHY THE BEHAVIOUR LISTS ARE NOT OPTIONAL DEFAULTS
 * ---------------------------------------------------------------------------
 * `packages/sdk/src/internal/input-manager.ts` decides per field:
 *
 *   - a field listed in `behavior.pulse`  → consume-on-read
 *   - a field listed in `behavior.latest` → stateless, return the raw value
 *   - a field listed in NONE of them      → inferred from the VALUE TYPE:
 *       `typeof value === "boolean"` → `pulse`     (line 242-244)
 *       vector / everything else     → `latest`   (line 245-248)
 *
 * The donor's ABI (`native/network-state.cpp:15`, mirrored by `seam.ts`) is
 * purely LEVEL-triggered: 5 analog axes + 3 booleans that the bridge
 * thresholds at `> 0.5`. That forces three specific declarations:
 *
 * 1. `jump` MUST stay `pulse`. It is listed explicitly even though `pulse` is
 *    already the boolean default, because relying on an inference is how this
 *    breaks silently: if a future schema made `jump` an object, the default
 *    would flip to `latest` and a 20 ms tap would vanish. Stating it makes the
 *    requirement load-bearing instead of emergent.
 *
 * 2. `boost` / `handbrake` / `airRoll` MUST be forced to `latest`. They are
 *    booleans, so the default would be `pulse` — and a `pulse` boost arrives as
 *    `true` for exactly one read and then `false` for as long as the button is
 *    down. The car would stutter its boost, which is unplayable.
 *
 * 3. `hold` is used for NOTHING, ever, in this game. This is the trap the brief
 *    calls out and it is worth spelling out: for a vector, `hold` keeps the
 *    last NON-ZERO value and only overwrites it when another non-zero value
 *    arrives (`input-manager.ts:329-337`). A self-centring thumbstick produces
 *    `{x: 0, y: 0}` on release, and `hold` would reply with the stale direction
 *    forever. The car would drive off in a straight line with no way to stop.
 *    `latest` is the only correct behaviour for a self-centring axis, which is
 *    why this layer also sends an explicit value EVERY tick, zeros included.
 *
 * A field may appear in only ONE behaviour list — the `InputManager` constructor
 * throws on a conflict (`input-manager.ts:218-222`). {@link ROCKET_ARENA_INPUT_BEHAVIOR}
 * is therefore built to be provably conflict-free.
 */

import type { StickVector } from "./stick";

/** Field names the controller publishes. Keep in sync with the controller UI. */
export const ROCKET_ARENA_INPUT_FIELDS = {
  /** Thumbstick. +x = right, +y = forward (donor `touch.js` convention). */
  stick: "stick",
  /** One-shot. Drives jump AND the donor's derived flips and double-jump. */
  jump: "jump",
  /** Held. */
  boost: "boost",
  /** Held. Powerslide on the ground, air-roll modifier in the air. */
  handbrake: "handbrake",
  /** Held. Air-roll affordance only; does NOT set `handbrake`. */
  airRoll: "airRoll",
  /** Monotonic count of ball-cam button presses. A COUNT, so a tap can never be lost. */
  ballCamPresses: "ballCamPresses",
  /** Phone-private lobby choices: ready flag, team preference, display name. */
  lobby: "lobby",
} as const;

export type RocketArenaInputField =
  (typeof ROCKET_ARENA_INPUT_FIELDS)[keyof typeof ROCKET_ARENA_INPUT_FIELDS];

/**
 * Per-field behaviour, structurally identical to the SDK's
 * `InputConfig["behavior"]` (`packages/sdk/src/internal/input-manager.ts:71-89`).
 *
 * Declared as a local interface on purpose: this layer must not depend on
 * `zod` (it is not in rocket-arena's `package.json`) or on SDK internals. The
 * host spreads this into `input: { behavior: ... }` when it builds the
 * `HostSessionProvider` / `createAirJamApp` config.
 *
 * NOT `as const`: the SDK's type is `string[]` (mutable), and a readonly tuple
 * is not assignable to it.
 */
export interface RocketArenaInputBehavior {
  pulse?: string[];
  hold?: string[];
  latest?: string[];
}

export const ROCKET_ARENA_INPUT_BEHAVIOR: RocketArenaInputBehavior = Object.freeze({
  pulse: [ROCKET_ARENA_INPUT_FIELDS.jump],
  latest: [
    ROCKET_ARENA_INPUT_FIELDS.stick,
    ROCKET_ARENA_INPUT_FIELDS.boost,
    ROCKET_ARENA_INPUT_FIELDS.handbrake,
    ROCKET_ARENA_INPUT_FIELDS.airRoll,
    ROCKET_ARENA_INPUT_FIELDS.ballCamPresses,
    ROCKET_ARENA_INPUT_FIELDS.lobby,
  ],
  // `hold` is intentionally absent. See the module header, point 3.
});

/**
 * A fully-defaulted payload. Used when the controller has published nothing
 * usable, so every field defaults to the SAFE direction: stick centred and all
 * buttons released. (For the `latest` booleans, defaulting to `false` is the
 * fail-safe choice — a field the phone forgot to send reads as "not held",
 * never as "held".)
 */
export const EMPTY_ROCKET_ARENA_INPUT: RocketArenaInput = Object.freeze({
  stick: Object.freeze({ x: 0, y: 0 }) as StickVector,
  jump: false,
  boost: false,
  handbrake: false,
  airRoll: false,
  ballCamPresses: null,
  lobby: null,
});

/** A normalised controller payload. All fields present and typed. */
export interface RocketArenaInput {
  /** RAW stick, still unshaped. Shaping is the source's job, not the parser's. */
  stick: StickVector;
  jump: boolean;
  boost: boolean;
  handbrake: boolean;
  airRoll: boolean;
  /** Null when the phone has not sent the field (an older controller build). */
  ballCamPresses: number | null;
  /** Null when the phone has not sent the field. */
  lobby: LobbyIntent | null;
}

export type LobbyTeamPreference = "auto" | "blue" | "orange";

/** What a phone says about itself while the room is in the lobby. */
export interface LobbyIntent {
  ready: boolean;
  team: LobbyTeamPreference;
  name: string;
  /** A garage car id, or null for "no preference" (the host picks a default). */
  carId: string | null;
}

const readLobby = (value: unknown): LobbyIntent | null => {
  if (typeof value !== "object" || value === null) return null;
  const lobby = value as { ready?: unknown; team?: unknown; name?: unknown; carId?: unknown };
  const team: LobbyTeamPreference =
    lobby.team === "blue" || lobby.team === "orange" ? lobby.team : "auto";
  return {
    ready: lobby.ready === true,
    team,
    name: typeof lobby.name === "string" ? lobby.name.slice(0, 24) : "",
    carId: typeof lobby.carId === "string" && lobby.carId.length > 0 ? lobby.carId.slice(0, 40) : null,
  };
};

const readVector = (value: unknown): StickVector => {
  if (typeof value !== "object" || value === null) {
    return { x: 0, y: 0 };
  }
  const vector = value as { x?: unknown; y?: unknown };
  return {
    x: typeof vector.x === "number" ? vector.x : 0,
    y: typeof vector.y === "number" ? vector.y : 0,
  };
};

/**
 * Parse whatever the SDK handed us into a fully-defaulted payload.
 *
 * The SDK's own zod validation (if the host configures a schema) is NOT trusted
 * as the only line of defence: a schema mismatch makes `getInput` return
 * `undefined` (`input-manager.ts:172-178`), and a missing schema means the raw
 * `Record` arrives unchecked. Parsing here means a malformed payload degrades to
 * "everything released" instead of throwing inside the 120 Hz loop.
 *
 * Booleans are read STRICTLY (`=== true`). The `InputManager` only latches
 * booleans it saw as `typeof value === "boolean"` (`:273-277`), so a real
 * payload always carries real booleans; accepting truthy junk would let a
 * stray `"false"` string latch a boost on.
 *
 * `jump` is read from the top level of the payload rather than from the stick,
 * because the `InputManager` deliberately INJECTS pending pulses for fields
 * missing from the current payload (`:341-346`) — the one-tick `true` we depend
 * on to never lose a press shows up exactly there.
 */
export const parseRocketArenaInput = (raw: unknown): RocketArenaInput => {
  if (typeof raw !== "object" || raw === null) {
    return EMPTY_ROCKET_ARENA_INPUT;
  }
  const payload = raw as Record<string, unknown>;
  return {
    stick: readVector(payload[ROCKET_ARENA_INPUT_FIELDS.stick]),
    jump: payload[ROCKET_ARENA_INPUT_FIELDS.jump] === true,
    boost: payload[ROCKET_ARENA_INPUT_FIELDS.boost] === true,
    handbrake: payload[ROCKET_ARENA_INPUT_FIELDS.handbrake] === true,
    airRoll: payload[ROCKET_ARENA_INPUT_FIELDS.airRoll] === true,
    ballCamPresses:
      typeof payload[ROCKET_ARENA_INPUT_FIELDS.ballCamPresses] === "number" &&
      Number.isFinite(payload[ROCKET_ARENA_INPUT_FIELDS.ballCamPresses])
        ? (payload[ROCKET_ARENA_INPUT_FIELDS.ballCamPresses] as number)
        : null,
    lobby: readLobby(payload[ROCKET_ARENA_INPUT_FIELDS.lobby]),
  };
};
