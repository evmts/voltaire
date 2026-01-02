// @ts-check

export { decodeParameters } from "./decodeParameters.js";
export { decodeUint256, decodeValue } from "./decodeValue.js";
export { encodeParameters } from "./encodeParameters.js";
// Re-export all encoding/decoding functions from split files
export { encodeUint256, encodeValue } from "./encodeValue.js";
export { isDynamicType } from "./isDynamicType.js";

// Legacy exports that were internal utilities - keep for backwards compatibility
// These are now inlined in their respective files but we expose encodeUint256/decodeUint256

export { decodeParameters as DecodeParameters } from "./decodeParameters.js";
// Constructor-style aliases (data-first pattern)
export { encodeParameters as Parameters } from "./encodeParameters.js";
