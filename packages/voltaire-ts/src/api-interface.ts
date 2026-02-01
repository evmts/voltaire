/**
 * Shared API interface that all entrypoints (JS, WASM, Native) must satisfy.
 * This ensures compile-time errors if any entrypoint's API doesn't match.
 *
 * The JS entrypoint (src/index.ts) is the source of truth.
 * WASM (src/wasm/index.ts) and Native (src/native/index.ts) must match this interface.
 */

import type { Blake2 } from "./crypto/Blake2/index.js";
import type { Bls12381 } from "./crypto/Bls12381/Bls12381.js";
import type { BN254 } from "./crypto/bn254/BN254.js";
import type { Ed25519 } from "./crypto/Ed25519/index.js";
import type { EIP712 } from "./crypto/EIP712/index.js";
// Crypto types
import type { Keccak256 } from "./crypto/Keccak256/index.js";
import type { KZG } from "./crypto/KZG/index.js";
import type { ModExp } from "./crypto/ModExp/index.js";
import type { P256 } from "./crypto/P256/index.js";
import type { Ripemd160 } from "./crypto/Ripemd160/index.js";
import type { Secp256k1 } from "./crypto/Secp256k1/index.js";
import type { SHA256 } from "./crypto/SHA256/index.js";
import type { X25519 } from "./crypto/X25519/X25519.js";
import type { Abi } from "./primitives/Abi/Abi.js";
import type { AccessList } from "./primitives/AccessList/index.js";
// Re-export types from the source of truth
import type { Address } from "./primitives/Address/index.js";
import type { Blob } from "./primitives/Blob/index.js";
import type { BloomFilter } from "./primitives/BloomFilter/index.js";
import type { Bytecode } from "./primitives/Bytecode/index.js";
import type { Bytes } from "./primitives/Bytes/Bytes.js";
import type { Bytes32 } from "./primitives/Bytes/Bytes32/index.js";
import type { Chain } from "./primitives/Chain/index.js";
import type { Ether, Gwei, Wei } from "./primitives/Denomination/index.js";
import type { Hash } from "./primitives/Hash/index.js";
import type { Hex } from "./primitives/Hex/index.js";
import type { Opcode } from "./primitives/Opcode/index.js";
import type { Rlp } from "./primitives/Rlp/index.js";
import type { Siwe } from "./primitives/Siwe/index.js";
import type { StorageKey } from "./primitives/State/index.js";
import type { Uint } from "./primitives/Uint/Uint.js";

/**
 * Core primitives that all entrypoints must export
 */
export interface VoltairePrimitives {
	// Core types
	Address: typeof Address;
	Hash: typeof Hash;
	Hex: typeof Hex;
	Uint: typeof Uint;

	// Encoding
	Rlp: typeof Rlp;
	Abi: typeof Abi;

	// EVM
	Blob: typeof Blob;
	AccessList: typeof AccessList;
	Bytecode: typeof Bytecode;
	Chain: typeof Chain;
	Opcode: typeof Opcode;

	// Data structures
	BloomFilter: typeof BloomFilter;

	// Standards
	Siwe: typeof Siwe;

	// Bytes types
	Bytes: typeof Bytes;
	Bytes32: typeof Bytes32;
	StorageKey: typeof StorageKey;

	// Denomination
	Wei: typeof Wei;
	Gwei: typeof Gwei;
	Ether: typeof Ether;
}

/**
 * Crypto operations that all entrypoints must export
 */
export interface VoltaireCrypto {
	// Hashing
	Keccak256: typeof Keccak256;
	SHA256: typeof SHA256;
	Blake2: typeof Blake2;
	Ripemd160: typeof Ripemd160;

	// Signatures & Keys
	Secp256k1: typeof Secp256k1;
	Ed25519: typeof Ed25519;
	P256: typeof P256;
	X25519: typeof X25519;

	// Curves
	BN254: typeof BN254;
	Bls12381: typeof Bls12381;

	// Advanced
	KZG: typeof KZG;
	EIP712: typeof EIP712;
	ModExp: typeof ModExp;
}

/**
 * Complete Voltaire API interface
 * All entrypoints must satisfy this interface for type-safe interoperability
 */
export interface VoltaireAPI extends VoltairePrimitives, VoltaireCrypto {}

/**
 * Type guard to check if an object satisfies VoltaireAPI
 */
export function isVoltaireAPI(obj: unknown): obj is VoltaireAPI {
	if (typeof obj !== "object" || obj === null) return false;
	const api = obj as Record<string, unknown>;

	// Check required primitives
	const requiredPrimitives = [
		"Address",
		"Hash",
		"Hex",
		"Uint",
		"Rlp",
		"Abi",
		"Blob",
		"AccessList",
		"Bytecode",
		"Chain",
	];

	// Check required crypto
	const requiredCrypto = [
		"Keccak256",
		"SHA256",
		"Blake2",
		"Ripemd160",
		"Secp256k1",
		"Ed25519",
		"P256",
		"X25519",
		"BN254",
		"Bls12381",
		"KZG",
		"EIP712",
		"ModExp",
	];

	for (const key of [...requiredPrimitives, ...requiredCrypto]) {
		if (!(key in api)) return false;
	}

	return true;
}
