import { describe, expect, it } from "vitest";

import {
  browserRealtimeEventToGeminiLiveMessages,
  buildGeminiLiveSetupMessage,
  buildGeminiLiveWebSocketURL,
  geminiLiveMessageToBrowserRealtimeEvents,
} from "@/lib/ai/gemini-live-relay";

describe("Gemini Live relay helpers", () => {
  it("builds Gemini Live websocket URLs without exposing the key elsewhere", () => {
    expect(buildGeminiLiveWebSocketURL("gemini-secret")).toBe(
      "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=gemini-secret",
    );
  });

  it("builds a Gemini Live audio setup message", () => {
    expect(
      buildGeminiLiveSetupMessage({
        instructions: "Act as a customer.",
        model: "gemini-3.1-flash-live-preview",
      }),
    ).toMatchObject({
      setup: {
        model: "models/gemini-3.1-flash-live-preview",
        generationConfig: {
          responseModalities: ["AUDIO"],
        },
        systemInstruction: {
          parts: [{ text: "Act as a customer." }],
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
    });
  });

  it("builds Gemini Live setup with the selected AI Studio voice", () => {
    expect(
      buildGeminiLiveSetupMessage({
        instructions: "Act as a customer.",
        model: "gemini-3.1-flash-live-preview",
        voiceName: "Kore",
      }),
    ).toMatchObject({
      setup: {
        generationConfig: {
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Kore",
              },
            },
          },
        },
      },
    });
  });

  it("translates browser PCM chunks into Gemini realtime input", () => {
    expect(
      browserRealtimeEventToGeminiLiveMessages({
        type: "input_audio_buffer.append",
        audio: "base64-audio",
      }),
    ).toEqual([
      {
        realtimeInput: {
          audio: {
            mimeType: "audio/pcm;rate=16000",
            data: "base64-audio",
          },
        },
      },
    ]);
  });

  it("translates browser audio end markers into Gemini realtime input", () => {
    expect(
      browserRealtimeEventToGeminiLiveMessages({
        type: "input_audio_buffer.end",
      }),
    ).toEqual([
      {
        realtimeInput: {
          audioStreamEnd: true,
        },
      },
    ]);
  });

  it("translates Gemini audio responses into browser realtime events", () => {
    expect(
      geminiLiveMessageToBrowserRealtimeEvents({
        serverContent: {
          modelTurn: {
            parts: [
              {
                inlineData: {
                  mimeType: "audio/pcm;rate=24000",
                  data: "base64-output",
                },
              },
            ],
          },
          turnComplete: true,
        },
      }),
    ).toEqual([
      {
        type: "response.audio.delta",
        delta: "base64-output",
      },
      {
        type: "response.done",
      },
    ]);
  });

  it("translates Gemini input and output transcripts into browser realtime events", () => {
    expect(
      geminiLiveMessageToBrowserRealtimeEvents({
        serverContent: {
          inputTranscription: {
            text: "We need remote support.",
          },
          outputTranscription: {
            text: "What systems do you need to integrate with?",
          },
        },
      }),
    ).toEqual([
      {
        type: "conversation.item.input_audio_transcription.completed",
        transcript: "We need remote support.",
      },
      {
        type: "response.audio_transcript.delta",
        delta: "What systems do you need to integrate with?",
      },
    ]);
  });
});
