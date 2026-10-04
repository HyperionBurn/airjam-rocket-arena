/**
 * Public surface of the Rocket Arena phone controller.
 *
 * ---------------------------------------------------------------------------
 HOW THE HOST PAGE WIRES THIS
 * ---------------------------------------------------------------------------
 * This module produces RAW intents and never publishes them itself: input
 * publishing (`useInputWriter` + `useControllerTick`) and pulse→level timing
 * belong to the input layer under `src/airjam/input/`, and adding a second
 * writer here would race it on one socket. The dependency edge is one-way.
 *
 * ```tsx
 * import { TouchController, deriveCarControls, type TouchControllerHandle } from "@/controller";
 *
 * // 1. Phase + connection come from the host/controller runtime.
 * // 2. Airborne and boostPercent come from the simulation, not from touch.
 * const handle = useRef<TouchControllerHandle>(null);
 * const [intents, setIntents] = useState<RawTouchIntents | null>(null);
 *
 * <TouchController
 *   phase={runtimeState === "playing" ? "playing" : "lobby"}
 *   controlsDisabled={connectionStatus !== "connected"}
 *   controllerRef={handle}
 *   airborne={simGrounded ? null : true}   // or handle.setAirborne(...)
 *   boostPercent={simBoostPercent}
 *   onIntents={setIntents}                // → hand to the input layer
 *   onCarChange={...} onTeamChange={...} onReadyChange={...}
 * />
 * ```
 *
 * On disconnect or match end call `handle.current?.release()`; the component
 * also drops everything on `blur`, `pagehide` and tab-hide on its own.
 */

export {
  HELD_BUTTON_IDS,
  IMPULSE_BUTTON_IDS,
  TOUCH_BUTTON_IDS,
  createTouchControlState,
  deriveCarControls,
  isNeutralControls,
  readRawIntents,
  touchControlReducer,
  type RawTouchIntents,
  type TouchButtonId,
  type TouchControlAction,
  type TouchControlState,
  type TouchPointerBinding,
} from "./raw-intents";

export {
  STICK_DEADZONE,
  STICK_EXPO,
  clampAxis,
  offsetFromOrigin,
  shapeAxis,
  shapeMagnitude,
  shapeStick,
  type StickShapeOptions,
  type ShapedStick,
} from "./stick";

export { canVibrate, playHaptic, type HapticKind } from "./haptics";

export {
  useGameplayViewportLock,
} from "./use-gameplay-viewport";

export {
  useTouchInput,
  type TouchButtonHandlers,
  type TouchStickHandlers,
  type UseTouchInputOptions,
  type UseTouchInputResult,
} from "./use-touch-input";

export {
  TouchController,
  type TouchCarOption,
  type TouchControllerHandle,
  type TouchControllerPhase,
  type TouchControllerProps,
  type TouchTeamPreference,
} from "./touch-controller";
