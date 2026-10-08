/**
 * 音声の下ごしらえ。ブラウザで録った音を、16kHz・モノラル・16bit の生データにして送る。
 * （ブラウザごとに録音の形式が違う〔Chrome は webm、Safari は mp4〕ため、形式をそろえる。）
 * 音声は、文字に直す間だけメモリにあり、保存しない。
 */
export function floatToInt16(f: Float32Array): Int16Array {
  const out = new Int16Array(f.length);
  for (let i = 0; i < f.length; i++) {
    const v = Math.max(-1, Math.min(1, f[i]));
    out[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
  }
  return out;
}

export function int16ToBase64(i16: Int16Array): string {
  const bytes = new Uint8Array(i16.buffer, i16.byteOffset, i16.byteLength);
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

export const STT_SAMPLE_RATE = 16000;
export const STT_MAX_SECONDS = 55;

export async function blobTo16kPcmBase64(blob: Blob): Promise<{ base64: string; seconds: number }> {
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AC();
  try {
    const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
    const frames = Math.max(1, Math.ceil(decoded.duration * STT_SAMPLE_RATE));
    const off = new OfflineAudioContext(1, frames, STT_SAMPLE_RATE);
    const src = off.createBufferSource();
    src.buffer = decoded;
    src.connect(off.destination);
    src.start();
    const rendered = await off.startRendering();
    return { base64: int16ToBase64(floatToInt16(rendered.getChannelData(0))), seconds: decoded.duration };
  } finally {
    void ctx.close();
  }
}
