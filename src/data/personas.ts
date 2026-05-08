export type PersonaId =
  | "distributor"
  | "enterprise_buyer"
  | "technical_lead"
  | "procurement_manager"
  | "skeptical_executive"
  | "end_user_manager";

export type CustomerPersona = {
  id: PersonaId;
  name: string;
  focusAreas: string[];
  tone: string;
  sampleQuestions: string[];
};

export const personas: CustomerPersona[] = [
  {
    id: "distributor",
    name: "Distributor",
    focusAreas: ["channel margin", "regional demand", "sales support", "after-sales support", "training"],
    tone: "Practical and commercially focused.",
    sampleQuestions: [
      "What kind of sales support can Rokid provide for a new distributor?",
      "How would this product fit into our current channel portfolio?",
    ],
  },
  {
    id: "enterprise_buyer",
    name: "Enterprise Buyer",
    focusAreas: ["ROI", "pilot value", "procurement process", "deployment cost", "business outcomes"],
    tone: "Cautious and outcome-oriented.",
    sampleQuestions: [
      "What business problem does this solve for our team?",
      "What would a successful pilot look like?",
    ],
  },
  {
    id: "technical_lead",
    name: "Technical Lead",
    focusAreas: ["security", "integration", "stability", "device constraints", "workflow fit"],
    tone: "Detail-oriented and technically skeptical.",
    sampleQuestions: [
      "How does this fit into our current workflow?",
      "What technical requirements should we prepare for?",
    ],
  },
  {
    id: "procurement_manager",
    name: "Procurement Manager",
    focusAreas: ["pricing", "delivery timeline", "contract terms", "supply risk", "vendor reliability"],
    tone: "Cost-conscious and negotiation-driven.",
    sampleQuestions: [
      "Why should we invest now instead of waiting?",
      "Can you explain the expected pilot cost structure?",
    ],
  },
  {
    id: "skeptical_executive",
    name: "Skeptical Executive",
    focusAreas: ["business value", "differentiation", "time efficiency", "strategic fit", "next step"],
    tone: "Direct, impatient, and business-first.",
    sampleQuestions: [
      "I understand the feature, but why should this matter to our business?",
      "What makes Rokid different enough for us to spend time on this?",
    ],
  },
  {
    id: "end_user_manager",
    name: "End User Manager",
    focusAreas: ["daily usability", "training effort", "comfort", "adoption", "team experience"],
    tone: "Scenario-based and user-experience focused.",
    sampleQuestions: [
      "Will my team actually use this in daily meetings?",
      "How much training would our users need?",
    ],
  },
];
