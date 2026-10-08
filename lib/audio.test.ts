import { describe, expect, it } from "vitest";
import { floatToInt16, int16ToBase64 } from "./audio";

describe("音声の下ごしらえ", () => {
  it("−1〜1 を、16bit に直す（はみ出しは切る）", () => {
    const r = floatToInt16(new Float32Array([0, 1, -1, 2, -2, 0.5]));
    expect(Array.from(r)).toEqual([0, 32767, -32768, 32767, -32768, 16383]);
  });
  it("base64 にして、元に戻せる", () => {
    const i16 = new Int16Array([1, -2, 300, -400]);
    const b64 = int16ToBase64(i16);
    const bin = Buffer.from(b64, "base64");
    expect(new Int16Array(bin.buffer, bin.byteOffset, bin.byteLength / 2).join(",")).toBe("1,-2,300,-400");
  });
});
