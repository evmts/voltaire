import type { BlockNumberType } from "../BlockNumber/BlockNumberType.js";
/**
 * EIP-2124 Fork Identifier
 * Used in DevP2P for fork detection and network validation
 *
 * @see https://eips.ethereum.org/EIPS/eip-2124
 */
export type ForkIdType = {
    /**
     * CRC32 checksum of all fork hashes up to this point (4 bytes)
     */
    readonly hash: Uint8Array;
    /**
     * Block number of next upcoming fork (0 if no known forks)
     */
    readonly next: BlockNumberType;
};
//# sourceMappingURL=ForkIdType.d.ts.map