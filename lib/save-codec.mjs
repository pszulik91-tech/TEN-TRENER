// Read legacy JSON; write compact whole-world saves without dropping simulation data.
const PREFIX = 'TTGZ1:';
export async function encodeSave(value) {
  const raw = JSON.stringify(value);
  if (typeof CompressionStream === 'undefined') return raw;
  const stream = new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return PREFIX + btoa(binary);
}
export async function decodeSave(raw) {
  if (!raw.startsWith(PREFIX)) return JSON.parse(raw);
  const bytes = Uint8Array.from(atob(raw.slice(PREFIX.length)), c => c.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  const text = await new Response(stream).text();
  if (text.length > 30_000_000) throw new Error('Zapis jest zbyt duży.');
  return JSON.parse(text);
}
