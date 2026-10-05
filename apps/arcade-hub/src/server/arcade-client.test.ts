import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { encodePlayers } from "../core/view";

// The script is a plain browser file (UMD); evaluate it with a CommonJS-style module shim.
const load = <T>(): T => {
  const shim = { exports: {} as unknown };
  new Function("module", readFileSync(new URL("../../public/arcade-client.js", import.meta.url), "utf8"))(shim);
  return shim.exports as T;
};
const client = load<{
  decodePlayers: (value: string | null) => Array<{ id: string; name: string; color?: string }>;
  rank: (players: Array<{ id: string }>, scores: Record<string, number>, options?: { lowerIsBetter?: boolean }) => Array<{ playerId: string; rank: number | null; score?: number }>;
  fromUrl: (search: string) => { players: unknown[]; round: string } | null;
}>();

describe("arcade-client.js", () => {
  const players = [
    { id: "a1a1", name: "Ana", color: "#fff", avatar: "" },
    { id: "b2b2", name: "Zoë", color: "#000", avatar: "" },
  ];

  it("decodes exactly what the hub encodes, including non-ASCII names", () => {
    expect(client.decodePlayers(encodePlayers(players)).map((p) => p.name)).toEqual(["Ana", "Zoë"]);
    expect(client.decodePlayers("###")).toEqual([]);
  });

  it("reads a launch and refuses a non-http origin", () => {
    const search = `?arcade=https://hub.test&round=r1&token=t&players=${encodePlayers(players)}`;
    expect(client.fromUrl(search)?.players).toHaveLength(2);
    expect(client.fromUrl("?arcade=javascript:1&round=r&token=t")).toBeNull();
    expect(client.fromUrl("")).toBeNull();
  });

  it("ranks scores with ties and did-not-finish", () => {
    const three = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
    expect(client.rank(three, { a: 10, b: 30, c: 10 }).map((p) => p.rank)).toEqual([2, 1, 2, null]);
    expect(client.rank(three, { a: 61.2, b: 59.9 }, { lowerIsBetter: true }).map((p) => p.rank)).toEqual([2, 1, null, null]);
  });
});
