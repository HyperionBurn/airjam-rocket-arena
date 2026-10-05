/**
 * Arcade hub adapter: the React half. Mounted by `HostSurface` only when the hub
 * launched us (see `arcade.ts`). It replaces the projector lobby with a short
 * "gathering" screen, starts the match by itself once the hub's players are in,
 * mirrors the score to the hub, and posts the result when the match ends.
 *
 * It drives the existing lobby store with ordinary actions, so everything the
 * match director already does (seating, bots, teams, phones' runtime state)
 * works unchanged.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useAirJamHost } from "@air-jam/sdk";

import type { LobbyStore } from "@/lobby";
import { controllerTemplate, hubClient, placementsFor, progressFor, shouldStart, teamSizeFor, type ArcadeLaunch, type FinalScore } from "@/host/arcade";

const matchLengthFor = (seconds: number | null): 0 | 3 | 5 | 7 => {
  if (!seconds) return 3;
  const minutes = seconds / 60;
  return minutes <= 4 ? 3 : minutes <= 6 ? 5 : 7;
};

const finalScore = (store: LobbyStore): FinalScore => {
  const state = store.getState();
  return { teamOf: new Map(state.players.map((player) => [player.id, player.team])), blue: state.match.blue, orange: state.match.orange };
};

export interface ArcadeBridgeProps {
  launch: ArcadeLaunch;
  store: LobbyStore;
  /** True while the donor match is on screen. */
  matchActive: boolean;
}

export const ArcadeBridge = ({ launch, store, matchActive }: ArcadeBridgeProps) => {
  const host = useAirJamHost();
  const hub = useMemo(() => hubClient(launch), [launch]);
  const [present, setPresent] = useState<string[]>([]);
  const mountedAt = useRef(performance.now());
  const lastArrival = useRef(performance.now());
  const started = useRef(false);
  const reported = useRef(false);

  // Tell the hub where phones go, as soon as the Air Jam room exists. Retried,
  // because the hub may still be answering the page load that launched us.
  const joinUrl = host.joinUrl;
  useEffect(() => {
    if (!joinUrl) return undefined;
    let live = true;
    let timer = 0;
    const attempt = async (tries: number): Promise<void> => {
      const ok = await hub.ready(controllerTemplate(joinUrl));
      if (!ok && live && tries < 20) timer = window.setTimeout(() => void attempt(tries + 1), 1500);
    };
    void attempt(0);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [hub, joinUrl]);

  // Seats and match settings come from the hub's roster, not from a lobby screen.
  useEffect(() => {
    const humans = launch.players.length;
    const teamSize = teamSizeFor(humans);
    store.dispatch({
      type: "settings/patch",
      patch: { botFill: "fill", teamSize, playerSlots: Math.min(8, Math.max(teamSize * 2, humans)), matchLength: matchLengthFor(launch.seconds) },
    });
  }, [launch, store]);

  // Who from the hub has arrived, and the start decision.
  useEffect(() => {
    const expected = launch.players.map((player) => player.id);
    const sync = (): void => {
      const here = store.getState().players.map((player) => player.id).filter((id) => expected.includes(id));
      setPresent((previous) => {
        if (previous.length === here.length && previous.every((id, index) => id === here[index])) return previous;
        lastArrival.current = performance.now();
        return here;
      });
    };
    sync();
    const unsubscribe = store.subscribe(sync);
    const timer = window.setInterval(() => {
      const state = store.getState();
      if (started.current || state.phase !== "lobby") return;
      const now = performance.now();
      const ids = state.players.map((player) => player.id).filter((id) => expected.includes(id));
      if (!shouldStart({ expected, present: ids, elapsedMs: now - mountedAt.current, settledMs: now - lastArrival.current })) return;
      for (const player of state.players) store.dispatch({ type: "player/ready", id: player.id, ready: true });
      store.dispatch({ type: "match/start" });
      started.current = store.getState().phase === "playing";
    }, 400);
    return () => {
      unsubscribe();
      window.clearInterval(timer);
    };
  }, [launch, store]);

  // Score to the hub while the match runs, the result when it ends.
  useEffect(() => {
    let lastKey = "";
    return store.subscribe((state) => {
      if (state.phase === "playing") {
        const key = `${state.match.blue}-${state.match.orange}`;
        if (key !== lastKey) {
          lastKey = key;
          void hub.progress(progressFor(launch.players, finalScore(store)));
        }
      } else if (state.phase === "post-match" && !reported.current) {
        reported.current = true;
        void hub.progress(progressFor(launch.players, finalScore(store)));
        void hub.result(placementsFor(launch.players, finalScore(store)));
      }
    });
  }, [hub, launch, store]);

  if (matchActive) return null;
  const expected = launch.players;
  return (
    <div
      role="status"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9_500,
        display: "grid",
        placeItems: "center",
        background: "radial-gradient(120% 90% at 50% 20%, #0d2c5c 0%, #061a37 70%)",
        color: "#e8f3ff",
        font: "600 16px/1.5 system-ui, sans-serif",
      }}
    >
      <div style={{ width: "min(560px, 90vw)", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ font: "800 13px/1 system-ui, sans-serif", letterSpacing: "0.3em", color: "#ffd23f" }}>ROCKET ARENA</div>
        <div style={{ font: "900 44px/1 system-ui, sans-serif", letterSpacing: "-0.02em" }}>{present.length === expected.length ? "Kick-off!" : "Getting everyone in"}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {expected.map((player) => {
            const here = present.includes(player.id);
            return (
              <div key={player.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", border: `2px solid ${here ? "#7dffa9" : "#2a4a7a"}`, opacity: here ? 1 : 0.7 }}>
                <span>{player.name}</span>
                <span style={{ letterSpacing: "0.2em", fontSize: 12, alignSelf: "center" }}>{here ? "IN" : "WAITING"}</span>
              </div>
            );
          })}
        </div>
        <div style={{ opacity: 0.7, fontSize: 14 }}>Phones connect by themselves. The match starts as soon as everyone is in; bots fill any empty seats.</div>
        <button
          disabled={present.length === 0}
          onClick={() => {
            const state = store.getState();
            for (const player of state.players) store.dispatch({ type: "player/ready", id: player.id, ready: true });
            store.dispatch({ type: "match/start" });
            started.current = store.getState().phase === "playing";
          }}
          style={{ alignSelf: "flex-start", padding: "12px 24px", font: "800 14px/1 system-ui, sans-serif", letterSpacing: "0.1em", background: "#ffd23f", color: "#061a37", border: 0, cursor: "pointer", opacity: present.length === 0 ? 0.4 : 1 }}
        >
          START NOW
        </button>
      </div>
    </div>
  );
};
