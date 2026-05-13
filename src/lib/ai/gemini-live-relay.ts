export const GEMINI_LIVE_INPUT_SAMPLE_RATE = 16_000;
export const GEMINI_LIVE_OUTPUT_SAMPLE_RATE = 24_000;
export const DEFAULT_GEMINI_LIVE_MODEL = "gemini-3.1-flash-live-preview";

type GeminiLiveSetupInput = {
  instructions: string;
  model?: string;
  voiceName?: string;
};

function normalizeGeminiLiveModel(model: string | undefined) {
  const usefulModel = model?.trim() || DEFAULT_GEMINI_LIVE_MODEL;

  return usefulModel.startsWith("models/") ? usefulModel : `models/${usefulModel}`;
}

export function buildGeminiLiveWebSocketURL(apiKey: string) {
  const url = new URL(
    "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent",
  );
  url.searchParams.set("key", apiKey);

  return url.toString();
}

export function buildGeminiLiveSetupMessage({
  instructions,
  model,
  voiceName = "Puck",
}: GeminiLiveSetupInput) {
  return {
    setup: {
      model: normalizeGeminiLiveModel(model),
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName,
            },
          },
        },
      },
      systemInstruction: {
        parts: [
          {
            text: instructions,
          },
        ],
      },
    },
  };
}

function extractInputText(event: Record<string, unknown>) {
  const item = event.item;

  if (!item || typeof item !== "object") {
    return "";
  }

  const content = (item as Record<string, unknown>).content;

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((part) => {
      if (!part || typeof part !== "object") {
        return "";
      }

      const text = (part as Record<string, unknown>).text;
      return typeof text === "string" ? text : "";
    })
    .filter(Boolean)
    .join("\n")
    .trim();
}

function extractResponseInstructions(event: Record<string, unknown>) {
  const response = event.response;

  if (!response || typeof response !== "object") {
    return "";
  }

  const instructions = (response as Record<string, unknown>).instructions;

  return typeof instructions === "string" ? instructions.trim() : "";
}

function textTurnMessage(text: string) {
  return {
    clientContent: {
      turns: [
        {
          role: "user",
          parts: [
            {
              text,
            },
          ],
        },
      ],
      turnComplete: true,
    },
  };
}

export function browserRealtimeEventToGeminiLiveMessages(
  event: Record<string, unknown>,
) {
  if (event.type === "input_audio_buffer.append" && typeof event.audio === "string") {
    return [
      {
        realtimeInput: {
          mediaChunks: [
            {
              mimeType: `audio/pcm;rate=${GEMINI_LIVE_INPUT_SAMPLE_RATE}`,
              data: event.audio,
            },
          ],
        },
      },
    ];
  }

  if (event.type === "conversation.item.create") {
    const text = extractInputText(event);

    return text ? [textTurnMessage(text)] : [];
  }

  if (event.type === "response.create") {
    const instructions = extractResponseInstructions(event);

    return instructions ? [textTurnMessage(instructions)] : [];
  }

  return [];
}

export function geminiLiveMessageToBrowserRealtimeEvents(
  message: Record<string, unknown>,
) {
  const browserEvents: Array<Record<string, unknown>> = [];
  const error = message.error;

  if (error && typeof error === "object") {
    browserEvents.push({
      type: "error",
      error,
    });
    return browserEvents;
  }

  const serverContent = message.serverContent;

  if (!serverContent || typeof serverContent !== "object") {
    return browserEvents;
  }

  const modelTurn = (serverContent as Record<string, unknown>).modelTurn;

  if (modelTurn && typeof modelTurn === "object") {
    const parts = (modelTurn as Record<string, unknown>).parts;

    if (Array.isArray(parts)) {
      for (const part of parts) {
        if (!part || typeof part !== "object") {
          continue;
        }

        const text = (part as Record<string, unknown>).text;
        const inlineData = (part as Record<string, unknown>).inlineData;

        if (typeof text === "string" && text.trim()) {
          browserEvents.push({
            type: "response.text.done",
            text: text.trim(),
          });
        }

        if (inlineData && typeof inlineData === "object") {
          const data = (inlineData as Record<string, unknown>).data;
          const mimeType = (inlineData as Record<string, unknown>).mimeType;

          if (
            typeof data === "string" &&
            typeof mimeType === "string" &&
            mimeType.startsWith("audio/pcm")
          ) {
            browserEvents.push({
              type: "response.audio.delta",
              delta: data,
            });
          }
        }
      }
    }
  }

  if ((serverContent as Record<string, unknown>).turnComplete === true) {
    browserEvents.push({
      type: "response.done",
    });
  }

  return browserEvents;
}
