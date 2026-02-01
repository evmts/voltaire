import * as BlockNumber from "../BlockNumber/index.js";
/**
 * Create ForkId from hash and next block number
 *
 * @param {{ hash: Uint8Array | string | number, next: bigint | number | string }} value - Fork ID components
 * @returns {import('./ForkIdType.js').ForkIdType} ForkId
 *
 * @example
 * ```typescript
 * const forkId = ForkId.from({
 *   hash: new Uint8Array([0xfc, 0x64, 0xec, 0x04]),
 *   next: 1920000n,
 * });
 * ```
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: complex logic required
export function from(value) {
    if (!value || typeof value !== "object") {
        throw new Error("ForkId must be an object with hash and next properties");
    }
    if (!value.hash) {
        throw new Error("ForkId.hash is required");
    }
    if (value.next === undefined || value.next === null) {
        throw new Error("ForkId.next is required");
    }
    // Normalize hash to 4-byte Uint8Array
    let hash;
    if (value.hash instanceof Uint8Array) {
        if (value.hash.length !== 4) {
            throw new Error("ForkId.hash must be exactly 4 bytes");
        }
        hash = value.hash;
    }
    else if (typeof value.hash === "string") {
        // Parse hex string
        const hex = value.hash.startsWith("0x") ? value.hash.slice(2) : value.hash;
        if (hex.length !== 8) {
            throw new Error("ForkId.hash hex string must be 4 bytes (8 hex chars)");
        }
        hash = new Uint8Array(4);
        for (let i = 0; i < 4; i++) {
            hash[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
        }
    }
    else if (typeof value.hash === "number") {
        // Convert number to 4-byte big-endian
        hash = new Uint8Array(4);
        hash[0] = (value.hash >>> 24) & 0xff;
        hash[1] = (value.hash >>> 16) & 0xff;
        hash[2] = (value.hash >>> 8) & 0xff;
        hash[3] = value.hash & 0xff;
    }
    else {
        throw new Error("ForkId.hash must be Uint8Array, string, or number");
    }
    // Normalize next to BlockNumber
    const next = BlockNumber.from(/** @type {number | bigint} */ (value.next));
    return /** @type {import('./ForkIdType.js').ForkIdType} */ ({
        hash,
        next,
    });
}
