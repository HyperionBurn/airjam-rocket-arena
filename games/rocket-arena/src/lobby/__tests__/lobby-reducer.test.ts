/**
 * Lobby reducer unit tests. Pure node environment, no DOM, no React, no SDK.
 *
 * OWNER: the lobby worker (`src/lobby/**`).
 *
 * Run just these:
 *   npx --yes pnpm@9.9.0 --filter rocket-arena exec vitest run src/lobby
 *
 * Nothing here imports the seam at runtime, so the donor's WASM glue is never
 * pulled into the test graph — `types.ts` imports `CarControls` type-only.
 */

import { describe, expect, it } from "vitest";
import { createInitialLobbyState, lobbyReducer, selectReadiness } from "../lobby-reducer";
import { createLobbyStore } from "../lobby-store";
import {
  selectCarBindingIntents,
  selectTeamCounts,
  selectTeamOverflow,
} from "../lobby-selectors";
import { EVENT_MODE_SETTINGS, matchDurationMs } from "../settings";
import type { LobbyAction, LobbyState, MatchLengthMinutes } from "../types";

const run = (state: LobbyState, ...actions: LobbyAction[]): LobbyState =>
  actions.reduce(lobbyReducer, state);

const join = (state: LobbyState, id: string, name = id.toUpperCase()): LobbyState =>
  lobbyReducer(state, { type: "player/join", id, name });

/** Seat a list of players in order, each one joining with no team preference. */
const seat = (...ids: string[]): LobbyState =>
  ids.reduce<LobbyState>((state, id) => join(state, id), createInitialLobbyState());

const withTeamSize = (state: LobbyState, teamSize: number): LobbyState =>
  lobbyReducer(state, { type: "settings/patch", patch: { teamSize } });

describe("AUTO team balance", () => {
  it("splits two players 1/1", () => {
    const state = seat("a", "b");
    expect(state.players).toHaveLength(2);
    expect(selectTeamCounts(state)).toEqual({ blue: 1, orange: 1 });
  });

  it("splits four players 2/2", () => {
    let state = createInitialLobbyState();
    for (const id of ["a", "b", "c", "d"]) {
      state = join(state, id);
    }
    expect(state.players).toHaveLength(4);
    expect(selectTeamCounts(state)).toEqual({ blue: 2, orange: 2 });
  });

  it("splits six players 3/3 with a team size of three", () => {
    let state = withTeamSize(createInitialLobbyState(), 3);
    for (const id of ["a", "b", "c", "d", "e", "f"]) {
      state = join(state, id);
    }
    expect(state.players).toHaveLength(6);
    expect(selectTeamCounts(state)).toEqual({ blue: 3, orange: 3 });
  });

  it("keeps an explicit pick pinned and balances around it", () => {
    let state = createInitialLobbyState();
    for (const id of ["a", "b", "c", "d"]) {
      state = join(state, id);
    }
    state = lobbyReducer(state, { type: "player/team", id: "a", choice: "orange" });
    // 1 orange (pinned) + 3 auto → 2 blue, 2 orange.
    expect(selectTeamCounts(state)).toEqual({ blue: 2, orange: 2 });
    expect(state.players.find((p) => p.id === "a")?.team).toBe(1);

    // A late joiner choosing AUTO must not displace the pinned player.
    state = join(state, "e");
    state = lobbyReducer(state, { type: "player/team", id: "e", choice: "auto" });
    expect(state.players.find((p) => p.id === "a")?.team).toBe(1);
    expect(selectTeamCounts(state)).toEqual({ blue: 3, orange: 2 });
  });

  it("reports overflow rather than hiding a player when both teams are full", () => {
    let state = withTeamSize(createInitialLobbyState(), 1);
    for (const id of ["a", "b", "c", "d"]) {
      state = join(state, id);
    }
    expect(state.players).toHaveLength(4);
    expect(selectTeamOverflow(state)).toBe(true);
  });
});

describe("ready state transitions", () => {
  const seated = () => seat("a", "b");

  it("flips a player ready and back", () => {
    let state = seated();
    expect(state.players.every((p) => !p.ready)).toBe(true);

    state = lobbyReducer(state, { type: "player/ready", id: "a", ready: true });
    expect(state.players.find((p) => p.id === "a")?.ready).toBe(true);
    expect(state.players.find((p) => p.id === "b")?.ready).toBe(false);

    state = lobbyReducer(state, { type: "player/ready", id: "a", ready: false });
    expect(state.players.find((p) => p.id === "a")?.ready).toBe(false);
  });

  it("announces readiness for the projector's live region", () => {
    let state = seated();
    state = lobbyReducer(state, { type: "player/ready", id: "a", ready: true });
    expect(state.announcement).toContain("is ready");
    expect(state.announcement).toContain("1 of 2 ready");
  });

  it("returns the identical state object for a no-op ready toggle", () => {
    const state = seated();
    expect(lobbyReducer(state, { type: "player/ready", id: "a", ready: false })).toBe(state);
  });

  it("ignores a ready tap for a player who is not seated", () => {
    const state = seated();
    expect(lobbyReducer(state, { type: "player/ready", id: "ghost", ready: true })).toBe(state);
  });

  it("clears every ready flag on request", () => {
    let state = seated();
    state = run(state, { type: "player/ready", id: "a", ready: true }, { type: "player/ready", id: "b", ready: true });
    expect(state.players.every((p) => p.ready)).toBe(true);

    state = lobbyReducer(state, { type: "roster/clearReady" });
    expect(state.players.every((p) => !p.ready)).toBe(true);
  });
});

describe("join then leave returns the slot", () => {
  it("frees the seat immediately and drops the joined count", () => {
    let state = createInitialLobbyState();
    state = join(state, "a");
    state = join(state, "b");
    expect(state.announcement).toContain("2 / 4 PLAYERS JOINED");

    state = lobbyReducer(state, { type: "player/leave", id: "a" });
    expect(state.players).toHaveLength(1);
    expect(state.announcement).toContain("1 / 4 PLAYERS JOINED");
    expect(state.announcement).toContain("A left");

    // The freed seat is genuinely reusable.
    state = join(state, "c");
    expect(state.players.map((p) => p.id)).toEqual(["b", "c"]);
  });

  it("is a no-op for a player who is not seated", () => {
    const state = createInitialLobbyState();
    expect(lobbyReducer(state, { type: "player/leave", id: "nobody" })).toBe(state);
  });
});

describe("reconnecting player keeps identity and team", () => {
  const scenario = () => {
    let state = seat("a", "b");
    state = run(state, { type: "player/team", id: "a", choice: "orange" }, { type: "player/car", id: "a", carId: "vesper" });
    return lobbyReducer(state, { type: "player/leave", id: "a" });
  };

  it("restores the same team, preference and car on rejoin", () => {
    const before = scenario();
    expect(before.players.map((p) => p.id)).toEqual(["b"]);

    const after = join(before, "a", "SOMETHING ELSE");
    const restored = after.players.find((p) => p.id === "a");

    expect(restored).toBeDefined();
    // The NAME the phone sends wins — a player is allowed to rename between
    // connections, and the SDK persists their nickname on the device anyway.
    // Team, preference and car are the parts only the room remembers.
    expect(restored?.name).toBe("SOMETHING ELSE");
    expect(restored?.team).toBe(1);
    expect(restored?.teamPreference).toBe("orange");
    expect(restored?.carId).toBe("vesper");
    expect(after.players).toHaveLength(2);
  });

  it("falls back to the remembered name when the phone sends a blank one", () => {
    const after = join(scenario(), "a", "   ");
    expect(after.players.find((p) => p.id === "a")?.name).toBe("A");
  });

  it("keeps the departed record out of the active roster after reconnect", () => {
    const after = join(scenario(), "a");
    expect(after.departed).not.toHaveProperty("a");
    expect(after.departed).not.toHaveProperty("b");
  });

  it("keeps the same seat number so AUTO tie-breaks stay stable", () => {
    const before = scenario();
    const after = join(before, "a");
    expect(after.players.find((p) => p.id === "a")?.seat).toBe(
      before.departed.a?.seat,
    );
  });
});

describe("EVENT MODE preset", () => {
  it("applies its documented values in one action", () => {
    const state = lobbyReducer(createInitialLobbyState(), { type: "settings/eventMode", enabled: true });

    expect(state.settings.eventMode).toBe(true);
    expect(state.settings.playerSlots).toBe(4);
    expect(state.settings.teamSize).toBe(2);
    expect(state.settings.matchLength).toBe(3);
    expect(state.settings.botFill).toBe("fill");
    expect(state.settings.botDifficulty).toBe("pro");
    expect(state.settings.instantRematch).toBe(true);
    expect(state.settings.tuning).toEqual({
      boost: "normal",
      ball: "normal",
      kickoffReset: "fast",
      goalCelebration: "short",
      postMatchScreen: "short",
    });
    expect(state.match.clockMs).toBe(3 * 60_000);
    expect(state.announcement).toContain("EVENT MODE on");
  });

  it("matches the exported preset constant field for field", () => {
    const state = lobbyReducer(createInitialLobbyState(), { type: "settings/eventMode", enabled: true });
    for (const key of Object.keys(EVENT_MODE_SETTINGS) as (keyof typeof EVENT_MODE_SETTINGS)[]) {
      expect(state.settings[key]).toEqual(EVENT_MODE_SETTINGS[key]);
    }
  });

  it("rebalances the room to the preset team size", () => {
    let state = createInitialLobbyState();
    for (const id of ["a", "b", "c", "d", "e", "f"]) {
      state = join(state, id);
    }
    state = lobbyReducer(state, { type: "settings/eventMode", enabled: true });
    expect(state.settings.teamSize).toBe(2);
    expect(selectTeamCounts(state)).toEqual({ blue: 3, orange: 3 });
  });

  it("restores the standard defaults when switched off", () => {
    const on = lobbyReducer(createInitialLobbyState(), { type: "settings/eventMode", enabled: true });
    const off = lobbyReducer(on, { type: "settings/eventMode", enabled: false });

    expect(off.settings.eventMode).toBe(false);
    expect(off.settings.matchLength).toBe(5);
    expect(off.settings.botFill).toBe("off");
    expect(off.settings.instantRematch).toBe(false);
    expect(off.settings.tuning.kickoffReset).toBe("normal");
  });

  it("lets one ready player start, which is the whole point of the preset", () => {
    let state = lobbyReducer(createInitialLobbyState(), { type: "settings/eventMode", enabled: true });
    state = join(state, "a");
    expect(selectReadiness(state).ok).toBe(false);

    state = lobbyReducer(state, { type: "player/ready", id: "a", ready: true });
    expect(selectReadiness(state).ok).toBe(true);
    expect(lobbyReducer(state, { type: "match/start" }).phase).toBe("playing");
  });
});

describe("match start and instant rematch", () => {
  const playing = () => {
    let state = lobbyReducer(createInitialLobbyState(), { type: "settings/eventMode", enabled: true });
    for (const id of ["a", "b", "c", "d"]) {
      state = join(state, id);
    }
    state = run(
      state,
      { type: "player/ready", id: "a", ready: true },
      { type: "player/ready", id: "b", ready: true },
      { type: "player/car", id: "a", carId: "fennec" },
      { type: "match/start" },
    );
    return run(state, { type: "match/goal", team: 0 }, { type: "match/goal", team: 0 }, { type: "match/goal", team: 1 });
  };

  it("refuses to start a match nobody is ready for", () => {
    let state = createInitialLobbyState();
    state = join(state, "a");
    state = join(state, "b");
    expect(lobbyReducer(state, { type: "match/start" })).toBe(state);
    expect(selectReadiness(state).reason).toBe("WAITING FOR 2 MORE READY");
  });

  it("requires every human ready when bot fill is off", () => {
    let state = createInitialLobbyState();
    state = join(state, "a");
    state = join(state, "b");
    state = lobbyReducer(state, { type: "player/ready", id: "a", ready: true });
    expect(selectReadiness(state).ok).toBe(false);
  });

  it("resets score and clock on rematch without a rejoin", () => {
    const live = playing();
    expect(live.phase).toBe("playing");
    expect(live.match).toMatchObject({ blue: 2, orange: 1, number: 1 });

    const again = lobbyReducer(live, { type: "match/rematch" });

    expect(again.phase).toBe("playing");
    expect(again.match.blue).toBe(0);
    expect(again.match.orange).toBe(0);
    expect(again.match.clockMs).toBe(3 * 60_000);
    expect(again.match.number).toBe(2);
    expect(again.announcement).toContain("Rematch 2");
  });

  it("keeps every player, team, car and ready flag across a rematch", () => {
    const before = playing();
    const after = lobbyReducer(before, { type: "match/rematch" });

    expect(after.players).toEqual(before.players);
    expect(after.players).toHaveLength(4);
    expect(after.players.find((p) => p.id === "a")?.carId).toBe("fennec");
    expect(after.players.filter((p) => p.ready)).toHaveLength(2);
  });

  it("emits no join/leave traffic for a rematch", () => {
    const store = createLobbyStore();
    store.dispatch({ type: "settings/eventMode", enabled: true });
    for (const id of ["a", "b"]) {
      store.dispatch({ type: "player/join", id, name: id.toUpperCase() });
      store.dispatch({ type: "player/ready", id, ready: true });
    }
    store.dispatch({ type: "match/start" });
    store.dispatch({ type: "match/goal", team: 0 });

    const seen: string[] = [];
    const unsubscribe = store.subscribe((state) => seen.push(state.announcement));
    const before = store.getState();

    store.dispatch({ type: "match/rematch" });
    unsubscribe();

    const after = store.getState();
    // Exactly one notification, and it is about the rematch only.
    expect(seen).toHaveLength(1);
    expect(seen[0]).toContain("Rematch 2");
    expect(seen[0]).not.toMatch(/joined|left/);
    // The roster is the same array, not a rebuilt one: no rejoin happened.
    expect(after.players).toBe(before.players);
    expect(after.departed).toEqual({});
  });

  it("is a no-op when rematching from the lobby", () => {
    const state = createInitialLobbyState();
    expect(lobbyReducer(state, { type: "match/rematch" })).toBe(state);
  });

  it("carries the clock to zero and ends the match", () => {
    const live = playing();
    const expired = lobbyReducer(live, { type: "match/tick", deltaMs: 3 * 60_000 });
    expect(expired.phase).toBe("post-match");
    expect(expired.match.clockMs).toBe(0);
    expect(expired.announcement).toBe("Time up — match over");
  });

  it("never ticks an unlimited clock", () => {
    let state = createInitialLobbyState();
    state = lobbyReducer(state, { type: "settings/eventMode", enabled: true });
    state = lobbyReducer(state, { type: "settings/patch", patch: { matchLength: 0 as MatchLengthMinutes } });
    for (const id of ["a", "b"]) {
      state = join(state, id);
    }
    state = run(
      state,
      { type: "player/ready", id: "a", ready: true },
      { type: "player/ready", id: "b", ready: true },
      { type: "match/start" },
    );
    expect(state.match.clockMs).toBeNull();
    expect(matchDurationMs(0)).toBeNull();
    expect(lobbyReducer(state, { type: "match/tick", deltaMs: 60_000 })).toBe(state);
  });
});

describe("post-match options", () => {
  const postMatch = () => {
    let state = lobbyReducer(createInitialLobbyState(), { type: "settings/eventMode", enabled: true });
    state = join(state, "a");
    state = lobbyReducer(state, { type: "player/ready", id: "a", ready: true });
    state = run(state, { type: "match/start" }, { type: "match/goal", team: 1 }, { type: "match/end" });
    return state;
  };

  it("CHANGE TEAMS reshuffles, un-readies and returns to the lobby", () => {
    const state = lobbyReducer(postMatch(), { type: "lobby/reshuffleTeams" });
    expect(state.phase).toBe("lobby");
    expect(state.players.every((p) => !p.ready)).toBe(true);
    expect(state.players.every((p) => p.teamPreference === "auto")).toBe(true);
    expect(state.match.blue).toBe(0);
    expect(state.match.orange).toBe(0);
  });

  it("EXIT returns to the lobby with the players still seated", () => {
    const before = postMatch();
    const state = lobbyReducer(before, { type: "lobby/return" });
    expect(state.phase).toBe("lobby");
    expect(state.players).toEqual(before.players);
    expect(state.announcement).toContain("Back in the lobby");
  });

  it("names the winning team when the match ends", () => {
    const state = postMatch();
    expect(state.match.orange).toBe(1);
    expect(state.announcement).toBe("Match over — ORANGE wins");
  });
});

describe("store container", () => {
  it("only notifies subscribers on a real change", () => {
    const store = createLobbyStore();
    store.dispatch({ type: "player/join", id: "a", name: "Ada" });

    let notifications = 0;
    const unsubscribe = store.subscribe(() => {
      notifications += 1;
    });

    // No-op: same player, same join, and a leave for someone absent.
    store.dispatch({ type: "player/join", id: "a", name: "Ada" });
    store.dispatch({ type: "player/leave", id: "ghost" });
    expect(notifications).toBe(0);

    store.dispatch({ type: "player/ready", id: "a", ready: true });
    expect(notifications).toBe(1);

    unsubscribe();
    store.dispatch({ type: "player/ready", id: "a", ready: false });
    expect(notifications).toBe(1);
  });

  it("reconciles a whole room through a single sync action", () => {
    const store = createLobbyStore();
    store.dispatch({
      type: "players/sync",
      players: [
        { id: "a", name: "Ada" },
        { id: "b", name: "Bo" },
        { id: "c", name: "Cy" },
        { id: "d", name: "Di" },
      ],
    });
    expect(selectTeamCounts(store.getState())).toEqual({ blue: 2, orange: 2 });

    store.dispatch({
      type: "players/sync",
      players: [
        { id: "a", name: "Ada" },
        { id: "b", name: "Bo" },
      ],
    });
    expect(store.getState().players).toHaveLength(2);
  });

  it("a sync for a new arrival keeps everyone else's name, ready and team", () => {
    const store = createLobbyStore();
    store.dispatch({ type: "players/sync", players: [{ id: "a", name: "Player 0" }] });
    store.dispatch({ type: "player/rename", id: "a", name: "ROCKET RAYAN" });
    store.dispatch({ type: "player/team", id: "a", choice: "orange" });
    store.dispatch({ type: "player/ready", id: "a", ready: true });
    // a second phone joins: the SDK list now has both, with its default labels
    store.dispatch({
      type: "players/sync",
      players: [
        { id: "a", name: "Player 0" },
        { id: "b", name: "Player 1" },
      ],
    });
    const a = store.getState().players.find((p) => p.id === "a");
    expect(a?.name).toBe("ROCKET RAYAN");
    expect(a?.ready).toBe(true);
    expect(a?.team).toBe(1); // orange
    expect(store.getState().players).toHaveLength(2);
  });

  it("produces one car binding intent per seated player", () => {
    const store = createLobbyStore();
    for (const id of ["a", "b"]) {
      store.dispatch({ type: "player/join", id, name: id.toUpperCase() });
    }
    const intents = selectCarBindingIntents(store.getState());
    expect(intents).toHaveLength(2);
    expect(intents.map((i) => i.team).sort()).toEqual([0, 1]);
    expect(intents[0].controls).toMatchObject({ throttle: 0, boost: false, handbrake: false });
  });

  it("caps the room at the seam's arena limit", () => {
    const store = createLobbyStore();
    for (const id of ["a", "b", "c", "d", "e", "f", "g", "h", "i"]) {
      store.dispatch({ type: "player/join", id, name: id });
    }
    // DEFAULT_SETTINGS offers 4 seats; the 9th cannot exceed what was offered.
    expect(store.getState().players.length).toBeLessThanOrEqual(8);
  });
});

describe("settings/tuning", () => {
  it("changes only the fields it is given", () => {
    const state = createInitialLobbyState();
    const next = lobbyReducer(state, { type: "settings/tuning", patch: { boost: "turbo" } });
    expect(next.settings.tuning).toEqual({ ...state.settings.tuning, boost: "turbo" });
    const both = lobbyReducer(next, { type: "settings/tuning", patch: { ball: "heavy", goalCelebration: "short" } });
    expect(both.settings.tuning.boost).toBe("turbo");
    expect(both.settings.tuning.ball).toBe("heavy");
    expect(both.settings.tuning.goalCelebration).toBe("short");
  });

  it("ignores values it does not know and is a true no-op when nothing changes", () => {
    const state = createInitialLobbyState();
    const bogus = lobbyReducer(state, {
      type: "settings/tuning",
      patch: { boost: "ludicrous" as never, ball: "square" as never },
    });
    expect(bogus).toBe(state);
    expect(lobbyReducer(state, { type: "settings/tuning", patch: { boost: "normal" } })).toBe(state);
  });

  it("is reset by turning event mode off, and set by turning it on", () => {
    const tuned = lobbyReducer(createInitialLobbyState(), { type: "settings/tuning", patch: { boost: "turbo" } });
    const on = lobbyReducer(tuned, { type: "settings/eventMode", enabled: true });
    expect(on.settings.tuning.kickoffReset).toBe("fast");
    expect(on.settings.tuning.goalCelebration).toBe("short");
    const off = lobbyReducer(on, { type: "settings/eventMode", enabled: false });
    expect(off.settings.tuning.boost).toBe("normal");
    expect(off.settings.tuning.goalCelebration).toBe("full");
  });
});

