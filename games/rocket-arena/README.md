# Rocket Arena (Air Jam)

Rocket-car football for up to six players on **one shared screen**. One machine
(a laptop on a projector) hosts the match and shows a split-screen view for each
player; every player drives with their **phone** as a touch controller, joined by
scanning a QR code on the same network. Graphics, physics (RocketSim, 120 Hz) and
audio come from the MIT-licensed [rocket-arena-web](https://github.com/MalikAhed/rocket-arena-web)
donor; Air Jam provides rooms, joining and input transport.

```
projector  ── lobby (QR, roster, teams, settings) ── START ──▶ split-screen match
phones     ── name / team / READY ───────────────────────────▶ touch controller
```

## Run it

```bash
# from air-jam/games/rocket-arena
npx --yes pnpm@9.9.0 exec airjam dev
```

Open the **host** at `http://localhost:5173/` (the projector). Phones join from the
QR code or `http://<host-LAN-IP>:5173/controller?room=<CODE>`. Do not run bare
`vite`: the SDK needs the Air Jam server that `airjam dev` starts.

Start a match: every phone taps **READY**, then press **START MATCH** on the
projector. With **BOT FILL** on, empty seats are filled with bots (a lone player
gets the real neural opponent; bigger matches get scripted bots).

### Projector tips

* Launch Chrome with `--autoplay-policy=no-user-gesture-required` to skip the
  one-time "click to enable sound" step.
* The window does **not** need focus: phones are remote inputs, and audio stays on
  when the projector window is unfocused. A *hidden* tab pauses the match.
* A real GPU is expected. Six simultaneous views ran at 60 fps on an RTX 5060
  laptop; software rendering is far slower and says nothing about real speed.

## Lobby and match settings

Everything is chosen on the projector lobby; phones choose their own **name, team,
car and READY**. Match length, seats, team size, **bot fill** and difficulty, **boost**
(Normal / Unlimited) and **ball** (Normal / Heavy) are wired to the match. **Event
mode** one-clicks a short, fast configuration: 3-minute games, fast 1-second
kickoffs after goals, a short goal celebration (no replay), a short post-match
screen, bot fill on.

* **Cars:** fennec, octane-original, challenger, spectre, vesper, amethyst - the
  bodies the donor can draw. Two players on different teams may pick the same car;
  each gets their own team colour.
* **CPU players:** on the projector roster, **+ CPU Blue / + CPU Orange** adds a
  computer-controlled seat to a team (the arrows switch its team, the cross removes
  it). CPUs use the lobby's bot difficulty, count toward the seat limit and a team's
  four-car cap, and are the first to go if humans need the seat. **Bot fill** then
  tops both teams up to the team size on top of them. At least one human is needed
  to start.
* **Late joiners and drop-outs:** a phone that joins mid-match takes over a bot's
  car (on its team if possible); a phone that drops hands its car to a bot, and gets
  the same car back when it returns. With no free car it spectates.
* **Phone feedback:** the boost meter and the air/ground chip are live, and phones
  buzz on ball touches (light/medium), goals (heavy for the scorer, success/failure for
  the rest), demolitions, "go" and the final whistle.

## Look

A dusk arena under sweeping floodlights: HDR bloom, filmic grade, neon pitch
markings, speed streaking at the screen edges, a ground glow under boosting cars,
a fireball-and-smoke goal burst, a round boost dial and floating nameplates. The
method and the before/after are in [`docs/VISUAL-ANALYSIS.md`](docs/VISUAL-ANALYSIS.md).
Add `?daylight` to the host URL for the original bright park, `?plainpost` for the
donor's post-processing.

## How it drives

* **Floating stick:** the left thumb's neutral point is wherever it lands, so a
  slightly-off touch no longer steers the car on its own.
* **One shaping pass:** the phone applies a small deadzone and a light curve; the host
  passes it through. (It used to be shaped twice, which made half a stick push steer
  almost nothing.)
* **Rocket League mapping on the ground:** steering reaches full lock a little before
  the stick does, a diagonal push is full throttle, and **BOOST drives the car
  forward** by itself (pull the stick clearly back to brake).
* **Touches are sent immediately** (rate-capped) instead of waiting for the next
  16 ms timer tick.
* **Match sounds:** kickoff ticks and "go", goal blast + horn + crowd, demolitions,
  boost pad pickups and a full-time buzzer, on top of the donor's engine, boost,
  jump and impact audio.
* **Latency:** play on the local network (`airjam dev`, phones on the same Wi-Fi) for
  real feel. Through the hosted server a steer takes about 90 ms longer to reach the
  car (measured against the Render deployment), which is the main reason the hosted
  version feels laggier.

## Controls (Xbox / PlayStation gamepad)

Plug a controller into the projector machine (USB) or pair it over Bluetooth, then
**press any button on it** (browsers only reveal a gamepad after a press). It joins
the lobby as "Xbox 1", "PS 1" and so on, takes a seat like a phone does, and can mix
with phones in the same match (up to 6 players in total).

| Action | Xbox | PlayStation |
|---|---|---|
| Steer / pitch + yaw in the air | Left stick | Left stick |
| Accelerate / reverse | RT / LT | R2 / L2 |
| Jump (again = double jump, with stick = flip) | A | Cross |
| Boost | B or RB | Circle or R1 |
| Powerslide / air roll | X or LB | Square or L1 |
| Ball cam (your view only) | Y or R3 | Triangle or R3 |
| Lobby: ready / not ready | A or Start / B | Cross or Options / Circle |
| Lobby: team / car | LB, RB / D-pad left, right | L1, R1 / D-pad left, right |

Controllers rumble on ball touches, goals, demolitions, "go" and the final whistle.
A controller that is unplugged mid-match goes neutral and its car passes to a bot; if
it comes back it gets the same car. Any controller the browser reports with the
"standard" layout works. Code: `src/host/gamepads.ts`.

## Controls (phone)

Left thumb: stick (drive / steer; pitch + yaw in the air). Right thumb: **BOOST**,
**JUMP** (tap again to double jump; tap while steering to flip), **DRIFT**
(powerslide on the ground, air-roll in the air), **CAM** (ball cam / car cam for
*your* view only), **REV**.

## Develop

```bash
npx --yes pnpm@9.9.0 exec tsc --noEmit        # typecheck (must be clean)
npx --yes pnpm@9.9.0 exec vitest run          # unit tests
npx --yes pnpm@9.9.0 exec vite build          # production build (NOT `pnpm build`)
```

### Dev harness

Browsers stop `requestAnimationFrame` and throttle timers in background tabs, so a
projector tab plus phone tabs cannot be driven together. `harness.html` (dev
server only) puts the host and N controllers in iframes of one visible tab:

```
http://localhost:5173/harness.html?players=4&drive=circle
```

`drive=fwd|circle|boost` makes each phone auto-ready and publish a scripted stick
(dev builds only). Add `matchSeconds=20` to shorten regulation. With `?debug=1`
on the host, `window.__ra` exposes `runtime`, `store`, `raw(id)` and
`controller()` (including `debugPlaceBall` to score without driving).

Headless drivers that use these live in [`tools/e2e/`](tools/e2e/README.md)
(including `touch-test.mjs`, REAL multitouch via CDP touch events: run it after
touching anything under `src/controller/`, unit tests cannot see wiring bugs in
the touch hook). Session notes and the remaining-work list are in
[`docs/HANDOFF.md`](docs/HANDOFF.md).

## Deploy (Render)

Two services, defined in [`render.yaml`](../../render.yaml) at the repo root:

* **air-jam server** (Docker, `packages/server/Dockerfile`): the Socket.IO realtime
  server. Needs `AIR_JAM_AUTH_MODE=disabled` (production defaults to
  `required`, which wants a master key or database) and
  `AIR_JAM_ALLOWED_ORIGINS` set to the game's origin.
* **game** (static site): `vite build` plus `tools/render-postbuild.mjs`, which
  copies the app shell to `dist/controller/index.html` so `/controller?room=...`
  resolves on a host with no rewrite rules. `VITE_AIR_JAM_SERVER_URL` (the
  server) and `VITE_AIR_JAM_PUBLIC_HOST` (the game's own origin) are baked in at
  build time. BOTH are required: without the public host the SDK cannot read the
  Vite env in a production build, falls back to dev topology and opens its socket
  on the game origin instead of the server.

Open the game URL on the projector; phones scan the QR code. A free Render web
service sleeps when idle, so open it a minute before an event.

## Layout

| Path | What |
|---|---|
| `src/donor/**` | The donor game. **Patched** - see [DONOR-PATCHES.md](DONOR-PATCHES.md). |
| `src/donor/app/local-multiplayer.js` | The N-car match: frame loop, cameras, viewports, goals. |
| `src/airjam/seam.ts` | Prototype patch on the donor sim's `setControls`: how a phone's controls reach a car. |
| `src/airjam/input/` | Phone payload → donor controls (pulse→level jump, stick shaping, presence). |
| `src/airjam/bots/` | Bot seats, scripted policy, neural inference wrapper. |
| `src/host/` | The projector surface: runtime, lobby layer, **match director**, HUD, bot driver, phone controller view. |
| `src/lobby/`, `src/controller/` | Projector lobby UI and the phone touch UI. |
| `src/match/`, `src/contracts/` | Match model and the semantic agent contract (not driving the live donor match yet). |

## Licensing

Repository code is MIT (see `LICENSE`); the donor game is MIT. The **Necto/Nexto** bot models are CC BY-NC-SA 4.0
(**non-commercial**); Seer is MIT. See `BOT_FOR_DIFFICULTY` in
`src/host/match-director.tsx` before any commercial use. Scenery is CC-BY /
CC-BY-SA; attribution notices ship under `public/`.
