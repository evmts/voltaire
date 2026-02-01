/**
 * SSZ (Simple Serialize) - Ethereum consensus layer serialization
 *
 * @module Ssz
 *
 * @example
 * ```typescript
 * import * as Ssz from './primitives/Ssz/index.js';
 *
 * // Encode basic types
 * const encoded = Ssz.encodeBasic(42, 'uint32');
 *
 * // Decode basic types
 * const decoded = Ssz.decodeBasic(encoded, 'uint32');
 *
 * // Compute hash tree root
 * const root = await Ssz.hashTreeRoot(data);
 * ```
 */
export { decodeBasic, encodeBasic } from "./encodeBasic.js";
export { hashTreeRoot } from "./hashTreeRoot.js";
