/**
 * Transaction Signing
 *
 * Signs Ethereum transactions and returns serialized signed transaction.
 *
 * Supports all transaction types:
 * - Legacy (type 0)
 * - EIP-2930 (type 1)
 * - EIP-1559 (type 2)
 * - EIP-4844 (type 3)
 * - EIP-7702 (type 4)
 */

import { hash as keccak256 } from "../../src/crypto/Keccak256/hash.js";
import { sign as secp256k1Sign } from "../../src/crypto/Secp256k1/sign.js";

/**
 * Convert signature components to hex strings
 *
 * @param {{ r: Uint8Array; s: Uint8Array; v: number }} signature
 * @returns {{ r: string; s: string; v: bigint; yParity: number }}
 */
function formatSignature(signature) {
	const toHex = (bytes) =>
		`0x${Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("")}`;

	return {
		r: toHex(signature.r),
		s: toHex(signature.s),
		v: BigInt(signature.v),
		yParity: signature.v - 27,
	};
}

/**
 * Default transaction serializer (placeholder)
 *
 * In production, use the full Transaction primitive for RLP encoding.
 * This is a simplified version for demonstration.
 *
 * @param {Object} transaction
 * @param {Object} [signature]
 * @returns {string}
 */
function defaultSerializer(transaction, signature) {
	// This would use proper RLP encoding in production
	// For now, return a placeholder that indicates signature state
	if (signature) {
		return `0x02${transaction.chainId?.toString(16) ?? "01"}signed`;
	}
	return `0x02${transaction.chainId?.toString(16) ?? "01"}unsigned`;
}

/**
 * Sign a transaction
 *
 * @param {Object} params
 * @param {Uint8Array} params.privateKey - 32-byte private key
 * @param {Object} params.transaction - Transaction object
 * @param {Function} [params.serializer] - Custom serializer function
 * @returns {Promise<string>} Serialized signed transaction
 *
 * @example
 * ```javascript
 * import { signTransaction } from './signTransaction.js';
 *
 * const signedTx = await signTransaction({
 *   privateKey: privateKeyBytes,
 *   transaction: {
 *     type: 2,
 *     chainId: 1n,
 *     nonce: 0n,
 *     maxFeePerGas: 20000000000n,
 *     maxPriorityFeePerGas: 1000000000n,
 *     gas: 21000n,
 *     to: '0x...',
 *     value: 1000000000000000000n,
 *   },
 * });
 * ```
 */
export async function signTransaction({ privateKey, transaction, serializer = defaultSerializer }) {
	// For EIP-4844, exclude sidecars from signing
	const signableTransaction =
		transaction.type === "eip4844" || transaction.type === 3
			? { ...transaction, sidecars: false }
			: transaction;

	// Serialize and hash for signing
	const serialized = serializer(signableTransaction);
	const serializedBytes = hexToBytes(serialized);
	const hash = keccak256(serializedBytes);

	// Sign the hash
	const sig = secp256k1Sign(hash, privateKey);
	const signature = formatSignature(sig);

	// Return serialized with signature
	return serializer(transaction, signature);
}

/**
 * Convert hex string to bytes
 *
 * @param {string} hex
 * @returns {Uint8Array}
 */
function hexToBytes(hex) {
	const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
	const bytes = new Uint8Array(cleanHex.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
}

/**
 * Factory: Create signTransaction with injected dependencies
 *
 * @param {Object} deps
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256
 * @param {(hash: Uint8Array, privateKey: Uint8Array) => { r: Uint8Array; s: Uint8Array; v: number }} deps.sign
 * @param {Function} [deps.serializeTransaction] - Default serializer
 * @returns {(params: Object) => Promise<string>}
 */
export function SignTransaction({ keccak256: keccak256Fn, sign, serializeTransaction = defaultSerializer }) {
	return async function signTransaction({ privateKey, transaction, serializer = serializeTransaction }) {
		const signableTransaction =
			transaction.type === "eip4844" || transaction.type === 3
				? { ...transaction, sidecars: false }
				: transaction;

		const serialized = serializer(signableTransaction);
		const serializedBytes = hexToBytes(serialized);
		const hash = keccak256Fn(serializedBytes);

		const sig = sign(hash, privateKey);
		const signature = formatSignature(sig);

		return serializer(transaction, signature);
	};
}
