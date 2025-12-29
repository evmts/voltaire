/**
 * EIP-712 Typed Data Signing
 *
 * Signs typed structured data according to EIP-712.
 *
 * @see https://eips.ethereum.org/EIPS/eip-712
 */

import { hashTypedData } from "../../src/crypto/EIP712/EIP712.js";
import { sign as secp256k1Sign } from "../../src/crypto/Secp256k1/sign.js";

/**
 * Serialize signature to 65-byte hex string
 *
 * @param {{ r: Uint8Array; s: Uint8Array; v: number }} signature
 * @returns {string} 0x-prefixed hex signature
 */
function serializeSignature(signature) {
	const bytes = new Uint8Array(65);
	bytes.set(signature.r, 0);
	bytes.set(signature.s, 32);
	bytes[64] = signature.v;
	return `0x${Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Sign typed data according to EIP-712
 *
 * @param {Object} params
 * @param {Object} params.domain - EIP-712 domain
 * @param {Object} params.types - Type definitions
 * @param {string} params.primaryType - Primary type name
 * @param {Object} params.message - Message to sign
 * @param {Uint8Array} params.privateKey - 32-byte private key
 * @returns {Promise<string>} 65-byte hex signature
 *
 * @example
 * ```javascript
 * import { signTypedData } from './signTypedData.js';
 *
 * const signature = await signTypedData({
 *   domain: {
 *     name: 'MyApp',
 *     version: '1',
 *     chainId: 1n,
 *     verifyingContract: '0x...',
 *   },
 *   types: {
 *     Person: [
 *       { name: 'name', type: 'string' },
 *       { name: 'wallet', type: 'address' },
 *     ],
 *   },
 *   primaryType: 'Person',
 *   message: {
 *     name: 'Alice',
 *     wallet: '0x...',
 *   },
 *   privateKey: privateKeyBytes,
 * });
 * ```
 */
export async function signTypedData({ domain, types, primaryType, message, privateKey }) {
	const hash = hashTypedData({ domain, types, primaryType, message });
	const sig = secp256k1Sign(hash, privateKey);
	return serializeSignature(sig);
}

/**
 * Factory: Create signTypedData with injected dependencies
 *
 * @param {Object} deps
 * @param {(typedData: Object) => Uint8Array} deps.hashTypedData
 * @param {(hash: Uint8Array, privateKey: Uint8Array) => { r: Uint8Array; s: Uint8Array; v: number }} deps.sign
 * @returns {(params: Object) => Promise<string>}
 */
export function SignTypedData({ hashTypedData: hashTypedDataFn, sign }) {
	return async function signTypedData({ domain, types, primaryType, message, privateKey }) {
		const hash = hashTypedDataFn({ domain, types, primaryType, message });
		const sig = sign(hash, privateKey);
		const bytes = new Uint8Array(65);
		bytes.set(sig.r, 0);
		bytes.set(sig.s, 32);
		bytes[64] = sig.v;
		return `0x${Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("")}`;
	};
}
