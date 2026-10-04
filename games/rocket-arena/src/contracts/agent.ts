/**
 * The semantic agent contract for Rocket Arena.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS IS FOR
 * ---------------------------------------------------------------------------
 * Automated testing of a 3D game without visual browser automation. An agent
 * can read the whole match state as data, and can drive the match, the cars and
 * the simulation through named actions whose effects are described in prose.
 * Nothing here needs a frame loop, a canvas, a WebGL context or a screenshot.
 *
 * The idioms are copied from `games/air-capture/src/game/contracts/agent.ts`:
 * `defineAirJamAgentStores` + `agentStore` to declare the replicated domains,
 * `defineAirJamAgentContract` to bind them, `agentAction.participant` /
 * `agentAction.host` per action, and `agentActionInput` for the payload parser.
 * Every action's `actionName` matches a real action on `useMatchStore`, which is
 * what makes the contract executable rather than descriptive.
 *
 * ---------------------------------------------------------------------------
 * WHY TWO STORE DOMAINS
 * ---------------------------------------------------------------------------
 * `default` is the replicated match state a controller sees. `simulation` is the
 * headless control surface: the latched controls and the sim reads (car poses,
 * ball pose, boost, goal flag) that the `default` state deliberately does not
 * carry, because broadcasting 8 cars × 51 floats at 120 Hz to every phone is
 * not a design this port wants. An agent asks for the sim surface when it needs
 * physics detail; a phone never pays for it.
 */

import {
  agentAction,
  agentActionInput,
  agentStore,
  defineAirJamAgentContract,
  defineAirJamAgentStores,
} from "@air-jam/sdk";

import { countdownLabel, findMvp, formatScoreline, winnerLabel } from "../match/core.js";
import { EMPTY_STATS, STAT_CONFIDENCE } from "../match/stats.js";
import {
  MUTATOR_DESCRIPTION,
  MUTATOR_IDS,
  MUTATOR_LABEL,
  MUTATOR_REGISTRY,
  resolveSimConfig,
} from "../match/sim-config.js";
import { TEAM_LABEL, type MatchState, type PlayerStats, type Team } from "../match/types.js";

const MATCH_STORE_DOMAIN = "default";
const SIM_STORE_DOMAIN = "simulation";

/**
 * The data an agent sees for the match. Deliberately a JSON projection, never
 * the store's internal object: an agent must not be able to mutate state by
 * holding on to it.
 */
export interface MatchAgentSnapshot {
  readonly phase: string;
  readonly mode: string;
  readonly score: { readonly blue: number; readonly orange: number };
  readonly scoreline: string;
  readonly clock: {
    readonly display: string;
    readonly remainingTicks: number;
    readonly overtimeTicks: number;
    readonly overtime: boolean;
    /** False until the first touch after kickoff. The donor holds at 5:00. */
    readonly started: boolean;
  };
  readonly countdown: number;
  readonly countdownLabel: string;
  readonly winner: number | null;
  readonly winnerLabel: string | null;
  readonly mvp: { readonly playerId: string; readonly name: string } | null;
  readonly players: ReadonlyArray<{
    readonly playerId: string;
    readonly name: string;
    readonly team: Team;
    readonly teamLabel: string;
    readonly slot: number;
    readonly isBot: boolean;
    readonly ready: boolean;
  }>;
  readonly stats: ReadonlyArray<{
    readonly playerId: string;
    readonly name: string;
    readonly stats: PlayerStats;
  }>;
  readonly statsConfidence: Readonly<Record<keyof PlayerStats, string>>;
  readonly goals: ReadonlyArray<{
    readonly id: number;
    readonly team: Team;
    readonly scorerPlayerId: string | null;
    readonly assistPlayerId: string | null;
    readonly inOvertime: boolean;
  }>;
  readonly mutator: {
    readonly id: string;
    readonly label: string;
    readonly description: string;
  };
  readonly ballCam: Readonly<Record<string, boolean>>;
  readonly lastBallTouch: { readonly playerId: string; readonly team: Team; readonly tick: number } | null;
}

/**
 * The headless control surface. `carStates` / `ballState` are `null` when the
 * host has not wired a sim, which is exactly the case during a pure logic test —
 * and the agent is told so rather than being handed a fake zero.
 */
export interface SimulationAgentSnapshot {
  readonly available: boolean;
  readonly carStates: ReadonlyArray<{
    readonly slot: number;
    readonly position: readonly [number, number, number];
    readonly boost: number;
    readonly onGround: boolean;
    readonly demoed: boolean;
    readonly ballHitSerial: number;
  }> | null;
  readonly ballState: { readonly position: readonly [number, number, number]; readonly radiusScale: number } | null;
  readonly goalFlag: 0 | 1 | 2;
  readonly controls: Readonly<Record<string, unknown>>;
  readonly mutatorConfig: Readonly<Record<string, number | boolean>>;
}

const stores = defineAirJamAgentStores({
  [MATCH_STORE_DOMAIN]: agentStore<MatchAgentSnapshot>(),
  [SIM_STORE_DOMAIN]: agentStore<SimulationAgentSnapshot>(),
});

/** `"blue"` / `"orange"`, the vocabulary an agent actually thinks in. */
const teamIdFrom = (value: unknown): Team => (value === 1 || value === "orange" ? 1 : 0);

/** Project a `MatchState` into the agent's view. Pure. */
export const projectMatchSnapshot = (state: MatchState): MatchAgentSnapshot => {
  const mvp = findMvp(state);
  const config = resolveSimConfig(state.mutator);
  return {
    phase: state.phase,
    mode: state.mode,
    score: { blue: state.score[0], orange: state.score[1] },
    scoreline: formatScoreline(state),
    clock: {
      display: state.clock.display,
      remainingTicks: state.clock.remainingTicks,
      overtimeTicks: state.clock.overtimeTicks,
      overtime: state.clock.overtime,
      started: state.clock.started,
    },
    countdown: state.countdown,
    countdownLabel: countdownLabel(state),
    winner: state.winner,
    winnerLabel: winnerLabel(state),
    mvp: mvp ? { playerId: mvp.playerId, name: mvp.name } : null,
    players: state.players.map((player) => ({
      playerId: player.playerId,
      name: player.name,
      team: player.team,
      teamLabel: TEAM_LABEL[player.team],
      slot: player.slot,
      isBot: player.isBot,
      ready: player.ready,
    })),
    stats: state.players.map((player) => ({
      playerId: player.playerId,
      name: player.name,
      stats: state.stats[player.playerId] ?? EMPTY_STATS,
    })),
    // Published verbatim so an agent never treats an inferred number as exact.
    statsConfidence: STAT_CONFIDENCE,
    goals: state.goals.map((goal) => ({
      id: goal.id,
      team: goal.team,
      scorerPlayerId: goal.scorerPlayerId,
      assistPlayerId: goal.assistPlayerId,
      inOvertime: goal.inOvertime,
    })),
    mutator: { id: config.id, label: config.label, description: config.description },
    ballCam: state.ballCam,
    lastBallTouch: state.lastBallTouch,
  };
};

/** The control payload an agent sends, as documented in the action below. */
interface DrivePayload {
  playerId: string;
  throttle?: number;
  steer?: number;
  jump?: boolean;
  boost?: boolean;
  powerslide?: boolean;
}

/**
 * Parse the drive payload shared by every driving action.
 *
 * Deliberately forgiving: an agent that sends `steer: 4` gets a clamped 1
 * rather than a rejected action, because a rejected action tells it less than a
 * working one and the seam clamps anyway (`seam.ts:124-139`).
 */
const driveInput = (
  payloadDescription: string,
  extra: Record<string, unknown> = {},
) =>
  agentActionInput.custom<DrivePayload>(
    { payloadDescription },
    (input) => {
      const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
      const num = (value: unknown, fallback = 0): number => {
        const n = Number(value);
        return Number.isFinite(n) ? Math.max(-1, Math.min(1, n)) : fallback;
      };
      const bool = (value: unknown, fallback: boolean): boolean =>
        value === undefined ? fallback : value === true || value === "true" || value === 1;
      return {
        playerId: typeof raw.playerId === "string" ? raw.playerId : "",
        throttle: num(raw.throttle),
        steer: num(raw.steer),
        jump: bool(raw.jump, false),
        boost: bool(raw.boost, false),
        powerslide: bool(raw.powerslide, false),
        ...extra,
      };
    },
  );

/** `playerId` + optional `name` / `team` / `slot`, for the join action. */
const joinInput = agentActionInput.custom<{
  playerId: string;
  name: string;
  team: Team;
  slot: number;
  isBot: boolean;
}>(
  {
    payloadDescription:
      'A JSON object like {"playerId":"c1","name":"Wasif","team":0,"slot":0,"isBot":false}. `team` is 0 (blue) or 1 (orange); omit `slot` to let the host pick the next free one.',
  },
  (input) => {
    const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
    const slot = Number(raw.slot);
    return {
      playerId: typeof raw.playerId === "string" ? raw.playerId : "",
      name: typeof raw.name === "string" && raw.name.length > 0 ? raw.name : "PLAYER",
      team: teamIdFrom(raw.team),
      slot: Number.isFinite(slot) ? Math.max(-1, Math.floor(slot)) : -1,
      isBot: raw.isBot === true,
    };
  },
);

/* -------------------------------------------------------------------------- */
/* The actions                                                                  */
/* -------------------------------------------------------------------------- */

const agentContractActions = {
  /* ---- session ------------------------------------------------------------ */

  join_player: agentAction.participant(
    { actionName: "joinPlayer", storeDomain: MATCH_STORE_DOMAIN },
    {
      input: joinInput,
      toPayload: (payload) => payload,
      description: "Put a player into the lobby on a team, and give them a car slot.",
      availability: "Lobby, ready and result phases. The roster is frozen once a match starts.",
      resultDescription: "The player appears in `players` with a team and a slot, not ready.",
    },
  ),

  ready_player: agentAction.participant(
    { actionName: "readyPlayer", storeDomain: MATCH_STORE_DOMAIN },
    {
      input: agentActionInput.custom<{ playerId: string; ready: boolean }>(
        { payloadDescription: 'A JSON object like {"playerId":"c1","ready":true}.' },
        (input) => {
          const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
          return {
            playerId: typeof raw.playerId === "string" ? raw.playerId : "",
            ready: raw.ready === true || raw.ready === "true" || raw.ready === 1,
          };
        },
      ),
      toPayload: (payload) => payload,
      description: "Mark one lobby player ready. When everyone is ready and both teams are filled, the match moves to `ready`.",
      availability: "Lobby and ready phases only.",
      resultDescription: "The player's `ready` flag flips, and the phase may become `ready`.",
    },
  ),

  set_team: agentAction.participant(
    { actionName: "setTeam", storeDomain: MATCH_STORE_DOMAIN },
    {
      input: agentActionInput.custom<{ playerId: string; team: Team }>(
        { payloadDescription: 'A JSON object like {"playerId":"c1","team":1}. 0 = blue, 1 = orange.' },
        (input) => {
          const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
          return {
            playerId: typeof raw.playerId === "string" ? raw.playerId : "",
            team: teamIdFrom(raw.team),
          };
        },
      ),
      toPayload: (payload) => payload,
      description: "Move a lobby player to the other team. Their car slot is reassigned with them and their ready flag is cleared.",
      availability: "Lobby, ready and result phases only.",
      resultDescription: "The player's `team` and `slot` change together; readiness is cleared.",
    },
  ),

  start_match: agentAction.participant(
    { actionName: "startMatch", storeDomain: MATCH_STORE_DOMAIN },
    {
      input: agentActionInput.none({ payloadDescription: "No payload." }),
      description:
        "Start the match. Enters `kickoff` for one tick, then runs the 3-2-1-GO countdown, then `playing`.",
      availability: "Any pre-match phase. A test may start before every player is ready.",
      resultDescription:
        "Score, clock and stats reset to 0 / 5:00, the mode becomes `match`, and the host is asked to reset the simulation kickoff.",
    },
  ),

  restart_match: agentAction.participant(
    { actionName: "restartMatch", storeDomain: MATCH_STORE_DOMAIN },
    {
      input: agentActionInput.none({ payloadDescription: "No payload." }),
      description:
        "Rematch from the result screen. Score, clock, stats, the goal feed and the last ball touch all reset; the roster does NOT change, so nobody re-joins.",
      availability: "Any phase. The result screen's REMATCH button calls this.",
      resultDescription:
        "A fresh match begins at `kickoff` with the same players, teams and slots. Team composition is preserved.",
    },
  ),

  /* ---- driving ------------------------------------------------------------ */

  drive: agentAction.participant(
    { actionName: "setControls", storeDomain: SIM_STORE_DOMAIN },
    {
      input: driveInput(
        'A JSON object like {"playerId":"c1","throttle":1,"steer":-0.4,"jump":true,"boost":true,"powerslide":false}. Axes are clamped to [-1,1].',
      ),
      toPayload: (payload) => ({
        playerId: payload.playerId,
        controls: {
          throttle: payload.throttle,
          steer: payload.steer,
          pitch: 0,
          yaw: 0,
          roll: 0,
          jump: payload.jump,
          boost: payload.boost,
          handbrake: payload.powerslide,
        },
      }),
      description:
        "Set one car's LEVEL controls. This is a latch, not a pulse: the values persist until the next setControls call or until the player disconnects. `powerslide` is the donor's handbrake, which is a powerslide on the ground and an air-roll in the air.",
      availability: "Any phase. Usable at any time, which is what makes a headless driving test possible.",
      resultDescription:
        "The simulation's per-slot controls for that player's car are replaced, and the seam writes them on the next tick.",
    },
  ),

  throttle: agentAction.participant(
    { actionName: "setControls", storeDomain: SIM_STORE_DOMAIN },
    {
      input: driveInput('A JSON object like {"playerId":"c1","throttle":1}. -1 brakes, +1 accelerates.'),
      toPayload: (payload) => ({ playerId: payload.playerId, controls: { throttle: payload.throttle } }),
      description: "Set only the throttle axis of one car, leaving every other control alone.",
      availability: "Any phase.",
      resultDescription: "That car's throttle becomes this value; steering and buttons are untouched.",
    },
  ),

  steer: agentAction.participant(
    { actionName: "setControls", storeDomain: SIM_STORE_DOMAIN },
    {
      input: driveInput('A JSON object like {"playerId":"c1","steer":-1}. -1 left, +1 right.'),
      toPayload: (payload) => ({ playerId: payload.playerId, controls: { steer: payload.steer } }),
      description: "Set only the steering axis of one car.",
      availability: "Any phase.",
      resultDescription: "That car's steering becomes this value. No mutator can invert its sign.",
    },
  ),

  jump: agentAction.participant(
    { actionName: "setControls", storeDomain: SIM_STORE_DOMAIN },
    {
      input: driveInput('A JSON object like {"playerId":"c1","jump":true}.'),
      toPayload: (payload) => ({ playerId: payload.playerId, controls: { jump: payload.jump } }),
      description:
        "Hold or release jump. The donor derives a flip or a double jump from `jump` plus the analog direction held at that instant, so this is level-based by design.",
      availability: "Any phase.",
      resultDescription: "That car's jump input is held or released for subsequent ticks.",
    },
  ),

  boost: agentAction.participant(
    { actionName: "setControls", storeDomain: SIM_STORE_DOMAIN },
    {
      input: driveInput('A JSON object like {"playerId":"c1","boost":true}.'),
      toPayload: (payload) => ({ playerId: payload.playerId, controls: { boost: payload.boost } }),
      description:
        "Hold or release boost. Under the INFINITE_BOOST mutator the donor's own `_physics_setUnlimitedBoost` handles the fuel, and this action only decides whether the button is down.",
      availability: "Any phase.",
      resultDescription: "That car's boost input is held or released for subsequent ticks.",
    },
  ),

  powerslide: agentAction.participant(
    { actionName: "setControls", storeDomain: SIM_STORE_DOMAIN },
    {
      input: driveInput('A JSON object like {"playerId":"c1","powerslide":true}.'),
      toPayload: (payload) => ({
        playerId: payload.playerId,
        controls: { handbrake: payload.powerslide },
      }),
      description:
        "Hold or release the handbrake, which is a powerslide on the ground and an air-roll in the air. This is the donor's own semantics, not an invention.",
      availability: "Any phase.",
      resultDescription: "That car's handbrake is held or released for subsequent ticks.",
    },
  ),

  ball_cam: agentAction.participant(
    { actionName: "setBallCam", storeDomain: MATCH_STORE_DOMAIN },
    {
      input: agentActionInput.custom<{ playerId: string; ballCam: boolean }>(
        { payloadDescription: 'A JSON object like {"playerId":"c1","ballCam":true}.' },
        (input) => {
          const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
          return {
            playerId: typeof raw.playerId === "string" ? raw.playerId : "",
            ballCam: raw.ballCam === true || raw.ballCam === "true" || raw.ballCam === 1,
          };
        },
      ),
      toPayload: (payload) => payload,
      description:
        "Toggle one player's ball cam. Never shared between players, per the seam's own rule that every viewport gets its own camera.",
      availability: "Any phase.",
      resultDescription: "That player's `ballCam` flag flips in the snapshot.",
    },
  ),

  /* ---- simulation / test -------------------------------------------------- */

  advance_simulation: agentAction.participant(
    { actionName: "advance", storeDomain: MATCH_STORE_DOMAIN },
    {
      input: agentActionInput.custom<{ ticks: number; kickoffTouched?: boolean; ballOnGround?: boolean; goal?: 0 | 1 | 2 }>(
        {
          payloadDescription:
            'A JSON object like {"ticks":120,"kickoffTouched":true,"ballOnGround":true,"goal":0}. `goal` is the donor\'s own flag: 0 none, 1 = team 0 scored, 2 = team 1 scored.',
        },
        (input) => {
          const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
          const ticks = Number(raw.ticks);
          const goal = Number(raw.goal);
          return {
            ticks: Number.isFinite(ticks) ? Math.max(0, Math.min(200_000, Math.floor(ticks))) : 120,
            kickoffTouched: raw.kickoffTouched === true || raw.kickoffTouched === "true",
            ballOnGround: raw.ballOnGround === true || raw.ballOnGround === "true",
            goal: goal === 1 || goal === 2 ? (goal as 1 | 2) : (0 as const),
          };
        },
      ),
      toPayload: (payload) => payload,
      description:
        "Run N fixed 120 Hz match ticks with no frame loop and no browser. Ticks stop early once the match reaches `result`, so the returned `ticksRun` can be less than requested.",
      availability:
        "Requires `mode: \"match\"`. The clock only starts once `kickoffTouched` is true at least once — the donor deliberately holds it at 5:00 until the first touch, and so does this.",
      resultDescription:
        "The phase, clock, score and stats advance by exactly `ticksRun` ticks. This is the primitive that lets a whole match be tested without visual automation.",
    },
  ),

  reset_kickoff: agentAction.participant(
    { actionName: "resetKickoff", storeDomain: MATCH_STORE_DOMAIN },
    {
      input: agentActionInput.none({ payloadDescription: "No payload." }),
      description:
        "Force a kickoff: every car back to its spawn and a fresh 3-2-1 countdown. The host is asked to run the donor's own reset, so the reset is the engine's, not a table of coordinates.",
      availability: "Any phase in a match.",
      resultDescription:
        "The phase becomes `kickoff` then `countdown`, the countdown restarts, the clock is HELD (it is not rewound — exactly as the donor's own `kickoff()` behaves), and the last ball touch is cleared. Use `restart_match` to rewind the score and the clock together.",
    },
  ),

  score_goal: agentAction.participant(
    { actionName: "scoreGoal", storeDomain: MATCH_STORE_DOMAIN },
    {
      input: agentActionInput.custom<{ team: Team }>(
        { payloadDescription: 'A JSON object like {"team":0}. 0 = blue scores, 1 = orange scores.' },
        (input) => {
          const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
          return { team: teamIdFrom(raw.team) };
        },
      ),
      toPayload: (payload) => payload,
      description:
        "Score a goal for a team without waiting for physics. Outside `playing` the goal is only recorded in the feed, so poking this action can never corrupt a running match.",
      availability: "Any phase. Fully effective only in `playing`.",
      resultDescription:
        "That team's score goes up by one, the scorer is attributed to the last native ball contact, and the machine enters `goal` for 3 seconds before the next kickoff or the final horn.",
    },
  ),

  end_match: agentAction.participant(
    { actionName: "endMatch", storeDomain: MATCH_STORE_DOMAIN },
    {
      input: agentActionInput.custom<{ winner: Team | null }>(
        { payloadDescription: 'A JSON object like {"winner":0}, or {"winner":null} to end on the current scoreline.' },
        (input) => {
          const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
          if (raw.winner === null) return { winner: null };
          return { winner: teamIdFrom(raw.winner) };
        },
      ),
      toPayload: (payload) => payload,
      description:
        "Sound the final horn immediately. Refuses to invent a winner for a level scoreline, exactly as the donor's `end()` does.",
      availability: "Any phase in a match.",
      resultDescription: "The phase becomes `result` and the winner is published.",
    },
  ),

  set_mutator: agentAction.participant(
    { actionName: "setMutator", storeDomain: MATCH_STORE_DOMAIN },
    {
      input: agentActionInput.enum(MUTATOR_IDS, {
        payloadDescription: "One of the nine physics mutator ids.",
      }),
      toPayload: (mutator) => ({ mutator }),
      description:
        "Switch the centralised simulation config. One id resolves to one frozen config object; every reader — control shaping and the native bridge — reads fields off it, so no code anywhere branches on the id.",
      availability: "Any phase, including mid-match.",
      resultDescription:
        "The donor is re-configured: `_physics_setUnlimitedBoost` where the config asks for it, and the ball block is rewritten where the config scales ball velocity.",
    },
  ),
} as const;

/* -------------------------------------------------------------------------- */
/* The contract                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The whole contract, bound.
 *
 * Declared AFTER `agentContractActions` on purpose: `actions` is evaluated
 * eagerly here, so referencing the action map before its declaration would be a
 * temporal-dead-zone error at module load.
 */
export const agentContract = defineAirJamAgentContract({
  stores,
  snapshotDescription:
    "Rocket Arena host match state. Two replicated domains: `default` carries the phase list " +
    "(lobby, ready, kickoff, countdown, playing, goal, result), the BLUE/ORANGE scoreline, the " +
    "ticked clock with its overtime flag, per-player stats WITH per-counter confidence labels, the " +
    "goal feed, the roster with teams and slots, the active physics mutator, ball-cam preferences " +
    "and the MVP. `simulation` carries the headless control surface: latched controls per player " +
    "and the sim's car and ball reads, so a test can assert physics without a browser.",

  projectSnapshot: (context) => {
    const state = context.stores[MATCH_STORE_DOMAIN];
    const actionNames = Object.keys(agentContractActions);

    if (!state) {
      return {
        matchPhase: "unavailable",
        summary: "The replicated Rocket Arena match store is not available yet.",
        phaseOrder: PHASE_ORDER,
        availableActions: actionNames,
      };
    }

    const phase = state.phase;

    return {
      ...state,
      matchPhase: phase,
      /** The phase list, so an agent can assert on progression without guessing. */
      phaseOrder: PHASE_ORDER,
      canStartMatch: phase === "ready" || phase === "lobby",
      canRematch: phase === "result",
      isLive: phase === "playing",
      summary:
        phase === "result"
          ? `${state.winnerLabel ?? "No winner"} ${state.scoreline}. MVP: ${state.mvp?.name ?? "none"}.`
          : `${phase} — ${state.scoreline}, clock ${state.clock.display}${
              state.clock.overtime ? " (OVERTIME: next goal wins)" : ""
            }${state.clock.started ? "" : " (clock held: ball not yet touched)"}`,
      mutators: MUTATOR_IDS.map((id) => ({
        id,
        label: MUTATOR_LABEL[id],
        description: MUTATOR_DESCRIPTION[id],
        active: state.mutator.id === id,
      })),
      statConfidence: STAT_CONFIDENCE,
      availableActions: actionNames,
    };
  },

  actions: agentContractActions,
});

/** The phase order, published so an agent can assert progression by index. */
const PHASE_ORDER = Object.freeze([
  "lobby",
  "ready",
  "kickoff",
  "countdown",
  "playing",
  "goal",
  "result",
] as const);

/** The flat, numeric/boolean view of the active config, for an agent. */
export const projectSimConfig = (mutatorId: string): Record<string, number | boolean> => {
  const config = resolveSimConfig(mutatorId);
  const out: Record<string, number | boolean> = {};
  for (const [key, value] of Object.entries(MUTATOR_REGISTRY[config.id])) {
    if (typeof value === "number" || typeof value === "boolean") out[key] = value;
  }
  return out;
};

/** The action names, in registration order. Exported so a test can assert on it. */
export const AGENT_ACTION_NAMES: readonly string[] = Object.freeze(
  Object.keys(agentContractActions),
);

export { MATCH_STORE_DOMAIN, SIM_STORE_DOMAIN };
