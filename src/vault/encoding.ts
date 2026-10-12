export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

export function isDataUrl(value: string | undefined): value is string {
  return !!value && value.startsWith('data:');
}

/** Splits `data:<mime>;base64,<payload>` into its MIME type and raw bytes. */
export function dataUrlToBytes(dataUrl: string): { mimeType: string; bytes: Uint8Array } {
  const comma = dataUrl.indexOf(',');
  const header = dataUrl.slice(5, comma); // strip leading "data:"
  const payload = dataUrl.slice(comma + 1);
  const isBase64 = header.endsWith(';base64');
  const mimeType = (isBase64 ? header.slice(0, -7) : header).split(';')[0] || 'application/octet-stream';
  const bytes = isBase64 ? base64ToBytes(payload) : new TextEncoder().encode(decodeURIComponent(payload));
  return { mimeType, bytes };
}

export function bytesToDataUrl(bytes: Uint8Array, mimeType: string): string {
  return `data:${mimeType};base64,${bytesToBase64(bytes)}`;
}
