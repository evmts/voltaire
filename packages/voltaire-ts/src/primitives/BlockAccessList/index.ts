// Export types
export type {
	AccountChanges,
	AccountChangesLike,
	BalanceChange,
	BlockAccessIndex,
	BlockAccessListLike,
	BlockAccessListType,
	CodeChange,
	NonceChange,
	SlotChanges,
	StorageChange,
} from "./BlockAccessListType.js";

import type { HashType } from "../Hash/HashType.js";
import { assertValid as _assertValid } from "./assertValid.js";
import type {
	AccountChanges,
	BlockAccessListLike,
	BlockAccessListType,
} from "./BlockAccessListType.js";
import { calculateHash as _calculateHash } from "./calculateHash.js";
import { from as _from } from "./from.js";
import { fromRlp as _fromRlp } from "./fromRlp.js";
import { toRlp as _toRlp } from "./toRlp.js";

export {
	EMPTY_BLOCK_ACCESS_LIST_HASH,
	ITEM_COST,
	MAX_BLOCK_ACCESS_INDEX,
} from "./constants.js";
export { InvalidBlockAccessListError } from "./errors.js";

// Export internal functions (tree-shakeable, no input conversion)
export { _assertValid, _calculateHash, _from, _fromRlp, _toRlp };

/** Create a canonical EIP-7928 block access list; sorts, never merges. */
export function from(accounts: BlockAccessListLike): BlockAccessListType {
	return _from(accounts);
}

/** Decode strict canonical RLP, e.g. `ExecutionPayloadV4.blockAccessList`. */
export function fromRlp(data: Uint8Array): BlockAccessListType {
	return _fromRlp(data);
}

/** Assert every EIP-7928 rule that is checkable without the block. */
export function assertValid(
	list: readonly AccountChanges[],
): asserts list is BlockAccessListType {
	_assertValid(list);
}

/** RLP-encode a block access list. */
export function toRlp(list: BlockAccessListType | BlockAccessListLike) {
	return _toRlp(canonical(list));
}

/** `keccak256(rlp(list))`, the header `blockAccessListHash`. */
export function calculateHash(
	list: BlockAccessListType | BlockAccessListLike,
): HashType {
	return _calculateHash(canonical(list));
}

// Public wrappers accept loose input, so they always canonicalize.
function canonical(
	list: BlockAccessListType | BlockAccessListLike,
): BlockAccessListType {
	return _from(list as BlockAccessListLike);
}

// Namespace export
export const BlockAccessList = {
	from,
	fromRlp,
	assertValid,
	toRlp,
	calculateHash,
};
