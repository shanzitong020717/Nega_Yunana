import {
  defaultScenarioPack,
  type PracticeGoal,
  type ScenarioPack,
  type VoicePack,
} from "@/data/scenario-packs";
import {
  DEFAULT_GEMINI_LIVE_MODEL,
  GEMINI_LIVE_INPUT_SAMPLE_RATE,
  GEMINI_LIVE_OUTPUT_SAMPLE_RATE,
} from "@/lib/ai/gemini-live-relay";
import type { MaterialBriefPayload } from "@/lib/ai/material-brief";
import { getOpenAIClient, hasOpenAIApiKey } from "@/lib/ai/openai-client";
import type { PrepCardPayload } from "@/lib/ai/prep-card";
import { createRealtimeRelayToken } from "@/lib/ai/realtime-relay-token";
import type { CreatePracticeSessionInput } from "@/lib/validation/practice";
import type { ClientSecretCreateParams } from "openai/resources/realtime/client-secrets";

export type RealtimePersona = {
  id: string;
  name: string;
  focusAreas: string[];
  tone: string;
  sampleQuestions: string[];
};

export type BuildRealtimeInstructionsInput = {
  mode: CreatePracticeSessionInput["mode"];
  persona: RealtimePersona;
  scenarioPack?: ScenarioPack | null;
  practiceGoal?: PracticeGoal | null;
  voicePack?: VoicePack | null;
  materialBrief?: MaterialBriefPayload | null;
  prepCard?: PrepCardPayload | null;
  trainingFocus?: string[];
  focusTags?: string[];
  memorySnippets?: string[];
};

export type CreateRealtimeSessionInput = BuildRealtimeInstructionsInput & {
  practiceSessionId: string;
  mockMode?: boolean;
};

export type RealtimeWebRTCSessionCredential = {
  transport: "webrtc";
  clientSecret: string;
  sessionId: string;
  expiresAt: string;
  model: string;
  instructionsPreview: string;
};

export type RealtimeRelaySessionCredential = {
  transport: "websocket_relay";
  relayUrl: string;
  relayToken: string;
  sessionId: string;
  expiresAt: string;
  model: string;
  inputAudioSampleRate: number;
  outputAudioSampleRate: number;
  instructionsPreview: string;
};

export type RealtimeSessionCredential =
  | RealtimeWebRTCSessionCredential
  | RealtimeRelaySessionCredential;

const DEFAULT_REALTIME_MODEL = "gpt-realtime-mini";
const CLIENT_SECRET_TTL_SECONDS = 600;
const OPENAI_REALTIME_INPUT_SAMPLE_RATE = 24_000;
const OPENAI_REALTIME_OUTPUT_SAMPLE_RATE = 24_000;

function getErrorField(
  error: unknown,
  field: "status" | "code" | "type" | "param" | "request_id",
) {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const value = (error as Record<string, unknown>)[field];

  return typeof value === "string" || typeof value === "number"
    ? value
    : undefined;
}

function logRealtimeProviderError(error: unknown) {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  console.warn("[realtime] Provider session creation failed.", {
    name: error instanceof Error ? error.name : undefined,
    message: error instanceof Error ? error.message : String(error),
    status: getErrorField(error, "status"),
    code: getErrorField(error, "code"),
    type: getErrorField(error, "type"),
    param: getErrorField(error, "param"),
    requestId: getErrorField(error, "request_id"),
  });
}

function shouldUseMockMode(input: Pick<CreateRealtimeSessionInput, "mockMode">) {
  return (
    input.mockMode === true ||
    process.env.AI_MOCK_MODE === "true" ||
    process.env.NODE_ENV === "test" ||
    !hasOpenAIApiKey()
  );
}

function normalizeOptionalEnv(value: string | undefined) {
  const trimmedValue = value?.trim() ?? "";
  const unquotedValue =
    (trimmedValue.startsWith('"') && trimmedValue.endsWith('"')) ||
    (trimmedValue.startsWith("'") && trimmedValue.endsWith("'"))
      ? trimmedValue.slice(1, -1).trim()
      : trimmedValue;

  return unquotedValue.length > 0 ? unquotedValue : undefined;
}

function getRealtimeRelayConfig() {
  if (process.env.OPENAI_REALTIME_TRANSPORT !== "websocket_relay") {
    return null;
  }

  const relayUrl = normalizeOptionalEnv(process.env.REALTIME_RELAY_URL);
  const sharedSecret = normalizeOptionalEnv(
    process.env.REALTIME_RELAY_SHARED_SECRET,
  );

  if (!relayUrl || !sharedSecret) {
    throw new Error(
      "REALTIME_RELAY_URL and REALTIME_RELAY_SHARED_SECRET are required when OPENAI_REALTIME_TRANSPORT is websocket_relay.",
    );
  }

  return {
    relayUrl,
    sharedSecret,
    provider: normalizeOptionalEnv(process.env.REALTIME_RELAY_PROVIDER),
  };
}

function realtimeRelayProviderModel(provider: string | undefined) {
  if (provider === "gemini_live") {
    return process.env.GEMINI_LIVE_MODEL ?? DEFAULT_GEMINI_LIVE_MODEL;
  }

  return process.env.OPENAI_REALTIME_MODEL ?? DEFAULT_REALTIME_MODEL;
}

function realtimeRelayAudioRates(provider: string | undefined) {
  if (provider === "gemini_live") {
    return {
      inputAudioSampleRate: GEMINI_LIVE_INPUT_SAMPLE_RATE,
      outputAudioSampleRate: GEMINI_LIVE_OUTPUT_SAMPLE_RATE,
    };
  }

  return {
    inputAudioSampleRate: OPENAI_REALTIME_INPUT_SAMPLE_RATE,
    outputAudioSampleRate: OPENAI_REALTIME_OUTPUT_SAMPLE_RATE,
  };
}

function formatList(title: string, items?: string[] | null) {
  const usefulItems = (items ?? []).filter(Boolean);

  if (usefulItems.length === 0) {
    return `${title}: none provided.`;
  }

  return [`${title}:`, ...usefulItems.map((item) => `- ${item}`)].join("\n");
}

export function buildRealtimeInstructions(input: BuildRealtimeInstructionsInput) {
  const scenarioPack = input.scenarioPack ?? defaultScenarioPack;
  const practiceGoal = input.practiceGoal;
  const voicePack = input.voicePack;
  const materialBrief = input.materialBrief;
  const prepCard = input.prepCard;

  return [
    "You are an overseas customer meeting simulator and English speaking coach for a Rokid overseas sales and solution professional.",
    "Run a realistic English business conversation. Act as the customer first, then give concise learning support only when the learner asks for it or when a live support cue is used.",
    "",
    `Scenario pack: ${scenarioPack.name}`,
    `Scenario target user: ${scenarioPack.targetUser}`,
    `Scenario primary goal: ${scenarioPack.primaryGoal}`,
    `Practice goal: ${practiceGoal?.label ?? input.mode}`,
    `Practice goal description: ${practiceGoal?.description ?? "Run the selected practice scenario."}`,
    formatList("Focus tags", input.focusTags),
    formatList("Relevant memory snippets", input.memorySnippets),
    "",
    `Practice mode: ${input.mode}`,
    `AI customer role: ${input.persona.name}`,
    `Customer persona: ${input.persona.name}`,
    `Customer tone: ${input.persona.tone}`,
    formatList("Customer focus areas", input.persona.focusAreas),
    formatList("Sample customer questions", input.persona.sampleQuestions),
    `Voice pack: ${voicePack?.name ?? "Default business customer voice"}`,
    `Voice intent: ${voicePack?.modelVoiceHint ?? "natural_business_voice"}`,
    `Voice personality: ${voicePack?.personality ?? "professional and realistic"}`,
    `Voice style: ${voicePack?.voiceStyle ?? "clear spoken English"}`,
    "",
    "Material brief:",
    `Key message: ${materialBrief?.keyMessage ?? "No uploaded material brief is available for this session."}`,
    formatList("Product points", materialBrief?.productPoints),
    formatList("Customer value", materialBrief?.customerValue),
    formatList("Likely material questions", materialBrief?.likelyQuestions),
    formatList("Likely material objections", materialBrief?.likelyObjections),
    formatList("Approved useful phrases", materialBrief?.usefulPhrases),
    formatList("Risky claims to avoid", materialBrief?.riskyClaims),
    formatList("Material outline", materialBrief?.outline),
    "",
    "Meeting prep card:",
    `Customer context: ${prepCard?.customerContext ?? "No prep card is attached."}`,
    `Meeting goal: ${prepCard?.meetingGoal ?? "Practice a focused overseas customer conversation."}`,
    formatList("Key talking points", prepCard?.keyTalkingPoints),
    formatList("Discovery questions to invite", prepCard?.discoveryQuestions),
    formatList("Likely objections to test", prepCard?.likelyObjections),
    `Suggested opening script: ${prepCard?.openingScript ?? "May I first understand your use case and what you would like to validate?"}`,
    formatList("Must-use phrases", prepCard?.mustUsePhrases),
    formatList("Do not overpromise", prepCard?.doNotOverpromise),
    "",
    formatList("Training focus", input.trainingFocus),
    "",
    "Live support behavior:",
    "- Ask one realistic customer question at a time.",
    "- Keep customer turns natural and short enough for spoken practice.",
    "- If the learner struggles, offer a lighter English phrase and a Chinese explanation.",
    "- When asked to translate, provide English and Chinese side by side.",
    "- When asked to challenge, push on ROI, security, workflow fit, procurement, or adoption depending on the persona.",
    "- After the learner answers, continue the roleplay instead of turning into a lecture.",
    "",
    "Safety and accuracy:",
    "- Do not invent product claims, pricing, accuracy numbers, certifications, or contract terms not provided in the source material.",
    "- If the customer asks for unsupported specifics, coach the learner to say they will confirm with the Rokid team.",
  ].join("\n");
}

export async function createRealtimeSession(
  input: CreateRealtimeSessionInput,
): Promise<RealtimeSessionCredential> {
  const instructions = buildRealtimeInstructions(input);
  const instructionsPreview = instructions.slice(0, 1200);
  const sessionId = `rt_session_${crypto.randomUUID()}`;
  const expiresAt = new Date(
    Date.now() + CLIENT_SECRET_TTL_SECONDS * 1000,
  ).toISOString();
  const relayConfig = getRealtimeRelayConfig();
  const model = relayConfig
    ? realtimeRelayProviderModel(relayConfig.provider)
    : process.env.OPENAI_REALTIME_MODEL ?? DEFAULT_REALTIME_MODEL;

  if (relayConfig && input.mockMode !== true) {
    const audioRates = realtimeRelayAudioRates(relayConfig.provider);

    return {
      transport: "websocket_relay",
      relayUrl: relayConfig.relayUrl,
      relayToken: createRealtimeRelayToken(
        {
          practiceSessionId: input.practiceSessionId,
          realtimeSessionId: sessionId,
          model,
          instructions,
        },
        {
          secret: relayConfig.sharedSecret,
          ttlSeconds: CLIENT_SECRET_TTL_SECONDS,
        },
      ),
      sessionId,
      expiresAt,
      model,
      ...audioRates,
      instructionsPreview,
    };
  }

  if (shouldUseMockMode(input)) {
    return {
      transport: "webrtc",
      clientSecret: `mock_realtime_client_secret_${crypto.randomUUID()}`,
      sessionId,
      expiresAt,
      model,
      instructionsPreview,
    };
  }

  const params = {
    expires_after: {
      anchor: "created_at",
      seconds: CLIENT_SECRET_TTL_SECONDS,
    },
    session: {
      type: "realtime",
      model,
      instructions,
      output_modalities: ["audio"],
      audio: {
        input: {
          transcription: {
            model: "gpt-4o-mini-transcribe",
            language: "en",
            prompt:
              "Expect English business meeting speech about Rokid smart glasses, real-time translation, overseas sales, pilots, deployment, security, ROI, and customer objections.",
          },
          turn_detection: {
            type: "server_vad",
            create_response: true,
            interrupt_response: true,
          },
        },
        output: {
          voice: "marin",
        },
      },
    },
  } satisfies ClientSecretCreateParams;

  const clientSecret = await getOpenAIClient().realtime.clientSecrets
    .create(params)
    .catch((error: unknown) => {
      logRealtimeProviderError(error);
      throw error;
    });

  return {
    transport: "webrtc",
    clientSecret: clientSecret.value,
    sessionId,
    expiresAt: new Date(clientSecret.expires_at * 1000).toISOString(),
    model,
    instructionsPreview,
  };
}
