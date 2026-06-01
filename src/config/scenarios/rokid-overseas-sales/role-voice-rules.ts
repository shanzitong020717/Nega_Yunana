import type { RoleVoiceRule } from "@/data/scenario-packs";

export const rokidRoleVoiceRules: RoleVoiceRule[] = [
  {
    roleId: "enterprise_buyer",
    defaultVoicePackId: "kore-firm",
    recommendedVoicePackIds: ["kore-firm", "zephyr-bright", "leda-youthful"],
  },
  {
    roleId: "technical_lead",
    defaultVoicePackId: "charon-informative",
    recommendedVoicePackIds: ["charon-informative", "kore-firm", "fenrir-excitable"],
  },
  {
    roleId: "procurement_manager",
    defaultVoicePackId: "kore-firm",
    recommendedVoicePackIds: ["kore-firm", "fenrir-excitable", "leda-youthful"],
  },
  {
    roleId: "channel_partner",
    defaultVoicePackId: "puck-upbeat",
    recommendedVoicePackIds: ["puck-upbeat", "zephyr-bright", "leda-youthful"],
  },
  {
    roleId: "executive_decision_maker",
    defaultVoicePackId: "fenrir-excitable",
    recommendedVoicePackIds: ["fenrir-excitable", "kore-firm", "charon-informative"],
  },
];
