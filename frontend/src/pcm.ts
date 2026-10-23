export function encodePcm(samples: Float32Array, rate: number) {
  const ratio = rate / 16000;
  const count = Math.floor(samples.length / ratio);
  const bytes = new Uint8Array(count * 2);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < count; i++) {
    const start = Math.floor(i * ratio),
      end = Math.min(samples.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let j = start; j < end; j++) sum += samples[j];
    const value = Math.max(-1, Math.min(1, sum / Math.max(1, end - start)));
    view.setInt16(i * 2, Math.round(value * (value < 0 ? 32768 : 32767)), true);
  }
  let binary = "";
  for (let i = 0; i < bytes.length; i += 16000)
    binary += String.fromCharCode(...bytes.subarray(i, i + 16000));
  return btoa(binary);
}
