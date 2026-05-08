import { describe, expect, it } from "vitest";

import {
  decodePCM16Base64ToFloat32,
  encodeFloat32AudioToPCM16Base64,
  float32ToPCM16,
} from "@/lib/audio/pcm";

describe("PCM audio helpers", () => {
  it("converts float samples into signed 16-bit PCM", () => {
    expect(
      Array.from(float32ToPCM16(new Float32Array([-1, -0.5, 0, 0.5, 1]))),
    ).toEqual([-32768, -16384, 0, 16383, 32767]);
  });

  it("encodes and decodes PCM16 base64 audio chunks", () => {
    const encoded = encodeFloat32AudioToPCM16Base64(
      new Float32Array([-1, 0, 1]),
      {
        inputSampleRate: 24_000,
        outputSampleRate: 24_000,
      },
    );
    const decoded = decodePCM16Base64ToFloat32(encoded);

    expect(Array.from(decoded)).toEqual([-1, 0, 32767 / 32768]);
  });

  it("downsamples audio by sample-rate ratio before encoding", () => {
    const pcm = float32ToPCM16(new Float32Array([0.1, 0.2, 0.3, 0.4]), {
      inputSampleRate: 48_000,
      outputSampleRate: 24_000,
    });

    expect(Array.from(pcm)).toEqual([3276, 9830]);
  });
});
