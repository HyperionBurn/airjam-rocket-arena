import { describe, expect, it } from "vitest";

import { reachable } from "./api";

describe("reachable", () => {
  it("points a loopback controller URL at the host the phone loaded the hub from", () => {
    expect(reachable("http://localhost:5173/controller?room=AB12&controllerId=x", "10.0.0.5")).toBe("http://10.0.0.5:5173/controller?room=AB12&controllerId=x");
    expect(reachable("http://127.0.0.1:4100/play", "192.168.1.9")).toBe("http://192.168.1.9:4100/play");
  });
  it("leaves hosted URLs, and a page that is itself on localhost, alone", () => {
    expect(reachable("https://game.onrender.com/controller?room=A", "10.0.0.5")).toBe("https://game.onrender.com/controller?room=A");
    expect(reachable("http://localhost:5173/c", "localhost")).toBe("http://localhost:5173/c");
    expect(reachable("not a url", "10.0.0.5")).toBe("not a url");
  });
});
