/**
 * Transaction Types and Utilities
 *
 * Complete transaction encoding/decoding with type inference for all Ethereum transaction types.
 * All types namespaced under Transaction for intuitive access.
 *
 * Supports:
 * - Legacy (Type 0): Original format with fixed gas price
 * - EIP-2930 (Type 1): Access lists and explicit chain ID
 * - EIP-1559 (Type 2): Dynamic fee market
 * - EIP-4844 (Type 3): Blob transactions for L2 scaling
 * - EIP-7702 (Type 4): EOA delegation to smart contracts
 *
 * @example
 * ```typescript
 * import { Transaction } from './transaction.js';
 *
 * // Types
 * const legacy: Transaction.Legacy = { ... };
 * const eip1559: Transaction.EIP1559 = { ... };
 *
 * // Operations
 * const data = Transaction.serialize(tx);
 * const hash = Transaction.hash(tx);
 * const decoded = Transaction.deserialize(data);
 *
 * // Type-specific operations with this: pattern
 * const hash = Transaction.Legacy.hash.call(legacy);
 * const serialized = Transaction.EIP1559.serialize.call(eip1559);
 * ```
 */

import { Keccak256 } from "../crypto/keccak256.js";
import { Secp256k1 } from "../crypto/secp256k1.js";
import { Address } from "./Address/index.js";
import type { Hash } from "./Hash/index.js";
import { Rlp } from "./Rlp/index.js";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Encode bigint as big-endian bytes, removing leading zeros
 */
function encodeBigintCompact(value: bigint): Uint8Array {
	if (value === 0n) {
		return new Uint8Array(0);
	}

	// Calculate byte length needed
	let byteLength = 0;
	let temp = value;
	while (temp > 0n) {
		byteLength++;
		temp >>= 8n;
	}

	const bytes = new Uint8Array(byteLength);
	for (let i = byteLength - 1; i >= 0; i--) {
		bytes[i] = Number(value & 0xffn);
		value >>= 8n;
	}
	return bytes;
}

/**
 * Encode address for RLP (empty bytes for null, 20 bytes otherwise)
 */
function encodeAddress(address: Address | null): Uint8Array {
	if (address === null) {
		return new Uint8Array(0);
	}
	return address;
}

/**
 * Decode address from RLP bytes (null for empty, Address otherwise)
 */
function decodeAddress(bytes: Uint8Array): Address | null {
	if (bytes.length === 0) {
		return null;
	}
	if (bytes.length !== 20) {
		throw new Error(`Invalid address length: ${bytes.length}`);
	}
	return bytes as Address;
}

/**
 * Decode bigint from big-endian bytes
 */
function decodeBigint(bytes: Uint8Array): bigint {
	if (bytes.length === 0) {
		return 0n;
	}
	let result = 0n;
	for (let i = 0; i < bytes.length; i++) {
		result = (result << 8n) | BigInt(bytes[i]!);
	}
	return result;
}

/**
 * Recover Address from ECDSA signature
 */
function recoverAddress(
	signature: { r: Uint8Array; s: Uint8Array; v: number },
	messageHash: Hash,
): Address {
	// Recover 64-byte uncompressed public key (x || y)
	const publicKey = Secp256k1.recoverPublicKey(signature, messageHash);

	// Convert to x, y bigints (32 bytes each)
	let x = 0n;
	let y = 0n;
	for (let i = 0; i < 32; i++) {
		x = (x << 8n) | BigInt(publicKey[i]!);
		y = (y << 8n) | BigInt(publicKey[32 + i]!);
	}

	// Derive address from public key
	return Address.fromPublicKey(x, y);
}

/**
 * Encode access list for RLP
 */
function encodeAccessList(
	accessList: readonly { address: Address; storageKeys: readonly Hash[] }[],
): Rlp.Encodable[] {
	return accessList.map((item) => [
		item.address,
		item.storageKeys.map((key) => key as Uint8Array),
	]);
}

/**
 * Decode access list from RLP
 */
function decodeAccessList(
	data: Rlp.Data[],
): { address: Address; storageKeys: Hash[] }[] {
	return data.map((item) => {
		if (item.type !== "list" || item.value.length !== 2) {
			throw new Error("Invalid access list item");
		}

		const addressData = item.value[0];
		const keysData = item.value[1];

		if (addressData?.type !== "bytes" || addressData.value.length !== 20) {
			throw new Error("Invalid access list address");
		}

		if (keysData?.type !== "list") {
			throw new Error("Invalid access list storage keys");
		}

		const address = addressData.value as Address;
		const storageKeys = keysData.value.map((keyData) => {
			if (keyData.type !== "bytes" || keyData.value.length !== 32) {
				throw new Error("Invalid storage key");
			}
			return keyData.value as Hash;
		});

		return { address, storageKeys };
	});
}

/**
 * Encode authorization list for RLP (EIP-7702)
 */
function encodeAuthorizationList(
	authList: readonly {
		chainId: bigint;
		address: Address;
		nonce: bigint;
		yParity: number;
		r: Uint8Array;
		s: Uint8Array;
	}[],
): Rlp.Encodable[] {
	return authList.map((auth) => [
		encodeBigintCompact(auth.chainId),
		auth.address,
		encodeBigintCompact(auth.nonce),
		new Uint8Array([auth.yParity]),
		auth.r,
		auth.s,
	]);
}

/**
 * Decode authorization list from RLP (EIP-7702)
 */
function decodeAuthorizationList(data: Rlp.Data[]): {
	chainId: bigint;
	address: Address;
	nonce: bigint;
	yParity: number;
	r: Uint8Array;
	s: Uint8Array;
}[] {
	return data.map((item) => {
		if (item.type !== "list" || item.value.length !== 6) {
			throw new Error("Invalid authorization list item");
		}

		const chainId = decodeBigint(
			(item.value[0] as { type: "bytes"; value: Uint8Array }).value,
		);
		const addressBytes = (item.value[1] as { type: "bytes"; value: Uint8Array })
			.value;
		if (addressBytes.length !== 20) {
			throw new Error("Invalid authorization address");
		}
		const address = addressBytes as Address;
		const nonce = decodeBigint(
			(item.value[2] as { type: "bytes"; value: Uint8Array }).value,
		);
		const yParityBytes = (item.value[3] as { type: "bytes"; value: Uint8Array })
			.value;
		const yParity = yParityBytes.length > 0 ? yParityBytes[0]! : 0;
		const r = (item.value[4] as { type: "bytes"; value: Uint8Array }).value;
		const s = (item.value[5] as { type: "bytes"; value: Uint8Array }).value;

		return { chainId, address, nonce, yParity, r, s };
	});
}

// ============================================================================
// Main Transaction Namespace
// ============================================================================

export namespace Transaction {
	// ==========================================================================
	// Core Types
	// ==========================================================================

	/**
	 * Transaction type discriminator
	 */
	export enum Type {
		Legacy = 0x00,
		EIP2930 = 0x01,
		EIP1559 = 0x02,
		EIP4844 = 0x03,
		EIP7702 = 0x04,
	}

	/**
	 * Access list item for EIP-2930 and later transactions
	 */
	export type AccessListItem = {
		address: Address;
		storageKeys: readonly Hash[];
	};

	/**
	 * Access list (array of items)
	 */
	export type AccessList = readonly AccessListItem[];

	/**
	 * Authorization for EIP-7702 transactions
	 */
	export type Authorization = {
		chainId: bigint;
		address: Address;
		nonce: bigint;
		yParity: number;
		r: Uint8Array;
		s: Uint8Array;
	};

	/**
	 * Authorization list (array of authorizations)
	 */
	export type AuthorizationList = readonly Authorization[];

	/**
	 * Versioned hash for EIP-4844 blob transactions
	 */
	export type VersionedHash = Hash;

	/**
	 * Signature components (ECDSA secp256k1)
	 */
	export type Signature = {
		r: Uint8Array;
		s: Uint8Array;
	};

	// ==========================================================================
	// Legacy Transaction (Type 0)
	// ==========================================================================

	/**
	 * Legacy transaction (Type 0)
	 * Original Ethereum transaction format with fixed gas price
	 */
	export type Legacy = {
		type: Type.Legacy;
		nonce: bigint;
		gasPrice: bigint;
		gasLimit: bigint;
		to: Address | null;
		value: bigint;
		data: Uint8Array;
		v: bigint;
		r: Uint8Array;
		s: Uint8Array;
	};

	export namespace Legacy {
		/**
		 * Serialize legacy transaction to RLP encoded bytes
		 */
		export function serialize(this: Transaction.Legacy): Uint8Array {
			const fields = [
				encodeBigintCompact(this.nonce),
				encodeBigintCompact(this.gasPrice),
				encodeBigintCompact(this.gasLimit),
				encodeAddress(this.to),
				encodeBigintCompact(this.value),
				this.data,
				encodeBigintCompact(this.v),
				this.r,
				this.s,
			];
			return Rlp.encode.call(fields);
		}

		/**
		 * Compute transaction hash (keccak256 of serialized transaction)
		 */
		export function hash(this: Transaction.Legacy): Hash {
			return Keccak256.hash(serialize.call(this));
		}

		/**
		 * Get signing hash (hash of unsigned transaction for signature generation)
		 */
		export function getSigningHash(this: Transaction.Legacy): Hash {
			const chainId = getChainId.call(this);

			if (chainId !== null) {
				// EIP-155: [nonce, gasPrice, gasLimit, to, value, data, chainId, 0, 0]
				const fields = [
					encodeBigintCompact(this.nonce),
					encodeBigintCompact(this.gasPrice),
					encodeBigintCompact(this.gasLimit),
					encodeAddress(this.to),
					encodeBigintCompact(this.value),
					this.data,
					encodeBigintCompact(chainId),
					new Uint8Array(0), // 0
					new Uint8Array(0), // 0
				];
				return Keccak256.hash(Rlp.encode.call(fields));
			}
			// Pre-EIP-155: [nonce, gasPrice, gasLimit, to, value, data]
			const fields = [
				encodeBigintCompact(this.nonce),
				encodeBigintCompact(this.gasPrice),
				encodeBigintCompact(this.gasLimit),
				encodeAddress(this.to),
				encodeBigintCompact(this.value),
				this.data,
			];
			return Keccak256.hash(Rlp.encode.call(fields));
		}

		/**
		 * Deserialize RLP encoded legacy transaction
		 */
		export function deserialize(data: Uint8Array): Transaction.Legacy {
			const decoded = Rlp.decode.call(data);
			if (decoded.data.type !== "list") {
				throw new Error("Invalid legacy transaction: expected list");
			}

			const fields = decoded.data.value;
			if (fields.length !== 9) {
				throw new Error(
					`Invalid legacy transaction: expected 9 fields, got ${fields.length}`,
				);
			}

			// Validate all fields are bytes
			for (let i = 0; i < fields.length; i++) {
				if (fields[i]?.type !== "bytes") {
					throw new Error(
						`Invalid legacy transaction: field ${i} must be bytes`,
					);
				}
			}

			// Extract bytes from Data structures
			const nonce = decodeBigint(
				(fields[0] as { type: "bytes"; value: Uint8Array }).value,
			);
			const gasPrice = decodeBigint(
				(fields[1] as { type: "bytes"; value: Uint8Array }).value,
			);
			const gasLimit = decodeBigint(
				(fields[2] as { type: "bytes"; value: Uint8Array }).value,
			);
			const to = decodeAddress(
				(fields[3] as { type: "bytes"; value: Uint8Array }).value,
			);
			const value = decodeBigint(
				(fields[4] as { type: "bytes"; value: Uint8Array }).value,
			);
			const dataBytes = (fields[5] as { type: "bytes"; value: Uint8Array })
				.value;
			const v = decodeBigint(
				(fields[6] as { type: "bytes"; value: Uint8Array }).value,
			);
			const r = (fields[7] as { type: "bytes"; value: Uint8Array }).value;
			const s = (fields[8] as { type: "bytes"; value: Uint8Array }).value;

			return {
				type: Type.Legacy,
				nonce,
				gasPrice,
				gasLimit,
				to,
				value,
				data: dataBytes,
				v,
				r,
				s,
			};
		}

		/**
		 * Extract chain ID from v value (EIP-155)
		 */
		export function getChainId(this: Transaction.Legacy): bigint | null {
			// EIP-155: chainId = (v - 35) / 2 (if v >= 35)
			// Pre-EIP-155: null
			if (this.v < 35n) return null;
			return (this.v - 35n) / 2n;
		}

		/**
		 * Get sender address from signature
		 */
		export function getSender(this: Transaction.Legacy): Address {
			const signingHash = getSigningHash.call(this);

			// Convert EIP-155 v to recovery bit
			const chainId = getChainId.call(this);
			let v: number;
			if (chainId !== null) {
				// EIP-155: v = chainId * 2 + 35 + recoveryBit
				v = Number(this.v - chainId * 2n - 35n);
			} else {
				// Pre-EIP-155: v = 27 + recoveryBit
				v = Number(this.v);
			}

			return recoverAddress({ r: this.r, s: this.s, v }, signingHash);
		}

		/**
		 * Verify transaction signature
		 */
		export function verifySignature(this: Transaction.Legacy): boolean {
			try {
				const signingHash = getSigningHash.call(this);

				// Convert v to recovery bit
				const chainId = getChainId.call(this);
				let v: number;
				if (chainId !== null) {
					v = Number(this.v - chainId * 2n - 35n);
				} else {
					v = Number(this.v);
				}

				// Recover public key
				const publicKey = Secp256k1.recoverPublicKey(
					{ r: this.r, s: this.s, v },
					signingHash,
				);

				// Verify signature
				return Secp256k1.verify(
					{ r: this.r, s: this.s, v },
					signingHash,
					publicKey,
				);
			} catch {
				return false;
			}
		}
	}

	// ==========================================================================
	// EIP-2930 Transaction (Type 1)
	// ==========================================================================

	/**
	 * EIP-2930 transaction (Type 1)
	 * Adds access list and explicit chain ID for replay protection
	 */
	export type EIP2930 = {
		type: Type.EIP2930;
		chainId: bigint;
		nonce: bigint;
		gasPrice: bigint;
		gasLimit: bigint;
		to: Address | null;
		value: bigint;
		data: Uint8Array;
		accessList: AccessList;
		yParity: number;
		r: Uint8Array;
		s: Uint8Array;
	};

	export namespace EIP2930 {
		/**
		 * Serialize EIP-2930 transaction to RLP encoded bytes
		 */
		export function serialize(this: Transaction.EIP2930): Uint8Array {
			const fields = [
				encodeBigintCompact(this.chainId),
				encodeBigintCompact(this.nonce),
				encodeBigintCompact(this.gasPrice),
				encodeBigintCompact(this.gasLimit),
				encodeAddress(this.to),
				encodeBigintCompact(this.value),
				this.data,
				encodeAccessList(this.accessList),
				new Uint8Array([this.yParity]),
				this.r,
				this.s,
			];
			const rlpEncoded = Rlp.encode.call(fields);

			// Prepend type byte 0x01
			const result = new Uint8Array(1 + rlpEncoded.length);
			result[0] = Type.EIP2930;
			result.set(rlpEncoded, 1);
			return result;
		}

		/**
		 * Compute transaction hash
		 */
		export function hash(this: Transaction.EIP2930): Hash {
			return Keccak256.hash(serialize.call(this));
		}

		/**
		 * Get signing hash
		 */
		export function getSigningHash(this: Transaction.EIP2930): Hash {
			const fields = [
				encodeBigintCompact(this.chainId),
				encodeBigintCompact(this.nonce),
				encodeBigintCompact(this.gasPrice),
				encodeBigintCompact(this.gasLimit),
				encodeAddress(this.to),
				encodeBigintCompact(this.value),
				this.data,
				encodeAccessList(this.accessList),
			];
			const rlpEncoded = Rlp.encode.call(fields);

			// Prepend type byte 0x01
			const result = new Uint8Array(1 + rlpEncoded.length);
			result[0] = Type.EIP2930;
			result.set(rlpEncoded, 1);

			return Keccak256.hash(result);
		}

		/**
		 * Deserialize RLP encoded EIP-2930 transaction
		 */
		export function deserialize(data: Uint8Array): Transaction.EIP2930 {
			if (data.length === 0 || data[0] !== Type.EIP2930) {
				throw new Error(
					"Invalid EIP-2930 transaction: missing or wrong type byte",
				);
			}

			const rlpData = data.slice(1);
			const decoded = Rlp.decode.call(rlpData);

			if (decoded.data.type !== "list") {
				throw new Error("Invalid EIP-2930 transaction: expected list");
			}

			const fields = decoded.data.value;
			if (fields.length !== 11) {
				throw new Error(
					`Invalid EIP-2930 transaction: expected 11 fields, got ${fields.length}`,
				);
			}

			const chainId = decodeBigint(
				(fields[0] as { type: "bytes"; value: Uint8Array }).value,
			);
			const nonce = decodeBigint(
				(fields[1] as { type: "bytes"; value: Uint8Array }).value,
			);
			const gasPrice = decodeBigint(
				(fields[2] as { type: "bytes"; value: Uint8Array }).value,
			);
			const gasLimit = decodeBigint(
				(fields[3] as { type: "bytes"; value: Uint8Array }).value,
			);
			const to = decodeAddress(
				(fields[4] as { type: "bytes"; value: Uint8Array }).value,
			);
			const value = decodeBigint(
				(fields[5] as { type: "bytes"; value: Uint8Array }).value,
			);
			const dataBytes = (fields[6] as { type: "bytes"; value: Uint8Array })
				.value;
			const accessList = decodeAccessList(
				(fields[7] as { type: "list"; value: Rlp.Data[] }).value,
			);
			const yParityBytes = (fields[8] as { type: "bytes"; value: Uint8Array })
				.value;
			const yParity = yParityBytes.length > 0 ? yParityBytes[0]! : 0;
			const r = (fields[9] as { type: "bytes"; value: Uint8Array }).value;
			const s = (fields[10] as { type: "bytes"; value: Uint8Array }).value;

			return {
				type: Type.EIP2930,
				chainId,
				nonce,
				gasPrice,
				gasLimit,
				to,
				value,
				data: dataBytes,
				accessList,
				yParity,
				r,
				s,
			};
		}

		/**
		 * Get sender address from signature
		 */
		export function getSender(this: Transaction.EIP2930): Address {
			const signingHash = getSigningHash.call(this);
			const v = 27 + this.yParity;
			return recoverAddress({ r: this.r, s: this.s, v }, signingHash);
		}

		/**
		 * Verify transaction signature
		 */
		export function verifySignature(this: Transaction.EIP2930): boolean {
			try {
				const signingHash = getSigningHash.call(this);
				const v = 27 + this.yParity;
				const publicKey = Secp256k1.recoverPublicKey(
					{ r: this.r, s: this.s, v },
					signingHash,
				);
				return Secp256k1.verify(
					{ r: this.r, s: this.s, v },
					signingHash,
					publicKey,
				);
			} catch {
				return false;
			}
		}
	}

	// ==========================================================================
	// EIP-1559 Transaction (Type 2)
	// ==========================================================================

	/**
	 * EIP-1559 transaction (Type 2)
	 * Dynamic fee market with priority fee and max fee per gas
	 */
	export type EIP1559 = {
		type: Type.EIP1559;
		chainId: bigint;
		nonce: bigint;
		maxPriorityFeePerGas: bigint;
		maxFeePerGas: bigint;
		gasLimit: bigint;
		to: Address | null;
		value: bigint;
		data: Uint8Array;
		accessList: AccessList;
		yParity: number;
		r: Uint8Array;
		s: Uint8Array;
	};

	export namespace EIP1559 {
		/**
		 * Serialize EIP-1559 transaction to RLP encoded bytes
		 */
		export function serialize(this: Transaction.EIP1559): Uint8Array {
			const fields = [
				encodeBigintCompact(this.chainId),
				encodeBigintCompact(this.nonce),
				encodeBigintCompact(this.maxPriorityFeePerGas),
				encodeBigintCompact(this.maxFeePerGas),
				encodeBigintCompact(this.gasLimit),
				encodeAddress(this.to),
				encodeBigintCompact(this.value),
				this.data,
				encodeAccessList(this.accessList),
				new Uint8Array([this.yParity]),
				this.r,
				this.s,
			];
			const rlpEncoded = Rlp.encode.call(fields);

			// Prepend type byte 0x02
			const result = new Uint8Array(1 + rlpEncoded.length);
			result[0] = Type.EIP1559;
			result.set(rlpEncoded, 1);
			return result;
		}

		/**
		 * Compute transaction hash
		 */
		export function hash(this: Transaction.EIP1559): Hash {
			return Keccak256.hash(serialize.call(this));
		}

		/**
		 * Get signing hash
		 */
		export function getSigningHash(this: Transaction.EIP1559): Hash {
			const fields = [
				encodeBigintCompact(this.chainId),
				encodeBigintCompact(this.nonce),
				encodeBigintCompact(this.maxPriorityFeePerGas),
				encodeBigintCompact(this.maxFeePerGas),
				encodeBigintCompact(this.gasLimit),
				encodeAddress(this.to),
				encodeBigintCompact(this.value),
				this.data,
				encodeAccessList(this.accessList),
			];
			const rlpEncoded = Rlp.encode.call(fields);

			// Prepend type byte 0x02
			const result = new Uint8Array(1 + rlpEncoded.length);
			result[0] = Type.EIP1559;
			result.set(rlpEncoded, 1);

			return Keccak256.hash(result);
		}

		/**
		 * Deserialize RLP encoded EIP-1559 transaction
		 */
		export function deserialize(data: Uint8Array): Transaction.EIP1559 {
			if (data.length === 0 || data[0] !== Type.EIP1559) {
				throw new Error(
					"Invalid EIP-1559 transaction: missing or wrong type byte",
				);
			}

			const rlpData = data.slice(1);
			const decoded = Rlp.decode.call(rlpData);

			if (decoded.data.type !== "list") {
				throw new Error("Invalid EIP-1559 transaction: expected list");
			}

			const fields = decoded.data.value;
			if (fields.length !== 12) {
				throw new Error(
					`Invalid EIP-1559 transaction: expected 12 fields, got ${fields.length}`,
				);
			}

			const chainId = decodeBigint(
				(fields[0] as { type: "bytes"; value: Uint8Array }).value,
			);
			const nonce = decodeBigint(
				(fields[1] as { type: "bytes"; value: Uint8Array }).value,
			);
			const maxPriorityFeePerGas = decodeBigint(
				(fields[2] as { type: "bytes"; value: Uint8Array }).value,
			);
			const maxFeePerGas = decodeBigint(
				(fields[3] as { type: "bytes"; value: Uint8Array }).value,
			);
			const gasLimit = decodeBigint(
				(fields[4] as { type: "bytes"; value: Uint8Array }).value,
			);
			const to = decodeAddress(
				(fields[5] as { type: "bytes"; value: Uint8Array }).value,
			);
			const value = decodeBigint(
				(fields[6] as { type: "bytes"; value: Uint8Array }).value,
			);
			const dataBytes = (fields[7] as { type: "bytes"; value: Uint8Array })
				.value;
			const accessList = decodeAccessList(
				(fields[8] as { type: "list"; value: Rlp.Data[] }).value,
			);
			const yParityBytes = (fields[9] as { type: "bytes"; value: Uint8Array })
				.value;
			const yParity = yParityBytes.length > 0 ? yParityBytes[0]! : 0;
			const r = (fields[10] as { type: "bytes"; value: Uint8Array }).value;
			const s = (fields[11] as { type: "bytes"; value: Uint8Array }).value;

			return {
				type: Type.EIP1559,
				chainId,
				nonce,
				maxPriorityFeePerGas,
				maxFeePerGas,
				gasLimit,
				to,
				value,
				data: dataBytes,
				accessList,
				yParity,
				r,
				s,
			};
		}

		/**
		 * Get sender address from signature
		 */
		export function getSender(this: Transaction.EIP1559): Address {
			const signingHash = getSigningHash.call(this);
			const v = 27 + this.yParity;
			return recoverAddress({ r: this.r, s: this.s, v }, signingHash);
		}

		/**
		 * Verify transaction signature
		 */
		export function verifySignature(this: Transaction.EIP1559): boolean {
			try {
				const signingHash = getSigningHash.call(this);
				const v = 27 + this.yParity;
				const publicKey = Secp256k1.recoverPublicKey(
					{ r: this.r, s: this.s, v },
					signingHash,
				);
				return Secp256k1.verify(
					{ r: this.r, s: this.s, v },
					signingHash,
					publicKey,
				);
			} catch {
				return false;
			}
		}

		/**
		 * Calculate effective gas price given base fee
		 */
		export function getEffectiveGasPrice(
			this: Transaction.EIP1559,
			baseFee: bigint,
		): bigint {
			const maxPriorityFee = this.maxPriorityFeePerGas;
			const maxFee = this.maxFeePerGas;
			const effectivePriorityFee =
				maxFee - baseFee < maxPriorityFee ? maxFee - baseFee : maxPriorityFee;
			return baseFee + effectivePriorityFee;
		}
	}

	// ==========================================================================
	// EIP-4844 Transaction (Type 3)
	// ==========================================================================

	/**
	 * EIP-4844 blob transaction (Type 3)
	 * Adds blob data support for layer 2 scaling with separate blob gas market
	 */
	export type EIP4844 = {
		type: Type.EIP4844;
		chainId: bigint;
		nonce: bigint;
		maxPriorityFeePerGas: bigint;
		maxFeePerGas: bigint;
		gasLimit: bigint;
		to: Address; // Note: Cannot be null for blob transactions
		value: bigint;
		data: Uint8Array;
		accessList: AccessList;
		maxFeePerBlobGas: bigint;
		blobVersionedHashes: readonly VersionedHash[];
		yParity: number;
		r: Uint8Array;
		s: Uint8Array;
	};

	export namespace EIP4844 {
		/**
		 * Serialize EIP-4844 transaction to RLP encoded bytes
		 */
		export function serialize(this: Transaction.EIP4844): Uint8Array {
			const fields = [
				encodeBigintCompact(this.chainId),
				encodeBigintCompact(this.nonce),
				encodeBigintCompact(this.maxPriorityFeePerGas),
				encodeBigintCompact(this.maxFeePerGas),
				encodeBigintCompact(this.gasLimit),
				this.to, // Note: Cannot be null for blob transactions
				encodeBigintCompact(this.value),
				this.data,
				encodeAccessList(this.accessList),
				encodeBigintCompact(this.maxFeePerBlobGas),
				this.blobVersionedHashes.map((h) => h as Uint8Array),
				new Uint8Array([this.yParity]),
				this.r,
				this.s,
			];
			const rlpEncoded = Rlp.encode.call(fields);

			// Prepend type byte 0x03
			const result = new Uint8Array(1 + rlpEncoded.length);
			result[0] = Type.EIP4844;
			result.set(rlpEncoded, 1);
			return result;
		}

		/**
		 * Compute transaction hash
		 */
		export function hash(this: Transaction.EIP4844): Hash {
			return Keccak256.hash(serialize.call(this));
		}

		/**
		 * Get signing hash
		 */
		export function getSigningHash(this: Transaction.EIP4844): Hash {
			const fields = [
				encodeBigintCompact(this.chainId),
				encodeBigintCompact(this.nonce),
				encodeBigintCompact(this.maxPriorityFeePerGas),
				encodeBigintCompact(this.maxFeePerGas),
				encodeBigintCompact(this.gasLimit),
				this.to,
				encodeBigintCompact(this.value),
				this.data,
				encodeAccessList(this.accessList),
				encodeBigintCompact(this.maxFeePerBlobGas),
				this.blobVersionedHashes.map((h) => h as Uint8Array),
			];
			const rlpEncoded = Rlp.encode.call(fields);

			// Prepend type byte 0x03
			const result = new Uint8Array(1 + rlpEncoded.length);
			result[0] = Type.EIP4844;
			result.set(rlpEncoded, 1);

			return Keccak256.hash(result);
		}

		/**
		 * Deserialize RLP encoded EIP-4844 transaction
		 */
		export function deserialize(data: Uint8Array): Transaction.EIP4844 {
			if (data.length === 0 || data[0] !== Type.EIP4844) {
				throw new Error(
					"Invalid EIP-4844 transaction: missing or wrong type byte",
				);
			}

			const rlpData = data.slice(1);
			const decoded = Rlp.decode.call(rlpData);

			if (decoded.data.type !== "list") {
				throw new Error("Invalid EIP-4844 transaction: expected list");
			}

			const fields = decoded.data.value;
			if (fields.length !== 14) {
				throw new Error(
					`Invalid EIP-4844 transaction: expected 14 fields, got ${fields.length}`,
				);
			}

			const chainId = decodeBigint(
				(fields[0] as { type: "bytes"; value: Uint8Array }).value,
			);
			const nonce = decodeBigint(
				(fields[1] as { type: "bytes"; value: Uint8Array }).value,
			);
			const maxPriorityFeePerGas = decodeBigint(
				(fields[2] as { type: "bytes"; value: Uint8Array }).value,
			);
			const maxFeePerGas = decodeBigint(
				(fields[3] as { type: "bytes"; value: Uint8Array }).value,
			);
			const gasLimit = decodeBigint(
				(fields[4] as { type: "bytes"; value: Uint8Array }).value,
			);
			const toBytes = (fields[5] as { type: "bytes"; value: Uint8Array }).value;
			if (toBytes.length !== 20) {
				throw new Error(
					"EIP-4844 transaction to address must be 20 bytes (cannot be null)",
				);
			}
			const to = toBytes as Address;
			const value = decodeBigint(
				(fields[6] as { type: "bytes"; value: Uint8Array }).value,
			);
			const dataBytes = (fields[7] as { type: "bytes"; value: Uint8Array })
				.value;
			const accessList = decodeAccessList(
				(fields[8] as { type: "list"; value: Rlp.Data[] }).value,
			);
			const maxFeePerBlobGas = decodeBigint(
				(fields[9] as { type: "bytes"; value: Uint8Array }).value,
			);

			const blobHashesData = fields[10] as { type: "list"; value: Rlp.Data[] };
			if (blobHashesData.type !== "list") {
				throw new Error("Invalid blob versioned hashes");
			}
			const blobVersionedHashes = blobHashesData.value.map((hashData) => {
				if (hashData.type !== "bytes" || hashData.value.length !== 32) {
					throw new Error("Invalid blob versioned hash");
				}
				return hashData.value as Hash;
			});

			const yParityBytes = (fields[11] as { type: "bytes"; value: Uint8Array })
				.value;
			const yParity = yParityBytes.length > 0 ? yParityBytes[0]! : 0;
			const r = (fields[12] as { type: "bytes"; value: Uint8Array }).value;
			const s = (fields[13] as { type: "bytes"; value: Uint8Array }).value;

			return {
				type: Type.EIP4844,
				chainId,
				nonce,
				maxPriorityFeePerGas,
				maxFeePerGas,
				gasLimit,
				to,
				value,
				data: dataBytes,
				accessList,
				maxFeePerBlobGas,
				blobVersionedHashes,
				yParity,
				r,
				s,
			};
		}

		/**
		 * Get sender address from signature
		 */
		export function getSender(this: Transaction.EIP4844): Address {
			const signingHash = getSigningHash.call(this);
			const v = 27 + this.yParity;
			return recoverAddress({ r: this.r, s: this.s, v }, signingHash);
		}

		/**
		 * Verify transaction signature
		 */
		export function verifySignature(this: Transaction.EIP4844): boolean {
			try {
				const signingHash = getSigningHash.call(this);
				const v = 27 + this.yParity;
				const publicKey = Secp256k1.recoverPublicKey(
					{ r: this.r, s: this.s, v },
					signingHash,
				);
				return Secp256k1.verify(
					{ r: this.r, s: this.s, v },
					signingHash,
					publicKey,
				);
			} catch {
				return false;
			}
		}

		/**
		 * Calculate effective gas price given base fee
		 */
		export function getEffectiveGasPrice(
			this: Transaction.EIP4844,
			baseFee: bigint,
		): bigint {
			const maxPriorityFee = this.maxPriorityFeePerGas;
			const maxFee = this.maxFeePerGas;
			const effectivePriorityFee =
				maxFee - baseFee < maxPriorityFee ? maxFee - baseFee : maxPriorityFee;
			return baseFee + effectivePriorityFee;
		}

		/**
		 * Calculate total blob gas cost
		 */
		export function getBlobGasCost(
			this: Transaction.EIP4844,
			blobBaseFee: bigint,
		): bigint {
			// Each blob is 128 KB = 131072 bytes, gas per blob is fixed
			const gasPerBlob = 131072n;
			const blobCount = BigInt(this.blobVersionedHashes.length);
			return blobCount * gasPerBlob * blobBaseFee;
		}
	}

	// ==========================================================================
	// EIP-7702 Transaction (Type 4)
	// ==========================================================================

	/**
	 * EIP-7702 transaction (Type 4)
	 * EOA delegation to smart contracts with authorization list
	 */
	export type EIP7702 = {
		type: Type.EIP7702;
		chainId: bigint;
		nonce: bigint;
		maxPriorityFeePerGas: bigint;
		maxFeePerGas: bigint;
		gasLimit: bigint;
		to: Address | null;
		value: bigint;
		data: Uint8Array;
		accessList: AccessList;
		authorizationList: AuthorizationList;
		yParity: number;
		r: Uint8Array;
		s: Uint8Array;
	};

	export namespace EIP7702 {
		/**
		 * Serialize EIP-7702 transaction to RLP encoded bytes
		 */
		export function serialize(this: Transaction.EIP7702): Uint8Array {
			const fields = [
				encodeBigintCompact(this.chainId),
				encodeBigintCompact(this.nonce),
				encodeBigintCompact(this.maxPriorityFeePerGas),
				encodeBigintCompact(this.maxFeePerGas),
				encodeBigintCompact(this.gasLimit),
				encodeAddress(this.to),
				encodeBigintCompact(this.value),
				this.data,
				encodeAccessList(this.accessList),
				encodeAuthorizationList(this.authorizationList),
				new Uint8Array([this.yParity]),
				this.r,
				this.s,
			];
			const rlpEncoded = Rlp.encode.call(fields);

			// Prepend type byte 0x04
			const result = new Uint8Array(1 + rlpEncoded.length);
			result[0] = Type.EIP7702;
			result.set(rlpEncoded, 1);
			return result;
		}

		/**
		 * Compute transaction hash
		 */
		export function hash(this: Transaction.EIP7702): Hash {
			return Keccak256.hash(serialize.call(this));
		}

		/**
		 * Get signing hash
		 */
		export function getSigningHash(this: Transaction.EIP7702): Hash {
			const fields = [
				encodeBigintCompact(this.chainId),
				encodeBigintCompact(this.nonce),
				encodeBigintCompact(this.maxPriorityFeePerGas),
				encodeBigintCompact(this.maxFeePerGas),
				encodeBigintCompact(this.gasLimit),
				encodeAddress(this.to),
				encodeBigintCompact(this.value),
				this.data,
				encodeAccessList(this.accessList),
				encodeAuthorizationList(this.authorizationList),
			];
			const rlpEncoded = Rlp.encode.call(fields);

			// Prepend type byte 0x04
			const result = new Uint8Array(1 + rlpEncoded.length);
			result[0] = Type.EIP7702;
			result.set(rlpEncoded, 1);

			return Keccak256.hash(result);
		}

		/**
		 * Deserialize RLP encoded EIP-7702 transaction
		 */
		export function deserialize(data: Uint8Array): Transaction.EIP7702 {
			if (data.length === 0 || data[0] !== Type.EIP7702) {
				throw new Error(
					"Invalid EIP-7702 transaction: missing or wrong type byte",
				);
			}

			const rlpData = data.slice(1);
			const decoded = Rlp.decode.call(rlpData);

			if (decoded.data.type !== "list") {
				throw new Error("Invalid EIP-7702 transaction: expected list");
			}

			const fields = decoded.data.value;
			if (fields.length !== 13) {
				throw new Error(
					`Invalid EIP-7702 transaction: expected 13 fields, got ${fields.length}`,
				);
			}

			const chainId = decodeBigint(
				(fields[0] as { type: "bytes"; value: Uint8Array }).value,
			);
			const nonce = decodeBigint(
				(fields[1] as { type: "bytes"; value: Uint8Array }).value,
			);
			const maxPriorityFeePerGas = decodeBigint(
				(fields[2] as { type: "bytes"; value: Uint8Array }).value,
			);
			const maxFeePerGas = decodeBigint(
				(fields[3] as { type: "bytes"; value: Uint8Array }).value,
			);
			const gasLimit = decodeBigint(
				(fields[4] as { type: "bytes"; value: Uint8Array }).value,
			);
			const to = decodeAddress(
				(fields[5] as { type: "bytes"; value: Uint8Array }).value,
			);
			const value = decodeBigint(
				(fields[6] as { type: "bytes"; value: Uint8Array }).value,
			);
			const dataBytes = (fields[7] as { type: "bytes"; value: Uint8Array })
				.value;
			const accessList = decodeAccessList(
				(fields[8] as { type: "list"; value: Rlp.Data[] }).value,
			);
			const authorizationList = decodeAuthorizationList(
				(fields[9] as { type: "list"; value: Rlp.Data[] }).value,
			);
			const yParityBytes = (fields[10] as { type: "bytes"; value: Uint8Array })
				.value;
			const yParity = yParityBytes.length > 0 ? yParityBytes[0]! : 0;
			const r = (fields[11] as { type: "bytes"; value: Uint8Array }).value;
			const s = (fields[12] as { type: "bytes"; value: Uint8Array }).value;

			return {
				type: Type.EIP7702,
				chainId,
				nonce,
				maxPriorityFeePerGas,
				maxFeePerGas,
				gasLimit,
				to,
				value,
				data: dataBytes,
				accessList,
				authorizationList,
				yParity,
				r,
				s,
			};
		}

		/**
		 * Get sender address from signature
		 */
		export function getSender(this: Transaction.EIP7702): Address {
			const signingHash = getSigningHash.call(this);
			const v = 27 + this.yParity;
			return recoverAddress({ r: this.r, s: this.s, v }, signingHash);
		}

		/**
		 * Verify transaction signature
		 */
		export function verifySignature(this: Transaction.EIP7702): boolean {
			try {
				const signingHash = getSigningHash.call(this);
				const v = 27 + this.yParity;
				const publicKey = Secp256k1.recoverPublicKey(
					{ r: this.r, s: this.s, v },
					signingHash,
				);
				return Secp256k1.verify(
					{ r: this.r, s: this.s, v },
					signingHash,
					publicKey,
				);
			} catch {
				return false;
			}
		}

		/**
		 * Calculate effective gas price given base fee
		 */
		export function getEffectiveGasPrice(
			this: Transaction.EIP7702,
			baseFee: bigint,
		): bigint {
			const maxPriorityFee = this.maxPriorityFeePerGas;
			const maxFee = this.maxFeePerGas;
			const effectivePriorityFee =
				maxFee - baseFee < maxPriorityFee ? maxFee - baseFee : maxPriorityFee;
			return baseFee + effectivePriorityFee;
		}
	}

	// ==========================================================================
	// Authorization Operations
	// ==========================================================================

	export namespace Authorization {
		/**
		 * Get signing hash for authorization
		 *
		 * Per EIP-7702: keccak256(MAGIC || rlp([chain_id, address, nonce]))
		 * MAGIC = 0x05
		 */
		export function getSigningHash(this: Transaction.Authorization): Hash {
			const MAGIC = 0x05;
			const fields = [
				encodeBigintCompact(this.chainId),
				this.address,
				encodeBigintCompact(this.nonce),
			];
			const rlpEncoded = Rlp.encode.call(fields);

			// Prepend magic byte
			const data = new Uint8Array(1 + rlpEncoded.length);
			data[0] = MAGIC;
			data.set(rlpEncoded, 1);

			return Keccak256.hash(data);
		}

		/**
		 * Verify authorization signature
		 */
		export function verifySignature(this: Transaction.Authorization): boolean {
			try {
				const signingHash = getSigningHash.call(this);
				const v = 27 + this.yParity;
				const publicKey = Secp256k1.recoverPublicKey(
					{ r: this.r, s: this.s, v },
					signingHash,
				);
				return Secp256k1.verify(
					{ r: this.r, s: this.s, v },
					signingHash,
					publicKey,
				);
			} catch {
				return false;
			}
		}

		/**
		 * Get authorizing address from signature
		 */
		export function getAuthorizer(this: Transaction.Authorization): Address {
			const signingHash = getSigningHash.call(this);
			const v = 27 + this.yParity;
			return recoverAddress({ r: this.r, s: this.s, v }, signingHash);
		}
	}

	// ==========================================================================
	// Union Type and Type Guards
	// ==========================================================================

	/**
	 * Any transaction type
	 */
	export type Any = Legacy | EIP2930 | EIP1559 | EIP4844 | EIP7702;

	/**
	 * Type guard: Check if transaction is Legacy
	 */
	export function isLegacy(tx: Any): tx is Legacy {
		return tx.type === Type.Legacy;
	}

	/**
	 * Type guard: Check if transaction is EIP-2930
	 */
	export function isEIP2930(tx: Any): tx is EIP2930 {
		return tx.type === Type.EIP2930;
	}

	/**
	 * Type guard: Check if transaction is EIP-1559
	 */
	export function isEIP1559(tx: Any): tx is EIP1559 {
		return tx.type === Type.EIP1559;
	}

	/**
	 * Type guard: Check if transaction is EIP-4844
	 */
	export function isEIP4844(tx: Any): tx is EIP4844 {
		return tx.type === Type.EIP4844;
	}

	/**
	 * Type guard: Check if transaction is EIP-7702
	 */
	export function isEIP7702(tx: Any): tx is EIP7702 {
		return tx.type === Type.EIP7702;
	}

	// ==========================================================================
	// Transaction-Level Operations (operate on any transaction type)
	// ==========================================================================

	/**
	 * Detect transaction type from encoded data (standard form)
	 *
	 * @param data - RLP encoded transaction data
	 * @returns Transaction type
	 *
	 * @example
	 * ```typescript
	 * const type = Transaction.detectType(txData);
	 * if (type === Transaction.Type.EIP1559) { ... }
	 * ```
	 */
	export function detectType(data: Uint8Array): Type {
		if (data.length === 0) {
			throw new Error("Empty transaction data");
		}

		// Typed transactions start with a byte < 0xc0 (RLP list marker)
		const firstByte = data[0];
		if (firstByte === undefined) {
			throw new Error("Invalid transaction data");
		}

		if (firstByte < 0xc0) {
			// EIP-2718 typed transaction
			if (firstByte === Type.Legacy) return Type.Legacy;
			if (firstByte === Type.EIP2930) return Type.EIP2930;
			if (firstByte === Type.EIP1559) return Type.EIP1559;
			if (firstByte === Type.EIP4844) return Type.EIP4844;
			if (firstByte === Type.EIP7702) return Type.EIP7702;
			throw new Error(`Unknown transaction type: 0x${firstByte.toString(16)}`);
		}

		// Legacy RLP encoded transaction
		return Type.Legacy;
	}

	/**
	 * Serialize transaction to RLP encoded bytes (standard form)
	 *
	 * @param tx - Transaction of any type
	 * @returns RLP encoded transaction
	 *
	 * @example
	 * ```typescript
	 * const serialized = Transaction.serialize(tx);
	 * ```
	 */
	export function serialize(tx: Any): Uint8Array {
		switch (tx.type) {
			case Type.Legacy:
				return Legacy.serialize.call(tx);
			case Type.EIP2930:
				return EIP2930.serialize.call(tx);
			case Type.EIP1559:
				return EIP1559.serialize.call(tx);
			case Type.EIP4844:
				return EIP4844.serialize.call(tx);
			case Type.EIP7702:
				return EIP7702.serialize.call(tx);
			default:
				throw new Error(`Unknown transaction type: ${(tx as any).type}`);
		}
	}

	/**
	 * Compute transaction hash (standard form)
	 *
	 * @param tx - Transaction of any type
	 * @returns 32-byte transaction hash
	 *
	 * @example
	 * ```typescript
	 * const txHash = Transaction.hash(tx);
	 * ```
	 */
	export function hash(tx: Any): Hash {
		switch (tx.type) {
			case Type.Legacy:
				return Legacy.hash.call(tx);
			case Type.EIP2930:
				return EIP2930.hash.call(tx);
			case Type.EIP1559:
				return EIP1559.hash.call(tx);
			case Type.EIP4844:
				return EIP4844.hash.call(tx);
			case Type.EIP7702:
				return EIP7702.hash.call(tx);
			default:
				throw new Error(`Unknown transaction type: ${(tx as any).type}`);
		}
	}

	/**
	 * Get signing hash for transaction (standard form)
	 *
	 * @param tx - Transaction of any type
	 * @returns Hash that should be signed
	 *
	 * @example
	 * ```typescript
	 * const signingHash = Transaction.getSigningHash(tx);
	 * ```
	 */
	export function getSigningHash(tx: Any): Hash {
		switch (tx.type) {
			case Type.Legacy:
				return Legacy.getSigningHash.call(tx);
			case Type.EIP2930:
				return EIP2930.getSigningHash.call(tx);
			case Type.EIP1559:
				return EIP1559.getSigningHash.call(tx);
			case Type.EIP4844:
				return EIP4844.getSigningHash.call(tx);
			case Type.EIP7702:
				return EIP7702.getSigningHash.call(tx);
			default:
				throw new Error(`Unknown transaction type: ${(tx as any).type}`);
		}
	}

	/**
	 * Deserialize RLP encoded transaction (standard form)
	 *
	 * @param data - RLP encoded transaction data
	 * @returns Decoded transaction
	 *
	 * @example
	 * ```typescript
	 * const tx = Transaction.deserialize(encodedData);
	 * if (Transaction.isEIP1559(tx)) {
	 *   console.log(tx.maxFeePerGas);
	 * }
	 * ```
	 */
	export function deserialize(data: Uint8Array): Any {
		const type = detectType(data);
		switch (type) {
			case Type.Legacy:
				return Legacy.deserialize(data);
			case Type.EIP2930:
				return EIP2930.deserialize(data);
			case Type.EIP1559:
				return EIP1559.deserialize(data);
			case Type.EIP4844:
				return EIP4844.deserialize(data);
			case Type.EIP7702:
				return EIP7702.deserialize(data);
			default:
				throw new Error(`Unknown transaction type: ${type}`);
		}
	}

	/**
	 * Get sender address from transaction signature (standard form)
	 *
	 * @param tx - Transaction of any type
	 * @returns Sender address
	 *
	 * @example
	 * ```typescript
	 * const sender = Transaction.getSender(tx);
	 * ```
	 */
	export function getSender(tx: Any): Address {
		switch (tx.type) {
			case Type.Legacy:
				return Legacy.getSender.call(tx);
			case Type.EIP2930:
				return EIP2930.getSender.call(tx);
			case Type.EIP1559:
				return EIP1559.getSender.call(tx);
			case Type.EIP4844:
				return EIP4844.getSender.call(tx);
			case Type.EIP7702:
				return EIP7702.getSender.call(tx);
			default:
				throw new Error(`Unknown transaction type: ${(tx as any).type}`);
		}
	}

	/**
	 * Verify transaction signature (standard form)
	 *
	 * @param tx - Transaction of any type
	 * @returns True if signature is valid
	 *
	 * @example
	 * ```typescript
	 * if (Transaction.verifySignature(tx)) {
	 *   console.log('Valid signature');
	 * }
	 * ```
	 */
	export function verifySignature(tx: Any): boolean {
		switch (tx.type) {
			case Type.Legacy:
				return Legacy.verifySignature.call(tx);
			case Type.EIP2930:
				return EIP2930.verifySignature.call(tx);
			case Type.EIP1559:
				return EIP1559.verifySignature.call(tx);
			case Type.EIP4844:
				return EIP4844.verifySignature.call(tx);
			case Type.EIP7702:
				return EIP7702.verifySignature.call(tx);
			default:
				throw new Error(`Unknown transaction type: ${(tx as any).type}`);
		}
	}

	// ==========================================================================
	// Utility Functions
	// ==========================================================================

	/**
	 * Format transaction to human-readable string
	 *
	 * @example "EIP-1559 tx from 0x742d...f251e to 0x1234...5678, value: 1.5 ETH"
	 */
	export function format(tx: Any): string {
		const typeNames = {
			[Type.Legacy]: "Legacy",
			[Type.EIP2930]: "EIP-2930",
			[Type.EIP1559]: "EIP-1559",
			[Type.EIP4844]: "EIP-4844",
			[Type.EIP7702]: "EIP-7702",
		};

		const typeName = typeNames[tx.type];
		const toStr = tx.to ? `to ${tx.to}` : "contract creation";
		const valueEth = Number(tx.value) / 1e18;

		return `${typeName} tx ${toStr}, value: ${valueEth} ETH, nonce: ${tx.nonce}`;
	}

	/**
	 * Get transaction gas price (handles different types)
	 */
	export function getGasPrice(tx: Any, baseFee?: bigint): bigint {
		if (isLegacy(tx) || isEIP2930(tx)) {
			return tx.gasPrice;
		}

		if (!baseFee) {
			throw new Error("baseFee required for EIP-1559+ transactions");
		}

		if (isEIP1559(tx)) {
			return EIP1559.getEffectiveGasPrice.call(tx, baseFee);
		}

		if (isEIP4844(tx)) {
			return EIP4844.getEffectiveGasPrice.call(tx, baseFee);
		}

		if (isEIP7702(tx)) {
			return EIP7702.getEffectiveGasPrice.call(tx, baseFee);
		}

		throw new Error(`Unknown transaction type: ${(tx as any).type}`);
	}

	/**
	 * Check if transaction has access list
	 */
	export function hasAccessList(tx: Any): boolean {
		return !isLegacy(tx);
	}

	/**
	 * Get access list (empty for legacy transactions)
	 */
	export function getAccessList(tx: Any): AccessList {
		if (isLegacy(tx)) {
			return [];
		}
		return tx.accessList;
	}

	/**
	 * Get chain ID (null for pre-EIP-155 legacy transactions)
	 */
	export function getChainId(tx: Any): bigint | null {
		if (isLegacy(tx)) {
			return Legacy.getChainId.call(tx);
		}
		return tx.chainId;
	}

	/**
	 * Assert transaction is signed (has non-zero signature)
	 */
	export function assertSigned(tx: Any): void {
		const isZeroR = tx.r.every((b) => b === 0);
		const isZeroS = tx.s.every((b) => b === 0);

		if (isZeroR || isZeroS) {
			throw new Error("Transaction is not signed");
		}
	}

	/**
	 * Check if transaction is signed
	 */
	export function isSigned(tx: Any): boolean {
		try {
			assertSigned(tx);
			return true;
		} catch {
			return false;
		}
	}
}

/**
 * Complete Transaction type (same as Transaction.Any)
 *
 * Uses TypeScript declaration merging - Transaction is both a namespace and a type.
 */
export type Transaction = Transaction.Any;

// Re-export namespace as default
export default Transaction;
