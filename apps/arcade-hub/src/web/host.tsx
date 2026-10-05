/** The big-screen app: one room, one scene per phase. */
import { useEffect, useMemo, useState } from "react";

import { launchUrl } from "../core/view";
import { hostTokenFor, useCountdown, useJoinUrl, useRoom, type GameDef, type PublicState } from "./api";
import { Avatar, Board, Display, Footer, Header, Label, Qr, Ruler, Tag, Tile, Wordmark, gameOf, ordinal, points, style } from "./ui";

type Room = ReturnType<typeof useRoom>;
type Player = PublicState["players"][number];

/* ------------------------------------------------------------------ lobby */

const Lobby = ({ room, state }: { room: Room; state: PublicState }) => {
  const joinUrl = useJoinUrl(state.code);
  const connected = state.players.filter((player) => player.connected).length;
  return (
    <div className="scene lobby">
      <section className="hero">
        <Label>Fig. 1&nbsp;&nbsp;Point of impact</Label>
        <Wordmark fill />
        <Display text="Break the ice" max={5} />
      </section>
      <aside className="facts">
        <Ruler />
        <div className="join">
          <Qr value={joinUrl} />
          <div className="cell">
            <Label>Room code</Label>
            <div className="code num">{state.code}</div>
          </div>
        </div>
        <div className="mono url">Scan, or go to {joinUrl.replace(/^https?:\/\//, "")}</div>
        <div className="cell">
          <Label>Players&nbsp;&nbsp;{String(connected).padStart(2, "0")}</Label>
          <div className="plist">
            {state.players.map((player) => (
              <div key={player.id} className="row">
                <Avatar player={player} size={30} solid={player.id === state.leaderId && state.players.length > 1} />
                <span className="name">{player.name}</span>
                {!player.connected ? <Label>Away</Label> : null}
              </div>
            ))}
            {state.players.length === 0 ? <div className="empty mono">Waiting for the first player.</div> : null}
          </div>
        </div>
        <div className="cell">
          <Label>On the ice&nbsp;&nbsp;{state.totalRounds} rounds</Label>
          <div className="tags">
            {state.games.map((game) => (
              <Tag key={game.id}>{game.name}</Tag>
            ))}
          </div>
        </div>
        <div className="cell" style={{ marginTop: "auto" }}>
          <button className="btn" disabled={connected === 0} onClick={() => room.send({ type: "startVoting" })}>
            &lt;Start voting&gt;
          </button>
          <div className="mono">{connected === 0 ? "Nobody has joined yet." : connected < 2 ? "Most games want two or more." : "Ready when you are."}</div>
        </div>
      </aside>
    </div>
  );
};

/* ----------------------------------------------------------------- voting */

const Voting = ({ room, state }: { room: Room; state: PublicState }) => {
  const vote = state.vote!;
  const total = useMemo(() => Math.max(5, (vote.endsAt - state.serverTime) / 1000), [vote.endsAt, state.serverTime]);
  const left = useCountdown(vote.endsAt, room.clockOffset);
  const connected = state.players.filter((player) => player.connected);
  const most = Math.max(0, ...vote.candidates.map((candidate) => candidate.votes));
  return (
    <div className="scene vote">
      <div className="timer" style={style({ "--p": left / total })}><i /></div>
      <Label>Round {state.roundsDone + 1} of {state.totalRounds}&nbsp;&nbsp;·&nbsp;&nbsp;{Math.ceil(left)}s</Label>
      <Display text="What are we playing?" max={4.4} />
      <div className={`tiles${most > 0 ? " tiles--dim" : ""}`}>
        {vote.candidates.map((candidate) => {
          const game = gameOf(state.games, candidate.gameId)!;
          return (
            <div key={game.id} className="slot">
              <Tile game={game} focus={most > 0 && candidate.votes === most} />
              <div className="ticks" aria-label={`${candidate.votes} votes`}>
                {Array.from({ length: candidate.votes }, (_, index) => (
                  <i key={index} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="foot2">
        <span className="mono">{vote.votedIds.length} of {connected.length} voted</span>
        <button className="btn btn--outline btn--small" onClick={() => room.send({ type: "closeVoting" })}>Decide now</button>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------ result entry */

const ResultEntry = ({ players, onSubmit }: { players: Player[]; onSubmit: (order: Array<string | string[]>) => void }) => {
  const [entries, setEntries] = useState<Array<{ id: string; tie: boolean }>>([]);
  const toggle = (id: string): void =>
    setEntries((current) => (current.some((entry) => entry.id === id) ? current.filter((entry) => entry.id !== id) : [...current, { id, tie: false }]));
  const submit = (): void => {
    const groups: string[][] = [];
    for (const entry of entries) {
      if (entry.tie && groups.length > 0) groups[groups.length - 1]!.push(entry.id);
      else groups.push([entry.id]);
    }
    // Anyone not tapped did not finish.
    onSubmit(groups.map((group) => (group.length === 1 ? group[0]! : group)));
  };
  // Display place per entry: a tie shares the place of the entry before it.
  const places: number[] = [];
  entries.forEach((entry, index) => places.push(entry.tie && index > 0 ? places[index - 1]! : index + 1));
  return (
    <div className="entry">
      <Label>Enter the result</Label>
      <div className="mono">Tap players in the order they finished.</div>
      {players.map((player) => {
        const index = entries.findIndex((entry) => entry.id === player.id);
        const picked = index >= 0;
        return (
          <div key={player.id} style={{ display: "flex", gap: 8 }}>
            <button className="pick" aria-pressed={picked} onClick={() => toggle(player.id)}>
              <Avatar player={player} size={28} />
              <span>{player.name}</span>
              {picked ? <span className="place num">{places[index]}</span> : null}
            </button>
            {picked && index > 0 ? (
              <button className={`btn btn--small ${entries[index]!.tie ? "" : "btn--outline"}`} aria-pressed={entries[index]!.tie}
                onClick={() => setEntries((c) => c.map((e, i) => (i === index ? { ...e, tie: !e.tie } : e)))}>
                Tie
              </button>
            ) : null}
          </div>
        );
      })}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button className="btn btn--small" disabled={entries.length === 0} onClick={submit}>Save result</button>
        <button className="btn btn--small btn--outline" onClick={() => setEntries([])}>Reset</button>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- playing */

const Playing = ({ room, state }: { room: Room; state: PublicState }) => {
  const round = state.round!;
  const game = gameOf(state.games, round.gameId) as GameDef;
  const players = state.players.filter((player) => round.playerIds.includes(player.id));
  const roundToken = state.host?.roundToken ?? "";
  const [splashGone, setSplashGone] = useState(false);
  const [panel, setPanel] = useState(game.integration === "manual" || Boolean(game.consoleUrl));

  // Stable URL for the whole round: re-renders must never reload the game.
  const url = useMemo(
    () => launchUrl(game, { hubOrigin: window.location.origin, code: state.code, roundId: round.id, roundToken, players }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [round.id, roundToken],
  );

  useEffect(() => {
    setSplashGone(false);
    const minimum = window.setTimeout(() => setSplashGone(true), game.integration === "manual" ? 1800 : 3200);
    return () => window.clearTimeout(minimum);
  }, [round.id, game.integration]);
  const showSplash = !(splashGone && round.status === "live") && !(splashGone && Date.now() - round.startedAt > 14000);

  return (
    <div className="scene playing">
      <div className="play">
        <div className={`splash${showSplash ? "" : " splash--gone"}`}>
          <Label>Round {round.number} of {state.totalRounds}</Label>
          <Display text={game.name} max={5} />
          <div className="loadbar"><i /></div>
          <div className="mono">{round.status === "launching" ? "Starting the game." : "Get your controllers ready."}</div>
        </div>
        <iframe title={game.name} src={url} allow="autoplay; fullscreen; gamepad; accelerometer; gyroscope" />
        <div className="hud">
          <b>{game.name}</b>
          <span>Round {round.number} of {state.totalRounds}</span>
          {players.map((player) =>
            round.progress[player.id] !== undefined ? (
              <span key={player.id}>{player.name} <b className="num">{points(round.progress[player.id]!)}</b></span>
            ) : null,
          )}
        </div>
        <div className="hudmenu">
          <button className="btn btn--small" onClick={() => setPanel((open) => !open)}>{panel ? "Hide" : "Host controls"}</button>
        </div>
      </div>
      {panel ? (
        <div className="panel">
          {game.consoleUrl ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: "22em" }}>
              <Label>Moderator console</Label>
              <div className="mono">Private: it shows the answers. Open it on the laptop screen, never on the projector.</div>
              <button
                className="btn"
                onClick={() => {
                  window.open(`/host/${state.code}/console`, "arcade-console");
                  setPanel(false);
                }}
              >
                Open the console
              </button>
            </div>
          ) : null}
          {game.integration === "manual" && game.joinUrl ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Label>Phones join here</Label>
              <Qr value={game.joinUrl} />
              <div className="mono mono--code" style={{ wordBreak: "break-all", maxWidth: "16em" }}>{game.joinUrl}</div>
            </div>
          ) : null}
          <ResultEntry players={players} onSubmit={(order) => room.send({ type: "manualResult", order })} />
          <button className="btn btn--text" style={{ alignSelf: "flex-start", color: "var(--alert)" }} onClick={() => room.send({ type: "cancelRound" })}>
            Cancel this round
          </button>
        </div>
      ) : null}
    </div>
  );
};

/* ---------------------------------------------------------------- results */

const Results = ({ room, state }: { room: Room; state: PublicState }) => {
  const round = state.round!;
  const result = round.result;
  const game = gameOf(state.games, round.gameId)!;
  const left = useCountdown(state.nextAt, room.clockOffset);
  const byId = new Map(state.players.map((player) => [player.id, player]));
  const ranked = (result?.placements ?? []).filter((p) => p.rank !== null).sort((a, b) => a.rank! - b.rank!);
  const dnf = (result?.placements ?? []).filter((p) => p.rank === null);
  const first = ranked.filter((p) => p.rank === 1);
  const winners = first.map((p) => byId.get(p.playerId)?.name).filter(Boolean);
  // Team games: everyone sharing first place on one side is that side winning, not a tie.
  const winningGroup = first.length > 1 && first[0]!.group && first.every((p) => p.group === first[0]!.group) ? first[0]!.group : null;
  const last = round.number >= state.totalRounds;
  return (
    <div className="scene results">
      <div className="main">
        <Label>
          Round {round.number}&nbsp;&nbsp;·&nbsp;&nbsp;{game.name}{result && result.multiplier > 1 ? `  ·  Finale ×${result.multiplier}` : ""}
        </Label>
        <Display text={winners.length === 0 ? "Round over" : winningGroup ? `${winningGroup} wins` : winners.length === 1 ? `${winners[0]} wins` : `${winners.join(" & ")} tie`} max={5} />
        <div className="list">
          {ranked.map((placement) => {
            const player = byId.get(placement.playerId);
            if (!player) return null;
            return (
              <div key={placement.playerId} className={`rank rank--big rank--${placement.rank}`}>
                <div className="pos num">{String(placement.rank).padStart(2, "0")}</div>
                <Avatar player={player} size={44} />
                <div className="nm">{player.name}{placement.score !== undefined ? <span className="label num" style={{ marginLeft: "1.2em" }}>{points(placement.score)} in game</span> : null}</div>
                <div className="gain num">+{points(result!.points[player.id] ?? 0)}</div>
              </div>
            );
          })}
          {dnf.map((placement) => (
            <div key={placement.playerId} className="row mono">
              {byId.get(placement.playerId)?.name} — did not finish
            </div>
          ))}
        </div>
      </div>
      <div className="side">
        <Ruler />
        <Label>Tonight</Label>
        <Board standings={state.standings} players={state.players} />
        <div className="actions">
          <span className="mono">{last ? "Final standings in" : "Next vote in"} <b className="num">{Math.ceil(left)}s</b></span>
          <button className="btn btn--small" onClick={() => room.send({ type: "advance" })}>Continue</button>
        </div>
      </div>
    </div>
  );
};

/* --------------------------------------------------------------- champion */

const Champion = ({ room, state }: { room: Room; state: PublicState }) => {
  const winners = state.players.filter((player) => state.champions.includes(player.id));
  return (
    <div className="scene champion">
      <section className="hero">
        <Label>{winners.length > 1 ? "Champions of the night" : "Champion of the night"}</Label>
        <Wordmark fill />
        <Display text="The ice is broken" max={5} />
      </section>
      <aside className="side">
        <Ruler />
        {winners.length === 0 ? <div className="info">No winner</div> : null}
        {winners.map((winner) => (
          <div key={winner.id} className="winner">
            <Avatar player={winner} size={72} solid />
            <div className="info">{winner.name}</div>
          </div>
        ))}
        <Label>Final standings</Label>
        <Board standings={state.standings} players={state.players} limit={5} />
        <div className="actions">
          <button className="btn" onClick={() => room.send({ type: "restart" })}>Play again</button>
          <a className="btn btn--outline" href="/leaderboard" target="_blank" rel="noreferrer">All-time leaderboard</a>
        </div>
      </aside>
    </div>
  );
};

/* ----------------------------------------------------------- moderator console */

/**
 * A host-led game's private console, in its own window. It is embedded from here (not opened
 * straight at the game) so it sits in the same browser partition as the big-screen iframe:
 * that is what lets the two windows talk over the game's own same-origin channel.
 */
export const HostConsoleWindow = ({ code }: { code: string }) => {
  const token = hostTokenFor(code);
  const room = useRoom(code, "host", token ?? "");
  const state = room.state;
  if (!token) return <Notice title="Not your room" body={`This browser didn't create room ${code}.`} action={{ href: "/", label: "Home" }} />;
  if (room.closedReason) return <Notice title="Room closed" body={room.closedReason} action={{ href: "/", label: "Home" }} />;
  if (!state) return <div className="ground center" style={{ maxWidth: "none", minHeight: "100%" }}><div className="spinner" /></div>;

  const round = state.round;
  const game = round && state.phase === "playing" ? gameOf(state.games, round.gameId) : undefined;
  const roundToken = state.host?.roundToken ?? "";
  const players = round ? state.players.filter((player) => round.playerIds.includes(player.id)) : [];
  return (
    <div className="ground" style={{ height: "100vh", display: "grid", gridTemplateRows: "auto minmax(0, 1fr)" }}>
      <div className="row3 label" style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "10px 16px", borderBottom: "1px solid var(--line)" }}>
        <span>Moderator console  ·  Private</span>
        <span>{game ? `${game.name}  ·  Round ${round!.number} of ${state.totalRounds}` : "Waiting for a round"}</span>
        <span>Room {state.code}</span>
      </div>
      {round && game?.consoleUrl && roundToken ? (
        <iframe
          key={round.id}
          title={`${game.name} console`}
          style={{ width: "100%", height: "100%", border: 0, background: "var(--frost)" }}
          src={launchUrl(game, { hubOrigin: window.location.origin, code: state.code, roundId: round.id, roundToken, players }, "console")}
          allow="autoplay; fullscreen; clipboard-write"
        />
      ) : (
        <div className="center">
          <Display text={state.phase === "playing" ? "No console for this game" : "Waiting for a round"} max={3} />
          <p className="body">This window fills in when a game with a moderator console starts. You can leave it open for the whole night.</p>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------- app */

const Notice = ({ title, body, action }: { title: string; body: string; action: { href: string; label: string } }) => (
  <div className="ground" style={{ minHeight: "100%" }}>
    <div className="center">
      <Label>Arcade night</Label>
      <Display text={title} max={4} />
      <p className="body">{body}</p>
      <a className="btn" href={action.href}>{action.label}</a>
    </div>
  </div>
);

export const HostApp = ({ code }: { code: string }) => {
  const token = hostTokenFor(code);
  const room = useRoom(code, "host", token ?? "");
  const state = room.state;

  if (!token) return <Notice title="Not your room" body={`This browser didn't create room ${code}.`} action={{ href: "/", label: "Home" }} />;
  if (room.closedReason) return <Notice title="Room closed" body={room.closedReason} action={{ href: "/", label: "Start a new night" }} />;
  if (!state) return <div className="ground center" style={{ maxWidth: "none", minHeight: "100%" }}><div className="spinner" /></div>;

  const connected = state.players.filter((player) => player.connected).length;
  const phaseLabel =
    state.phase === "lobby"
      ? `Lobby  ·  ${state.totalRounds} rounds`
      : state.phase === "finished"
        ? "Night complete"
        : `Round ${Math.min(state.totalRounds, state.roundsDone + (state.phase === "results" ? 0 : 1))} of ${state.totalRounds}`;
  return (
    <div className="host ground" data-stage={state.phase}>
      <Header
        labels={[
          "Event 001  ·  Arcade night",
          phaseLabel,
          <span key="room" className="num">Room {state.code}  ·  {connected} {connected === 1 ? "player" : "players"}</span>,
          <span key="status" className={room.online ? "" : "status--off"}>{room.online ? "Live" : "Reconnecting…"}</span>,
        ]}
      />
      <div className="stage">
        {state.phase === "lobby" ? <Lobby room={room} state={state} /> : null}
        {state.phase === "voting" && state.vote ? <Voting room={room} state={state} /> : null}
        {state.phase === "playing" && state.round ? <Playing key={state.round.id} room={room} state={state} /> : null}
        {state.phase === "results" && state.round?.result ? <Results room={room} state={state} /> : null}
        {state.phase === "finished" ? <Champion room={room} state={state} /> : null}
      </div>
      <Footer />
      {room.error ? <div className="toast alert">{room.error}</div> : null}
    </div>
  );
};

export { ordinal };
