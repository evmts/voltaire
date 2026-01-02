import {
	InvalidLengthError,
	InvalidTransactionTypeError,
} from "../errors/index.js";
import { Type } from "./types.js";

/**
 * Convert hex string to Uint8Array
 * @param {string} hex
 * @returns {Uint8Array}
 */
function fromHex(hex) {
	const h = hex.startsWith("0x") ? hex.slice(2) : hex;
	const padded = h.length % 2 === 0 ? h : `0${h}`;
	const bytes = new Uint8Array(padded.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(padded.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
}

/**
 * Convert hex string to bigint
 * @param {string | undefined} hex
 * @returns {bigint}
 */
function hexToBigInt(hex) {
	if (!hex) return 0n;
	return BigInt(hex);
}

/**
 * Convert hex string to address bytes (20 bytes)
 * @param {string | null | undefined} hex
 * @returns {import('../Address/AddressType.js').AddressType | null}
 * @throws {InvalidLengthError} If address is not 20 bytes
 */
function hexToAddress(hex) {
	if (!hex) return null;
	const bytes = fromHex(hex);
	if (bytes.length !== 20) {
		throw new InvalidLengthError(
			`Invalid address length: ${bytes.length}, expected 20`,
			{
				code: "INVALID_ADDRESS_LENGTH",
				value: bytes,
				expected: "20 bytes",
				context: { actualLength: bytes.length },
				docsPath: "/primitives/transaction/from-rpc#error-handling",
			},
		);
	}
	return /** @type {import('../Address/AddressType.js').AddressType} */ (bytes);
}

/**
 * Convert hex string to address bytes (20 bytes), throws if null
 * @param {string} hex
 * @returns {import('../Address/AddressType.js').AddressType}
 * @throws {InvalidLengthError} If address is not 20 bytes
 */
function hexToAddressRequired(hex) {
	const bytes = fromHex(hex);
	if (bytes.length !== 20) {
		throw new InvalidLengthError(
			`Invalid address length: ${bytes.length}, expected 20`,
			{
				code: "INVALID_ADDRESS_LENGTH",
				value: bytes,
				expected: "20 bytes",
				context: { actualLength: bytes.length },
				docsPath: "/primitives/transaction/from-rpc#error-handling",
			},
		);
	}
	return /** @type {import('../Address/AddressType.js').AddressType} */ (bytes);
}

/**
 * Convert hex string to 32-byte hash
 * @param {string} hex
 * @returns {import('../Bytes32/Bytes32Type.js').Bytes32Type}
 * @throws {InvalidLengthError} If hash is not 32 bytes
 */
function hexToHash(hex) {
	const bytes = fromHex(hex);
	if (bytes.length !== 32) {
		throw new InvalidLengthError(
			`Invalid hash length: ${bytes.length}, expected 32`,
			{
				code: "INVALID_HASH_LENGTH",
				value: bytes,
				expected: "32 bytes",
				context: { actualLength: bytes.length },
				docsPath: "/primitives/transaction/from-rpc#error-handling",
			},
		);
	}
	return /** @type {import('../Bytes32/Bytes32Type.js').Bytes32Type} */ (bytes);
}

/**
 * @typedef {Object} RpcTransaction
 * @property {string} [type]
 * @property {string} [nonce]
 * @property {string} [gasLimit]
 * @property {string} [gas]
 * @property {string | null} [to]
 * @property {string} [value]
 * @property {string} [data]
 * @property {string} [input]
 * @property {string} [r]
 * @property {string} [s]
 * @property {string} [v]
 * @property {string} [yParity]
 * @property {string} [chainId]
 * @property {string} [gasPrice]
 * @property {string} [maxPriorityFeePerGas]
 * @property {string} [maxFeePerGas]
 * @property {string} [maxFeePerBlobGas]
 * @property {Array<{address: string, storageKeys?: string[]}>} [accessList]
 * @property {string[]} [blobVersionedHashes]
 * @property {Array<{chainId: string, address: string, nonce: string, yParity: string, r: string, s: string}>} [authorizationList]
 */

/**
 * Parse transaction from JSON-RPC format
 *
 * @param {RpcTransaction} rpc - JSON-RPC formatted transaction
 * @returns {import('./types.js').Any} Parsed transaction
 * @throws {InvalidLengthError} If address or hash length is invalid
 * @throws {InvalidTransactionTypeError} If transaction type is unknown
 *
 * @example
 * ```javascript
 * import * as Transaction from './primitives/Transaction/index.js';
 * const tx = Transaction.fromRpc({
 *   type: '0x2',
 *   chainId: '0x1',
 *   nonce: '0x0',
 *   // ...
 * });
 * ```
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: RPC parsing requires handling multiple transaction types
export function fromRpc(rpc) {
	const type = Number(hexToBigInt(rpc.type));

	const base = {
		nonce: hexToBigInt(rpc.nonce),
		gasLimit: hexToBigInt(rpc.gasLimit || rpc.gas),
		to: hexToAddress(rpc.to),
		value: hexToBigInt(rpc.value),
		data: fromHex(rpc.data || rpc.input || "0x"),
		r: fromHex(rpc.r || "0x0"),
		s: fromHex(rpc.s || "0x0"),
	};

	// Pad r and s to 32 bytes
	if (base.r.length < 32) {
		const padded = new Uint8Array(32);
		padded.set(base.r, 32 - base.r.length);
		base.r = padded;
	}
	if (base.s.length < 32) {
		const padded = new Uint8Array(32);
		padded.set(base.s, 32 - base.s.length);
		base.s = padded;
	}

	switch (type) {
		case Type.Legacy:
		case 0: // Handle missing type (default to legacy)
			return {
				...base,
				type: Type.Legacy,
				gasPrice: hexToBigInt(rpc.gasPrice),
				v: hexToBigInt(rpc.v),
			};

		case Type.EIP2930:
			return {
				...base,
				type: Type.EIP2930,
				chainId: hexToBigInt(rpc.chainId),
				gasPrice: hexToBigInt(rpc.gasPrice),
				accessList: (rpc.accessList || []).map((item) => ({
					address: hexToAddressRequired(item.address),
					storageKeys: (item.storageKeys || []).map(
						(key) =>
							/** @type {import('../Hash/HashType.js').HashType} */ (
								/** @type {unknown} */ (hexToHash(key))
							),
					),
				})),
				yParity: Number(hexToBigInt(rpc.yParity ?? rpc.v ?? "0x0")),
			};

		case Type.EIP1559:
			return {
				...base,
				type: Type.EIP1559,
				chainId: hexToBigInt(rpc.chainId),
				maxPriorityFeePerGas: hexToBigInt(rpc.maxPriorityFeePerGas),
				maxFeePerGas: hexToBigInt(rpc.maxFeePerGas),
				accessList: (rpc.accessList || []).map((item) => ({
					address: hexToAddressRequired(item.address),
					storageKeys: (item.storageKeys || []).map(
						(key) =>
							/** @type {import('../Hash/HashType.js').HashType} */ (
								/** @type {unknown} */ (hexToHash(key))
							),
					),
				})),
				yParity: Number(hexToBigInt(rpc.yParity ?? rpc.v ?? "0x0")),
			};

		case Type.EIP4844:
			return {
				...base,
				// EIP-4844 requires a recipient address; cast base.to for typing
				to: /** @type {import('../Address/AddressType.js').AddressType} */ (
					/** @type {unknown} */ (base.to)
				),
				type: Type.EIP4844,
				chainId: hexToBigInt(rpc.chainId),
				maxPriorityFeePerGas: hexToBigInt(rpc.maxPriorityFeePerGas),
				maxFeePerGas: hexToBigInt(rpc.maxFeePerGas),
				accessList: (rpc.accessList || []).map((item) => ({
					address: hexToAddressRequired(item.address),
					storageKeys: (item.storageKeys || []).map(
						(key) =>
							/** @type {import('../Hash/HashType.js').HashType} */ (
								/** @type {unknown} */ (hexToHash(key))
							),
					),
				})),
				maxFeePerBlobGas: hexToBigInt(rpc.maxFeePerBlobGas),
				blobVersionedHashes: (rpc.blobVersionedHashes || []).map(
					(h) =>
						/** @type {import('../Hash/HashType.js').HashType} */ (
							/** @type {unknown} */ (hexToHash(h))
						),
				),
				yParity: Number(hexToBigInt(rpc.yParity ?? rpc.v ?? "0x0")),
			};

		case Type.EIP7702:
			return {
				...base,
				type: Type.EIP7702,
				chainId: hexToBigInt(rpc.chainId),
				maxPriorityFeePerGas: hexToBigInt(rpc.maxPriorityFeePerGas),
				maxFeePerGas: hexToBigInt(rpc.maxFeePerGas),
				accessList: (rpc.accessList || []).map((item) => ({
					address: hexToAddressRequired(item.address),
					storageKeys: (item.storageKeys || []).map(
						(key) =>
							/** @type {import('../Hash/HashType.js').HashType} */ (
								/** @type {unknown} */ (hexToHash(key))
							),
					),
				})),
				authorizationList: (rpc.authorizationList || []).map((auth) => ({
					chainId: hexToBigInt(auth.chainId),
					address: hexToAddressRequired(auth.address),
					nonce: hexToBigInt(auth.nonce),
					yParity: Number(hexToBigInt(auth.yParity)),
					r: fromHex(auth.r),
					s: fromHex(auth.s),
				})),
				yParity: Number(hexToBigInt(rpc.yParity ?? rpc.v ?? "0x0")),
			};

		default:
			throw new InvalidTransactionTypeError(
				`Unknown transaction type: ${type}`,
				{
					code: "UNKNOWN_TRANSACTION_TYPE",
					context: { type },
					docsPath: "/primitives/transaction/from-rpc#error-handling",
				},
			);
	}
}
