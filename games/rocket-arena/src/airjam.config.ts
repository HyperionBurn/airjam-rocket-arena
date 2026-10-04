/**
 * Air Jam app config for Rocket Arena.
 *
 * One app serves BOTH roles: the projector's host surface at `/`, and the
 * phone's controller at `/controller` (see `app.tsx`). That is the same shape
 * the reference games use.
 *
 * The interesting part is `input.behavior`, and it is not optional. Air Jam
 * infers a boolean field's behaviour from its VALUE TYPE — a boolean defaults to
 * `pulse` (delivered once, then consumed) and a vector defaults to `latest`.
 * The donor's physics ABI is purely LEVEL-triggered. Left to inference, `boost`
 * would arrive as a one-frame pulse and the car would stutter its boost, and if
 * `jump` were ever shaped as an object it would silently flip to `latest` and a
 * 20 ms tap would vanish. So the mapping is stated explicitly here, derived from
 * the single source of truth in `@/airjam/input/input-contract.ts`.
 */
import { createAirJamApp, env } from "@air-jam/sdk";
import { defineAirJamGameMetadata } from "@air-jam/sdk/metadata";

import { ROCKET_ARENA_INPUT_BEHAVIOR } from "@/airjam/input";
import { agentContract } from "@/contracts";
import { gameInputSchema } from "@/host/input-schema";

export const gameMetadata = defineAirJamGameMetadata({
  slug: "rocket-arena",
  name: "Rocket Arena",
  tagline: "Rocket-car football on a real 120 Hz physics sim, driven by your phone.",
  category: "arcade",
  // The native arena hard-caps at MAX_CARS = 8 (`bridge.cpp`). The product
  // targets 2 → 4 → 6, so 6 is the honest ceiling, not the native 8.
  minPlayers: 1,
  maxPlayers: 6,
  inputModalities: ["buttons", "joystick", "touch"],
  supportedSdkRange: "^1.0.0",
  maintainer: { name: "Air Jam" },
  ageRating: "all-ages",
  tags: ["3d", "physics", "sports", "split-screen", "local-multiplayer"],
});

export const airjam = createAirJamApp({
  runtime: env.vite(import.meta.env),
  metadata: gameMetadata,
  controllerPath: "/controller",
  /**
   * The semantic agent contract. This is what lets a full match be driven and
   * asserted WITHOUT visual browser automation: `join_player`, `ready_player`,
   * `start_match`, `drive`/`throttle`/`steer`/`jump`/`boost`/`powerslide`,
   * `ball_cam`, `advance_simulation`, `reset_kickoff`, `score_goal`,
   * `restart_match`, `set_mutator` — plus a match store and a simulation store.
   */
  agent: agentContract,
  input: {
    schema: gameInputSchema,
    // See the module header. `hold` is used for nothing, ever, in this game.
    behavior: {
      pulse: [...ROCKET_ARENA_INPUT_BEHAVIOR.pulse!],
      latest: [...ROCKET_ARENA_INPUT_BEHAVIOR.latest!],
    },
  },
});
