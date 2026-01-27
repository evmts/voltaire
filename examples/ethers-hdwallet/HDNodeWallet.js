// @ts-nocheck
/**
 * Ethers-compatible HDNodeWallet using Voltaire primitives
 *
 * @example
 * ```javascript
 * import { HDNodeWallet } from './HDNodeWallet.js';
 *
 * // From phrase (most common)
 * const wallet = HDNodeWallet.fromPhrase("abandon abandon abandon ...");
 *
 * // Derive accounts
 * const account0 = wallet.derivePath("m/44'/60'/0'/0/0");
 * console.log(account0.address);
 * ```
 */

import { secp256k1 } from "@noble/curves/secp256k1.js";
import { Keccak256, Address } from "@tevm/voltaire";
import { HDWallet } from "@tevm/voltaire/HDWallet";
import { Mnemonic } from "./Mnemonic.js";
import {
	InvalidExtendedKeyError,
	InvalidIndexError,
	InvalidPathError,
	InvalidSeedError,
	UnsupportedOperationError,
} from "./errors.js";
import { LangEn } from "./wordlists/LangEn.js";

/**
 * @typedef {import('./EthersHDWalletTypes.js').DerivationPath} DerivationPath
 * @typedef {import('./EthersHDWalletTypes.js').HexString} HexString
 * @typedef {import('./EthersHDWalletTypes.js').Wordlist} Wordlist
 * @typedef {import('./EthersHDWalletTypes.js').MnemonicLike} MnemonicLike
 */

/** Default Ethereum derivation path (BIP-44) */
export const defaultPath = "m/44'/60'/0'/0/0";

/** Hardened bit for BIP-32 derivation */
const HardenedBit = 0x80000000;

const _guard = Symbol("hdwallet-guard");

/**
 * Ethers-compatible HD Node Wallet
 * Provides BIP-32 hierarchical deterministic key derivation
 */
export class HDNodeWallet {
	/** @type {import('@scure/bip32').HDKey} */
	#key;
	/** @type {MnemonicLike | null} */
	#mnemonic;
	/** @type {string | null} */
	#path;

	/**
	 * @param {symbol} guard - Private constructor guard
	 * @param {import('@scure/bip32').HDKey} key - Internal HD key
	 * @param {MnemonicLike | null} mnemonic - Source mnemonic
	 * @param {string | null} path - Derivation path
	 */
	constructor(guard, key, mnemonic, path) {
		if (guard !== _guard) {
			throw new Error(
				"Use HDNodeWallet.fromPhrase(), fromMnemonic(), fromSeed(), or fromExtendedKey()",
			);
		}
		this.#key = key;
		this.#mnemonic = mnemonic;
		this.#path = path;
	}

	// ===== Properties =====

	/** @returns {HexString} Compressed public key (33 bytes hex) */
	get publicKey() {
		return bytesToHex(this.#key.publicKey);
	}

	/** @returns {HexString} Private key (32 bytes hex) */
	get privateKey() {
		if (!this.#key.privateKey) {
			throw new UnsupportedOperationError("This is a public-only key");
		}
		return bytesToHex(this.#key.privateKey);
	}

	/** @returns {string} Checksummed Ethereum address */
	get address() {
		// Derive address from uncompressed public key
		const pubKey = this.#key.publicKey;
		// Get uncompressed key (remove prefix, hash x||y)
		const uncompressed = uncompressPublicKey(pubKey);
		const hash = Keccak256.hash(uncompressed.slice(1)); // Remove 0x04 prefix
		const addressBytes = hash.slice(-20);
		const addr = Address.fromBytes(addressBytes);
		return Address.toChecksummed(addr);
	}

	/** @returns {HexString} 4-byte fingerprint */
	get fingerprint() {
		return numberToHex32(this.#key.fingerprint);
	}

	/** @returns {HexString} Parent fingerprint */
	get parentFingerprint() {
		return numberToHex32(this.#key.parentFingerprint);
	}

	/** @returns {HexString} Chain code */
	get chainCode() {
		return bytesToHex(this.#key.chainCode);
	}

	/** @returns {DerivationPath | null} Derivation path */
	get path() {
		return this.#path;
	}

	/** @returns {number} Child index */
	get index() {
		return this.#key.index;
	}

	/** @returns {number} Derivation depth */
	get depth() {
		return this.#key.depth;
	}

	/** @returns {MnemonicLike | null} Source mnemonic */
	get mnemonic() {
		return this.#mnemonic;
	}

	/** @returns {string} Extended private key (xprv...) */
	get extendedKey() {
		if (!this.#key.privateKey) {
			return this.#key.publicExtendedKey;
		}
		return this.#key.privateExtendedKey;
	}

	// ===== Instance Methods =====

	/**
	 * Derive child by path
	 * @param {string} path - Derivation path (e.g., "m/44'/60'/0'/0/0" or "0/0")
	 * @returns {HDNodeWallet}
	 */
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: ethers compatibility
	derivePath(path) {
		const components = path.split("/");
		if (components.length === 0) {
			throw new InvalidPathError("Empty path", { path });
		}

		// Handle "m" prefix
		if (components[0] === "m") {
			if (this.#key.depth !== 0) {
				throw new InvalidPathError(
					`Cannot derive root path for node at depth ${this.#key.depth}`,
					{ path, depth: this.#key.depth },
				);
			}
			components.shift();
		}

		let result = this;
		for (let i = 0; i < components.length; i++) {
			const component = components[i];
			if (component.match(/^[0-9]+'$/)) {
				// Hardened
				const index = Number.parseInt(component.slice(0, -1));
				if (index >= HardenedBit) {
					throw new InvalidPathError(`Invalid path index: ${component}`, {
						path,
						component,
					});
				}
				result = result.deriveChild(HardenedBit + index);
			} else if (component.match(/^[0-9]+$/)) {
				// Normal
				const index = Number.parseInt(component);
				if (index >= HardenedBit) {
					throw new InvalidPathError(`Invalid path index: ${component}`, {
						path,
						component,
					});
				}
				result = result.deriveChild(index);
			} else {
				throw new InvalidPathError(`Invalid path component: ${component}`, {
					path,
					component,
				});
			}
		}
		return result;
	}

	/**
	 * Derive child by index
	 * @param {number} index - Child index (add HardenedBit for hardened)
	 * @returns {HDNodeWallet}
	 */
	deriveChild(index) {
		if (index < 0 || index > 0xffffffff) {
			throw new InvalidIndexError(`Invalid index: ${index}`, { index });
		}

		if (index >= HardenedBit && !this.#key.privateKey) {
			throw new UnsupportedOperationError(
				"Cannot derive hardened child from public key",
				{ index },
			);
		}

		const childKey = this.#key.deriveChild(index);

		// Update path
		let childPath = this.#path;
		if (childPath) {
			const childIndex = index & ~HardenedBit;
			childPath += `/${childIndex}`;
			if (index >= HardenedBit) {
				childPath += "'";
			}
		}

		return new HDNodeWallet(_guard, childKey, this.#mnemonic, childPath);
	}

	/**
	 * Create neutered (public-only) wallet
	 * @returns {HDNodeVoidWallet}
	 */
	neuter() {
		const publicKey = this.#key.publicKey;
		const neuteredKey = this.#key.wipePrivateData();
		return new HDNodeVoidWallet(
			_guard,
			neuteredKey,
			this.#path,
			this.address,
			bytesToHex(publicKey),
		);
	}

	/**
	 * Type guard for path presence
	 * @returns {boolean}
	 */
	hasPath() {
		return this.#path !== null;
	}

	// ===== Signer Methods =====

	/**
	 * Sign message with EIP-191 prefix
	 * @param {string | Uint8Array} message - Message to sign
	 * @returns {Promise<HexString>} Signature (0x + r + s + v)
	 */
	async signMessage(message) {
		const msgBytes =
			typeof message === "string" ? new TextEncoder().encode(message) : message;
		const prefix = new TextEncoder().encode(
			`\x19Ethereum Signed Message:\n${msgBytes.length}`,
		);
		const combined = new Uint8Array(prefix.length + msgBytes.length);
		combined.set(prefix);
		combined.set(msgBytes, prefix.length);
		const hash = Keccak256.hash(combined);

		const sig = secp256k1.sign(hash, this.#key.privateKey);

		const r = sig.r.toString(16).padStart(64, "0");
		const s = sig.s.toString(16).padStart(64, "0");
		const v = (sig.recovery + 27).toString(16).padStart(2, "0");

		return `0x${r}${s}${v}`;
	}

	/**
	 * Sign transaction
	 * @param {any} transaction - Transaction to sign
	 * @returns {Promise<any>} Signed transaction
	 */
	async signTransaction(transaction) {
		const { Transaction } = await import("@tevm/voltaire");
		const signingHash = Transaction.getSigningHash(transaction);

		const sig = secp256k1.sign(signingHash, this.#key.privateKey);

		const r = new Uint8Array(32);
		const s = new Uint8Array(32);
		const rHex = sig.r.toString(16).padStart(64, "0");
		const sHex = sig.s.toString(16).padStart(64, "0");
		for (let i = 0; i < 32; i++) {
			r[i] = Number.parseInt(rHex.slice(i * 2, i * 2 + 2), 16);
			s[i] = Number.parseInt(sHex.slice(i * 2, i * 2 + 2), 16);
		}

		if (transaction.type === 0) {
			const chainId = transaction.chainId ?? 0n;
			const v = BigInt(sig.recovery) + 35n + chainId * 2n;
			return { ...transaction, v, r, s };
		}

		return { ...transaction, yParity: sig.recovery, r, s };
	}

	/**
	 * Sign EIP-712 typed data
	 * @param {any} typedData - Typed data
	 * @returns {Promise<HexString>} Signature
	 */
	async signTypedData(typedData) {
		const { EIP712 } = await import("@tevm/voltaire");
		const hash = EIP712.hashTypedData(typedData);

		const sig = secp256k1.sign(hash, this.#key.privateKey);

		const r = sig.r.toString(16).padStart(64, "0");
		const s = sig.s.toString(16).padStart(64, "0");
		const v = (sig.recovery + 27).toString(16).padStart(2, "0");

		return `0x${r}${s}${v}`;
	}

	// ===== Static Factory Methods =====

	/**
	 * Create from Mnemonic instance
	 * @param {MnemonicLike} mnemonic - Mnemonic instance
	 * @param {DerivationPath} [path] - Derivation path
	 * @returns {HDNodeWallet}
	 */
	static fromMnemonic(mnemonic, path = defaultPath) {
		const seed = mnemonic.computeSeed();
		const root = HDWallet.fromSeed(seed);
		const derived = HDWallet.derivePath(root, path);
		return new HDNodeWallet(_guard, derived, mnemonic, path);
	}

	/**
	 * Create from phrase string
	 * @param {string} phrase - Mnemonic phrase
	 * @param {string} [password=""] - Optional passphrase
	 * @param {DerivationPath} [path] - Derivation path
	 * @param {Wordlist} [wordlist] - Wordlist
	 * @returns {HDNodeWallet}
	 */
	static fromPhrase(phrase, password, path, wordlist) {
		const mnemonic = Mnemonic.fromPhrase(
			phrase,
			password ?? "",
			wordlist ?? LangEn.wordlist(),
		);
		return HDNodeWallet.fromMnemonic(mnemonic, path);
	}

	/**
	 * Create from raw seed
	 * @param {Uint8Array} seed - 16-64 byte seed
	 * @returns {HDNodeWallet}
	 */
	static fromSeed(seed) {
		if (seed.length < 16 || seed.length > 64) {
			throw new InvalidSeedError("Seed must be 16-64 bytes", {
				length: seed.length,
			});
		}
		const root = HDWallet.fromSeed(seed);
		return new HDNodeWallet(_guard, root, null, "m");
	}

	/**
	 * Create from extended key (xprv or xpub)
	 * @param {string} extendedKey - Base58-encoded extended key
	 * @returns {HDNodeWallet | HDNodeVoidWallet}
	 */
	static fromExtendedKey(extendedKey) {
		try {
			const key = HDWallet.fromExtendedKey(extendedKey);
			if (key.privateKey) {
				return new HDNodeWallet(_guard, key, null, null);
			}
			// Return void wallet for xpub
			return new HDNodeVoidWallet(
				_guard,
				key,
				null,
				computeAddressFromPublicKey(key.publicKey),
				bytesToHex(key.publicKey),
			);
		} catch (error) {
			throw new InvalidExtendedKeyError(
				`Invalid extended key: ${error.message}`,
				{ key: "[REDACTED]" },
			);
		}
	}

	/**
	 * Create random wallet
	 * @param {string} [password=""] - Optional passphrase
	 * @param {DerivationPath} [path] - Derivation path
	 * @param {Wordlist} [wordlist] - Wordlist
	 * @returns {HDNodeWallet}
	 */
	static createRandom(password, path, wordlist) {
		const entropy = crypto.getRandomValues(new Uint8Array(16));
		const mnemonic = Mnemonic.fromEntropy(
			entropy,
			password ?? "",
			wordlist ?? LangEn.wordlist(),
		);
		return HDNodeWallet.fromMnemonic(mnemonic, path);
	}
}

/**
 * Public-key-only HD Node (cannot sign, can derive non-hardened children)
 */
export class HDNodeVoidWallet {
	/** @type {import('@scure/bip32').HDKey} */
	#key;
	/** @type {string | null} */
	#path;
	/** @type {string} */
	#address;
	/** @type {HexString} */
	#publicKey;

	/**
	 * @param {symbol} guard - Private constructor guard
	 * @param {import('@scure/bip32').HDKey} key - Internal HD key
	 * @param {string | null} path - Derivation path
	 * @param {string} address - Ethereum address
	 * @param {HexString} publicKey - Public key hex
	 */
	constructor(guard, key, path, address, publicKey) {
		if (guard !== _guard) {
			throw new Error("Use HDNodeWallet.neuter() or fromExtendedKey()");
		}
		this.#key = key;
		this.#path = path;
		this.#address = address;
		this.#publicKey = publicKey;
	}

	/** @returns {HexString} */
	get publicKey() {
		return this.#publicKey;
	}

	/** @returns {string} */
	get address() {
		return this.#address;
	}

	/** @returns {HexString} */
	get fingerprint() {
		return numberToHex32(this.#key.fingerprint);
	}

	/** @returns {HexString} */
	get parentFingerprint() {
		return numberToHex32(this.#key.parentFingerprint);
	}

	/** @returns {HexString} */
	get chainCode() {
		return bytesToHex(this.#key.chainCode);
	}

	/** @returns {DerivationPath | null} */
	get path() {
		return this.#path;
	}

	/** @returns {number} */
	get index() {
		return this.#key.index;
	}

	/** @returns {number} */
	get depth() {
		return this.#key.depth;
	}

	/** @returns {string} */
	get extendedKey() {
		return this.#key.publicExtendedKey;
	}

	/**
	 * Derive child by path (non-hardened only)
	 * @param {string} path - Derivation path
	 * @returns {HDNodeVoidWallet}
	 */
	derivePath(path) {
		const components = path.split("/");
		if (components.length === 0) {
			throw new InvalidPathError("Empty path", { path });
		}

		if (components[0] === "m") {
			if (this.#key.depth !== 0) {
				throw new InvalidPathError(
					`Cannot derive root path for node at depth ${this.#key.depth}`,
					{ path, depth: this.#key.depth },
				);
			}
			components.shift();
		}

		let result = this;
		for (const component of components) {
			if (component.includes("'")) {
				throw new UnsupportedOperationError(
					"Cannot derive hardened path from public key",
					{ path, component },
				);
			}
			if (!component.match(/^[0-9]+$/)) {
				throw new InvalidPathError(`Invalid path component: ${component}`, {
					path,
					component,
				});
			}
			const index = Number.parseInt(component);
			result = result.deriveChild(index);
		}
		return result;
	}

	/**
	 * Derive child by index (non-hardened only)
	 * @param {number} index - Child index
	 * @returns {HDNodeVoidWallet}
	 */
	deriveChild(index) {
		if (index < 0 || index >= HardenedBit) {
			throw new UnsupportedOperationError(
				"Cannot derive hardened child from public key",
				{ index },
			);
		}

		const childKey = this.#key.deriveChild(index);

		let childPath = this.#path;
		if (childPath) {
			childPath += `/${index}`;
		}

		return new HDNodeVoidWallet(
			_guard,
			childKey,
			childPath,
			computeAddressFromPublicKey(childKey.publicKey),
			bytesToHex(childKey.publicKey),
		);
	}

	/**
	 * Type guard for path presence
	 * @returns {boolean}
	 */
	hasPath() {
		return this.#path !== null;
	}
}

// ===== Helper Functions =====

/**
 * Get BIP-44 account path (Ledger style)
 * @param {number} index - Account index
 * @returns {string}
 */
export function getAccountPath(index) {
	if (index < 0 || index >= HardenedBit) {
		throw new InvalidIndexError(`Invalid account index: ${index}`, { index });
	}
	return `m/44'/60'/${index}'/0/0`;
}

/**
 * Get indexed account path (MetaMask style)
 * @param {number} index - Account index
 * @returns {string}
 */
export function getIndexedAccountPath(index) {
	if (index < 0 || index >= HardenedBit) {
		throw new InvalidIndexError(`Invalid account index: ${index}`, { index });
	}
	return `m/44'/60'/0'/0/${index}`;
}

/**
 * Convert bytes to hex string
 * @param {Uint8Array} bytes - Bytes
 * @returns {HexString}
 */
function bytesToHex(bytes) {
	if (!bytes) return "0x";
	return `0x${Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")}`;
}

/**
 * Convert 32-bit number to 8-char hex string (4 bytes)
 * @param {number} num - 32-bit number
 * @returns {HexString}
 */
function numberToHex32(num) {
	return `0x${(num >>> 0).toString(16).padStart(8, "0")}`;
}

/**
 * Uncompress secp256k1 public key
 * @param {Uint8Array} compressed - 33-byte compressed key
 * @returns {Uint8Array} 65-byte uncompressed key (with 0x04 prefix)
 */
function uncompressPublicKey(compressed) {
	// Convert to hex string for Point.fromHex
	const hex = Array.from(compressed)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	const point = secp256k1.Point.fromHex(hex);
	return point.toBytes(false); // Uncompressed (with 0x04 prefix)
}

/**
 * Compute Ethereum address from compressed public key
 * @param {Uint8Array} publicKey - Compressed public key
 * @returns {string} Checksummed address
 */
function computeAddressFromPublicKey(publicKey) {
	const uncompressed = uncompressPublicKey(publicKey);
	const hash = Keccak256.hash(uncompressed.slice(1));
	const addressBytes = hash.slice(-20);
	const addr = Address.fromBytes(addressBytes);
	return Address.toChecksummed(addr);
}

export default HDNodeWallet;
