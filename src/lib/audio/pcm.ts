const DEFAULT_REALTIME_SAMPLE_RATE = 24_000;

type PCMConversionOptions = {
  inputSampleRate?: number;
  outputSampleRate?: number;
};

function resampleFloat32Audio(
  samples: Float32Array,
  inputSampleRate: number,
  outputSampleRate: number,
) {
  if (inputSampleRate === outputSampleRate) {
    return samples;
  }

  const ratio = inputSampleRate / outputSampleRate;
  const outputLength = Math.floor(samples.length / ratio);
  const output = new Float32Array(outputLength);

  for (let index = 0; index < outputLength; index += 1) {
    output[index] = samples[Math.floor(index * ratio)] ?? 0;
  }

  return output;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function base64ToBytes(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

export function float32ToPCM16(
  samples: Float32Array,
  options: PCMConversionOptions = {},
) {
  const inputSampleRate =
    options.inputSampleRate ?? DEFAULT_REALTIME_SAMPLE_RATE;
  const outputSampleRate =
    options.outputSampleRate ?? DEFAULT_REALTIME_SAMPLE_RATE;
  const resampledSamples = resampleFloat32Audio(
    samples,
    inputSampleRate,
    outputSampleRate,
  );
  const pcm = new Int16Array(resampledSamples.length);

  for (let index = 0; index < resampledSamples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, resampledSamples[index] ?? 0));
    pcm[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }

  return pcm;
}

export function encodeFloat32AudioToPCM16Base64(
  samples: Float32Array,
  options: PCMConversionOptions = {},
) {
  const pcm = float32ToPCM16(samples, options);
  const bytes = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength);

  return bytesToBase64(bytes);
}

export function decodePCM16Base64ToFloat32(base64: string) {
  const bytes = base64ToBytes(base64);
  const pcm = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
  const samples = new Float32Array(pcm.length);

  for (let index = 0; index < pcm.length; index += 1) {
    samples[index] = (pcm[index] ?? 0) / 0x8000;
  }

  return samples;
}
