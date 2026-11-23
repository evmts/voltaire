/** Largest EIP-7928 `BlockAccessIndex` (uint32). */
export const MAX_BLOCK_ACCESS_INDEX: 4294967295;
/** Largest uint64, the EIP-7928 `Nonce` bound. */
export const MAX_UINT64: bigint;
/** Largest uint256, the EIP-7928 storage key, storage value, and balance bound. */
export const MAX_UINT256: bigint;
/**
 * EIP-7928 `ITEM_COST`: a block access list is valid only when
 * `addresses + storage_keys <= block_gas_limit / ITEM_COST`.
 */
export const ITEM_COST: 2000n;
/**
 * `keccak256(rlp.encode([]))`: the `blockAccessListHash` of an empty list.
 */
export const EMPTY_BLOCK_ACCESS_LIST_HASH: "0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347";
//# sourceMappingURL=constants.d.ts.map