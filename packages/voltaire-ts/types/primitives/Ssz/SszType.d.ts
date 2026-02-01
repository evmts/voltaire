/**
 * SSZ (Simple Serialize) encoding
 *
 * Type-safe SSZ encoding for Ethereum consensus layer types.
 * Implements the Simple Serialize specification from consensus-specs.
 *
 * @see https://github.com/ethereum/consensus-specs/blob/dev/ssz/simple-serialize.md
 */
/**
 * SSZ encoded data
 */
export type SszType = Uint8Array & {
    readonly __tag: "Ssz";
};
//# sourceMappingURL=SszType.d.ts.map