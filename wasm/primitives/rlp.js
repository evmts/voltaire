/**
 * WASM RLP wrapper powered by loader.js
 * Auto-loads the local primitives.wasm at import time.
 */
import { loadWasm, rlpEncodeBytes as _encode, rlpEncodeUint as _encodeUint, rlpToHex as _toHex, rlpFromHex as _fromHex, hexToBytes as _hexToBytes } from "../loader.js";

await loadWasm(new URL("../primitives.wasm", import.meta.url));

// Convenience wrapper: encode strings/numbers/bytes using RLP
export function encode(value) {
  if (typeof value === "string") {
    const bytes = _hexToBytes(value);
    return _encode(bytes);
  }
  if (typeof value === "number" || typeof value === "bigint") {
    const u256 = bigIntToU256Bytes(BigInt(value));
    return _encodeUint(u256);
  }
  if (value instanceof Uint8Array) {
    return _encode(value);
  }
  if (Array.isArray(value)) {
    return encodeList(value);
  }
  throw new Error("Unsupported type for RLP encode");
}

export function encodeUint(value) {
  const u256 = bigIntToU256Bytes(BigInt(value));
  return _encodeUint(u256);
}

export const toHex = _toHex;
export const fromHex = _fromHex;

export function encodeList(values) {
  // Encode each element individually
  const encodedItems = values.map((v) => encode(v));
  const payloadLen = encodedItems.reduce((sum, item) => sum + item.length, 0);
  const header = rlpListHeader(payloadLen);
  const out = new Uint8Array(header.length + payloadLen);
  out.set(header, 0);
  let offset = header.length;
  for (const item of encodedItems) {
    out.set(item, offset);
    offset += item.length;
  }
  return out;
}

function rlpListHeader(len) {
  if (len <= 55) {
    return new Uint8Array([0xc0 + len]);
  }
  // long list
  const lenBytes = intToBytes(len);
  const header = new Uint8Array(1 + lenBytes.length);
  header[0] = 0xf7 + lenBytes.length;
  header.set(lenBytes, 1);
  return header;
}

function intToBytes(n) {
  // minimal big-endian bytes for positive integer n
  if (n === 0) return new Uint8Array([0]);
  const bytes = [];
  while (n > 0) {
    bytes.push(Number(n & 0xffn));
    n >>= 8n;
  }
  bytes.reverse();
  return new Uint8Array(bytes);
}

function bigIntToU256Bytes(n) {
  if (n < 0n) throw new Error("Negative integers not supported in RLP");
  const bytes = new Uint8Array(32);
  let i = 31;
  while (n > 0n && i >= 0) {
    bytes[i] = Number(n & 0xffn);
    n >>= 8n;
    i--;
  }
  return bytes;
}
