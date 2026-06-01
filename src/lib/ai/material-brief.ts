import {
  TEXT_ANALYSIS_BOUNDARY,
  generateTextJSON,
  hasTextAIApiKey,
} from "@/lib/ai/text-client";
import { materialBriefSchema } from "@/lib/validation/materials";
import type { MaterialBriefPayload } from "@/lib/validation/materials";

export type { MaterialBriefPayload } from "@/lib/validation/materials";

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
    !hasTextAIApiKey()
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
    applicationScenarios: [
      "Multilingual customer meetings where participants need live captions without switching devices.",
      "Overseas product demos where the seller needs to stay visually engaged with the customer.",
      "Pilot workshops that need to test translation, workflow fit, and user adoption in one session.",
    ],
    pros: [
      "Keeps the seller hands-free and visually present during the conversation.",
      "Connects meeting preparation, live captions, and follow-up practice in one workflow.",
      "Makes language support feel embedded in the meeting instead of handled on a separate phone.",
    ],
    cons: [
      "The exact translation quality depends on the meeting environment and supported language pair.",
      "Privacy, data handling, and IT review still need customer-specific confirmation.",
      "It should be positioned as a pilotable workflow improvement, not a guaranteed replacement for every interpreter scenario.",
    ],
    competitorDifferences: [
      "Compared with phone translation apps, Rokid keeps the user's eyes and hands in the meeting.",
      "Compared with standard meeting software captions, Rokid is designed for wearable, in-person, hands-free scenarios.",
      "Compared with generic smart glasses, the value story should focus on overseas meeting communication and workflow fit.",
    ],
    productParameters: [
      "Live translated captions are the main capability referenced by this material.",
      "Pilot setup should define users, meeting environments, language pairs, and success metrics.",
      "Do not state unverified accuracy, latency, certification, battery, pricing, or deployment numbers.",
    ],
    memoryStatus: "session_only",
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
    TEXT_ANALYSIS_BOUNDARY,
    "Create a concise Material Brief as strict JSON with these keys: keyMessage, productPoints, customerValue, likelyQuestions, applicationScenarios, pros, cons, competitorDifferences, productParameters, memoryStatus, likelyObjections, riskyClaims, usefulPhrases, glossary, outline.",
    "Extract product application scenarios, product advantages, product disadvantages or fit boundaries, differences versus other products or alternatives, detailed product parameters, and likely follow-up questions from customers.",
    "For memoryStatus, use one of: session_only, available_for_future, saved_to_memory, confidential. Default to session_only unless the material is clearly confidential.",
    "Use Chinese business categories mentally, but write concise English content suitable for sales preparation.",
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

  const parsed = await generateTextJSON({
    prompt: buildMaterialBriefPrompt(input),
    schemaName: "material brief",
  });

  return materialBriefSchema.parse(parsed);
}
