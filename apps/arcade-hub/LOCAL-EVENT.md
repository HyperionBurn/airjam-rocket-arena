# Run the whole arcade on one laptop (agent runbook)

Goal: the hub, Rocket Arena and Family Feud all running **on this laptop**, reached by phones over the venue Wi-Fi, with no internet needed except for the two hosted fallback games. Round trip phone to game drops from about 180 ms (hosted) to about 10 ms.

Follow the steps in order. Every command was run for real on Windows 11, Node 24; step 6 (`doctor`) tells you whether you got it right. Do not skip it.

```
phones (Wi-Fi)  ─▶ http://<LAN-IP>:8787 ─▶ hub  ─┬─▶ Rocket Arena   http://localhost:5173  (+ Air Jam relay :4000)
big screen (this browser) ─▶ http://localhost:8787 ┤
                                                  └─▶ Family Feud    http://localhost:4100  (screen + console)
                                                  (Turbo Kart, Air Brawl: still the hosted URLs; they need internet)
```

## Rules that bite (read once)

1. **The big screen must use `http://localhost:8787`, never the LAN address.** Rocket Arena's engine needs a browser *secure context* (`crypto.subtle`), and `localhost` is the only plain-http address that counts as one. Open it by LAN IP and Rocket Arena fails with `FAILED TO START: Cannot read properties of undefined (reading 'digest')`. Only phones use the LAN address.
2. **Family Feud's console is opened from the hub's "Open the console" button**, not typed in as a URL. The hub embeds it so the console and the projector share one browser partition; a console opened directly cannot drive the embedded projector.
3. **Port 4000 is the Air Jam relay** (started by Rocket Arena). Family Feud also defaults to 4000, so it must be started with `PORT=4100`. If port 4000 is already held by *another project's* Air Jam server, reuse it; never kill a process you did not start.
4. **Needs a real GPU** (Chrome with hardware acceleration) for Rocket Arena. On software rendering the kickoff takes minutes.
5. **Phones and laptop on the same network with client/AP isolation off.** Hotel and campus guest Wi-Fi often isolate clients. A small travel router is the reliable fix.
6. Never `vite` directly in `games/rocket-arena`; the game needs the Air Jam server that `airjam dev` starts.

## 0. What you need

- Node 22 or newer, git, Google Chrome.
- pnpm is **not** installed globally. Use `npx --yes pnpm@9.9.0 ...` for this repo and `npx --yes pnpm@12.6.0 ...` for Family Feud.
- Two checkouts side by side (adjust paths; the examples assume `C:\arcade`):
  - `C:\arcade\airjam-rocket-arena` ← `https://github.com/HyperionBurn/airjam-rocket-arena` (hub + Rocket Arena)
  - `C:\arcade\Family-Feud` ← `https://github.com/HyperionBurn/Family-Feud` (Family Feud with the arcade adapter)

```powershell
git clone https://github.com/HyperionBurn/airjam-rocket-arena C:\arcade\airjam-rocket-arena
git clone https://github.com/HyperionBurn/Family-Feud C:\arcade\Family-Feud
```

## 1. Install and build (once, needs internet)

```powershell
# hub + Rocket Arena (and their workspace dependencies)
cd C:\arcade\airjam-rocket-arena
npx --yes pnpm@9.9.0 install --frozen-lockfile --filter "arcade-hub..." --filter "rocket-arena..."
npx --yes pnpm@9.9.0 --filter @air-jam/sdk build
npx --yes pnpm@9.9.0 --filter arcade-hub build

# Family Feud (NODE_ENV=development so the build tools install)
cd C:\arcade\Family-Feud
$env:NODE_ENV = "development"; npx --yes pnpm@12.6.0 install --frozen-lockfile; Remove-Item Env:NODE_ENV
npx --yes pnpm@12.6.0 run build
```

Bash equivalent for the Family Feud install: `NODE_ENV=development npx --yes pnpm@12.6.0 install --frozen-lockfile`.

## 2. Open the firewall (ask the user first)

Windows blocks inbound connections to Node until allowed. The first time each service starts, Windows may pop up a firewall prompt: choose **Private networks**. If phones cannot reach the laptop later, the rules below fix it. This changes a security setting and needs an elevated PowerShell, so **ask the user before running it**:

```powershell
netsh advfirewall firewall add rule name="Arcade hub" dir=in action=allow protocol=TCP localport=8787,5173,4000,4100 profile=private
```

Undo: `netsh advfirewall firewall delete rule name="Arcade hub"`.

## 3. Start Rocket Arena (game on :5173, Air Jam relay on :4000)

Leave this running in its own terminal:

```powershell
cd C:\arcade\airjam-rocket-arena\games\rocket-arena
npx --yes pnpm@9.9.0 exec airjam dev
```

Ready when it prints `Server listening on http://localhost:4000` and Vite's `Local: http://localhost:5173/`.

## 4. Start Family Feud (game + its own relay on :4100)

Own terminal:

```powershell
cd C:\arcade\Family-Feud
$env:PORT = "4100"; node scripts/serve.mjs
```

Ready when it prints `Family Feud is up on port 4100`. (Bash: `PORT=4100 node scripts/serve.mjs`.)

## 5. Start the hub (:8787)

```powershell
cd C:\arcade\airjam-rocket-arena
npx --yes pnpm@9.9.0 --filter arcade-hub run games:local      # writes apps\arcade-hub\data\games.local.json
cd apps\arcade-hub
$env:ARCADE_GAMES_FILE = "data/games.local.json"; node dist/server/main.js
```

(Bash: `ARCADE_GAMES_FILE=data/games.local.json node dist/server/main.js`.) The path is relative to the folder you run it from, which must be `apps/arcade-hub`.

`games:local` points Rocket Arena and Family Feud at `localhost` and leaves Turbo Kart and Air Brawl on their hosted URLs. Re-run it only if you change ports (`-- --rocket-port 5173 --feud-port 4100`), then restart the hub.

Hub data (sessions, all-time leaderboard) lives in `apps/arcade-hub/data/hub.json` and survives restarts. Delete it to wipe the leaderboard.

## 6. Verify (do not skip)

```powershell
cd C:\arcade\airjam-rocket-arena
npx --yes pnpm@9.9.0 --filter arcade-hub run doctor
```

Everything on this laptop must say `[ok  ]`, and it prints the address phones use (for example `http://192.168.1.20:8787`). `[warn]` on Turbo Kart or Air Brawl only means they are asleep or you are offline; those are hosted. Fix every `[FAIL]` using the table at the bottom, then re-run.

Then check from a **phone** (not the laptop): open the printed phone address in the phone's browser. You should see the hub's blue landing page. If not, it is the firewall (step 2) or client isolation (rule 5), not the app.

## 7. Run a night

1. On the laptop, in Chrome, open **`http://localhost:8787`** → **Host a night** → pick the number of rounds. Press **F11** for full screen on the projector.
2. Phones scan the QR on the big screen (it encodes the LAN address) and type a name.
3. **Start voting**, phones vote, the winning game opens inside the big screen.
4. Per game:
   - **Rocket Arena:** click once in the game ("Click anywhere once to enable sound"; or launch Chrome with `--autoplay-policy=no-user-gesture-required`). Phones show touch controls; the match starts by itself once everyone is in, or press **START NOW**. The hub scores it at full time.
   - **Family Feud:** in the host controls under the game press **Open the console**, drag that window to the laptop's own screen (never the projector), click **Enable sound** inside the projector once, load the survey results in the console's **Setup** tab, play it verbally, and at the end press **Send the result to the arcade**. Survey results are stored per browser *and per embedding page*: load them in this hub-opened console even if they were loaded at the game's own address earlier.
   - **Turbo Kart / Air Brawl:** hosted, manual: use the join QR the hub shows, and tap the finishing order in the host controls panel afterwards.
5. Results and standings show automatically; **Continue** for the next vote. The champion screen follows the last round.

## Stop everything

Close the three terminals (Ctrl+C). If something is orphaned, find the owner of a port and stop only your own processes:

```powershell
Get-NetTCPConnection -LocalPort 8787,5173,4000,4100 -State Listen | Select LocalPort, OwningProcess
```

## When something is wrong

| Symptom | Cause and fix |
|---|---|
| Rocket Arena: `FAILED TO START ... reading 'digest'` | The big screen was opened by LAN IP. Use `http://localhost:8787` (rule 1). |
| Phone cannot open the hub address | Firewall (step 2), or Wi-Fi client isolation, or the phone is on mobile data. Confirm the phone is on the same network as the laptop. |
| Phone joins but the game controls never appear (stays "Starting the game") | The game's ready call has not arrived: Rocket Arena's relay on :4000 is down (`doctor` shows it), or the game page itself has not finished loading on the laptop. |
| Phone shows controls but the car does not move | A hidden browser tab pauses the match; keep the hub tab visible. Check phones and laptop are on the same network. |
| Rocket Arena kickoff takes forever | No GPU acceleration. Chrome → Settings → System → "Use graphics acceleration when available", and restart Chrome. |
| `doctor` says family-feud console not answering | Family Feud was not started with `PORT=4100`, or it is still running with the default and port 4000 clashed. Restart it (step 4). |
| Family Feud console shows "Projector not open" and the board never updates | The console was opened directly instead of from the hub's **Open the console** button (rule 2). Close it and use the button. |
| Family Feud console says no survey results | They are stored per embedding page. Paste them in this console's Setup tab (or restore a backup there). |
| `EADDRINUSE` on 4000 | Another Air Jam server (for example from another project) holds the port. If it is healthy (`curl http://localhost:4000/health`), reuse it and skip starting a second one. |
| Hub shows the old game list after a code change | Rebuild (`--filter arcade-hub build`), re-run `games:local`, restart the hub. A running hub never reloads its catalogue. |
| Hub refuses to start: `ARCADE_GAMES_FILE ... must be a non-empty JSON array` | Wrong path or edited file. Re-run `games:local` from the repo root, start the hub from `apps/arcade-hub`. |
| Turbo Kart / Air Brawl blank | They are hosted services on Render's free plan: open them a few minutes early to wake them, and the laptop needs internet. |
| Everything works, then a phone drops | Phones reconnect by themselves and keep their name (a device token). If one is stuck, reload its page; it rejoins the same room. |

## For an agent: definition of done

- `pnpm --filter arcade-hub run doctor` prints `All local services are ready.`
- A phone on the same Wi-Fi opens the printed address and can join a hosted night.
- Optional end-to-end proof on the laptop: host a night at `http://localhost:8787` with two browser contexts as phones at the LAN address, vote Family Feud, press **Open the console**, play one round and **Send the result**; the hub shows the results screen. This is what was run to validate this document.
- Report honestly what you did not test: real phones on the venue Wi-Fi, the venue projector, and sound.
