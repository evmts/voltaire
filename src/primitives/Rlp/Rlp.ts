/**
 * RLP (Recursive Length Prefix) Type Definitions
 */

// Re-export types
export type { BrandedRlp } from "./BrandedRlp.js";

// For backwards compatibility, export BrandedRlp as main type
export type { BrandedRlp as Rlp } from "./BrandedRlp.js";

// Re-export other types
export type { Decoded } from "./decode.js";
export type { Encodable } from "./encode.js";

// Legacy type exports
export type RlpDataType = BrandedRlp;
export type Data = BrandedRlp;
export type RlpData = BrandedRlp;
export type RlpDecoded = Decoded;
export type RlpEncodable = Encodable;

import type { BrandedRlp } from "./BrandedRlp.js";
import type { Decoded } from "./decode.js";
import type { Encodable } from "./encode.js";
