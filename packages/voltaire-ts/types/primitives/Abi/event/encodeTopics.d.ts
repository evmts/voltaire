/**
 * Factory: Encode event arguments into topics array
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(str: string) => Uint8Array} deps.keccak256String - Keccak256 hash function for strings
 * @returns {(event: any, args: any) => (import('../../Hash/HashType.js').HashType | null)[]} Function that encodes event topics
 *
 * @example
 * ```typescript
 * import { EncodeTopics } from './primitives/Abi/event/index.js';
 * import { hash as keccak256, keccak256String } from './primitives/Hash/index.js';
 *
 * const encodeTopics = EncodeTopics({ keccak256, keccak256String });
 * const event = { type: "event", name: "Transfer", inputs: [...], anonymous: false };
 * const topics = encodeTopics(event, { from: "0x...", to: "0x..." });
 * // [selector, encodedFrom, encodedTo]
 * ```
 */
export function EncodeTopics({ keccak256, keccak256String }: {
    keccak256: (data: Uint8Array) => Uint8Array;
    keccak256String: (str: string) => Uint8Array;
}): (event: any, args: any) => (import("../../Hash/HashType.js").HashType | null)[];
//# sourceMappingURL=encodeTopics.d.ts.map