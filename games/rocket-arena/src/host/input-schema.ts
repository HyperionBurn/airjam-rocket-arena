/**
 * The Air Jam input schema for Rocket Arena.
 *
 * Declared with `zod` so the host gets SDK-level validation and the controller
 * gets a typed publishing surface, but it is NOT the defence that matters for
 * safety — `parseRocketArenaInput` in `@/airjam/input` re-parses every payload
 * defensively at the point of use, because a schema mismatch makes the SDK's
 * `getInput` return `undefined` and a malformed payload must degrade to
 * "everything released" rather than throw inside the 120 Hz loop.
 *
 * FIELD SEMANTICS (why each field is shaped the way it is):
 *  - `stick`   → a vector, so Air Jam treats it as `latest`. This MUST NOT be
 *                `hold`: `hold` keeps the last non-zero value forever, and a
 *                self-centring thumbstick sends `{x:0,y:0}` on release, so the
 *                car would drive off in a straight line with no way to stop.
 *  - `jump`    → boolean, and deliberately left OPTIONAL. Air Jam injects
 *                pending pulses for fields missing from a payload, which is
 *                exactly how a 20 ms tap survives to the next host read. If
 *                `jump` were required, the SDK would reject the short payload
 *                and the press could be lost. It is declared `pulse` in
 *                `ROCKET_ARENA_INPUT_BEHAVIOR`.
 *  - `boost`, `handbrake`, `airRoll` → booleans that must be HELD, so they are
 *                forced to `latest` in `ROCKET_ARENA_INPUT_BEHAVIOR`. As pulses
 *                they would read `true` for one frame and then `false` while
 *                still held, and the car would stutter its boost.
 *
 * The stick is reported RAW. Deadzone, expo and clamping are applied by the
 * source in `@/airjam/input`, so shaping lives in exactly one place.
 */
import { z } from "zod";

export const gameInputSchema = z.object({
  /** +x right, +y forward. Raw; shaped downstream. */
  stick: z.object({ x: z.number(), y: z.number() }),
  /** One-shot. Drives jump, plus the derived flips and double-jump. */
  jump: z.boolean().optional(),
  /** Held. */
  boost: z.boolean().optional(),
  /** Held. Powerslide on the ground, air-roll modifier in the air. */
  handbrake: z.boolean().optional(),
  /** Held. Air-roll affordance only; does not set `handbrake`. */
  airRoll: z.boolean().optional(),
  /** Monotonic ball-cam press count. The host toggles once per increment. */
  ballCamPresses: z.number().int().nonnegative().optional(),
  /** Phone-private lobby choices, republished every tick. Latest-wins. */
  lobby: z
    .object({
      ready: z.boolean(),
      team: z.enum(["auto", "blue", "orange"]),
      name: z.string().max(24),
      /** Garage car id; omitted/empty = no preference. */
      carId: z.string().max(40).optional(),
    })
    .optional(),
});

export type GameInput = z.infer<typeof gameInputSchema>;
