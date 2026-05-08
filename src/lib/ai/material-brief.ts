import { z } from "zod";

import { getOpenAIClient, hasOpenAIApiKey } from "@/lib/ai/openai-client";

const glossaryItemSchema = z.object({
  term: z.string().min(1),
  definition: z.string().min(1),
  chinese: z.string().optional(),
});

export const materialBriefSchema = z.object({
  keyMessage: z.string().min(1),
  productPoints: z.array(z.string().min(1)),
  customerValue: z.array(z.string().min(1)),
  likelyQuestions: z.array(z.string().min(1)),
  likelyObjections: z.array(z.string().min(1)),
  riskyClaims: z.array(z.string().min(1)),
  usefulPhrases: z.array(z.string().min(1)),
  glossary: z.array(glossaryItemSchema),
  outline: z.array(z.string().min(1)),
});

export type MaterialBriefPayload = z.infer<typeof materialBriefSchema>;

export type GenerateMaterialBriefInput = {
  materialName: string;
  extractedText: string;
  customerType?: string;
  industry?: string;
  meetingGoal?: string;
  notes?: string;
  mockMode?: boolean;
};

function shouldUseMockMode(input: GenerateMaterialBriefInput) {
  return (
    input.mockMode === true ||
    process.env.AI_MOCK_MODE === "true" ||
    process.env.NODE_ENV === "test" ||
    !hasOpenAIApiKey()
  );
}

function firstUsefulLine(text: string) {
  const line = text
    .split(/\n|(?<=\.)\s+/)
    .map((item) => item.trim())
    .find((item) => item.length > 0);

  return line ?? "Rokid helps customers communicate and access information more effectively during meetings.";
}

function generateMockMaterialBrief(
  input: GenerateMaterialBriefInput,
): MaterialBriefPayload {
  const materialSignal = firstUsefulLine(input.extractedText);
  const customerContext = [
    input.customerType,
    input.industry,
    input.meetingGoal,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    keyMessage: `${input.materialName}: ${materialSignal}`,
    productPoints: [
      "Real-time translated captions for multilingual conversations.",
      "Hands-free access to meeting information while staying engaged with the customer.",
      "AI-assisted meeting preparation based on customer materials.",
    ],
    customerValue: [
      "Reduce communication friction during overseas business meetings.",
      "Help customer-facing teams stay focused instead of switching between devices.",
      customerContext
        ? `Connect the demo to this customer context: ${customerContext}.`
        : "Clarify the customer's workflow before positioning the product.",
    ],
    likelyQuestions: [
      "How accurate is the translation in our meeting environment?",
      "How is meeting data handled?",
      "What does a successful pilot look like for our team?",
    ],
    likelyObjections: [
      "We can already use a phone translation app.",
      "Our IT team may have privacy concerns.",
      "We need proof that users will adopt this workflow.",
    ],
    riskyClaims: [
      "Do not invent accuracy percentages that are not in the source material.",
      "Do not promise compliance certifications without approved documentation.",
      "Do not claim the product replaces professional interpreters in high-stakes meetings.",
    ],
    usefulPhrases: [
      "Before we jump into the product, may I first understand your use case?",
      "The key value is reducing communication friction in real time.",
      "We can start with a small pilot before discussing a larger rollout.",
    ],
    glossary: [
      {
        term: "real-time translated captions",
        definition: "Live captions that help people follow multilingual conversations.",
        chinese: "实时翻译字幕",
      },
      {
        term: "hands-free access",
        definition: "Getting information without holding or looking down at another device.",
        chinese: "免手持获取信息",
      },
    ],
    outline: [
      "Open with customer workflow discovery.",
      "Position Rokid around the meeting problem, not only the hardware.",
      "Demo the material-relevant product points.",
      "Handle privacy, accuracy, and adoption objections.",
      "Close with a pilot success definition and next stakeholder.",
    ],
  };
}

function buildMaterialBriefPrompt(input: GenerateMaterialBriefInput) {
  return [
    "You are helping a Rokid overseas sales and solutions manager prepare for an English customer meeting.",
    "Create a concise Material Brief as strict JSON with these keys: keyMessage, productPoints, customerValue, likelyQuestions, likelyObjections, riskyClaims, usefulPhrases, glossary, outline.",
    "Do not invent product claims, pricing, accuracy numbers, certifications, or contract terms not provided in the source material.",
    `Material name: ${input.materialName}`,
    `Customer type: ${input.customerType ?? "unknown"}`,
    `Industry: ${input.industry ?? "unknown"}`,
    `Meeting goal: ${input.meetingGoal ?? "unknown"}`,
    `Notes: ${input.notes ?? "none"}`,
    "Source material:",
    input.extractedText.slice(0, 12000),
  ].join("\n\n");
}

export async function generateMaterialBrief(
  input: GenerateMaterialBriefInput,
): Promise<MaterialBriefPayload> {
  if (shouldUseMockMode(input)) {
    return generateMockMaterialBrief(input);
  }

  const response = await getOpenAIClient().responses.create({
    model: process.env.OPENAI_TEXT_MODEL ?? "gpt-5.4-mini",
    input: buildMaterialBriefPrompt(input),
  });

  const parsed = JSON.parse(response.output_text) as unknown;
  return materialBriefSchema.parse(parsed);
}
