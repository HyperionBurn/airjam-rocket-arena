# Visual analysis: a real 2v2 match vs. this game

Method: a 17-minute 1080p60 recording of a high-level 2v2 match was downloaded for
reference only (`yt-dlp`, kept outside the repo), sampled as contact sheets every
12 s (87 frames), then stepped through at 4-5 fps around key moments (kickoff, boost
runs, a flip, a goal and its replay). The same situations were captured from this game
at 1080p (`_scratch/ours.mjs`) and compared side by side. Nothing from the recording
is used in the game: the notes below describe qualities, and every effect here is
original and procedural.

## What was different

| Area | Reference | This game (before) | Done |
|---|---|---|---|
| Atmosphere | Dusk/night arena: warm-to-violet sky, floodlight beams, strong contrast | Flat bright daytime park | Procedural dusk sky with stars, dusk light colours and fog, tinted scenery, sweeping floodlight beams (`rendering/arena-look.js`) |
| Colour and glow | Filmic tone curve, cool shadows / warm highlights, saturated, bloom on lights and boost | Linear, unbloomed, flat | HDR post chain: 3-scale bloom, filmic tone map, split-toned grade, vignette (`rendering/arena-post.js`) |
| Speed feel | Radial streaking and edge colour fringing as the car goes fast or boosts | None | Speed-driven radial blur and chromatic aberration per view |
| Pitch | Dark glossy surface, bright glowing markings | Bright matte checkered lawn, chalk lines | Cooled/darkened lawn with neon additive markings (`arena/park.js`) |
| Boost | Big flame plus a pool of warm light on the ground | Small jets, no ground light | Per-car additive ground glow that lingers (`effects/arena-fx.js` `BoostGlow`) |
| Goal | Ball burst, huge fireball, team-coloured smoke, sparks, ring, screen flash | Confetti and a banner | Pooled fireball, billowing team smoke, ring, sparks and a short grade flash (`GoalBurst`) |
| HUD | Round boost dial with a big number; floating name tags over other cars | Number + thin bar; no tags | 270-degree ring gauge; projected nameplates per view (`host/match-hud.tsx`) |
| Sound | Kickoff ticks, goal horn and crowd, demolitions, pad pickups, buzzer | Engines and impacts only | Procedural match sounds (`audio/arena-sfx.js`) |

## Switches

* `?daylight` keeps the donor's original look; `?plainpost` uses the donor's post chains
  (A/B comparison). `?debug` exposes `window.__arena` (world, renderer, fx).
* The dusk palette and grade are single constants: `DUSK` in `rendering/arena-look.js`
  and `DUSK_LOOK` in `rendering/arena-post.js`.

## Measured cost

6 split-screen views at 1080p and a 2v2 at 1080p both hold 60 fps with no frame over
25 ms (RTX 5060 laptop, headless). Lower-end GPUs were not measured.

## Not done / known gaps

* No stadium stands or crowd: the park scenery (trees, mountains, skyline) is kept and
  re-lit. A crowd bowl would be a modelling task, not a shader.
* Sun shadows still cover only cars 0-1 and the ball (donor limit).
* Boost flames and flip trails are the donor's; only their light pool and the post
  glow were added.
