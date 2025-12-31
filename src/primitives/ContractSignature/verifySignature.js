import { Address } from "../Address/index.js";
import { isValidSignature } from "./isValidSignature.js";

/**
 * Factory: Create unified signature verification for EOA and contract accounts
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(signature: {r: Uint8Array, s: Uint8Array, v: number}, messageHash: Uint8Array) => Uint8Array} deps.recoverPublicKey - secp256k1 public key recovery
 * @param {(x: bigint, y: bigint) => import("../Address/AddressType.js").AddressType} deps.addressFromPublicKey - Address derivation from public key
 * @returns {(provider: {request: (method: string, params: unknown[]) => Promise<unknown>}, address: import("../Address/AddressType.js").AddressType | string, hash: import("../Hash/HashType.js").HashType | Uint8Array, signature: {r: Uint8Array, s: Uint8Array, v: number} | Uint8Array) => Promise<boolean>}
 */
export function VerifySignature({
	keccak256,
	recoverPublicKey,
	addressFromPublicKey,
}) {
	/**
	 * Verify signature for both EOA and contract accounts
	 *
	 * Automatically detects if the address is a contract (has code) or an EOA:
	 * - EOA: Uses ecrecover to verify signature
	 * - Contract: Uses EIP-1271 isValidSignature to verify
	 *
	 * @param {Object} provider - JSON-RPC provider
	 * @param {(method: string, params: unknown[]) => Promise<unknown>} provider.request - JSON-RPC request method
	 * @param {import("../Address/AddressType.js").AddressType | string} address - Address to verify signature for
	 * @param {import("../Hash/HashType.js").HashType | Uint8Array} hash - Message hash
	 * @param {{r: Uint8Array, s: Uint8Array, v: number} | Uint8Array} signature - ECDSA signature or raw bytes
	 * @returns {Promise<boolean>} True if signature is valid
	 *
	 * @example
	 * ```javascript
	 * import { VerifySignature } from './primitives/ContractSignature/verifySignature.js';
	 * import { hash as keccak256 } from './crypto/Keccak256/hash.js';
	 * import { recoverPublicKey } from './crypto/Secp256k1/recoverPublicKey.js';
	 * import { fromPublicKey } from './primitives/Address/fromPublicKey.js';
	 *
	 * const verifySignature = VerifySignature({
	 *   keccak256,
	 *   recoverPublicKey,
	 *   addressFromPublicKey: fromPublicKey
	 * });
	 *
	 * // Works for both EOA and contract accounts
	 * const isValid = await verifySignature(
	 *   provider,
	 *   signerAddress,
	 *   messageHash,
	 *   signature
	 * );
	 * ```
	 */
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: unified EOA/contract verification requires multiple code paths
	return async function verifySignature(provider, address, hash, signature) {
		try {
			// Convert address to hex string for eth_getCode
			const addressHex =
				typeof address === "string" ? address : Address.toHex(address);

			// Check if address is a contract
			const code = await provider.request("eth_getCode", [
				addressHex,
				"latest",
			]);

			// Empty code means EOA
			if (
				typeof code === "string" &&
				(code === "0x" || code === "0x0" || code === "0x00")
			) {
				// EOA - use ecrecover
				// Convert signature to component form if needed
				let sigComponents;
				if (signature instanceof Uint8Array) {
					// Assume 65-byte signature: r (32) + s (32) + v (1)
					if (signature.length !== 65) {
						return false;
					}
					sigComponents = {
						r: signature.slice(0, 32),
						s: signature.slice(32, 64),
						v: signature[64] ?? 0,
					};
				} else {
					sigComponents = signature;
				}

				// Recover public key
				const publicKey = recoverPublicKey(sigComponents, hash);

				// Derive address from public key coordinates
				const x = bytesToBigInt(publicKey.slice(0, 32));
				const y = bytesToBigInt(publicKey.slice(32, 64));
				const recoveredAddress = addressFromPublicKey(x, y);

				// Convert expected address to AddressType
				const expectedAddress =
					typeof address === "string" ? Address(address) : address;

				// Compare addresses using utility function
				return Address.equals(recoveredAddress, expectedAddress);
			}
			// Contract - use EIP-1271
			const signatureBytes =
				signature instanceof Uint8Array
					? signature
					: concatSignature(signature);
			return await isValidSignature(provider, address, hash, signatureBytes);
		} catch (error) {
			// Verification failed
			return false;
		}
	};
}

/**
 * Concatenate signature components into bytes
 * @param {{r: Uint8Array, s: Uint8Array, v: number}} sig
 * @returns {Uint8Array}
 */
function concatSignature(sig) {
	const result = new Uint8Array(65);
	result.set(sig.r, 0);
	result.set(sig.s, 32);
	result[64] = sig.v;
	return result;
}

/**
 * Convert bytes to bigint (big-endian)
 * @param {Uint8Array} bytes - Bytes to convert
 * @returns {bigint} BigInt value
 */
function bytesToBigInt(bytes) {
	let result = 0n;
	for (const byte of bytes) {
		result = (result << 8n) | BigInt(byte);
	}
	return result;
}
