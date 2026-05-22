type BuildOpenAIRealtimeSessionUpdateInput = {
  instructions: string;
  voiceName?: string;
};

const DEFAULT_OPENAI_RELAY_VOICE = "marin";

function normalizeVoiceName(voiceName?: string) {
  const normalizedVoiceName = voiceName?.trim();

  return normalizedVoiceName || DEFAULT_OPENAI_RELAY_VOICE;
}

export function buildOpenAIRealtimeSessionUpdate({
  instructions,
  voiceName,
}: BuildOpenAIRealtimeSessionUpdateInput) {
  return {
    type: "session.update",
    session: {
      modalities: ["audio", "text"],
      instructions,
      voice: normalizeVoiceName(voiceName),
      input_audio_format: "pcm16",
      output_audio_format: "pcm16",
      input_audio_transcription: {
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
  };
}
