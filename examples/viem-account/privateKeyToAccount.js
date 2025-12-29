/**
 * Private Key to Account
 *
 * Creates a viem-compatible LocalAccount from a private key.
 *
 * @module privateKeyToAccount
 */

import { secp256k1 } from "@noble/curves/secp256k1.js";
import { hash as keccak256 } from "../../src/crypto/Keccak256/hash.js";
import { sign as secp256k1Sign } from "../../src/crypto/Secp256k1/sign.js";
import { hashTypedData } from "../../src/crypto/EIP712/EIP712.js";
import { signMessage as _signMessage, hashMessage } from "./signMessage.js";
import { signTypedData as _signTypedData } from "./signTypedData.js";
import { signTransaction as _signTransaction } from "./signTransaction.js";
import { InvalidAddressError, InvalidPrivateKeyError } from "./errors.js";

/**
 * Convert bytes to hex string
 *
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function toHex(bytes) {
	return `0x${Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("")}`;
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
 * Compute EIP-55 checksummed address
 *
 * @param {string} address - Lowercase address without checksum
 * @returns {string} Checksummed address
 */
function checksumAddress(address) {
	const addr = address.toLowerCase().replace("0x", "");
	const hash = keccak256(new TextEncoder().encode(addr));
	let result = "0x";
	for (let i = 0; i < 40; i++) {
		const hashByte = hash[Math.floor(i / 2)];
		const hashNibble = i % 2 === 0 ? hashByte >> 4 : hashByte & 0x0f;
		result += hashNibble >= 8 ? addr[i].toUpperCase() : addr[i];
	}
	return result;
}

/**
 * Derive address from public key
 *
 * @param {string} publicKey - 65-byte uncompressed public key (0x04 prefixed)
 * @returns {string} Checksummed address
 */
function publicKeyToAddress(publicKey) {
	// Remove 0x04 prefix, hash the 64-byte key
	const pubKeyBytes = hexToBytes(publicKey.slice(4)); // Remove 0x04
	const hash = keccak256(pubKeyBytes);
	const addressBytes = hash.slice(-20);
	const address = toHex(addressBytes);
	return checksumAddress(address);
}

/**
 * Serialize signature to 65-byte hex string
 *
 * @param {{ r: Uint8Array; s: Uint8Array; v: number }} signature
 * @returns {string}
 */
function serializeSignature(signature) {
	const bytes = new Uint8Array(65);
	bytes.set(signature.r, 0);
	bytes.set(signature.s, 32);
	bytes[64] = signature.v;
	return toHex(bytes);
}

/**
 * Validate private key
 *
 * @param {string | Uint8Array} privateKey
 * @returns {Uint8Array}
 */
function validatePrivateKey(privateKey) {
	let bytes;
	if (typeof privateKey === "string") {
		if (!privateKey.startsWith("0x")) {
			throw new InvalidPrivateKeyError("Private key must start with 0x");
		}
		if (privateKey.length !== 66) {
			throw new InvalidPrivateKeyError("Private key must be 32 bytes (66 hex characters with 0x)");
		}
		bytes = hexToBytes(privateKey);
	} else {
		bytes = privateKey;
	}

	if (bytes.length !== 32) {
		throw new InvalidPrivateKeyError("Private key must be 32 bytes");
	}

	// Check not zero
	if (bytes.every(b => b === 0)) {
		throw new InvalidPrivateKeyError("Private key cannot be zero");
	}

	return bytes;
}

/**
 * Create a viem-compatible account from a private key
 *
 * @param {string} privateKey - 32-byte private key as hex string (0x prefixed)
 * @param {Object} [options]
 * @param {Object} [options.nonceManager] - Optional nonce manager
 * @returns {import('./AccountTypes.js').PrivateKeyAccount}
 *
 * @example
 * ```javascript
 * import { privateKeyToAccount } from './privateKeyToAccount.js';
 *
 * const account = privateKeyToAccount(
 *   '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
 * );
 *
 * console.log(account.address); // '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
 *
 * // Sign a message
 * const sig = await account.signMessage({ message: 'Hello!' });
 *
 * // Sign typed data
 * const typedSig = await account.signTypedData({
 *   domain: { name: 'App', version: '1' },
 *   types: { Message: [{ name: 'content', type: 'string' }] },
 *   primaryType: 'Message',
 *   message: { content: 'Hello!' },
 * });
 * ```
 */
export function privateKeyToAccount(privateKey, options = {}) {
	const { nonceManager } = options;
	const privateKeyBytes = validatePrivateKey(privateKey);

	// Derive public key (uncompressed, 65 bytes with 0x04 prefix)
	const publicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, false);
	const publicKey = toHex(publicKeyBytes);

	// Derive address
	const address = publicKeyToAddress(publicKey);

	return {
		address,
		publicKey,
		source: "privateKey",
		type: "local",
		nonceManager,

		/**
		 * Sign a raw hash
		 */
		async sign({ hash }) {
			const hashBytes = hexToBytes(hash);
			const sig = secp256k1Sign(hashBytes, privateKeyBytes);
			return serializeSignature(sig);
		},

		/**
		 * Sign EIP-7702 authorization
		 */
		async signAuthorization(authorization) {
			const { chainId, nonce } = authorization;
			const authAddress = authorization.contractAddress ?? authorization.address;

			// Hash authorization: keccak256(0x05 || rlp([chainId, address, nonce]))
			// Simplified RLP encoding for this specific structure
			const rlpData = encodeAuthorizationRlp(chainId, authAddress, nonce);
			const hashInput = new Uint8Array(1 + rlpData.length);
			hashInput[0] = 0x05;
			hashInput.set(rlpData, 1);
			const hash = keccak256(hashInput);

			const sig = secp256k1Sign(hash, privateKeyBytes);

			return {
				address: authAddress,
				chainId,
				nonce,
				r: toHex(sig.r),
				s: toHex(sig.s),
				v: BigInt(sig.v),
				yParity: sig.v - 27,
			};
		},

		/**
		 * Sign EIP-191 message
		 */
		async signMessage({ message }) {
			return _signMessage({ message, privateKey: privateKeyBytes });
		},

		/**
		 * Sign transaction
		 */
		async signTransaction(transaction, options = {}) {
			return _signTransaction({
				privateKey: privateKeyBytes,
				transaction,
				serializer: options.serializer,
			});
		},

		/**
		 * Sign EIP-712 typed data
		 */
		async signTypedData(typedData) {
			return _signTypedData({
				...typedData,
				privateKey: privateKeyBytes,
			});
		},
	};
}

/**
 * Encode authorization for EIP-7702 (simplified RLP)
 *
 * @param {bigint} chainId
 * @param {string} address
 * @param {bigint} nonce
 * @returns {Uint8Array}
 */
function encodeAuthorizationRlp(chainId, address, nonce) {
	// Simplified RLP encoding for [chainId, address, nonce]
	const items = [
		encodeBigInt(chainId),
		hexToBytes(address),
		encodeBigInt(nonce),
	];

	// Calculate total length
	let totalLength = 0;
	const encodedItems = items.map(item => encodeRlpItem(item));
	for (const item of encodedItems) {
		totalLength += item.length;
	}

	// Create list encoding
	if (totalLength < 56) {
		const result = new Uint8Array(1 + totalLength);
		result[0] = 0xc0 + totalLength;
		let offset = 1;
		for (const item of encodedItems) {
			result.set(item, offset);
			offset += item.length;
		}
		return result;
	}

	// Long list (unlikely for authorization)
	const lengthBytes = encodeBigInt(BigInt(totalLength));
	const result = new Uint8Array(1 + lengthBytes.length + totalLength);
	result[0] = 0xf7 + lengthBytes.length;
	result.set(lengthBytes, 1);
	let offset = 1 + lengthBytes.length;
	for (const item of encodedItems) {
		result.set(item, offset);
		offset += item.length;
	}
	return result;
}

/**
 * Encode bigint to minimal bytes
 *
 * @param {bigint} value
 * @returns {Uint8Array}
 */
function encodeBigInt(value) {
	if (value === 0n) return new Uint8Array(0);
	let hex = value.toString(16);
	if (hex.length % 2) hex = "0" + hex;
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
}

/**
 * RLP encode a single item
 *
 * @param {Uint8Array} bytes
 * @returns {Uint8Array}
 */
function encodeRlpItem(bytes) {
	if (bytes.length === 0) {
		return new Uint8Array([0x80]);
	}
	if (bytes.length === 1 && bytes[0] < 0x80) {
		return bytes;
	}
	if (bytes.length < 56) {
		const result = new Uint8Array(1 + bytes.length);
		result[0] = 0x80 + bytes.length;
		result.set(bytes, 1);
		return result;
	}
	const lengthBytes = encodeBigInt(BigInt(bytes.length));
	const result = new Uint8Array(1 + lengthBytes.length + bytes.length);
	result[0] = 0xb7 + lengthBytes.length;
	result.set(lengthBytes, 1);
	result.set(bytes, 1 + lengthBytes.length);
	return result;
}

/**
 * Factory: Create privateKeyToAccount with injected dependencies
 *
 * @param {Object} deps
 * @param {(privateKey: Uint8Array, compressed?: boolean) => Uint8Array} deps.getPublicKey
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256
 * @param {(hash: Uint8Array, privateKey: Uint8Array) => { r: Uint8Array; s: Uint8Array; v: number }} deps.sign
 * @param {(typedData: Object) => Uint8Array} deps.hashTypedData
 * @returns {(privateKey: string, options?: Object) => import('./AccountTypes.js').PrivateKeyAccount}
 */
export function PrivateKeyToAccount({ getPublicKey, keccak256: keccak256Fn, sign, hashTypedData: hashTypedDataFn }) {
	return function privateKeyToAccount(privateKey, options = {}) {
		const { nonceManager } = options;
		const privateKeyBytes = validatePrivateKey(privateKey);

		const publicKeyBytes = getPublicKey(privateKeyBytes, false);
		const publicKey = toHex(publicKeyBytes);

		// Derive address using injected keccak256
		const pubKeyBytesNoPrefix = publicKeyBytes.slice(1);
		const addressHash = keccak256Fn(pubKeyBytesNoPrefix);
		const addressBytes = addressHash.slice(-20);
		const addressLower = toHex(addressBytes);

		// Checksum with injected keccak256
		const addr = addressLower.slice(2);
		const checksumHash = keccak256Fn(new TextEncoder().encode(addr));
		let address = "0x";
		for (let i = 0; i < 40; i++) {
			const hashByte = checksumHash[Math.floor(i / 2)];
			const hashNibble = i % 2 === 0 ? hashByte >> 4 : hashByte & 0x0f;
			address += hashNibble >= 8 ? addr[i].toUpperCase() : addr[i];
		}

		const serializeSig = (sig) => {
			const bytes = new Uint8Array(65);
			bytes.set(sig.r, 0);
			bytes.set(sig.s, 32);
			bytes[64] = sig.v;
			return toHex(bytes);
		};

		return {
			address,
			publicKey,
			source: "privateKey",
			type: "local",
			nonceManager,

			async sign({ hash }) {
				const hashBytes = hexToBytes(hash);
				const sig = sign(hashBytes, privateKeyBytes);
				return serializeSig(sig);
			},

			async signAuthorization(authorization) {
				const { chainId, nonce } = authorization;
				const authAddress = authorization.contractAddress ?? authorization.address;
				const rlpData = encodeAuthorizationRlp(chainId, authAddress, nonce);
				const hashInput = new Uint8Array(1 + rlpData.length);
				hashInput[0] = 0x05;
				hashInput.set(rlpData, 1);
				const hash = keccak256Fn(hashInput);
				const sig = sign(hash, privateKeyBytes);
				return {
					address: authAddress,
					chainId,
					nonce,
					r: toHex(sig.r),
					s: toHex(sig.s),
					v: BigInt(sig.v),
					yParity: sig.v - 27,
				};
			},

			async signMessage({ message }) {
				const msgBytes = typeof message === "string"
					? new TextEncoder().encode(message)
					: typeof message.raw === "string"
						? hexToBytes(message.raw)
						: message.raw;
				const prefix = new TextEncoder().encode(`\x19Ethereum Signed Message:\n${msgBytes.length}`);
				const combined = new Uint8Array(prefix.length + msgBytes.length);
				combined.set(prefix);
				combined.set(msgBytes, prefix.length);
				const hash = keccak256Fn(combined);
				const sig = sign(hash, privateKeyBytes);
				return serializeSig(sig);
			},

			async signTransaction(transaction, txOptions = {}) {
				// Simplified - in production would use full RLP serialization
				const sig = sign(keccak256Fn(new Uint8Array(32)), privateKeyBytes);
				return serializeSig(sig);
			},

			async signTypedData(typedData) {
				const hash = hashTypedDataFn(typedData);
				const sig = sign(hash, privateKeyBytes);
				return serializeSig(sig);
			},
		};
	};
}

export default privateKeyToAccount;
