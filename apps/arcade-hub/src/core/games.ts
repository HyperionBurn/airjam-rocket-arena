/**
 * The catalogue of games the hub can run. Edit this (or set ARCADE_GAMES_JSON to
 * a JSON array) to add a game: the hub needs nothing else.
 *
 * `integration: "arcade"` games embed the arcade client and report back on their
 * own. `"manual"` games work today with no code change: the host opens the game
 * and types in the finishing order.
 */
import type { GameDef } from "./types";

export const DEFAULT_GAMES: GameDef[] = [
  {
    id: "rocket-arena",
    name: "Rocket Arena",
    tagline: "Rocket-car football. Team up, boost, score.",
    accent: "#38bdf8",
    icon: "🚀",
    minPlayers: 2,
    maxPlayers: 6,
    minutes: 4,
    integration: "arcade",
    hostUrl: "https://airjam-rocket-arena.onrender.com/",
  },
  {
    id: "turbo-kart",
    name: "Turbo Kart Rally",
    tagline: "Six-way split-screen kart racing with items.",
    accent: "#fb923c",
    icon: "🏁",
    minPlayers: 2,
    maxPlayers: 6,
    minutes: 5,
    integration: "manual",
    hostUrl: "https://turbo-kart-rally-mstb.onrender.com/",
    joinUrl: "https://turbo-kart-rally-mstb.onrender.com/controller",
  },
  {
    id: "air-brawl",
    name: "Air Brawl",
    tagline: "Platform fighter. Knock everyone off the stage.",
    accent: "#c084fc",
    icon: "🥊",
    minPlayers: 2,
    maxPlayers: 8,
    minutes: 4,
    integration: "manual",
    hostUrl: "https://air-brawl.onrender.com/",
  },
];

/** The catalogue, honouring an optional JSON override. */
export const loadGames = (env: NodeJS.ProcessEnv = process.env): GameDef[] => {
  const raw = env.ARCADE_GAMES_JSON;
  if (!raw) return DEFAULT_GAMES;
  try {
    const parsed = JSON.parse(raw) as GameDef[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_GAMES;
  } catch {
    return DEFAULT_GAMES;
  }
};
