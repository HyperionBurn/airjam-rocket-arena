/** Landing page and the all-time leaderboard. */
import { useEffect, useState } from "react";

import { api, ApiError, saveHostToken, type AllTimeRow, type GameDef } from "./api";
import { Avatar, Display, Footer, GameArt, Header, Label, Ruler, Tag, Wordmark, gameOf, points } from "./ui";

export const Landing = () => {
  const [code, setCode] = useState("");
  const [rounds, setRounds] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [top, setTop] = useState<AllTimeRow[]>([]);
  const [games, setGames] = useState<GameDef[]>([]);

  useEffect(() => {
    void api.leaderboard().then((result) => {
      setTop(result.rows.slice(0, 5));
      setGames(result.games);
    }).catch(() => undefined);
    void fetch("/api/games").then((r) => r.json()).then((body: { games: GameDef[] }) => setGames(body.games)).catch(() => undefined);
  }, []);

  const host = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      const room = await api.createRoom(rounds);
      saveHostToken(room.code, room.hostToken);
      window.location.assign(`/host/${room.code}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't reach the hub.");
      setBusy(false);
    }
  };

  const join = (): void => {
    if (code.trim().length === 4) window.location.assign(`/play/${code.trim().toUpperCase()}`);
  };

  return (
    <div className="page">
      <div className="ground" data-theme="ice">
        <div className="measure">
          <Header labels={["Event 001  ·  Arcade night", "Join once. Vote. One leaderboard."]} />
          <div className="hero-block">
            <div className="stack">
              <Wordmark />
              <Display text="Break the ice" max={8} />
            </div>
            <div className="ctl">
              <Label>Host</Label>
              <div className="actions">
                <button className="btn" disabled={busy} onClick={() => void host()}>&lt;Host a night&gt;</button>
                <label className="label" style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
                  Rounds
                  <select className="field" value={rounds} onChange={(event) => setRounds(Number(event.target.value))}>
                    {[3, 4, 5, 6, 8, 10].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
              </div>
              <Ruler />
              <Label>Join</Label>
              <div className="joinrow">
                <input className="field field--code" placeholder="CODE" maxLength={4} value={code} onChange={(event) => setCode(event.target.value.replace(/[^a-zA-Z]/g, ""))}
                  onKeyDown={(event) => event.key === "Enter" && join()} aria-label="Room code" />
                <button className="btn btn--outline" disabled={code.trim().length !== 4} onClick={join}>Join →</button>
              </div>
              {error ? <div className="alert">{error.toUpperCase()}</div> : null}
            </div>
          </div>
          {games.length > 0 ? (
            <div style={{ paddingBottom: 48 }}>
              <Ruler />
              <div className="facts-grid" style={{ borderTop: 0, paddingTop: 16 }}>
                {games.map((game) => (
                  <div key={game.id} className="cell">
                    <Label>{game.minPlayers}–{game.maxPlayers} players  ·  {game.minutes} min</Label>
                    <div className="main">{game.name}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <Footer left="Arcade night. Free. Everyone welcome." />
          <div style={{ height: 24 }} />
        </div>
      </div>
      {games.length > 0 || top.length > 0 ? (
        <div className="ground" data-theme="frost">
          <div className="measure">
            <div className="section" style={{ display: "flex", flexDirection: "column", gap: 40 }}>
              {games.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <Label>On the ice</Label>
                  <div className="games">
                    {games.map((game) => (
                      <div key={game.id} className="tile">
                        <GameArt game={game} />
                        <span className="cap">
                          <span className="nm">{game.name}</span>
                          <span className="meta label">{game.minPlayers}–{game.maxPlayers} players</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {top.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <Label>Hall of fame</Label>
                  <div className="list">
                    {top.map((row, index) => (
                      <div key={row.profileId} className={`rank rank--${index + 1}`} style={{ gridTemplateColumns: "2.2em auto 1fr auto auto" }}>
                        <div className="pos num">{String(index + 1).padStart(2, "0")}</div>
                        <Avatar player={row} size={34} />
                        <div className="nm">{row.name}</div>
                        <div className="move">{row.wins} {row.wins === 1 ? "win" : "wins"}</div>
                        <div className="pts num">{points(row.points)}</div>
                      </div>
                    ))}
                  </div>
                  <div><a className="btn btn--small" href="/leaderboard">Full leaderboard →</a></div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export const Leaderboard = () => {
  const [game, setGame] = useState<string | undefined>(undefined);
  const [rows, setRows] = useState<AllTimeRow[] | null>(null);
  const [games, setGames] = useState<GameDef[]>([]);

  useEffect(() => {
    let live = true;
    setRows(null);
    void api.leaderboard(game).then((result) => {
      if (!live) return;
      setRows(result.rows);
      setGames(result.games);
    }).catch(() => live && setRows([]));
    return () => {
      live = false;
    };
  }, [game]);

  return (
    <div className="page ground" data-theme="frost">
      <div className="measure" style={{ maxWidth: 1200 }}>
        <div className="section" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Label>Event 001  ·  All-time</Label>
            <a className="btn btn--small btn--outline" href="/">Home</a>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <hr className="hairline" />
            <h1 className="headline">Leaderboard</h1>
          </div>
          <div className="tabs">
            <button className="tag" aria-pressed={game === undefined} onClick={() => setGame(undefined)}>All games</button>
            {games.map((entry) => (
              <button key={entry.id} className="tag" aria-pressed={game === entry.id} onClick={() => setGame(entry.id)}>{entry.name}</button>
            ))}
          </div>
          {rows === null ? (
            <div className="spinner" />
          ) : rows.length === 0 ? (
            <p className="body">No finished rounds yet. Host a night and the first results land here.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>#</th><th>Player</th><th>Points</th><th>Rounds</th><th>Wins</th><th>Win rate</th><th>Podiums</th><th>Most played</th></tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => {
                    const favourite = row.favouriteGameId ? gameOf(games, row.favouriteGameId) : undefined;
                    return (
                      <tr key={row.profileId}>
                        <td className="num">{String(index + 1).padStart(2, "0")}</td>
                        <td><span className="who"><Avatar player={row} size={32} />{row.name}</span></td>
                        <td className="num">{points(row.points)}</td>
                        <td className="num">{row.rounds}</td>
                        <td className="num">{row.wins}</td>
                        <td className="num">{Math.round(row.winRate * 100)}%</td>
                        <td className="num">{row.podiums}</td>
                        <td>{favourite ? favourite.name : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="mono mono--code">print("hello, world!")</div>
        </div>
      </div>
    </div>
  );
};
