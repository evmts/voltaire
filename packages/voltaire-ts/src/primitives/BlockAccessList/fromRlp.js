import { fromBytes as addressFromBytes } from "../Address/fromBytes.js";
import { equals as bytesEqual } from "../Bytes/equals.js";
import { from as bytesFrom } from "../Bytes/from.js";
import { decode as rlpDecode } from "../Rlp/decode.js";
import { assertValid } from "./assertValid.js";
import { InvalidBlockAccessListError } from "./errors.js";
import { toRlp } from "./toRlp.js";

/** @typedef {import('../Rlp/RlpType.js').BrandedRlp} RlpData */

/**
 * @param {RlpData | undefined} data
 * @param {string} path
 * @param {number} [length] - Required item count
 * @returns {readonly RlpData[]}
 */
function list(data, path, length) {
	if (
		data?.type !== "list" ||
		(length !== undefined && data.value.length !== length)
	) {
		throw new InvalidBlockAccessListError(
			length === undefined
				? `${path} must be an RLP list`
				: `${path} must be an RLP list of ${length} items`,
			{ value: data, context: { path } },
		);
	}
	return data.value;
}

/**
 * @param {RlpData | undefined} data
 * @param {string} path
 * @returns {Uint8Array}
 */
function bytes(data, path) {
	if (data?.type !== "bytes") {
		throw new InvalidBlockAccessListError(`${path} must be an RLP string`, {
			value: data,
			context: { path },
		});
	}
	return data.value;
}

/**
 * Decode a canonical RLP integer: at most `size` bytes, no leading zero.
 *
 * @param {RlpData | undefined} data
 * @param {number} size
 * @param {string} path
 * @returns {bigint}
 */
function uint(data, size, path) {
	const value = bytes(data, path);
	if (value.length > size || value[0] === 0) {
		throw new InvalidBlockAccessListError(
			`${path} must be a minimal big-endian integer of at most ${size} bytes`,
			{ value, context: { path } },
		);
	}
	let n = 0n;
	for (const byte of value) n = (n << 8n) | BigInt(byte);
	return n;
}

/**
 * Decode `[BlockAccessIndex, payload]` pairs.
 *
 * @template T
 * @param {RlpData | undefined} data
 * @param {string} path
 * @param {(index: number, payload: RlpData | undefined, path: string) => T} build
 * @returns {T[]}
 */
function changes(data, path, build) {
	return list(data, path).map((item, i) => {
		const pair = list(item, `${path}[${i}]`, 2);
		return build(
			Number(uint(pair[0], 4, `${path}[${i}].blockAccessIndex`)),
			pair[1],
			`${path}[${i}]`,
		);
	});
}

/**
 * Decode an EIP-7928 RLP block access list.
 *
 * Strict: rejects trailing bytes, wrong shapes, padded integers, and any
 * ordering or uniqueness violation. A list that decodes re-encodes to the
 * same bytes, so its hash is safe to compare against the header.
 *
 * @see https://eips.ethereum.org/EIPS/eip-7928
 * @param {Uint8Array} data - RLP bytes, e.g. `ExecutionPayloadV4.blockAccessList`
 * @returns {import('./BlockAccessListType.js').BlockAccessListType}
 * @throws {InvalidBlockAccessListError} If the list is malformed or non-canonical
 * @throws {import('../Rlp/RlpError.js').RlpDecodingError} If the bytes are not valid RLP
 * @example
 * ```javascript
 * import { BlockAccessList } from "@tevm/voltaire";
 *
 * const bal = BlockAccessList.fromRlp(new Uint8Array([0xc0])); // []
 * ```
 */
export function fromRlp(data) {
	const accounts = list(rlpDecode(data).data, "blockAccessList").map(
		(item, a) => {
			const path = `accounts[${a}]`;
			const fields = list(item, path, 6);
			const address = bytes(fields[0], `${path}.address`);
			if (address.length !== 20) {
				throw new InvalidBlockAccessListError(
					`${path}.address must be 20 bytes`,
					{ value: address, context: { path } },
				);
			}
			return {
				address: addressFromBytes(address),
				storageChanges: list(fields[1], `${path}.storageChanges`).map(
					(slotItem, s) => {
						const slotPath = `${path}.storageChanges[${s}]`;
						const pair = list(slotItem, slotPath, 2);
						return {
							slot: uint(pair[0], 32, `${slotPath}.slot`),
							changes: changes(
								pair[1],
								`${slotPath}.changes`,
								(blockAccessIndex, payload, p) => ({
									blockAccessIndex,
									newValue: uint(payload, 32, `${p}.newValue`),
								}),
							),
						};
					},
				),
				storageReads: list(fields[2], `${path}.storageReads`).map((slot, r) =>
					uint(slot, 32, `${path}.storageReads[${r}]`),
				),
				balanceChanges: changes(
					fields[3],
					`${path}.balanceChanges`,
					(blockAccessIndex, payload, p) => ({
						blockAccessIndex,
						postBalance: uint(payload, 32, `${p}.postBalance`),
					}),
				),
				nonceChanges: changes(
					fields[4],
					`${path}.nonceChanges`,
					(blockAccessIndex, payload, p) => ({
						blockAccessIndex,
						newNonce: uint(payload, 8, `${p}.newNonce`),
					}),
				),
				codeChanges: changes(
					fields[5],
					`${path}.codeChanges`,
					(blockAccessIndex, payload, p) => ({
						blockAccessIndex,
						newCode: bytes(payload, `${p}.newCode`),
					}),
				),
			};
		},
	);
	assertValid(accounts);
	if (!bytesEqual(bytesFrom(toRlp(accounts)), bytesFrom(data))) {
		throw new InvalidBlockAccessListError(
			"block access list must use canonical RLP encoding",
			{ value: data },
		);
	}
	return accounts;
}
