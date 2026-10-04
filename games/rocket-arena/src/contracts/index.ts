/**
 * Public surface of the agent contract.
 *
 * `src/airjam.config.ts` is owned by the orchestrator and is where this gets
 * wired (`createAirJamApp({ agent: agentContract })`), so this barrel only
 * re-exports. It depends on `../match/**` and on `@air-jam/sdk`; it never
 * imports the donor, the shell, the controller or the input layer.
 */

export {
  AGENT_ACTION_NAMES,
  MATCH_STORE_DOMAIN,
  SIM_STORE_DOMAIN,
  agentContract,
  projectMatchSnapshot,
  projectSimConfig,
} from "./agent.js";
export type { MatchAgentSnapshot, SimulationAgentSnapshot } from "./agent.js";
