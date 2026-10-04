// Called only after an explicit online action. No periodic wake-up/keep-alive.
function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(signal.reason ?? new DOMException('Cancelled', 'AbortError')); };
    const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, ms);
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
  });
}
export async function waitForReady(serverUrl, { signal, timeoutMs = 90000, onProgress = () => {},
  fetchImpl = fetch, now = () => performance.now(), delay = sleep } = {}) {
  const start = now(); let attempt = 0;
  while (now() - start < timeoutMs) {
    signal?.throwIfAborted();
    const remaining = timeoutMs - (now() - start);
    const timeout = AbortSignal.timeout(Math.max(1, Math.ceil(Math.min(10000, remaining))));
    let response, health;
    try {
      response = await fetchImpl(serverUrl + '/readyz', { cache: 'no-store', signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
      try { health = await response.json(); } catch { /* Provider cold-start pages may be HTML. */ }
    } catch { signal?.throwIfAborted(); }
    if (response?.ok && health?.ready === true) return health;
    if (response && response.status >= 400 && response.status < 500 && ![408, 429].includes(response.status)) {
      throw Error(`The game-server readiness endpoint returned ${response.status}. Check the deployment configuration.`);
    }
    signal?.throwIfAborted();
    onProgress({ attempt: ++attempt, elapsedMs: now() - start });
    const pause = Math.min(4000, 500 * 2 ** Math.min(attempt - 1, 3), timeoutMs - (now() - start));
    if (pause > 0) await delay(pause, signal);
  }
  throw Error('The game server did not become ready. It may be sleeping or unavailable. Retry later, or play Bots/Free Play offline.');
}
