/** Largest uint64, the bound of every integer bid field. */
export const MAX_UINT64: bigint;
/**
 * EIP-7732 `BUILDER_INDEX_SELF_BUILD` (`UINT64_MAX`): the `builderIndex` of a
 * bid whose payload the proposer built itself.
 */
export const BUILDER_INDEX_SELF_BUILD: bigint;
/**
 * EIP-7732 `DOMAIN_BEACON_BUILDER`: BLS signature domain type for
 * `SignedExecutionPayloadBid`.
 */
export const DOMAIN_BEACON_BUILDER: "0x0B000000";
/** Length in bytes of a KZG commitment. */
export const KZG_COMMITMENT_SIZE: 48;
/** Length in bytes of a BLS12-381 signature. */
export const BLS_SIGNATURE_SIZE: 96;
//# sourceMappingURL=constants.d.ts.map