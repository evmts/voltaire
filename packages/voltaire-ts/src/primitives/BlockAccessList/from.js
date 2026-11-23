import { compare as compareAddress } from "../Address/compare.js";
import { from as addressFrom } from "../Address/internal-index.js";
import { toBytes as hexToBytes } from "../Hex/toBytes.js";
import { assertValid } from "./assertValid.js";
import { InvalidBlockAccessListError } from "./errors.js";

/**
 * @param {bigint | number | string} value
 * @returns {bigint}
 */
function toBigInt(value) {
	if (typeof value === "bigint") return value;
	if (typeof value === "number" && !Number.isSafeInteger(value)) {
		throw new InvalidBlockAccessListError(
			"number quantities must be safe integers",
			{ value, expected: "safe integer, bigint, or hex string" },
		);
	}
	if (typeof value === "string" && value.trim() === "") {
		throw new InvalidBlockAccessListError("quantity is not an integer", {
			value,
			expected: "safe integer, bigint, or hex string",
		});
	}
	try {
		return BigInt(value);
	} catch (cause) {
		throw new InvalidBlockAccessListError("quantity is not an integer", {
			value,
			expected: "safe integer, bigint, or hex string",
			cause: /** @type {Error} */ (cause),
		});
	}
}

/**
 * @template {{ blockAccessIndex: number }} T
 * @param {readonly T[]} changes
 * @returns {T[]}
 */
function byIndex(changes) {
	return [...changes].sort((a, b) => a.blockAccessIndex - b.blockAccessIndex);
}

/**
 * @param {bigint} a
 * @param {bigint} b
 * @returns {number}
 */
function compareBigInt(a, b) {
	return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Create a canonical EIP-7928 block access list.
 *
 * Normalizes addresses, quantities, and bytecode, then sorts accounts by
 * address, slots by key, and every change list by block access index.
 * Duplicates are an error; `from` never merges or drops entries.
 *
 * @see https://eips.ethereum.org/EIPS/eip-7928
 * @param {import('./BlockAccessListType.js').BlockAccessListLike} accounts
 * @returns {import('./BlockAccessListType.js').BlockAccessListType}
 * @throws {InvalidBlockAccessListError} If a value is out of range or duplicated
 * @example
 * ```javascript
 * import { BlockAccessList } from "@tevm/voltaire";
 *
 * const bal = BlockAccessList.from([
 *   {
 *     address: "0x00000000000000000000000000000000000000aa",
 *     storageChanges: [{ slot: 1n, changes: [{ blockAccessIndex: 1, newValue: 42n }] }],
 *     storageReads: [2n],
 *     balanceChanges: [{ blockAccessIndex: 1, postBalance: 10n ** 18n }],
 *     nonceChanges: [{ blockAccessIndex: 1, newNonce: 1n }],
 *   },
 * ]);
 * ```
 */
export function from(accounts) {
	if (!Array.isArray(accounts)) {
		throw new InvalidBlockAccessListError(
			"block access list must be an array of account changes",
			{ value: accounts },
		);
	}
	// Array.isArray narrows a readonly array to any[]; restore the input type.
	const input =
		/** @type {import('./BlockAccessListType.js').BlockAccessListLike} */ (
			accounts
		);
	const list = input
		.map((account) => ({
			address: addressFrom(account.address),
			storageChanges: (account.storageChanges ?? [])
				.map((slotChanges) => ({
					slot: toBigInt(slotChanges.slot),
					changes: byIndex(
						slotChanges.changes.map((change) => ({
							blockAccessIndex: change.blockAccessIndex,
							newValue: toBigInt(change.newValue),
						})),
					),
				}))
				.sort((a, b) => compareBigInt(a.slot, b.slot)),
			storageReads: (account.storageReads ?? [])
				.map(toBigInt)
				.sort(compareBigInt),
			balanceChanges: byIndex(
				(account.balanceChanges ?? []).map((change) => ({
					blockAccessIndex: change.blockAccessIndex,
					postBalance: toBigInt(change.postBalance),
				})),
			),
			nonceChanges: byIndex(
				(account.nonceChanges ?? []).map((change) => ({
					blockAccessIndex: change.blockAccessIndex,
					newNonce: toBigInt(change.newNonce),
				})),
			),
			codeChanges: byIndex(
				(account.codeChanges ?? []).map((change) => ({
					blockAccessIndex: change.blockAccessIndex,
					newCode:
						typeof change.newCode === "string"
							? hexToBytes(change.newCode)
							: change.newCode,
				})),
			),
		}))
		.sort((a, b) => compareAddress(a.address, b.address));
	assertValid(list);
	return list;
}
