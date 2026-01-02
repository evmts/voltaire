// @ts-check

// Re-export all encoding/decoding functions from split files
export { encodeValue, encodeUint256 } from "./encodeValue.js";
export { decodeValue, decodeUint256 } from "./decodeValue.js";
export { encodeParameters } from "./encodeParameters.js";
export { decodeParameters } from "./decodeParameters.js";
export { isDynamicType } from "./isDynamicType.js";

// Legacy exports that were internal utilities - keep for backwards compatibility
// These are now inlined in their respective files but we expose encodeUint256/decodeUint256

// Constructor-style aliases (data-first pattern)
export { encodeParameters as Parameters } from "./encodeParameters.js";
export { decodeParameters as DecodeParameters } from "./decodeParameters.js";
