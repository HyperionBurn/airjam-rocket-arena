import { PHYSICS_PRESETS, physicsModeURL } from "../physics/presets.js";

export function mountPhysicsLab(root, { selection, getConfiguration, getTrainingDiagnostics = () => null, onOverlayChange, apply,
  href = () => window.location.href, navigate = url => window.history.replaceState(null, "", url) }) {
  const panel = document.createElement("div");
  panel.className = "physics-lab";
  panel.innerHTML = `<h2>Physics</h2>
    <p>Rocket League-style physics is the default, covering driving, boost, jumping, dodges, aerial control, ball contacts, pads and demolitions. Original remains available below.</p>
    <form><label>Physics mode<select name="engine"><option value="experimental">Rocket League-style (default)</option><option value="original">Original</option></select></label>
    <label>Player hitbox<select name="family"><option value="auto">Match visual car (Octane / Dominus)</option></select></label>
    <p class="physics-lab__warning">Player only; the bot stays Octane. Other hitboxes reuse the current visual model, which may not align.</p>
    <p data-native-config></p>
    <details><summary>Launch diagnostics · momentum-v2</summary><p data-training-debug></p></details>
    <label class="physics-lab__check"><input type="checkbox" name="overlay"> Show native hitbox and wheel diagnostics</label>
    <p>Applying resets cars and ball to kickoff without reloading. Score, match time and other settings are kept.</p>
    <p role="status" aria-live="polite" data-result></p>
    <div class="physics-lab__actions"><button type="submit">Apply physics</button></div></form>`;
  const form = panel.querySelector("form"), engine = form.elements.engine,
    family = form.elements.family, overlay = form.elements.overlay,
    result = panel.querySelector("[data-result]");
  for (const key of Object.keys(PHYSICS_PRESETS)) {
    const option = document.createElement("option");
    option.value = key; option.textContent = key[0].toUpperCase() + key.slice(1); family.append(option);
  }
  engine.value = selection.engine; family.value = selection.requestedFamily;
  const update = () => { family.disabled = engine.value !== "experimental"; };
  engine.addEventListener("change", update); update();
  const badge = document.createElement("p");
  badge.className = "physics-lab-badge";
  document.body.append(badge);
  const refresh = () => {
    const diagnostics = getTrainingDiagnostics();
    const velocity = v => v ? `horizontal ${Math.hypot(v[0], v[1]).toFixed(1)}, upward ${v[2].toFixed(1)} uu/s` : "not stepped yet";
    panel.querySelector("[data-training-debug]").textContent = diagnostics
      ? `Active: ${diagnostics.engine === "experimental" ? "RocketSim" : "Original"}, build ${diagnostics.build.slice(0, 12)}. ` +
        (diagnostics.launch ? `Last Launch: before ${velocity(diagnostics.launch.before)}; after ${velocity(diagnostics.launch.after)}; next step ${velocity(diagnostics.launch.nextStep)}. ` : "No Launch recorded yet. ") +
        `Recent controls (tick:action): ${diagnostics.actions.join(", ") || "none"}.`
      : "No running-game diagnostics available.";
    const config = getConfiguration();
    panel.querySelector("[data-native-config]").textContent = `Active native box: ${config.fullSize.map(v => v.toFixed(3)).join(" × ")} uu; offset ${config.offset.map(v => v.toFixed(3)).join(", ")}.`;
    badge.hidden = selection.engine !== "experimental" || !new URL(href()).searchParams.has("physicsDebug");
    badge.textContent = `SOURCE-BUILT ROCKETSIM · ${selection.family.toUpperCase()} HITBOX · VISUAL MODEL UNCHANGED`;
  };
  let busy = false;
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (busy) return;
    busy = true;
    const url = physicsModeURL(href(), engine.value, family.value);
    for (const control of form.elements) control.disabled = true;
    result.textContent = "Preparing physics…";
    try {
      selection = await apply(url);
      navigate(url); refresh();
      result.textContent = "Applied without page reload. Cars and ball reset to kickoff.";
    } catch (error) {
      result.textContent = `Could not apply physics: ${error.message}`;
      engine.value = selection.engine; family.value = selection.requestedFamily;
    } finally {
      busy = false;
      for (const control of form.elements) control.disabled = false;
      update();
    }
  });
  overlay.addEventListener("change", () => onOverlayChange(overlay.checked));
  root.append(panel); refresh();
  return {
    setSelection(value) { selection = value; engine.value = value.engine; family.value = value.requestedFamily; update(); refresh(); },
    show(visible = false) { refresh(); overlay.checked = visible; },
    restoreDefaults() { if (busy) return; engine.value = "experimental"; family.value = "auto"; form.requestSubmit(); },
  };
}
