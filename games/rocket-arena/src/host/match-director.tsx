/**
 * Match director: the one place that connects the projector lobby to the
 * donor's local match.
 *
 *   lobby store phase "playing"  ->  seat everyone, start the donor match,
 *                                    tell phones the runtime is "playing"
 *   lobby store phase otherwise  ->  stop the donor match, runtime "paused"
 *   donor goals / final whistle  ->  mirrored back into the lobby store so its
 *                                    post-match screen shows the real score
 *   donor events                 ->  haptics on the right phones
 *   donor car state              ->  each phone's boost / airborne readout
 *   players joining / leaving    ->  a late joiner takes a bot's car; a player
 *                                    who leaves hands their car back to a bot
 *
 * It renders the in-match HUD and nothing else. The lobby is the source of
 * truth for WHO plays, on WHICH team and in WHICH car; the donor is the source
 * of truth for what happens on the pitch.
 */
import { useEffect, useRef, useState } from "react";
import { useAirJamHost } from "@air-jam/sdk";

import { selectCarBindingIntents, selectCpuTeams, type LobbyStore } from "@/lobby";
import { MatchHud, type HudSeatInfo } from "@/host/match-hud";
import {
  launchLocalMatch,
  type LocalMatchController,
  type LocalMatchHud,
  type MatchTeam,
  type MatchTuning,
} from "@/host/local-match";
import { createBotDriver, planBotCars, type BotDriver } from "@/host/bot-driver";
import { encodeDownlink, type PhoneReadout } from "@/host/downlink";
import { createHapticPlanner } from "@/host/haptics";
import type { BotDifficultyId } from "@/airjam/bots/bot-difficulty";
import type { HostRuntime } from "@/host/runtime";
import type { LobbyIntent } from "@/airjam/input";

/**
 * DEV ONLY: `?matchSeconds=20` shortens regulation so end-of-match and overtime
 * can be exercised in seconds. Ignored in production builds.
 */
const DEV_MATCH_SECONDS = import.meta.env.DEV
  ? Number(new URLSearchParams(window.location.search).get("matchSeconds")) || null
  : null;

/** Lobby match length (minutes, 0 = unlimited) to regulation seconds. Unlimited is a very long match. */
const regulationSeconds = (minutes: number): number => (minutes > 0 ? minutes * 60 : 99 * 60);

/**
 * Lobby difficulty -> donor bot model. Only a 1v1 uses a neural model at all
 * (larger matches are scripted whatever is chosen here, see bot-driver.ts), so
 * this decides who a lone player faces.
 *
 * LICENSING: Seer is MIT. Necto and Nexto are CC BY-NC-SA 4.0, non-commercial.
 * The mapping below uses them for the higher tiers, which is fine for a local
 * or non-commercial event; a commercial deployment must remap `pro` and `ace`
 * to "seer" (see COMMERCIAL_SAFE_BOT_IDS in airjam/bots/bot-difficulty.ts).
 */
const BOT_FOR_DIFFICULTY: Record<"rookie" | "pro" | "ace", BotDifficultyId> = {
  rookie: "seer",
  pro: "necto",
  ace: "nexto",
};

/** The donor gives each bot model its own body (`bots/catalog.js`). */
const BOT_CAR: Record<string, string> = {
  seer: "challenger",
  necto: "octane-original",
  nexto: "fennec",
};

/** HUD refresh. Fast enough for a boost bar, slow enough to be free. */
const HUD_POLL_MS = 100;
/** The phone readout needs far less than the HUD; every Nth poll. */
const DOWNLINK_EVERY_POLLS = 2;
/** How long the final-whistle banner stays before the post-match screen, by lobby setting. */
const POST_MATCH_DELAY_MS = { full: 4000, short: 1500 } as const;

/** Who is in each car. `playerId` null = a bot (or nobody). */
interface CarSeat {
  playerId: string | null;
  team: MatchTeam;
}

export interface MatchDirectorProps {
  runtime: HostRuntime;
  controller: LocalMatchController;
  store: LobbyStore;
  /** Tell the shell whether a match is on screen (hides the lobby). */
  onActiveChange?: (active: boolean) => void;
}

const toMatchTuning = (tuning: { boost: string; ball: string; kickoffReset: string; goalCelebration: string }): MatchTuning => ({
  boost: tuning.boost === "turbo" ? "turbo" : "normal",
  ball: tuning.ball === "heavy" ? "heavy" : "normal",
  kickoffReset: tuning.kickoffReset === "fast" ? "fast" : "normal",
  goalCelebration: tuning.goalCelebration === "short" ? "short" : "full",
});

export const MatchDirector = ({ runtime, controller, store, onActiveChange }: MatchDirectorProps) => {
  const host = useAirJamHost();
  const players = useAirJamHost((state) => state.players);
  const [hud, setHud] = useState<LocalMatchHud | null>(null);
  const [replay, setReplay] = useState(false);
  const [seatNames, setSeatNames] = useState<HudSeatInfo[]>([]);

  // Latest values for the long-lived subscriptions below, without re-subscribing.
  const hostRef = useRef(host);
  hostRef.current = host;
  const playersRef = useRef(players);
  playersRef.current = players;
  const onActiveRef = useRef(onActiveChange);
  onActiveRef.current = onActiveChange;

  const botDriver = useRef<BotDriver | null>(null);
  const botDifficulty = useRef<BotDifficultyId>("seer");
  const botSkill = useRef<"rookie" | "pro" | "ace">("pro");
  const botsWanted = useRef(false);
  const seatsRef = useRef<CarSeat[]>([]);
  /** Which car a player last drove, so a reconnect gets the same car back. */
  const lastCarOf = useRef(new Map<string, number>());
  const launchedKey = useRef<string | null>(null);
  const busy = useRef(false);
  const mirroredScore = useRef({ blue: 0, orange: 0 });
  const endedReported = useRef(false);
  const postMatchDelay = useRef<number>(POST_MATCH_DELAY_MS.full);

  const refreshSeatNames = (): void => {
    const lobbyNames = new Map(store.getState().players.map((player) => [player.id, player.name]));
    const sdkNames = new Map(playersRef.current.map((player) => [player.id, player.label]));
    setSeatNames(
      seatsRef.current.map((seat) => ({
        name: seat.playerId ? (lobbyNames.get(seat.playerId) ?? sdkNames.get(seat.playerId) ?? "Player") : "CPU",
      })),
    );
  };

  // Phone-room runtime state: "playing" only while a match is live. A retry
  // loop, not a one-shot: the host socket may not be ready the first time we
  // ask, and `setRuntimeState` silently does nothing until it is.
  const runtimeState = useAirJamHost((state) => state.runtimeState);
  useEffect(() => {
    const timer = window.setInterval(() => {
      const desired = controller.active ? "playing" : "paused";
      if (hostRef.current.roomId && runtimeState !== desired) {
        hostRef.current.setRuntimeState(desired);
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, [controller, runtimeState]);

  /* ---------------------------------------------------------------- launch */

  useEffect(() => {
    const reconcile = async (): Promise<void> => {
      if (busy.current) return;
      const state = store.getState();
      const key = `${state.phase}:${state.match.number}`;

      if (state.phase === "playing") {
        if (launchedKey.current === key) return;
        busy.current = true;
        launchedKey.current = key;
        try {
          const intents = selectCarBindingIntents(state);
          const difficulty = BOT_FOR_DIFFICULTY[state.settings.botDifficulty];
          // The host's own CPU seats first, then (bot fill) enough extra bots to
          // bring both teams up to the team size. CPUs count as cars already on
          // the team, so fill never doubles them up.
          const cpuTeams = selectCpuTeams(state);
          const fillTeams =
            state.settings.botFill === "fill"
              ? planBotCars(
                  [...intents.map((intent) => intent.team), ...cpuTeams],
                  state.settings.teamSize,
                  controller.maxCars,
                )
              : [];
          const botTeams = [...cpuTeams, ...fillTeams];
          const result = await launchLocalMatch(
            runtime,
            controller,
            intents.map((intent) => ({ playerId: intent.playerId, team: intent.team, carId: intent.carId })),
            {
              matchSeconds: DEV_MATCH_SECONDS ?? regulationSeconds(state.settings.matchLength),
              tuning: toMatchTuning(state.settings.tuning),
              botTeams,
              botDifficulty: difficulty,
              botVisual: BOT_CAR[difficulty],
              botSkill: state.settings.botDifficulty,
            },
          );
          botDriver.current = result.bots;
          botDifficulty.current = difficulty;
          botSkill.current = state.settings.botDifficulty;
          botsWanted.current = state.settings.botFill === "fill" || cpuTeams.length > 0;
          postMatchDelay.current = POST_MATCH_DELAY_MS[state.settings.tuning.postMatchScreen === "short" ? "short" : "full"];
          lastCarOf.current.clear();
          seatsRef.current = result.teams.map((team, car) => ({ playerId: result.seats[car] ?? null, team }));
          result.seats.forEach((playerId, car) => lastCarOf.current.set(playerId, car));
          refreshSeatNames();
          mirroredScore.current = { blue: 0, orange: 0 };
          endedReported.current = false;
          hostRef.current.setRuntimeState("playing");
          onActiveRef.current?.(true);
        } catch (error) {
          console.error("[rocket-arena/host] could not start the match", error);
          launchedKey.current = null;
          store.dispatch({ type: "lobby/return" });
        } finally {
          busy.current = false;
        }
        return;
      }

      if (controller.active) {
        busy.current = true;
        try {
          await controller.stop();
          botDriver.current?.stop();
          botDriver.current = null;
        } catch (error) {
          console.error("[rocket-arena/host] could not stop the match cleanly", error);
        } finally {
          busy.current = false;
        }
        launchedKey.current = null;
        seatsRef.current = [];
        setHud(null);
        hostRef.current.sendState({ message: "" });
        hostRef.current.setRuntimeState("paused");
        onActiveRef.current?.(false);
      }
    };

    void reconcile();
    return store.subscribe(() => void reconcile());
  }, [store, runtime, controller]);

  /* --------------------------------------------------------- lobby polling */

  // Phones talk to the lobby through their input payload (ready / team / name /
  // car). Only while nobody is driving: reading a raw payload consumes a
  // pending jump press, which matters in a match and is meaningless before one.
  // Only CHANGES are dispatched, so the projector's own buttons (CLEAR READY,
  // CHANGE TEAMS) are not fought by a phone that is simply repeating its last
  // choice.
  const lastLobby = useRef(new Map<string, LobbyIntent>());
  useEffect(() => {
    const timer = window.setInterval(() => {
      const state = store.getState();
      if (state.phase === "playing" || busy.current) return;
      for (const player of state.players) {
        const intent = runtime.peekLobby(player.id);
        if (!intent) continue;
        const previous = lastLobby.current.get(player.id);
        if (!previous || previous.ready !== intent.ready) {
          store.dispatch({ type: "player/ready", id: player.id, ready: intent.ready });
        }
        if (previous && previous.team !== intent.team) {
          store.dispatch({ type: "player/team", id: player.id, choice: intent.team });
        }
        if ((!previous || previous.name !== intent.name) && intent.name.trim().length > 0) {
          store.dispatch({ type: "player/rename", id: player.id, name: intent.name });
        }
        if ((!previous || previous.carId !== intent.carId) && intent.carId !== null) {
          store.dispatch({ type: "player/car", id: player.id, carId: intent.carId });
        }
        lastLobby.current.set(player.id, intent);
      }
    }, 200);
    return () => window.clearInterval(timer);
  }, [runtime, store]);

  /* --------------------------------------------- mid-match joins and leaves */

  useEffect(() => {
    if (!controller.active || seatsRef.current.length === 0) return;
    const seats = seatsRef.current;
    const live = new Set(players.map((player) => player.id));
    let changed = false;

    // A seated player left: their car goes back to a bot (when bots are on).
    seats.forEach((seat, car) => {
      if (!seat.playerId || live.has(seat.playerId)) return;
      lastCarOf.current.set(seat.playerId, car);
      seat.playerId = null;
      changed = true;
      controller.removeHumanView(car);
      if (!botsWanted.current) return;
      const spec = { slot: car, team: seat.team };
      if (botDriver.current) botDriver.current.adopt(spec);
      else {
        // No bots existed at launch (a full roster): start a driver for this car.
        void createBotDriver({ bots: [spec], totalCars: seats.length, difficulty: botDifficulty.current, skill: botSkill.current }).then((driver) => {
          if (!controller.active || botDriver.current) {
            driver.stop();
            return;
          }
          botDriver.current = driver;
          controller.setBotDriver(driver);
        });
      }
    });

    // A player without a car arrived (or came back): give them one.
    const lobbyTeams = new Map(store.getState().players.map((player) => [player.id, player.team]));
    for (const player of players) {
      if (seats.some((seat) => seat.playerId === player.id)) continue;
      const remembered = lastCarOf.current.get(player.id);
      const free = (car: number): boolean => seats[car] !== undefined && seats[car]!.playerId === null;
      let car = remembered !== undefined && free(remembered) ? remembered : -1;
      if (car < 0) {
        const preferred = lobbyTeams.get(player.id);
        car = seats.findIndex((seat, index) => free(index) && seat.team === preferred);
        if (car < 0) car = seats.findIndex((_, index) => free(index));
      }
      if (car < 0) continue; // no free car: this phone spectates
      const slot = runtime.takeSeat(player.id, car, seats[car]!.team);
      if (slot === null) continue;
      botDriver.current?.release(car);
      controller.addHumanView(car);
      seats[car]!.playerId = player.id;
      lastCarOf.current.set(player.id, car);
      changed = true;
    }

    if (changed) refreshSeatNames();
  }, [players, controller, runtime, store]);

  /* ------------------------------------------------------- events -> phones */

  useEffect(() => {
    const planner = createHapticPlanner(() => ({
      players: seatsRef.current.map((seat) => seat.playerId),
      teams: seatsRef.current.map((seat) => seat.team),
    }));
    const buzz = (commands: ReturnType<typeof planner.go>): void => {
      for (const command of commands) {
        hostRef.current.sendSignal("HAPTIC", { pattern: command.pattern }, command.playerId);
      }
    };
    let previousPhase: string | null = null;
    return controller.onEvent((event) => {
      if (event.type === "phase") {
        // The kickoff countdown just ended: everyone feels "go".
        if (previousPhase === "kickoff" && event.phase === "playing") buzz(planner.go());
        previousPhase = event.phase;
      }
      buzz(planner.plan(event, performance.now()));
    });
  }, [controller]);

  /* ------------------------------------------------------- HUD + downlink */

  // Poll the donor for HUD data, mirror goals + the final whistle back into the
  // lobby store, and tell every phone its own boost / airborne state.
  useEffect(() => {
    const app = document.querySelector("#app");
    let polls = 0;
    const timer = window.setInterval(() => {
      if (!controller.active) return;
      const next = controller.hud();
      setHud(next);
      setReplay(Boolean(app?.classList.contains("goal-presentation-active")));

      const mirrored = mirroredScore.current;
      for (; mirrored.blue < next.blueScore; mirrored.blue += 1) store.dispatch({ type: "match/goal", team: 0 });
      for (; mirrored.orange < next.orangeScore; mirrored.orange += 1) store.dispatch({ type: "match/goal", team: 1 });
      if (next.phase === "ended" && !endedReported.current && store.getState().phase === "playing") {
        endedReported.current = true;
        // Let the result banner breathe before the lobby's post-match screen covers it.
        window.setTimeout(() => store.dispatch({ type: "match/end" }), postMatchDelay.current);
      }

      polls += 1;
      if (polls % DOWNLINK_EVERY_POLLS === 0) {
        const readouts: Record<string, PhoneReadout> = {};
        for (const view of next.views) {
          const playerId = seatsRef.current[view.car]?.playerId;
          if (playerId) readouts[playerId] = { boost: view.boost, airborne: view.airborne, demolished: view.demolished };
        }
        hostRef.current.sendState({ message: encodeDownlink(readouts) });
      }
    }, HUD_POLL_MS);
    return () => window.clearInterval(timer);
  }, [controller, store]);

  if (!hud?.active) return null;
  return <MatchHud hud={hud} seats={seatNames} replay={replay} />;
};
