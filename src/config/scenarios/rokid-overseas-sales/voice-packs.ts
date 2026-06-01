import type { VoicePack } from "@/data/scenario-packs";

function geminiAudioConfig(voiceName: string): VoicePack["geminiLiveConfig"] {
  return {
    response_modalities: ["AUDIO"],
    speech_config: {
      voice_config: {
        prebuilt_voice_config: {
          voice_name: voiceName,
        },
      },
    },
  };
}

export const rokidVoicePacks: VoicePack[] = [
  {
    id: "kore-firm",
    name: "Kore 坚定专业",
    providerVoiceName: "Kore",
    gender: "female",
    personality: "Firm · 稳定、专业、有判断力",
    voiceStyle: "适合企业买家、采购和正式客户问答",
    speed: "medium",
    bestFor: ["企业买家", "客户问答", "正式会议"],
    modelVoiceHint: "Gemini AI Studio voice_name=Kore; firm professional voice",
    geminiLiveConfig: geminiAudioConfig("Kore"),
  },
  {
    id: "zephyr-bright",
    name: "Zephyr 明亮友好",
    providerVoiceName: "Zephyr",
    gender: "female",
    personality: "Bright · 明亮、友好、鼓励感强",
    voiceStyle: "适合低压力热身、产品介绍和新手练习",
    speed: "medium",
    bestFor: ["新手练习", "产品介绍", "轻松会谈"],
    modelVoiceHint: "Gemini AI Studio voice_name=Zephyr; bright friendly voice",
    geminiLiveConfig: geminiAudioConfig("Zephyr"),
  },
  {
    id: "puck-upbeat",
    name: "Puck 轻快外向",
    providerVoiceName: "Puck",
    gender: "male",
    personality: "Upbeat · 轻快、外向、互动感强",
    voiceStyle: "适合渠道伙伴、开放式探索和轻商务对话",
    speed: "medium",
    bestFor: ["渠道合作", "探索式提问", "轻商务对话"],
    modelVoiceHint: "Gemini AI Studio voice_name=Puck; upbeat conversational voice",
    geminiLiveConfig: geminiAudioConfig("Puck"),
  },
  {
    id: "charon-informative",
    name: "Charon 清晰信息型",
    providerVoiceName: "Charon",
    gender: "male",
    personality: "Informative · 清晰、沉稳、解释性强",
    voiceStyle: "适合技术负责人、参数追问和部署讨论",
    speed: "medium",
    bestFor: ["技术参数", "部署集成", "安全问题"],
    modelVoiceHint: "Gemini AI Studio voice_name=Charon; informative clear voice",
    geminiLiveConfig: geminiAudioConfig("Charon"),
  },
  {
    id: "fenrir-excitable",
    name: "Fenrir 高能追问",
    providerVoiceName: "Fenrir",
    gender: "male",
    personality: "Excitable · 反应快、追问强、压迫感更高",
    voiceStyle: "适合挑战练习、竞品差异和高压异议",
    speed: "fast",
    bestFor: ["异议挑战", "竞品差异", "快速应答"],
    modelVoiceHint: "Gemini AI Studio voice_name=Fenrir; excitable challenging voice",
    geminiLiveConfig: geminiAudioConfig("Fenrir"),
  },
  {
    id: "leda-youthful",
    name: "Leda 年轻自然",
    providerVoiceName: "Leda",
    gender: "female",
    personality: "Youthful · 年轻、自然、表达直接",
    voiceStyle: "适合日常业务场景、应用场景讲解和产品演示",
    speed: "medium",
    bestFor: ["应用场景", "产品演示", "日常沟通"],
    modelVoiceHint: "Gemini AI Studio voice_name=Leda; youthful natural voice",
    geminiLiveConfig: geminiAudioConfig("Leda"),
  },
];
