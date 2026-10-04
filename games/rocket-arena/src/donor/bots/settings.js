import { createSettingsStore, readChoice } from "../core/settings-store.js";
import { pl } from "./catalog.js";

const dm = createSettingsStore(
    "rocket-arena.bot-settings.v1",
    () => ({ botId: "nexto" }),
    (i, e) => {
      i.botId = readChoice(
        e.botId,
        pl.map((t) => t.id),
        i.botId,
      );
    },
  );

const Pi = 1;

const Ba = 159;

const eB = Ba - Pi;

const ri = 13;

const tB = [0, 25, 50, 75, 100];

export { Ba, Pi, dm, eB, ri, tB };
