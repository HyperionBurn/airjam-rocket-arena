import { describe, expect, it } from "vitest";

import {
  BOTS_DISABLED_ID,
  BOT_DIFFICULTIES,
  BOT_LICENSING_NOTICE,
  COMMERCIAL_SAFE_BOT_IDS,
  DEFAULT_BOT_DIFFICULTY_ID,
  NON_COMMERCIAL_BOT_IDS,
  botDifficultyIds,
  botModelSlot,
  canDriveArena,
  describeArenaRefusal,
  getBotDifficulty,
  isCommercialSafe,
  listBotDifficulties,
  nonCommercialModelBytes,
} from "../bot-difficulty.js";

describe("difficulty registry — the three donor bots plus the off switch", () => {
  it("exposes the donor's three difficulties and a disabled entry", () => {
    expect(botDifficultyIds()).toEqual(["seer", "necto", "nexto", "disabled"]);
    expect(listBotDifficulties()).toHaveLength(4);
  });

  it("carries the donor's own catalog facts for each model", () => {
    // Values cross-checked against src/donor/bots/catalog.js and the shipped
    // public/assets/bot/** tree. A drift here means the model moved.
    expect(BOT_DIFFICULTIES.seer).toMatchObject({
      label: "Seer v0",
      rank: "Platinum",
      modelUrl: "/assets/bot/seer/policy.onnx",
      noticeUrl: "/assets/bot/seer/NOTICE.txt",
      tickSkip: 8,
      enabled: true,
    });
    expect(BOT_DIFFICULTIES.necto).toMatchObject({
      label: "Necto",
      rank: "Diamond",
      modelUrl: "/assets/bot/necto/policy.onnx",
      tickSkip: 8,
    });
    expect(BOT_DIFFICULTIES.nexto).toMatchObject({
      label: "Nexto",
      rank: "GC",
      modelUrl: "/assets/bot/policy.onnx",
      // The donor gives Nexto a scripted kickoff and the others none.
      scriptedKickoff: true,
    });
    expect(BOT_DIFFICULTIES.seer.scriptedKickoff).toBe(false);
    expect(BOT_DIFFICULTIES.necto.scriptedKickoff).toBe(false);
  });
});

describe("difficulty registry — the disabled entry really turns bots off", () => {
  it("loads no model, spawns no worker and reports not enabled", () => {
    const off = BOT_DIFFICULTIES[BOTS_DISABLED_ID];
    expect(off.enabled).toBe(false);
    expect(off.requiresNeuralRuntime).toBe(false);
    expect(off.modelUrl).toBeNull();
    expect(off.noticeUrl).toBeNull();
    expect(off.modelBytes).toBe(0);
    expect(off.arenaSupport).toBe("none");
  });

  it("is what an unknown or missing id degrades to, never a throw", () => {
    expect(getBotDifficulty("nope").id).toBe(BOTS_DISABLED_ID);
    expect(getBotDifficulty(null).id).toBe(BOTS_DISABLED_ID);
    expect(getBotDifficulty(undefined).id).toBe(BOTS_DISABLED_ID);
    expect(getBotDifficulty(42 as never).id).toBe(BOTS_DISABLED_ID);
  });

  it("cannot drive any arena", () => {
    expect(canDriveArena("disabled", 2)).toBe(false);
    expect(canDriveArena("disabled", 6)).toBe(false);
    expect(describeArenaRefusal("disabled", 2)).toBe("Bots are turned off.");
  });
});

describe("difficulty registry — licensing is first-class data", () => {
  it("marks Seer v0 as the MIT, commercially usable model", () => {
    expect(BOT_DIFFICULTIES.seer.license).toBe("MIT");
    expect(BOT_DIFFICULTIES.seer.commercialUse).toBe("permitted");
    expect(isCommercialSafe("seer")).toBe(true);
  });

  it("marks Necto and Nexto as non-commercial, with no invented exemption", () => {
    for (const id of ["necto", "nexto"] as const) {
      expect(BOT_DIFFICULTIES[id].license).toBe("CC-BY-NC-SA-4.0");
      expect(BOT_DIFFICULTIES[id].commercialUse).toBe("forbidden");
      expect(isCommercialSafe(id)).toBe(false);
    }
    expect(NON_COMMERCIAL_BOT_IDS).toEqual(["necto", "nexto"]);
  });

  it("defaults to the commercially safe model", () => {
    // A fresh install must not be able to breach a licence by default.
    expect(DEFAULT_BOT_DIFFICULTY_ID).toBe("seer");
    expect(isCommercialSafe(DEFAULT_BOT_DIFFICULTY_ID)).toBe(true);
    expect(COMMERCIAL_SAFE_BOT_IDS).toEqual(["seer"]);
  });

  it("carries the attribution the donor requires", () => {
    expect(BOT_LICENSING_NOTICE).toContain("Neville Walo");
    expect(BOT_LICENSING_NOTICE).toContain("MIT");
    expect(BOT_LICENSING_NOTICE).toContain("CC BY-NC-SA 4.0");
    expect(BOT_LICENSING_NOTICE).toContain("non-commercial");
    for (const entry of listBotDifficulties()) {
      expect(entry.credit.length, entry.id).toBeGreaterThan(0);
    }
  });

  it("accounts for the non-commercial weights separately", () => {
    const bytes = nonCommercialModelBytes();
    expect(bytes).toBe(707_364 + 1_802_204);
    expect(bytes).toBeLessThan(BOT_DIFFICULTIES.seer.modelBytes);
  });
});

describe("difficulty registry — arena support mirrors the models' own guard", () => {
  it("allows a neural policy only at 1v1, because that is all it can observe", () => {
    // observations.js:5, necto.js:28 and seer.js:82 all throw unless NUM_CARS===2.
    for (const id of ["seer", "necto", "nexto"] as const) {
      expect(BOT_DIFFICULTIES[id].arenaSupport, id).toBe("1v1");
      expect(canDriveArena(id, 2), id).toBe(true);
      expect(canDriveArena(id, 3), id).toBe(false);
      expect(canDriveArena(id, 4), id).toBe(false);
      expect(canDriveArena(id, 6), id).toBe(false);
    }
  });

  it("explains the refusal instead of failing silently", () => {
    const message = describeArenaRefusal("nexto", 6);
    expect(message).toContain("1v1");
    expect(message).toContain("6 cars");
    expect(describeArenaRefusal("nexto", 2)).toBeNull();
  });

  it("names the slot the models can reason about", () => {
    // Every builder indexes the world as [slot, 1 - slot].
    expect(botModelSlot(0)).toBe(0);
    expect(botModelSlot(1)).toBe(1);
  });
});
