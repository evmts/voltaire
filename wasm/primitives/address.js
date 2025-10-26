/**
 * WASM Address wrapper powered by loader.js
 * Auto-loads the local primitives.wasm at import time.
 */
import {
  loadWasm,
  addressFromHex as _fromHex,
  addressToHex as _toHex,
  addressToChecksumHex as _toChecksumHex,
  addressIsZero as _isZero,
  addressEquals as _equals,
  calculateCreateAddress as _calculateCreate,
  calculateCreate2Address as _calculateCreate2,
} from "../loader.js";

await loadWasm(new URL("../primitives.wasm", import.meta.url));

export const fromHex = _fromHex;
export const toHex = _toHex;
export const toChecksumHex = _toChecksumHex;
export const isZero = _isZero;
export const equals = _equals;
export const calculateCreateAddress = _calculateCreate;
export const calculateCreate2Address = _calculateCreate2;

export default {
  fromHex,
  toHex,
  toChecksumHex,
  isZero,
  equals,
  calculateCreateAddress,
  calculateCreate2Address,
};
