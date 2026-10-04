/**
 * Thin React wrappers over `useMatchStore`.
 *
 * Every one of these is a pure projection: no component holds state, no
 * component decides anything, and nothing here imports the donor. The machine in
 * `./machine.ts` is the only thing that can move a match forward.
 *
 * `rocket-arena-game.tsx` (owned by the orchestrator) is what mounts these; this
 * file deliberately does not import anything from `src/shell/**`, `src/app.tsx`
 * or `src/controller/**`, all of which belong to other workers.
 *
 * TWO IDIOMS WORTH KNOWING:
 *  - `useMatchStore()` with NO selector infers `unknown` from the SDK's
 *    `<U>(selector?) => U` signature, so every hook here passes an explicit
 *    selector. `useMatchStore((state) => state)` infers the whole store.
 *  - Actions go through `useActions()`, which returns the dispatch map with the
 *    payload types already lifted, rather than the raw `(ctx, payload)` map.
 */

import { useCallback } from "react";
import { countdownLabel, findMvp, formatScoreline, winnerLabel } from "./core.js";
import { MUTATOR_IDS, MUTATOR_LABEL } from "./sim-config.js";
import { useMatchStore } from "./store.js";
import { TEAM_LABEL, type MatchState, type PlayerStats, type Team } from "./types.js";

/** The whole store, with the type inferred rather than falling back to unknown. */
const useMatchState = (): MatchState => useMatchStore((state) => state);

/* -------------------------------------------------------------------------- */
/* Scoreboard                                                                    */
/* -------------------------------------------------------------------------- */

/** The permanent HUD strip: BLUE · score · clock · ORANGE. */
export const MatchScoreboard = (): React.ReactElement => {
  const state = useMatchState();
  return (
    <div className="ra-scoreboard" data-phase={state.phase}>
      <span className="ra-scoreboard__team">{TEAM_LABEL[0]}</span>
      <strong className="ra-scoreboard__score">{formatScoreline(state)}</strong>
      <span className="ra-scoreboard__team">{TEAM_LABEL[1]}</span>
      <span className="ra-scoreboard__clock" data-overtime={state.clock.overtime}>
        {state.clock.display}
      </span>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Countdown                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The 3 · 2 · 1 · GO overlay. Mounted unconditionally and hidden by CSS, so a
 * transition can never be missed by a mount/unmount race.
 */
export const MatchCountdown = (): React.ReactElement => {
  const phase = useMatchStore((state) => state.phase);
  const label = useMatchStore(countdownLabel);
  const visible = phase === "kickoff" || phase === "countdown" || phase === "goal";
  return (
    <div className="ra-countdown" data-visible={visible} role="status" aria-live="polite">
      <span className="ra-countdown__label">{visible ? label : ""}</span>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Result                                                                        */
/* -------------------------------------------------------------------------- */

const statRows = (state: MatchState): Array<{ playerId: string; name: string; stats: PlayerStats }> =>
  state.players
    .map((player) => ({
      playerId: player.playerId,
      name: player.name,
      stats: state.stats[player.playerId],
    }))
    .filter((row): row is { playerId: string; name: string; stats: PlayerStats } => Boolean(row.stats))
    .sort(
      (a, b) =>
        b.stats.goals - a.stats.goals ||
        b.stats.assists - a.stats.assists ||
        b.stats.ballTouches - a.stats.ballTouches,
    );

/**
 * The result screen: `BLUE WINS / 3 - 2 / MVP: <name>`, the per-player table the
 * donor's state actually supports, then REMATCH / CHANGE TEAMS / EXIT.
 */
export const MatchResult = (): React.ReactElement => {
  const state = useMatchState();
  const actions = useMatchStore.useActions();
  const mvp = findMvp(state);

  const onRematch = useCallback(() => void actions.restartMatch(), [actions]);
  const onChangeTeams = useCallback(() => void actions.swapTeams(), [actions]);
  const onExit = useCallback(() => void actions.leaveMatch(), [actions]);

  if (state.phase !== "result") {
    return <section className="ra-result" hidden aria-hidden="true" />;
  }

  return (
    <section className="ra-result" role="dialog" aria-label="Match result">
      <p className="ra-result__winner">{winnerLabel(state)}</p>
      <p className="ra-result__score">{formatScoreline(state)}</p>
      <p className="ra-result__mvp">MVP: {mvp ? mvp.name : "—"}</p>

      <table className="ra-result__table">
        <caption className="sr-only">Match statistics</caption>
        <thead>
          <tr>
            <th scope="col">Player</th>
            <th scope="col">Team</th>
            <th scope="col">G</th>
            <th scope="col">A</th>
            <th scope="col">SV</th>
            <th scope="col">SH</th>
            <th scope="col">DEM</th>
            <th scope="col">TCH</th>
            <th scope="col">BOOST</th>
          </tr>
        </thead>
        <tbody>
          {statRows(state).map((row) => {
            const team: Team = state.players.find((entry) => entry.playerId === row.playerId)?.team ?? 0;
            return (
              <tr key={row.playerId} data-mvp={mvp?.playerId === row.playerId}>
                <th scope="row">{row.name}</th>
                <td>{TEAM_LABEL[team]}</td>
                <td>{row.stats.goals}</td>
                <td>{row.stats.assists}</td>
                <td>{row.stats.saves}</td>
                <td>{row.stats.shots}</td>
                <td>{row.stats.demolitions}</td>
                <td>{row.stats.ballTouches}</td>
                <td>{Math.round(row.stats.boostConsumed)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="ra-result__actions">
        <button type="button" onClick={onRematch}>
          REMATCH
        </button>
        <button type="button" onClick={onChangeTeams}>
          CHANGE TEAMS
        </button>
        <button type="button" onClick={onExit}>
          EXIT
        </button>
      </div>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/* Mutator picker                                                                */
/* -------------------------------------------------------------------------- */

/**
 * The lobby mutator picker. It writes ONE id; everything downstream reads the
 * config that id resolves to. There is deliberately no per-mutator UI here.
 */
export const MutatorPicker = (): React.ReactElement => {
  const active = useMatchStore((state) => state.mutator);
  const actions = useMatchStore.useActions();
  return (
    <label className="ra-mutator">
      <span>Physics</span>
      <select
        value={active}
        onChange={(event) => void actions.setMutator({ mutator: event.target.value })}
      >
        {MUTATOR_IDS.map((id) => (
          <option key={id} value={id}>
            {MUTATOR_LABEL[id]}
          </option>
        ))}
      </select>
    </label>
  );
};

/* -------------------------------------------------------------------------- */
/* The whole overlay                                                             */
/* -------------------------------------------------------------------------- */

/** Everything above, in one place, for the orchestrator to mount. */
export const MatchOverlay = (): React.ReactElement => (
  <>
    <MatchScoreboard />
    <MatchCountdown />
    <MatchResult />
  </>
);
