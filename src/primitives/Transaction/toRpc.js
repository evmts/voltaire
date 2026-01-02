import { InvalidTransactionTypeError } from "../errors/index.js";
import { Type } from "./types.js";

/**
 * Convert Uint8Array to hex string
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function toHex(bytes) {
	return `0x${Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")}`;
}

/**
 * Convert bigint to hex string
 * @param {bigint} value
 * @returns {string}
 */
function bigintToHex(value) {
	return `0x${value.toString(16)}`;
}

/**
 * Convert address to hex string
 * @param {Uint8Array | null} address
 * @returns {string | null}
 */
function addressToHex(address) {
	return address ? toHex(address) : null;
}

/**
 * Convert transaction to JSON-RPC format
 *
 * @param {import('./types.js').Any} tx - Transaction to convert
 * @returns {object} JSON-RPC formatted transaction
 * @throws {InvalidTransactionTypeError} If transaction type is unknown
 *
 * @example
 * ```javascript
 * import * as Transaction from './primitives/Transaction/index.js';
 * const tx = Transaction.deserialize(serialized);
 * const rpc = Transaction.toRpc(tx);
 * // { type: '0x2', chainId: '0x1', nonce: '0x0', ... }
 * ```
 */
export function toRpc(tx) {
	const base = {
		type: bigintToHex(BigInt(tx.type)),
		nonce: bigintToHex(tx.nonce),
		gasLimit: bigintToHex(tx.gasLimit),
		to: addressToHex(tx.to),
		value: bigintToHex(tx.value),
		data: toHex(tx.data),
		r: toHex(tx.r),
		s: toHex(tx.s),
	};

	switch (tx.type) {
		case Type.Legacy:
			return {
				...base,
				gasPrice: bigintToHex(tx.gasPrice),
				v: bigintToHex(tx.v),
			};

		case Type.EIP2930:
			return {
				...base,
				chainId: bigintToHex(tx.chainId),
				gasPrice: bigintToHex(tx.gasPrice),
				accessList: tx.accessList.map((item) => ({
					address: toHex(item.address),
					storageKeys: item.storageKeys.map((key) => toHex(key)),
				})),
				yParity: bigintToHex(BigInt(tx.yParity)),
			};

		case Type.EIP1559:
			return {
				...base,
				chainId: bigintToHex(tx.chainId),
				maxPriorityFeePerGas: bigintToHex(tx.maxPriorityFeePerGas),
				maxFeePerGas: bigintToHex(tx.maxFeePerGas),
				accessList: tx.accessList.map((item) => ({
					address: toHex(item.address),
					storageKeys: item.storageKeys.map((key) => toHex(key)),
				})),
				yParity: bigintToHex(BigInt(tx.yParity)),
			};

		case Type.EIP4844:
			return {
				...base,
				chainId: bigintToHex(tx.chainId),
				maxPriorityFeePerGas: bigintToHex(tx.maxPriorityFeePerGas),
				maxFeePerGas: bigintToHex(tx.maxFeePerGas),
				accessList: tx.accessList.map((item) => ({
					address: toHex(item.address),
					storageKeys: item.storageKeys.map((key) => toHex(key)),
				})),
				maxFeePerBlobGas: bigintToHex(tx.maxFeePerBlobGas),
				blobVersionedHashes: tx.blobVersionedHashes.map((h) => toHex(h)),
				yParity: bigintToHex(BigInt(tx.yParity)),
			};

		case Type.EIP7702:
			return {
				...base,
				chainId: bigintToHex(tx.chainId),
				maxPriorityFeePerGas: bigintToHex(tx.maxPriorityFeePerGas),
				maxFeePerGas: bigintToHex(tx.maxFeePerGas),
				accessList: tx.accessList.map((item) => ({
					address: toHex(item.address),
					storageKeys: item.storageKeys.map((key) => toHex(key)),
				})),
				authorizationList: tx.authorizationList.map((auth) => ({
					chainId: bigintToHex(auth.chainId),
					address: toHex(auth.address),
					nonce: bigintToHex(auth.nonce),
					yParity: bigintToHex(BigInt(auth.yParity)),
					r: toHex(auth.r),
					s: toHex(auth.s),
				})),
				yParity: bigintToHex(BigInt(tx.yParity)),
			};

		default: {
			const _exhaustive = /** @type {never} */ (tx);
			throw new InvalidTransactionTypeError(
				`Unknown transaction type: ${/** @type {any} */ (_exhaustive).type}`,
				{
					code: "UNKNOWN_TRANSACTION_TYPE",
					context: { type: /** @type {any} */ (_exhaustive).type },
					docsPath: "/primitives/transaction/to-rpc#error-handling",
				},
			);
		}
	}
}
