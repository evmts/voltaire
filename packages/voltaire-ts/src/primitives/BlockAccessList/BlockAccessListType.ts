import type { brand } from "../../brand.js";
import type { AddressType } from "../Address/AddressType.js";

/**
 * EIP-7928 block access index (uint32).
 *
 * - `0`: pre-execution system contract calls
 * - `1..n`: transactions in block order
 * - `n + 1`: post-execution system calls and withdrawals
 */
export type BlockAccessIndex = number;

/** EIP-7928 `StorageChange = [BlockAccessIndex, StorageValue]`. */
export type StorageChange = {
	readonly blockAccessIndex: BlockAccessIndex;
	/** Storage value after the access index executed (uint256). */
	readonly newValue: bigint;
};

/** EIP-7928 `BalanceChange = [BlockAccessIndex, Balance]`. */
export type BalanceChange = {
	readonly blockAccessIndex: BlockAccessIndex;
	/** Account balance in wei after the access index executed (uint256). */
	readonly postBalance: bigint;
};

/** EIP-7928 `NonceChange = [BlockAccessIndex, Nonce]`. */
export type NonceChange = {
	readonly blockAccessIndex: BlockAccessIndex;
	/** Account nonce after the access index executed (uint64). */
	readonly newNonce: bigint;
};

/** EIP-7928 `CodeChange = [BlockAccessIndex, Bytecode]`. */
export type CodeChange = {
	readonly blockAccessIndex: BlockAccessIndex;
	/** Runtime bytecode after the access index executed. */
	readonly newCode: Uint8Array;
};

/** EIP-7928 `SlotChanges = [StorageKey, List[StorageChange]]`. */
export type SlotChanges = {
	/** Storage key (uint256). */
	readonly slot: bigint;
	/** At least one change, ascending by `blockAccessIndex`. */
	readonly changes: readonly StorageChange[];
};

/**
 * EIP-7928 `AccountChanges`:
 * `[address, storage_changes, storage_reads, balance_changes, nonce_changes, code_changes]`.
 */
export type AccountChanges = {
	readonly address: AddressType;
	/** Written slots, ascending by `slot`. */
	readonly storageChanges: readonly SlotChanges[];
	/** Slots read but never written, ascending (uint256). */
	readonly storageReads: readonly bigint[];
	readonly balanceChanges: readonly BalanceChange[];
	readonly nonceChanges: readonly NonceChange[];
	readonly codeChanges: readonly CodeChange[];
};

/**
 * EIP-7928 Block-Level Access List: `List[AccountChanges]` in canonical order.
 *
 * Accounts ascend by address. Every nested list ascends strictly by its key,
 * which also makes each key unique.
 *
 * @see https://eips.ethereum.org/EIPS/eip-7928
 */
export type BlockAccessListType = readonly AccountChanges[] & {
	readonly [brand]: "BlockAccessList";
};

type Quantity = bigint | number | string;

/** Loose input accepted by `BlockAccessList.from`. Lists may be unsorted. */
export type AccountChangesLike = {
	address: AddressType | Uint8Array | string;
	storageChanges?: readonly {
		slot: Quantity;
		changes: readonly { blockAccessIndex: number; newValue: Quantity }[];
	}[];
	storageReads?: readonly Quantity[];
	balanceChanges?: readonly {
		blockAccessIndex: number;
		postBalance: Quantity;
	}[];
	nonceChanges?: readonly { blockAccessIndex: number; newNonce: Quantity }[];
	codeChanges?: readonly {
		blockAccessIndex: number;
		newCode: Uint8Array | string;
	}[];
};

export type BlockAccessListLike = readonly AccountChangesLike[];
