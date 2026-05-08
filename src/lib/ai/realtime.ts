import type { CustomerPersona } from "@/data/personas";
import type { MaterialBriefPayload } from "@/lib/ai/material-brief";
import { getOpenAIClient, hasOpenAIApiKey } from "@/lib/ai/openai-client";
import type { PrepCardPayload } from "@/lib/ai/prep-card";
import type { CreatePracticeSessionInput } from "@/lib/validation/practice";
import type { ClientSecretCreateParams } from "openai/resources/realtime/client-secrets";

export type BuildRealtimeInstructionsInput = {
  mode: CreatePracticeSessionInput["mode"];
  persona: CustomerPersona;
  materialBrief?: MaterialBriefPayload | null;
  prepCard?: PrepCardPayload | null;
  trainingFocus?: string[];
};

export type CreateRealtimeSessionInput = BuildRealtimeInstructionsInput & {
  practiceSessionId: string;
  mockMode?: boolean;
};

export type RealtimeSessionCredential = {
  clientSecret: string;
  sessionId: string;
  expiresAt: string;
  model: string;
  instructionsPreview: string;
};

const DEFAULT_REALTIME_MODEL = "gpt-realtime-mini";
const CLIENT_SECRET_TTL_SECONDS = 600;

function shouldUseMockMode(input: Pick<CreateRealtimeSessionInput, "mockMode">) {
  return (
    input.mockMode === true ||
    process.env.AI_MOCK_MODE === "true" ||
    process.env.NODE_ENV === "test" ||
    !hasOpenAIApiKey()
  );
}

function formatList(title: string, items?: string[] | null) {
  const usefulItems = (items ?? []).filter(Boolean);

  if (usefulItems.length === 0) {
    return `${title}: none provided.`;
  }

  return [`${title}:`, ...usefulItems.map((item) => `- ${item}`)].join("\n");
}

export function buildRealtimeInstructions(input: BuildRealtimeInstructionsInput) {
  const materialBrief = input.materialBrief;
  const prepCard = input.prepCard;

  return [
    "You are an overseas customer meeting simulator and English speaking coach for a Rokid overseas sales and solution professional.",
    "Run a realistic English business conversation. Act as the customer first, then give concise learning support only when the learner asks for it or when a live support cue is used.",
    "",
    `Practice mode: ${input.mode}`,
    `Customer persona: ${input.persona.name}`,
    `Customer tone: ${input.persona.tone}`,
    formatList("Customer focus areas", input.persona.focusAreas),
    formatList("Sample customer questions", input.persona.sampleQuestions),
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
  const model = process.env.OPENAI_REALTIME_MODEL ?? DEFAULT_REALTIME_MODEL;
  const instructions = buildRealtimeInstructions(input);
  const instructionsPreview = instructions.slice(0, 1200);

  if (shouldUseMockMode(input)) {
    return {
      clientSecret: `mock_realtime_client_secret_${crypto.randomUUID()}`,
      sessionId: `rt_session_${crypto.randomUUID()}`,
      expiresAt: new Date(
        Date.now() + CLIENT_SECRET_TTL_SECONDS * 1000,
      ).toISOString(),
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

  const clientSecret = await getOpenAIClient().realtime.clientSecrets.create(
    params,
  );

  return {
    clientSecret: clientSecret.value,
    sessionId: `rt_session_${crypto.randomUUID()}`,
    expiresAt: new Date(clientSecret.expires_at * 1000).toISOString(),
    model,
    instructionsPreview,
  };
}
