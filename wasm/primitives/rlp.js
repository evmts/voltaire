/**
 * WASM RLP wrapper powered by loader.js
 * Auto-loads the local primitives.wasm at import time.
 */
import { loadWasm, rlpEncodeBytes as _encode, rlpEncodeUint as _encodeUint, rlpToHex as _toHex, rlpFromHex as _fromHex } from "../loader.js";

await loadWasm(new URL("../primitives.wasm", import.meta.url));

export const encode = _encode;
export const encodeUint = _encodeUint;
export const toHex = _toHex;
export const fromHex = _fromHex;
