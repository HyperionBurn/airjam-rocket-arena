/**
 * Persistence. A JSON file with atomic, debounced writes: plenty for a party
 * hub (one process, a few KB), and a `Store` is two methods so a database can
 * replace it later without touching the rest.
 *
 * On a host with an ephemeral disk (a free web service) the file resets when the
 * service redeploys; mount a disk or set DATA_DIR to keep the all-time board.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { emptyData, type HubData, type Store } from "./hub";

export const memoryStore = (): Store & { snapshot(): HubData } => {
  let data = emptyData();
  return {
    load: () => data,
    save: (next) => {
      data = next;
    },
    snapshot: () => data,
  };
};

export const fileStore = (path: string, debounceMs = 400): Store & { flush(): void } => {
  let latest: HubData | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const write = (): void => {
    timer = null;
    if (!latest) return;
    try {
      mkdirSync(dirname(path), { recursive: true });
      const temp = `${path}.tmp`;
      writeFileSync(temp, JSON.stringify(latest));
      renameSync(temp, path); // atomic: a crash mid-write never leaves half a file
    } catch (error) {
      console.error("[arcade-hub] could not save", error);
    }
  };

  return {
    load: () => {
      if (!existsSync(path)) return emptyData();
      try {
        return { ...emptyData(), ...(JSON.parse(readFileSync(path, "utf8")) as Partial<HubData>) };
      } catch (error) {
        console.error("[arcade-hub] could not read saved data, starting fresh", error);
        return emptyData();
      }
    },
    save: (data) => {
      latest = data;
      if (timer === null) {
        timer = setTimeout(write, debounceMs);
        timer.unref?.();
      }
    },
    flush: () => {
      if (timer) clearTimeout(timer);
      write();
    },
  };
};
