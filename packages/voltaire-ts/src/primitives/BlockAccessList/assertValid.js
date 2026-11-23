import { compare as compareAddress } from "../Address/compare.js";
import {
	MAX_BLOCK_ACCESS_INDEX,
	MAX_UINT64,
	MAX_UINT256,
} from "./constants.js";
import { InvalidBlockAccessListError } from "./errors.js";

/**
 * @param {unknown} value
 * @param {bigint} max
 * @param {string} path
 */
function assertUint(value, max, path) {
	if (typeof value !== "bigint" || value < 0n || value > max) {
		throw new InvalidBlockAccessListError(`${path} is out of range`, {
			value,
			expected: `bigint in [0, ${max}]`,
			context: { path },
		});
	}
}

/**
 * Checks that the access indices are uint32 and strictly ascending.
 *
 * @param {readonly { blockAccessIndex: number }[]} changes
 * @param {string} path
 */
function assertIndices(changes, path) {
	let previous = -1;
	for (const [i, change] of changes.entries()) {
		const index = change.blockAccessIndex;
		if (
			!Number.isInteger(index) ||
			index < 0 ||
			index > MAX_BLOCK_ACCESS_INDEX
		) {
			throw new InvalidBlockAccessListError(
				`${path}[${i}].blockAccessIndex is not a uint32`,
				{ value: index, expected: "uint32", context: { path } },
			);
		}
		if (index <= previous) {
			throw new InvalidBlockAccessListError(
				`${path} must ascend strictly by blockAccessIndex`,
				{ value: index, context: { path, previous } },
			);
		}
		previous = index;
	}
}

/**
 * Assert that a block access list satisfies every EIP-7928 rule that is
 * checkable without the block: field types and ranges, canonical ordering,
 * and uniqueness.
 *
 * It does not check that access indices stay within `len(transactions) + 1`
 * or the `ITEM_COST` size bound; both need the block.
 *
 * @see https://eips.ethereum.org/EIPS/eip-7928
 * @param {readonly import('./BlockAccessListType.js').AccountChanges[]} list
 * @returns {asserts list is import('./BlockAccessListType.js').BlockAccessListType}
 * @throws {InvalidBlockAccessListError} If any rule is violated
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: one linear pass over the EIP-7928 rules, in spec order
export function assertValid(list) {
	/** @type {Uint8Array | undefined} */
	let previousAddress;
	for (const [a, account] of list.entries()) {
		const path = `accounts[${a}]`;
		if (
			!(account.address instanceof Uint8Array) ||
			account.address.length !== 20
		) {
			throw new InvalidBlockAccessListError(
				`${path}.address must be 20 bytes`,
				{ value: account.address, context: { path } },
			);
		}
		if (
			previousAddress !== undefined &&
			compareAddress(
				/** @type {import('../Address/AddressType.js').AddressType} */ (
					previousAddress
				),
				account.address,
			) >= 0
		) {
			throw new InvalidBlockAccessListError(
				"accounts must ascend strictly by address",
				{ value: account.address, context: { path } },
			);
		}
		previousAddress = account.address;

		/** @type {Set<bigint>} */
		const written = new Set();
		let previousSlot = -1n;
		for (const [s, slotChanges] of account.storageChanges.entries()) {
			const slotPath = `${path}.storageChanges[${s}]`;
			assertUint(slotChanges.slot, MAX_UINT256, `${slotPath}.slot`);
			if (slotChanges.slot <= previousSlot) {
				throw new InvalidBlockAccessListError(
					`${path}.storageChanges must ascend strictly by slot`,
					{ value: slotChanges.slot, context: { path: slotPath } },
				);
			}
			previousSlot = slotChanges.slot;
			written.add(slotChanges.slot);
			if (slotChanges.changes.length === 0) {
				throw new InvalidBlockAccessListError(
					`${slotPath}.changes must hold at least one change`,
					{ value: slotChanges, context: { path: slotPath } },
				);
			}
			assertIndices(slotChanges.changes, `${slotPath}.changes`);
			for (const [c, change] of slotChanges.changes.entries()) {
				assertUint(
					change.newValue,
					MAX_UINT256,
					`${slotPath}.changes[${c}].newValue`,
				);
			}
		}

		let previousRead = -1n;
		for (const [r, slot] of account.storageReads.entries()) {
			const readPath = `${path}.storageReads[${r}]`;
			assertUint(slot, MAX_UINT256, readPath);
			if (slot <= previousRead) {
				throw new InvalidBlockAccessListError(
					`${path}.storageReads must ascend strictly`,
					{ value: slot, context: { path: readPath } },
				);
			}
			if (written.has(slot)) {
				throw new InvalidBlockAccessListError(
					`${readPath} also appears in storageChanges`,
					{ value: slot, context: { path: readPath } },
				);
			}
			previousRead = slot;
		}

		assertIndices(account.balanceChanges, `${path}.balanceChanges`);
		for (const [i, change] of account.balanceChanges.entries()) {
			assertUint(
				change.postBalance,
				MAX_UINT256,
				`${path}.balanceChanges[${i}].postBalance`,
			);
		}

		assertIndices(account.nonceChanges, `${path}.nonceChanges`);
		for (const [i, change] of account.nonceChanges.entries()) {
			assertUint(
				change.newNonce,
				MAX_UINT64,
				`${path}.nonceChanges[${i}].newNonce`,
			);
		}

		assertIndices(account.codeChanges, `${path}.codeChanges`);
		for (const [i, change] of account.codeChanges.entries()) {
			if (!(change.newCode instanceof Uint8Array)) {
				throw new InvalidBlockAccessListError(
					`${path}.codeChanges[${i}].newCode must be bytes`,
					{ value: change.newCode, context: { path } },
				);
			}
		}
	}
}
