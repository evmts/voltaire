// @ts-check
/**
 * Ethers v6-compatible Signer implementation using Voltaire primitives
 *
 * @module EthersSigner
 */

import { secp256k1 } from "@noble/curves/secp256k1.js";
import { EIP712 } from "../../src/crypto/EIP712/EIP712.js";
import { hash as keccak256 } from "../../src/crypto/Keccak256/hash.js";
import { sign as secp256k1Sign } from "../../src/crypto/Secp256k1/sign.js";
import { Address } from "../../src/primitives/Address/index.js";
import * as BrandedAddress from "../../src/primitives/Address/internal-index.js";
import { fromBytes as privateKeyFromBytes } from "../../src/primitives/PrivateKey/fromBytes.js";
import { Hash as SignedDataHash } from "../../src/primitives/SignedData/hash.js";

import {
	AddressMismatchError,
	ChainIdMismatchError,
	InvalidPrivateKeyError,
	InvalidTransactionError,
	MissingProviderError,
	SigningFailedError,
} from "./errors.js";

/**
 * @typedef {import('./EthersSignerTypes.js').SignerProvider} SignerProvider
 * @typedef {import('./EthersSignerTypes.js').TransactionRequest} TransactionRequest
 * @typedef {import('./EthersSignerTypes.js').PopulatedTransaction} PopulatedTransaction
 * @typedef {import('./EthersSignerTypes.js').TransactionResponse} TransactionResponse
 * @typedef {import('./EthersSignerTypes.js').TypedDataDomain} TypedDataDomain
 * @typedef {import('./EthersSignerTypes.js').TypedDataTypes} TypedDataTypes
 * @typedef {import('./EthersSignerTypes.js').BlockTag} BlockTag
 * @typedef {import('./EthersSignerTypes.js').Authorization} Authorization
 * @typedef {import('./EthersSignerTypes.js').SignedAuthorization} SignedAuthorization
 * @typedef {import('./EthersSignerTypes.js').EthersSignerOptions} EthersSignerOptions
 */

// Create message hasher with keccak256
const hashMessage = SignedDataHash({ keccak256 });

/**
 * Converts hex string to Uint8Array
 * @param {string} hex - Hex string (with or without 0x prefix)
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
 * Converts Uint8Array to hex string with 0x prefix
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function bytesToHex(bytes) {
	return `0x${Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")}`;
}

/**
 * Normalizes address to checksummed format
 * @param {string} address
 * @returns {string}
 */
function normalizeAddress(address) {
	const addr = Address.fromHex(address);
	return BrandedAddress.toChecksummed(addr);
}

/**
 * Ethers v6-compatible Signer using Voltaire primitives
 *
 * Implements the ethers Signer interface for signing transactions,
 * messages, and typed data using Voltaire's cryptographic primitives.
 *
 * @example
 * ```javascript
 * import { EthersSigner } from './examples/ethers-signer/EthersSigner.js';
 *
 * // Create signer from private key
 * const signer = EthersSigner.fromPrivateKey({
 *   privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
 * });
 *
 * // Sign a message
 * const signature = await signer.signMessage('Hello, Ethereum!');
 *
 * // Connect to provider and send transaction
 * const connected = signer.connect(provider);
 * const tx = await connected.sendTransaction({ to: '0x...', value: 1000000000000000000n });
 * ```
 */
export class EthersSigner {
	/** @type {string} */
	#address;

	/** @type {Uint8Array} */
	#privateKeyBytes;

	/** @type {SignerProvider | null} */
	#provider;

	/**
	 * @param {Uint8Array} privateKeyBytes
	 * @param {SignerProvider | null} provider
	 */
	constructor(privateKeyBytes, provider = null) {
		if (privateKeyBytes.length !== 32) {
			throw new InvalidPrivateKeyError("Private key must be 32 bytes");
		}

		// Validate not zero
		if (privateKeyBytes.every((b) => b === 0)) {
			throw new InvalidPrivateKeyError("Private key cannot be zero");
		}

		this.#privateKeyBytes = privateKeyBytes;
		this.#provider = provider;

		// Derive address from private key
		const publicKey = secp256k1.getPublicKey(privateKeyBytes, false);
		const pubkeyHash = keccak256(publicKey.slice(1));
		const addressBytes = pubkeyHash.slice(-20);
		const addressObj = Address.fromBytes(addressBytes);
		this.#address = BrandedAddress.toChecksummed(addressObj);
	}

	/**
	 * Creates a signer from a private key
	 * @param {EthersSignerOptions} options
	 * @returns {EthersSigner}
	 */
	static fromPrivateKey(options) {
		let privateKeyBytes;

		if (typeof options.privateKey === "string") {
			const hex = options.privateKey.startsWith("0x")
				? options.privateKey.slice(2)
				: options.privateKey;
			if (hex.length !== 64) {
				throw new InvalidPrivateKeyError(
					"Private key must be 32 bytes (64 hex characters)",
				);
			}
			privateKeyBytes = hexToBytes(options.privateKey);
		} else {
			privateKeyBytes = new Uint8Array(options.privateKey);
		}

		return new EthersSigner(privateKeyBytes, options.provider ?? null);
	}

	/**
	 * The checksummed address
	 * @returns {string}
	 */
	get address() {
		return this.#address;
	}

	/**
	 * The private key as hex string
	 * @returns {string}
	 */
	get privateKey() {
		return bytesToHex(this.#privateKeyBytes);
	}

	/**
	 * The connected provider
	 * @returns {SignerProvider | null}
	 */
	get provider() {
		return this.#provider;
	}

	/**
	 * Get the checksummed address
	 * @returns {Promise<string>}
	 */
	async getAddress() {
		return this.#address;
	}

	/**
	 * Connect to a provider
	 * @param {SignerProvider} provider
	 * @returns {EthersSigner}
	 */
	connect(provider) {
		return new EthersSigner(this.#privateKeyBytes, provider);
	}

	/**
	 * Sign raw hash with private key
	 * @param {Uint8Array} hash
	 * @returns {{ r: Uint8Array, s: Uint8Array, v: number }}
	 */
	#signHash(hash) {
		const privateKey = privateKeyFromBytes(this.#privateKeyBytes);
		const sig = secp256k1Sign(/** @type {any} */ (hash), privateKey);
		return {
			r: sig.r,
			s: sig.s,
			v: sig.v,
		};
	}

	/**
	 * Sign an EIP-191 personal message (synchronous)
	 * @param {string | Uint8Array} message
	 * @returns {string}
	 */
	signMessageSync(message) {
		const hash = hashMessage(message);
		const sig = this.#signHash(hash);

		// Return serialized signature: 0x + r + s + v
		const result = new Uint8Array(65);
		result.set(sig.r, 0);
		result.set(sig.s, 32);
		result[64] = sig.v;
		return bytesToHex(result);
	}

	/**
	 * Sign an EIP-191 personal message
	 * @param {string | Uint8Array} message
	 * @returns {Promise<string>}
	 */
	async signMessage(message) {
		return this.signMessageSync(message);
	}

	/**
	 * Sign EIP-712 typed data
	 * @param {TypedDataDomain} domain
	 * @param {TypedDataTypes} types
	 * @param {Record<string, unknown>} value
	 * @returns {Promise<string>}
	 */
	async signTypedData(domain, types, value) {
		// Helper to convert address strings to Address types recursively
		const convertAddresses = (obj, typeName) => {
			const typeFields = types[typeName];
			if (!typeFields) return obj;

			const result = { ...obj };
			for (const field of typeFields) {
				if (
					field.type === "address" &&
					typeof result[field.name] === "string"
				) {
					result[field.name] = Address.fromHex(result[field.name]);
				} else if (
					types[field.type] &&
					typeof result[field.name] === "object"
				) {
					// Nested struct
					result[field.name] = convertAddresses(result[field.name], field.type);
				}
			}
			return result;
		};

		// Determine primary type
		const primaryType =
			Object.keys(types).find((t) => t !== "EIP712Domain") ?? "";

		// Convert domain to EIP712 format
		const typedData = {
			domain: {
				name: domain.name,
				version: domain.version,
				chainId: domain.chainId ? BigInt(domain.chainId) : undefined,
				verifyingContract: domain.verifyingContract
					? Address.fromHex(domain.verifyingContract)
					: undefined,
				salt:
					typeof domain.salt === "string"
						? hexToBytes(domain.salt)
						: domain.salt,
			},
			types,
			primaryType,
			message: convertAddresses(value, primaryType),
		};

		const sig = EIP712.signTypedData(typedData, this.#privateKeyBytes);

		// Return serialized signature
		const result = new Uint8Array(65);
		result.set(sig.r, 0);
		result.set(sig.s, 32);
		result[64] = sig.v;
		return bytesToHex(result);
	}

	/**
	 * Ensures provider is connected
	 * @param {string} operation
	 * @returns {SignerProvider}
	 */
	#requireProvider(operation) {
		if (!this.#provider) {
			throw new MissingProviderError(operation);
		}
		return this.#provider;
	}

	/**
	 * Get nonce (transaction count)
	 * @param {BlockTag} [blockTag]
	 * @returns {Promise<number>}
	 */
	async getNonce(blockTag) {
		const provider = this.#requireProvider("getNonce");
		return provider.getTransactionCount(this.#address, blockTag);
	}

	/**
	 * Populate transaction for eth_call
	 * @param {TransactionRequest} tx
	 * @returns {Promise<PopulatedTransaction>}
	 */
	async populateCall(tx) {
		/** @type {PopulatedTransaction} */
		const pop = {
			from: this.#address,
			nonce: tx.nonce != null ? BigInt(tx.nonce) : 0n,
			gasLimit: tx.gasLimit != null ? BigInt(tx.gasLimit) : 0n,
			data: tx.data
				? typeof tx.data === "string"
					? hexToBytes(tx.data)
					: tx.data
				: new Uint8Array(0),
			value: tx.value != null ? BigInt(tx.value) : 0n,
			chainId: tx.chainId != null ? BigInt(tx.chainId) : 1n,
			type: tx.type ?? 2,
		};

		if (tx.to != null) {
			pop.to = normalizeAddress(tx.to);
		}

		if (tx.from != null) {
			const from = normalizeAddress(tx.from);
			if (from.toLowerCase() !== this.#address.toLowerCase()) {
				throw new AddressMismatchError(this.#address, from);
			}
		}

		return pop;
	}

	/**
	 * Populate a transaction with all required fields
	 * @param {TransactionRequest} tx
	 * @returns {Promise<PopulatedTransaction>}
	 */
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: compatibility layer
	async populateTransaction(tx) {
		const provider = this.#requireProvider("populateTransaction");
		const pop = await this.populateCall(tx);

		// Get network for chain ID
		const network = await provider.getNetwork();
		if (pop.chainId !== 0n && tx.chainId != null) {
			const requestedChainId = BigInt(tx.chainId);
			if (requestedChainId !== network.chainId) {
				throw new ChainIdMismatchError(network.chainId, requestedChainId);
			}
		}
		pop.chainId = network.chainId;

		// Get nonce if not provided
		if (tx.nonce == null) {
			pop.nonce = BigInt(await this.getNonce("pending"));
		}

		// Get gas limit if not provided
		if (tx.gasLimit == null) {
			pop.gasLimit = await this.estimateGas(tx);
		}

		// Handle gas pricing
		const hasEip1559 =
			tx.maxFeePerGas != null || tx.maxPriorityFeePerGas != null;
		const feeData = await provider.getFeeData();

		if (tx.gasPrice != null && (tx.type === 2 || hasEip1559)) {
			throw new InvalidTransactionError(
				"EIP-1559 transactions do not support gasPrice",
			);
		}

		if ((tx.type === 0 || tx.type === 1) && hasEip1559) {
			throw new InvalidTransactionError(
				"Legacy transactions do not support maxFeePerGas/maxPriorityFeePerGas",
			);
		}

		// Determine transaction type and gas pricing
		if (
			(tx.type === 2 || tx.type == null) &&
			tx.maxFeePerGas != null &&
			tx.maxPriorityFeePerGas != null
		) {
			// Fully specified EIP-1559
			pop.type = 2;
			pop.maxFeePerGas = BigInt(tx.maxFeePerGas);
			pop.maxPriorityFeePerGas = BigInt(tx.maxPriorityFeePerGas);
		} else if (tx.type === 0 || tx.type === 1) {
			// Legacy or EIP-2930
			pop.type = tx.type;
			if (tx.gasPrice != null) {
				pop.gasPrice = BigInt(tx.gasPrice);
			} else if (feeData.gasPrice != null) {
				pop.gasPrice = feeData.gasPrice;
			} else {
				throw new InvalidTransactionError("Network does not support gasPrice");
			}
		} else {
			// Auto-detect type
			if (
				feeData.maxFeePerGas != null &&
				feeData.maxPriorityFeePerGas != null
			) {
				pop.type = 2;
				if (tx.gasPrice != null) {
					// Convert legacy gasPrice to EIP-1559 fees
					const gasPrice = BigInt(tx.gasPrice);
					pop.maxFeePerGas = gasPrice;
					pop.maxPriorityFeePerGas = gasPrice;
				} else {
					pop.maxFeePerGas =
						tx.maxFeePerGas != null
							? BigInt(tx.maxFeePerGas)
							: feeData.maxFeePerGas;
					pop.maxPriorityFeePerGas =
						tx.maxPriorityFeePerGas != null
							? BigInt(tx.maxPriorityFeePerGas)
							: feeData.maxPriorityFeePerGas;
				}
			} else if (feeData.gasPrice != null) {
				// Network doesn't support EIP-1559
				if (hasEip1559) {
					throw new InvalidTransactionError(
						"Network does not support EIP-1559",
					);
				}
				pop.type = 0;
				pop.gasPrice =
					tx.gasPrice != null ? BigInt(tx.gasPrice) : feeData.gasPrice;
			} else {
				throw new InvalidTransactionError("Failed to get fee data");
			}
		}

		// Handle access list for EIP-2930+
		if (tx.accessList) {
			pop.accessList = tx.accessList;
		}

		return pop;
	}

	/**
	 * Estimate gas for a transaction
	 * @param {TransactionRequest} tx
	 * @returns {Promise<bigint>}
	 */
	async estimateGas(tx) {
		const provider = this.#requireProvider("estimateGas");
		const pop = await this.populateCall(tx);
		return provider.estimateGas(pop);
	}

	/**
	 * Execute eth_call
	 * @param {TransactionRequest} tx
	 * @returns {Promise<string>}
	 */
	async call(tx) {
		const provider = this.#requireProvider("call");
		const pop = await this.populateCall(tx);
		return provider.call(pop);
	}

	/**
	 * Resolve ENS name
	 * @param {string} name
	 * @returns {Promise<string | null>}
	 */
	async resolveName(name) {
		const provider = this.#requireProvider("resolveName");
		if (!provider.resolveName) {
			return null;
		}
		return provider.resolveName(name);
	}

	/**
	 * Sign a transaction
	 * @param {TransactionRequest} tx
	 * @returns {Promise<string>}
	 */
	async signTransaction(tx) {
		// Build transaction object
		const pop = await this.populateTransaction(tx);

		// Remove from field before signing
		const { from: _from, ...txWithoutFrom } = pop;

		// Import transaction serialization
		const { TransactionEIP1559 } = await import(
			"../../src/primitives/Transaction/EIP1559/index.js"
		);
		const { default: TransactionModule } = await import(
			"../../src/primitives/Transaction/index.js"
		);

		let signingHash;
		let signedTx;

		if (pop.type === 2) {
			// EIP-1559 transaction
			const unsignedTx = TransactionEIP1559({
				chainId: pop.chainId,
				nonce: pop.nonce,
				maxPriorityFeePerGas: pop.maxPriorityFeePerGas ?? 0n,
				maxFeePerGas: pop.maxFeePerGas ?? 0n,
				gasLimit: pop.gasLimit,
				to: pop.to ? Address.fromHex(pop.to) : null,
				value: pop.value,
				data: pop.data,
				accessList: (pop.accessList ?? []).map((item) => ({
					address: Address.fromHex(item.address),
					storageKeys: item.storageKeys.map((k) => hexToBytes(k)),
				})),
				yParity: 0,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			});

			signingHash = TransactionEIP1559.getSigningHash(unsignedTx);
			const sig = this.#signHash(signingHash);

			// Create signed transaction
			signedTx = TransactionEIP1559({
				...unsignedTx,
				yParity: sig.v - 27,
				r: sig.r,
				s: sig.s,
			});

			return bytesToHex(TransactionEIP1559.serialize(signedTx));
		}

		// Legacy transaction
		const { default: LegacyTx } = await import(
			"../../src/primitives/Transaction/Legacy/index.js"
		);

		const unsignedTx = {
			type: 0,
			nonce: pop.nonce,
			gasPrice: pop.gasPrice ?? 0n,
			gasLimit: pop.gasLimit,
			to: pop.to ? Address.fromHex(pop.to) : null,
			value: pop.value,
			data: pop.data,
			v: pop.chainId * 2n + 35n,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};

		signingHash = LegacyTx.getSigningHash(unsignedTx);
		const sig = this.#signHash(signingHash);

		// Calculate v value with chain ID (EIP-155)
		const v = BigInt(sig.v - 27) + pop.chainId * 2n + 35n;

		signedTx = {
			...unsignedTx,
			v,
			r: sig.r,
			s: sig.s,
		};

		return bytesToHex(LegacyTx.serialize(signedTx));
	}

	/**
	 * Sign and send a transaction
	 * @param {TransactionRequest} tx
	 * @returns {Promise<TransactionResponse>}
	 */
	async sendTransaction(tx) {
		const provider = this.#requireProvider("sendTransaction");
		const signedTx = await this.signTransaction(tx);
		return provider.broadcastTransaction(signedTx);
	}

	/**
	 * Sign EIP-7702 authorization (synchronous)
	 * @param {Authorization} auth
	 * @returns {SignedAuthorization}
	 */
	authorizeSync(auth) {
		const chainId = auth.chainId != null ? BigInt(auth.chainId) : 0n;
		const nonce = auth.nonce != null ? BigInt(auth.nonce) : 0n;
		const address = normalizeAddress(auth.address);

		// Hash authorization: keccak256(MAGIC || chainId || address || nonce)
		const MAGIC = 0x05;
		const chainIdBytes = bigintToBytes(chainId);
		const addressBytes = hexToBytes(address);
		const nonceBytes = bigintToBytes(nonce);

		const data = new Uint8Array(
			1 + chainIdBytes.length + 20 + nonceBytes.length,
		);
		let offset = 0;
		data[offset++] = MAGIC;
		data.set(chainIdBytes, offset);
		offset += chainIdBytes.length;
		data.set(addressBytes, offset);
		offset += 20;
		data.set(nonceBytes, offset);

		const hash = keccak256(data);
		const sig = this.#signHash(hash);

		return {
			address,
			chainId,
			nonce,
			signature: sig,
		};
	}

	/**
	 * Sign EIP-7702 authorization
	 * @param {Authorization} auth
	 * @returns {Promise<SignedAuthorization>}
	 */
	async authorize(auth) {
		// Populate chain ID and nonce if not provided
		let chainId = auth.chainId != null ? BigInt(auth.chainId) : undefined;
		let nonce = auth.nonce != null ? BigInt(auth.nonce) : undefined;

		if (chainId === undefined && this.#provider) {
			const network = await this.#provider.getNetwork();
			chainId = network.chainId;
		}

		if (nonce === undefined) {
			nonce = BigInt(await this.getNonce());
		}

		return this.authorizeSync({
			address: auth.address,
			chainId,
			nonce,
		});
	}
}

/**
 * Convert bigint to minimal bytes representation
 * @param {bigint} value
 * @returns {Uint8Array}
 */
function bigintToBytes(value) {
	if (value === 0n) return new Uint8Array(0);

	let hex = value.toString(16);
	if (hex.length % 2) hex = `0${hex}`;

	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
}

export default EthersSigner;
