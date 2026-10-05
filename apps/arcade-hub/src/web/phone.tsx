/** The phone app: join once, then vote, play and watch your standing. */
import { useEffect, useMemo, useState } from "react";

import { api, ApiError, forgetProfile, loadProfile, saveProfile, useCountdown, useRoom, type PublicState, type StoredProfile } from "./api";
import { Avatar, Board, Display, GameArt, Header, Label, Ruler, Tag, Wordmark, gameOf, ordinal, points, style } from "./ui";

/* ------------------------------------------------------------------- join */

const Join = ({ code, onJoined }: { code: string; onJoined: (profile: StoredProfile) => void }) => {
  const saved = loadProfile();
  const [name, setName] = useState(saved?.name ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (): Promise<void> => {
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      // The hub assigns each player a colour for the games that want one.
      const result = await api.join(code, { name, profileToken: saved?.token });
      const profile = { token: result.profileToken, name: name.trim(), avatar: "", color: saved?.color ?? "" };
      saveProfile(profile);
      onJoined(profile);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't join. Check your connection.");
      setBusy(false);
    }
  };

  return (
    <div className="ground">
      <div className="phone">
        <Header labels={["Event 001", `Room ${code}`]} />
        <Wordmark />
        <Display text="Break the ice" max={3} />
        <div className="stack" style={{ gap: 8 }}>
          <Label>Your name</Label>
          <input className="field" placeholder="TYPE IT HERE" value={name} maxLength={16} autoFocus autoComplete="off"
            onChange={(event) => setName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void submit()} />
          {error ? <div className="alert">{error.toUpperCase()}</div> : null}
        </div>
        <button className="btn btn--block" style={{ marginTop: "auto" }} disabled={!name.trim() || busy} onClick={() => void submit()}>
          {busy ? "Joining…" : "<Join>"}
        </button>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------- room */

type Me = PublicState["players"][number];
type RoomHook = ReturnType<typeof useRoom>;

const MeRow = ({ state, me }: { state: PublicState; me: Me }) => {
  const standing = state.standings.find((row) => row.playerId === me.id);
  return (
    <div className="me">
      <Avatar player={me} size={46} solid />
      <div>
        <div className="nm">{me.name}</div>
        <Label>
          Room {state.code}
          {standing && state.roundsDone > 0 ? `  ·  ${ordinal(standing.rank)}  ·  ${points(standing.points)} pts` : ""}
        </Label>
      </div>
    </div>
  );
};

const Lobby = ({ room, state }: { room: RoomHook; state: PublicState }) => (
  <>
    <div className="stack" style={{ gap: 12 }}>
      <Label>You&apos;re in</Label>
      <Display text="Waiting to start" max={3} />
    </div>
    <div className="list">
      {state.players.map((player) => (
        <div key={player.id} className="row">
          <Avatar player={player} size={36} />
          <span className="name">{player.name}</span>
          {player.id === state.leaderId && state.players.length > 1 ? <Tag>Leader</Tag> : null}
        </div>
      ))}
    </div>
    {state.you?.isLeader ? (
      <button className="btn btn--block" style={{ marginTop: "auto" }} onClick={() => room.send({ type: "startVoting" })}>&lt;Start voting&gt;</button>
    ) : (
      <div className="mono" style={{ marginTop: "auto" }}>The room leader starts the vote. Watch the big screen.</div>
    )}
  </>
);

const Voting = ({ room, state }: { room: RoomHook; state: PublicState }) => {
  const vote = state.vote!;
  const total = useMemo(() => Math.max(5, (vote.endsAt - state.serverTime) / 1000), [vote.endsAt, state.serverTime]);
  const left = useCountdown(vote.endsAt, room.clockOffset);
  return (
    <>
      <div className="stack" style={{ gap: 12 }}>
        <Label>Round {state.roundsDone + 1} of {state.totalRounds}</Label>
        <Display text="What are we playing?" max={3} />
      </div>
      <div className="timer" style={style({ "--p": left / total })}><i /></div>
      <div className="stack">
        {vote.candidates.map((candidate) => {
          const game = gameOf(state.games, candidate.gameId)!;
          const mine = state.you?.vote === game.id;
          return (
            <button key={game.id} className={`pickrow${mine ? " pickrow--mine" : ""}`} onClick={() => room.send({ type: "vote", gameId: game.id })}>
              <span className="thumb"><GameArt game={game} /></span>
              <span>
                <div className="t">{game.name}</div>
                <Label>{mine ? "Your vote" : `${game.minutes} min · up to ${game.maxPlayers}`}</Label>
              </span>
              <span className="v num">{candidate.votes}</span>
            </button>
          );
        })}
      </div>
      <div className="mono" style={{ marginTop: "auto" }}>{vote.votedIds.length} of {state.players.filter((p) => p.connected).length} voted</div>
    </>
  );
};

const Notice = ({ label, title, body, spinner }: { label?: string; title: string; body?: string; spinner?: boolean }) => (
  <div className="ground" style={{ minHeight: "100%" }}>
    <div className="center">
      {label ? <Label>{label}</Label> : null}
      <Display text={title} max={3} />
      {body ? <p className="body">{body}</p> : null}
      {spinner ? <div className="spinner" /> : null}
    </div>
  </div>
);

const Playing = ({ state, me }: { state: PublicState; me: Me }) => {
  const round = state.round!;
  const game = gameOf(state.games, round.gameId)!;
  const [reload, setReload] = useState(0);
  const [menu, setMenu] = useState(false);
  const inRound = round.playerIds.includes(me.id);
  const url = round.controllerUrl;

  if (!inRound) return <Notice title={game.name} body="This round started before you joined. You're in for the next one." />;
  if (!url) return <Notice label={`Round ${round.number}`} title={game.name} body={round.status === "launching" ? "Starting the game." : "Play on the big screen."} spinner />;
  return (
    <div className="pad">
      <button className="handle" onClick={() => setMenu((open) => !open)}>{game.name.toUpperCase()}</button>
      <iframe key={`${round.id}-${reload}`} title={`${game.name} controller`} src={url} allow="autoplay; fullscreen; gamepad; accelerometer; gyroscope; vibrate" />
      {menu ? (
        <div className="menu">
          <button className="btn btn--small" onClick={() => { setReload((n) => n + 1); setMenu(false); }}>Reload controller</button>
          <button className="btn btn--small btn--outline" onClick={() => setMenu(false)}>Close</button>
        </div>
      ) : null}
    </div>
  );
};

const Results = ({ state, me }: { state: PublicState; me: Me }) => {
  const round = state.round!;
  const result = round.result!;
  const mine = result.placements.find((p) => p.playerId === me.id);
  const standing = state.standings.find((row) => row.playerId === me.id);
  const game = gameOf(state.games, round.gameId)!;
  return (
    <>
      <div className="big stack" style={{ gap: 12 }}>
        <Label>{game.name}  ·  Round {round.number}</Label>
        <div className="p num">{mine && mine.rank !== null ? ordinal(mine.rank) : "—"}</div>
        <div className="pts num">+{points(result.points[me.id] ?? 0)} pts{result.multiplier > 1 ? `  ·  finale ×${result.multiplier}` : ""}</div>
        {standing ? <Label>{ordinal(standing.rank)} overall  ·  {points(standing.points)} pts</Label> : null}
      </div>
      <Ruler />
      <Label>Standings</Label>
      <Board standings={state.standings} players={state.players} />
    </>
  );
};

const Finished = ({ state, me }: { state: PublicState; me: Me }) => {
  const standing = state.standings.find((row) => row.playerId === me.id);
  const won = state.champions.includes(me.id);
  return (
    <>
      <div className="big stack" style={{ gap: 12 }}>
        <Label>{won ? "You're the champion" : "Final result"}</Label>
        <div className="p num">{standing ? ordinal(standing.rank) : "—"}</div>
        <div className="pts">{standing ? `${points(standing.points)} points` : ""}</div>
      </div>
      <Ruler />
      <Board standings={state.standings} players={state.players} />
      <a className="btn btn--outline" style={{ marginTop: "auto" }} href="/leaderboard">All-time leaderboard</a>
    </>
  );
};

/* -------------------------------------------------------------------- app */

const Room = ({ code, profile, onForget }: { code: string; profile: StoredProfile; onForget: () => void }) => {
  const room = useRoom(code, "player", profile.token);
  const state = room.state;
  const me = state?.players.find((player) => state.you && player.id === state.you.playerId);

  if (room.closedReason) {
    return (
      <div className="ground" style={{ minHeight: "100%" }}>
        <div className="center">
          <Display text="Disconnected" max={3} />
          <p className="body">{room.closedReason}</p>
          <button className="btn" onClick={onForget}>Rejoin</button>
        </div>
      </div>
    );
  }
  if (!state || !me) return <div className="ground" style={{ minHeight: "100%" }}><div className="center"><div className="spinner" /></div></div>;

  if (state.phase === "playing" && state.round) return <Playing state={state} me={me} />;
  return (
    <div className="ground">
      <div className="phone">
        <MeRow state={state} me={me} />
        <hr className="hairline" />
        {state.phase === "lobby" ? <Lobby room={room} state={state} /> : null}
        {state.phase === "voting" && state.vote ? <Voting room={room} state={state} /> : null}
        {state.phase === "results" && state.round?.result ? <Results state={state} me={me} /> : null}
        {state.phase === "finished" ? <Finished state={state} me={me} /> : null}
        {room.error ? <div className="toast alert">{room.error}</div> : null}
        {!room.online ? <div className="toast alert">Reconnecting…</div> : null}
        <div style={{ textAlign: "center" }}>
          <button className="btn btn--text" onClick={() => { room.send({ type: "leave" }); onForget(); }}>Leave room</button>
        </div>
      </div>
    </div>
  );
};

export const PhoneApp = ({ code }: { code: string }) => {
  const [profile, setProfile] = useState<StoredProfile | null>(null);
  const [checked, setChecked] = useState(false);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        await api.roomInfo(code);
      } catch {
        if (live) setMissing(true);
        return;
      }
      // A returning phone rejoins silently with its saved identity.
      const saved = loadProfile();
      if (saved) {
        try {
          const result = await api.join(code, { name: saved.name, color: saved.color, profileToken: saved.token });
          if (live) setProfile({ ...saved, token: result.profileToken });
        } catch {
          /* fall through to the join form */
        }
      }
      if (live) setChecked(true);
    })();
    return () => {
      live = false;
    };
  }, [code]);

  if (missing) {
    return (
      <div className="ground" style={{ minHeight: "100%" }}>
        <div className="center">
          <Display text="No such room" max={3} />
          <p className="body">Check the code on the big screen.</p>
          <a className="btn" href="/">Back</a>
        </div>
      </div>
    );
  }
  if (!checked && !profile) return <div className="ground" style={{ minHeight: "100%" }}><div className="center"><div className="spinner" /></div></div>;
  if (!profile) return <Join code={code} onJoined={setProfile} />;
  return <Room code={code} profile={profile} onForget={() => { forgetProfile(); setProfile(null); }} />;
};
