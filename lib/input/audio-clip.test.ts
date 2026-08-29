import { describe, expect, it } from "vitest";
import { extractSelectionAsWav, type AudioBufferLike } from "./audio-clip";

function generatedBuffer(durationSeconds = 10, sampleRate = 1_000): AudioBufferLike {
  const samples = Float32Array.from({ length: durationSeconds * sampleRate }, (_, index) => {
    const second = Math.floor(index / sampleRate);
    return second < 5 ? 0.25 : -0.5;
  });
  return {
    sampleRate,
    numberOfChannels: 1,
    length: samples.length,
    getChannelData: () => samples,
  };
}

describe("selected audio WAV extraction", () => {
  it("encodes only the exact selected frames with a valid PCM WAV header", async () => {
    const source = generatedBuffer();
    const clip = extractSelectionAsWav(source, 5_000, 7_000);
    const view = new DataView(await clip.arrayBuffer());
    const ascii = (offset: number, length: number) =>
      String.fromCharCode(...Array.from({ length }, (_, index) => view.getUint8(offset + index)));

    expect(clip.type).toBe("audio/wav");
    expect(ascii(0, 4)).toBe("RIFF");
    expect(ascii(8, 4)).toBe("WAVE");
    expect(view.getUint32(24, true)).toBe(1_000);
    expect(view.getUint32(40, true)).toBe(4_000);
    expect(view.byteLength).toBe(4_044);
    expect(view.byteLength).toBeLessThan(44 + source.length * 2);
    expect(view.getInt16(44, true)).toBeLessThan(-16_000);
  });

  it("rejects empty, inverted, out-of-source and over-30-second selections", () => {
    const source = generatedBuffer(40);
    expect(() => extractSelectionAsWav(source, 1_000, 1_000)).toThrow();
    expect(() => extractSelectionAsWav(source, 2_000, 1_000)).toThrow();
    expect(() => extractSelectionAsWav(source, 41_000, 42_000)).toThrow();
    expect(() => extractSelectionAsWav(source, 0, 30_001)).toThrow();
  });
});
