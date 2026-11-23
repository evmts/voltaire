import { fromBigInt as bytesFromBigInt } from "../Bytes/fromBigInt.js";
import { encode as rlpEncode } from "../Rlp/encode.js";

const EMPTY = new Uint8Array(0);

/**
 * RLP integer payload: minimal big-endian, zero as the empty string.
 *
 * @param {bigint | number} value
 * @returns {Uint8Array}
 */
function uint(value) {
	const n = BigInt(value);
	return n === 0n ? EMPTY : bytesFromBigInt(n);
}

/**
 * RLP-encode a block access list per EIP-7928.
 *
 * This is the `blockAccessList` payload field of `ExecutionPayloadV4` and the
 * preimage of the header `blockAccessListHash`. Storage keys, values,
 * balances, nonces, and access indices are RLP integers, never 32-byte padded.
 *
 * @see https://eips.ethereum.org/EIPS/eip-7928
 * @param {import('./BlockAccessListType.js').BlockAccessListType} list - Canonical list from `from` or `fromRlp`
 * @returns {Uint8Array} RLP bytes
 * @example
 * ```javascript
 * import { BlockAccessList } from "@tevm/voltaire";
 *
 * BlockAccessList.toRlp(BlockAccessList.from([])); // Uint8Array [0xc0]
 * ```
 */
export function toRlp(list) {
	return rlpEncode(
		list.map((account) => [
			account.address,
			account.storageChanges.map((slotChanges) => [
				uint(slotChanges.slot),
				slotChanges.changes.map((change) => [
					uint(change.blockAccessIndex),
					uint(change.newValue),
				]),
			]),
			account.storageReads.map(uint),
			account.balanceChanges.map((change) => [
				uint(change.blockAccessIndex),
				uint(change.postBalance),
			]),
			account.nonceChanges.map((change) => [
				uint(change.blockAccessIndex),
				uint(change.newNonce),
			]),
			account.codeChanges.map((change) => [
				uint(change.blockAccessIndex),
				change.newCode,
			]),
		]),
	);
}
