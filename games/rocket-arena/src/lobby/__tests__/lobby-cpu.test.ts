/**
 * CPU seats: computer-controlled players the host adds to a team in the lobby.
 * Pure node tests against the reducer and selectors.
 */
import { describe, expect, it } from "vitest";
import { createInitialLobbyState, lobbyReducer, selectReadiness } from "../lobby-reducer";
import { selectCpuTeams, selectJoinCountLabel, selectRoster, selectTeamScoreLabel } from "../lobby-selectors";
import type { LobbyAction, LobbyState } from "../types";

const run = (state: LobbyState, ...actions: LobbyAction[]): LobbyState => actions.reduce(lobbyReducer, state);
const join = (state: LobbyState, id: string): LobbyState =>
  lobbyReducer(state, { type: "player/join", id, name: id.toUpperCase() });
const withSeats = (playerSlots: number): LobbyState =>
  lobbyReducer(createInitialLobbyState(), { type: "settings/patch", patch: { playerSlots } });

describe("adding and removing CPUs", () => {
  it("adds a named CPU to the chosen team", () => {
    const state = run(withSeats(4), { type: "cpu/add", team: 1 });
    expect(state.cpus).toEqual([{ id: "cpu-1", name: "CPU 1", team: 1 }]);
    expect(selectCpuTeams(state)).toEqual([1]);
  });

  it("never reuses an id while a CPU still exists", () => {
    let state = run(withSeats(6), { type: "cpu/add", team: 0 }, { type: "cpu/add", team: 1 });
    state = run(state, { type: "cpu/remove", id: "cpu-1" }, { type: "cpu/add", team: 0 });
    expect(state.cpus.map((cpu) => cpu.id)).toEqual(["cpu-2", "cpu-3"]);
  });

  it("removes one CPU, or all of them", () => {
    const two = run(withSeats(4), { type: "cpu/add", team: 0 }, { type: "cpu/add", team: 1 });
    expect(run(two, { type: "cpu/remove", id: "cpu-1" }).cpus.map((cpu) => cpu.id)).toEqual(["cpu-2"]);
    expect(run(two, { type: "cpu/clear" }).cpus).toEqual([]);
  });

  it("moves a CPU to the other team", () => {
    const state = run(withSeats(4), { type: "cpu/add", team: 0 }, { type: "cpu/team", id: "cpu-1", team: 1 });
    expect(state.cpus[0]!.team).toBe(1);
  });

  it("changes nothing (same object) for unknown ids and no-op moves", () => {
    const state = run(withSeats(4), { type: "cpu/add", team: 0 });
    expect(lobbyReducer(state, { type: "cpu/remove", id: "cpu-99" })).toBe(state);
    expect(lobbyReducer(state, { type: "cpu/team", id: "cpu-1", team: 0 })).toBe(state);
    expect(lobbyReducer(state, { type: "cpu/team", id: "cpu-99", team: 1 })).toBe(state);
    expect(lobbyReducer(createInitialLobbyState(), { type: "cpu/clear" })).toStrictEqual(createInitialLobbyState());
  });
});

describe("seat and team limits", () => {
  it("counts a CPU as a seat: no CPU beyond the seats on offer", () => {
    let state = run(withSeats(2), { type: "cpu/add", team: 0 }, { type: "cpu/add", team: 1 });
    expect(state.cpus).toHaveLength(2);
    expect(lobbyReducer(state, { type: "cpu/add", team: 0 })).toBe(state);
    state = join(run(withSeats(4), { type: "cpu/add", team: 0 }), "a");
    expect(state.players.length + state.cpus.length).toBe(2);
  });

  it("a team holds at most four cars, humans and CPUs together", () => {
    let state = withSeats(8);
    for (let i = 0; i < 6; i += 1) state = lobbyReducer(state, { type: "cpu/add", team: 0 });
    expect(selectCpuTeams(state)).toEqual([0, 0, 0, 0]);
    expect(lobbyReducer(state, { type: "cpu/team", id: "cpu-1", team: 0 })).toBe(state);
  });

  it("a joining human takes a seat from the newest CPU", () => {
    let state = run(withSeats(2), { type: "cpu/add", team: 0 }, { type: "cpu/add", team: 1 });
    state = join(state, "a");
    expect(state.players).toHaveLength(1);
    expect(state.cpus.map((cpu) => cpu.id)).toEqual(["cpu-1"]);
  });

  it("lowering the seat count drops CPUs that no longer fit", () => {
    let state = run(withSeats(6), { type: "cpu/add", team: 0 }, { type: "cpu/add", team: 1 }, { type: "cpu/add", team: 0 });
    state = lobbyReducer(state, { type: "settings/patch", patch: { playerSlots: 2 } });
    expect(state.cpus).toHaveLength(2);
  });

  it("CPUs are only edited in the lobby", () => {
    let state = join(withSeats(4), "a");
    state = lobbyReducer(state, { type: "player/ready", id: "a", ready: true });
    state = lobbyReducer(state, { type: "match/start" });
    expect(state.phase).toBe("playing");
    expect(lobbyReducer(state, { type: "cpu/add", team: 0 })).toBe(state);
  });

  it("survive rematch and return-to-lobby, and are wiped by reset", () => {
    let state = run(join(withSeats(4), "a"), { type: "cpu/add", team: 1 }, { type: "player/ready", id: "a", ready: true }, { type: "match/start" });
    state = run(state, { type: "match/end" }, { type: "match/rematch" });
    expect(state.cpus).toHaveLength(1);
    state = run(state, { type: "lobby/return" });
    expect(state.cpus).toHaveLength(1);
    expect(lobbyReducer(state, { type: "lobby/resetAll" }).cpus).toEqual([]);
  });
});

describe("roster and labels", () => {
  it("lists CPUs after the humans, always ready, then the open seats", () => {
    const state = run(join(withSeats(4), "a"), { type: "cpu/add", team: 1 });
    const rows = selectRoster(state);
    expect(rows.map((row) => row.name)).toEqual(["A", "CPU 1", "OPEN SEAT", "OPEN SEAT"]);
    expect(rows[1]).toMatchObject({ cpu: true, ready: true, team: 1, teamLabel: "ORANGE" });
  });

  it("numbers every row consecutively, open seats included", () => {
    const state = run(join(withSeats(6), "a"), { type: "cpu/add", team: 1 });
    expect(selectRoster(state).map((row) => row.seat)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("includes CPUs in the team tally and the join label", () => {
    const state = run(join(withSeats(4), "a"), { type: "cpu/add", team: 1 }, { type: "cpu/add", team: 1 });
    expect(selectTeamScoreLabel(state)).toBe("BLUE 1 — ORANGE 2");
    expect(selectJoinCountLabel(state)).toBe("1 / 4 PLAYERS JOINED + 2 CPU");
    expect(selectJoinCountLabel(join(withSeats(4), "a"))).toBe("1 / 4 PLAYERS JOINED");
  });

  it("a match still needs a human: CPUs alone are not a start", () => {
    const state = run(withSeats(4), { type: "cpu/add", team: 0 }, { type: "cpu/add", team: 1 });
    expect(selectReadiness(state).ok).toBe(false);
  });
});
