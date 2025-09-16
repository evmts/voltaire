export type Word = bigint;
export const MASK_256 = (1n << 256n) - 1n;
export const U256 = 256n;

export function u256(v: bigint): Word {
  return v & MASK_256;
}

export function toSigned(w: Word): bigint {
  const sign = 1n << 255n;
  return (w & sign) !== 0n ? -((~w & MASK_256) + 1n) : w;
}

export function fromSigned(s: bigint): Word {
  return u256(s < 0n ? (~(-s) + 1n) : s);
}

export function wordToBytes32(w: Word): Uint8Array {
  const out = new Uint8Array(32);
  let v = w & MASK_256;
  for (let i = 31; i >= 0; i--) {
    out[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return out;
}

export function bytesToWord(bytes: Uint8Array, offset: number = 0, length: number = bytes.length - offset): Word {
  let word = 0n;
  const end = Math.min(offset + length, bytes.length);
  for (let i = offset; i < end; i++) {
    word = (word << 8n) | BigInt(bytes[i]);
  }
  return word;
}