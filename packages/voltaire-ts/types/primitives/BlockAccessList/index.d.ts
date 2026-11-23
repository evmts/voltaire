export type { AccountChanges, AccountChangesLike, BalanceChange, BlockAccessIndex, BlockAccessListLike, BlockAccessListType, CodeChange, NonceChange, SlotChanges, StorageChange, } from "./BlockAccessListType.js";
import type { HashType } from "../Hash/HashType.js";
import { assertValid as _assertValid } from "./assertValid.js";
import type { AccountChanges, BlockAccessListLike, BlockAccessListType } from "./BlockAccessListType.js";
import { calculateHash as _calculateHash } from "./calculateHash.js";
import { from as _from } from "./from.js";
import { fromRlp as _fromRlp } from "./fromRlp.js";
import { toRlp as _toRlp } from "./toRlp.js";
export { EMPTY_BLOCK_ACCESS_LIST_HASH, ITEM_COST, MAX_BLOCK_ACCESS_INDEX, } from "./constants.js";
export { InvalidBlockAccessListError } from "./errors.js";
export { _assertValid, _calculateHash, _from, _fromRlp, _toRlp };
/** Create a canonical EIP-7928 block access list; sorts, never merges. */
export declare function from(accounts: BlockAccessListLike): BlockAccessListType;
/** Decode strict canonical RLP, e.g. `ExecutionPayloadV4.blockAccessList`. */
export declare function fromRlp(data: Uint8Array): BlockAccessListType;
/** Assert every EIP-7928 rule that is checkable without the block. */
export declare function assertValid(list: readonly AccountChanges[]): asserts list is BlockAccessListType;
/** RLP-encode a block access list. */
export declare function toRlp(list: BlockAccessListType | BlockAccessListLike): Uint8Array<ArrayBufferLike>;
/** `keccak256(rlp(list))`, the header `blockAccessListHash`. */
export declare function calculateHash(list: BlockAccessListType | BlockAccessListLike): HashType;
export declare const BlockAccessList: {
    from: typeof from;
    fromRlp: typeof fromRlp;
    assertValid: typeof assertValid;
    toRlp: typeof toRlp;
    calculateHash: typeof calculateHash;
};
//# sourceMappingURL=index.d.ts.map