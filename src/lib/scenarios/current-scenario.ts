import { defaultScenarioPack, scenarioPacks } from "@/data/scenario-packs";

export function getScenarioPack(scenarioPackId?: string) {
  return (
    scenarioPacks.find((pack) => pack.id === scenarioPackId) ||
    defaultScenarioPack
  );
}

export function getDefaultVoicePack(scenarioPackId?: string) {
  return getScenarioPack(scenarioPackId).voicePacks[0];
}
