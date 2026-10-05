# Arcade hub

One front door for every game in the room: players join **once** by QR, vote on what to play, and score on one leaderboard across games. Look and feel: [`design.md`](design.md) (Blue Ice, the *hello, world!* brand book).

```
phones ──▶ /play/ABCD  ┐                              ┌─▶ Rocket Arena   (adapter, in-repo)
                       ├─ hub (REST + WebSocket) ─────┼─▶ Turbo Kart     (manual until adapted)
big screen ▶ /host/ABCD┘   players · votes · scores   └─▶ Air Brawl      (manual until adapted)
```

The hub owns **players, voting, scoring, leaderboards and the front end**. A game owns only its gameplay and speaks a four-call contract (below).

## Run

```bash
pnpm --filter arcade-hub dev        # hub API :8787 + web :5180
pnpm --filter arcade-hub test       # core rules + HTTP/WS integration + client script
pnpm --filter arcade-hub build && pnpm --filter arcade-hub start
```

| env | default | meaning |
|---|---|---|
| `PORT` | 8787 | listen port |
| `DATA_DIR` | `./data` | where `hub.json` (sessions, all-time profiles) is written |
| `ARCADE_ROUNDS` | 5 | rounds per night (the host can change it per night) |
| `ARCADE_GAMES_JSON` | built-ins | JSON array replacing the game catalogue (`src/core/games.ts` shows the shape) |

On Render's free plan the disk is ephemeral, so the all-time board resets when the service restarts. Point `DATA_DIR` at a persistent disk to keep it.

## A night

1. The host opens `/` and taps **Host a night**: a four-letter room and a QR (it uses the machine's LAN address when opened on `localhost`).
2. Phones scan once. A name is all it takes; the hub remembers the device (a profile token), so the all-time board follows people across nights.
3. **Voting.** Every game that fits the room is on the ballot. Votes are weighted by how recently each game ran (one that just ran is dampened, one not yet played is lifted), so a night does not become the same game five times; a silent room is decided by the weights alone and ties are broken at random. The vote closes when everyone has voted, on the timer, or when the host decides.
4. **Playing.** The big screen embeds the game; phones embed its controller. The game reports back when it is done.
5. **Results and standings** after every round, then a champion screen after the last one (the final round is worth double).

### Scoring

`[10, 8, 6, 5, 4, 3, 2, 1]` by finishing place, **+1** for finishing at all, **0** for did-not-finish. Ties share the average of the places they cover. Standings tie-break on points, then wins, then best finish. The all-time board is per profile, and also per game.

## Game contract

The hub opens the game's host page with a query string:

```
?arcade=<hub origin>&session=<room>&round=<round id>&token=<round token>&players=<base64url JSON [{id,name,color,avatar}]>
```

The round token is a bearer token for **that round only**; phones never see it. The game then calls, with `Authorization: Bearer <token>` (CORS is open on these three):

| call | body | when |
|---|---|---|
| `POST /api/rounds/:id/ready` | `{ controllerUrl }` | the game is up. `controllerUrl` is the page phones should show, with `{playerId}` `{name}` `{color}` placeholders the hub fills per phone (`null` if phones need nothing) |
| `POST /api/rounds/:id/progress` | `{ scores: { [playerId]: number } }` | optional, drives the live HUD |
| `POST /api/rounds/:id/result` | `{ placements: [{ playerId, rank, score?, stats? }] }` | the finishing order. `rank` 1 is first, equal ranks tie, `null` is did-not-finish |

A game that does not skip its own lobby, take the hub's player list, and post a result is **manual**: the host taps the finishing order in a panel under the game. That works with zero changes to the game, which is how a new game gets on the board on day one.

### Writing an adapter

- **Any game, no framework:** load [`/arcade-client.js`](public/arcade-client.js) (it is served by the hub) and use `ArcadeClient.fromUrl()`, `.ready()`, `.progress()`, `.result()`, and `ArcadeClient.rank(players, scores)` to turn scores into placements.
- **Rocket Arena** is the worked example: [`games/rocket-arena/src/host/arcade.ts`](../../games/rocket-arena/src/host/arcade.ts) (pure, tested), [`arcade-bridge.tsx`](../../games/rocket-arena/src/host/arcade-bridge.tsx) (hides the lobby, starts when the hub's players are in, posts the result). Its phone controller is told the player's name and the hub's id through the template (`controllerId={playerId}`), so Air Jam player ids *are* hub player ids.
- Use the hub's `id` as your player id wherever you can. It keeps results free of lookup tables.

## Layout

```
src/core    pure domain: hub state machine, scoring, voting, leaderboard, store (injected clock/random/scheduler)
src/server  node:http + ws + zod, round-token auth, static hosting; app.test.ts runs the real thing on a port
src/web     React 19: host (16:9), phone, landing, leaderboard; ui.tsx holds the Blue Ice components
public/blue-ice  the brand's fonts, mark and fracture generator, unmodified
```
