/**
 * Ethereum Transaction Types
 *
 * Comprehensive support for all Ethereum transaction types:
 * - Legacy (Type 0)
 * - EIP-1559 (Type 2)
 * - EIP-7702 (Type 4)
 */

import { keccak256, keccak256Hex } from "./keccak";
import {
	type RlpDecoded,
	type RlpInput,
	decode as decodeRlp,
	encodeList as encodeRlp,
	fromHex,
	toHex,
} from "./rlp";

// Transaction Types
export type TransactionType = "legacy" | "eip1559" | "eip7702";

// Access List Types (EIP-2930)
export interface AccessListItem {
	address: string;
	storageKeys: string[];
}

export type AccessList = AccessListItem[];

// Authorization Type (EIP-7702)
export interface Authorization {
	chainId: bigint;
	address: string;
	nonce: bigint;
	v: bigint;
	r: string;
	s: string;
}

// Blob Type (EIP-4844)
export interface Blob {
	data: Uint8Array;
	commitment: string;
	proof: string;
	versionedHash: string;
}

// Legacy Transaction (Type 0)
export interface LegacyTransaction {
	type?: "legacy";
	nonce: bigint;
	gasPrice: bigint;
	gasLimit: bigint;
	to?: string;
	value: bigint;
	data: string;
	v: bigint;
	r: string;
	s: string;
}

// EIP-1559 Transaction (Type 2)
export interface Eip1559Transaction {
	type: "eip1559";
	chainId: bigint;
	nonce: bigint;
	maxPriorityFeePerGas: bigint;
	maxFeePerGas: bigint;
	gasLimit: bigint;
	to?: string;
	value: bigint;
	data: string;
	accessList: AccessList;
	v: bigint;
	r: string;
	s: string;
}

// EIP-7702 Transaction (Type 4)
export interface Eip7702Transaction {
	type: "eip7702";
	chainId: bigint;
	nonce: bigint;
	maxPriorityFeePerGas: bigint;
	maxFeePerGas: bigint;
	gasLimit: bigint;
	to?: string;
	value: bigint;
	data: string;
	accessList: AccessList;
	authorizationList: Authorization[];
	v: bigint;
	r: string;
	s: string;
}

// Union type for all transactions
export type Transaction =
	| LegacyTransaction
	| Eip1559Transaction
	| Eip7702Transaction;

/**
 * Encode a legacy transaction for signing (EIP-155)
 */
export function encodeLegacyForSigning(
	tx: LegacyTransaction,
	chainId: bigint,
): string {
	// Helper to convert addresses and hex strings to bytes
	const hexToBytes = (hex: string): Uint8Array => {
		const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
		const bytes = new Uint8Array(clean.length / 2);
		for (let i = 0; i < clean.length; i += 2) {
			bytes[i / 2] = Number.parseInt(clean.slice(i, i + 2), 16);
		}
		return bytes;
	};

	const fields: RlpInput[] = [
		tx.nonce,
		tx.gasPrice,
		tx.gasLimit,
		tx.to ? hexToBytes(tx.to) : new Uint8Array([]),
		tx.value,
		hexToBytes(tx.data),
	];

	// For unsigned transactions, add EIP-155 fields
	if (tx.v === 0n) {
		fields.push(chainId, 0n, 0n);
	} else {
		fields.push(tx.v, hexToBytes(tx.r), hexToBytes(tx.s));
	}

	const encoded = encodeRlp(fields);
	return toHex(encoded);
}

/**
 * Serialize a legacy transaction to RLP-encoded hex string
 */
export function serializeLegacy(tx: LegacyTransaction): string {
	return encodeLegacyForSigning(tx, 1n);
}

/**
 * Encode an EIP-1559 transaction for signing
 */
export function encodeEip1559ForSigning(tx: Eip1559Transaction): string {
	// Helper to convert hex strings to bytes
	const hexToBytes = (hex: string): Uint8Array => {
		const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
		const bytes = new Uint8Array(clean.length / 2);
		for (let i = 0; i < clean.length; i += 2) {
			bytes[i / 2] = Number.parseInt(clean.slice(i, i + 2), 16);
		}
		return bytes;
	};

	const fields: RlpInput[] = [
		tx.chainId,
		tx.nonce,
		tx.maxPriorityFeePerGas,
		tx.maxFeePerGas,
		tx.gasLimit,
		tx.to ? hexToBytes(tx.to) : new Uint8Array([]),
		tx.value,
		hexToBytes(tx.data),
		encodeAccessListRlp(tx.accessList, hexToBytes),
	];

	// Add signature fields if signed
	if (tx.v !== 0n) {
		fields.push(tx.v, hexToBytes(tx.r), hexToBytes(tx.s));
	}

	const encoded = encodeRlp(fields);
	const result = new Uint8Array(1 + encoded.length);
	result[0] = 0x02; // EIP-1559 type
	result.set(encoded, 1);
	return toHex(result);
}

/**
 * Serialize an EIP-1559 transaction to RLP-encoded hex string
 */
export function serializeEip1559(tx: Eip1559Transaction): string {
	return encodeEip1559ForSigning(tx);
}

/**
 * Encode an EIP-7702 transaction for signing
 */
export function encodeEip7702ForSigning(tx: Eip7702Transaction): string {
	// Helper to convert hex strings to bytes
	const hexToBytes = (hex: string): Uint8Array => {
		const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
		const bytes = new Uint8Array(clean.length / 2);
		for (let i = 0; i < clean.length; i += 2) {
			bytes[i / 2] = Number.parseInt(clean.slice(i, i + 2), 16);
		}
		return bytes;
	};

	const fields: RlpInput[] = [
		tx.chainId,
		tx.nonce,
		tx.maxPriorityFeePerGas,
		tx.maxFeePerGas,
		tx.gasLimit,
		tx.to ? hexToBytes(tx.to) : new Uint8Array([]),
		tx.value,
		hexToBytes(tx.data),
		encodeAccessListRlp(tx.accessList, hexToBytes),
		encodeAuthorizationListRlp(tx.authorizationList, hexToBytes),
	];

	// Add signature fields if signed
	if (tx.v !== 0n) {
		fields.push(tx.v, hexToBytes(tx.r), hexToBytes(tx.s));
	}

	const encoded = encodeRlp(fields);
	const result = new Uint8Array(1 + encoded.length);
	result[0] = 0x04; // EIP-7702 type
	result.set(encoded, 1);
	return toHex(result);
}

/**
 * Serialize an EIP-7702 transaction to RLP-encoded hex string
 */
export function serializeEip7702(tx: Eip7702Transaction): string {
	return encodeEip7702ForSigning(tx);
}

/**
 * Encode access list to RLP format
 */
function encodeAccessListRlp(
	accessList: AccessList,
	hexToBytes: (hex: string) => Uint8Array,
): RlpInput {
	return accessList.map((item) => [
		hexToBytes(item.address),
		item.storageKeys.map((key) => hexToBytes(key)),
	]);
}

/**
 * Encode authorization list to RLP format
 */
function encodeAuthorizationListRlp(
	authList: Authorization[],
	hexToBytes: (hex: string) => Uint8Array,
): RlpInput {
	return authList.map((auth) => [
		auth.chainId,
		hexToBytes(auth.address),
		auth.nonce,
		auth.v,
		hexToBytes(auth.r),
		hexToBytes(auth.s),
	]);
}

/**
 * Parse a transaction from raw hex data
 */
export function parseTransaction(data: string): Transaction {
	const bytes = fromHex(data);

	// Check for typed transaction
	if (bytes.length > 0 && bytes[0] <= 0x7f) {
		const type = bytes[0];
		const payload = bytes.slice(1);

		switch (type) {
			case 0x02:
				return parseEip1559Transaction(payload);
			case 0x04:
				return parseEip7702Transaction(payload);
			default:
				throw new Error(`Unsupported transaction type: ${type}`);
		}
	}

	// Legacy transaction
	return parseLegacyTransaction(bytes);
}

/**
 * Parse legacy transaction from RLP data
 */
function parseLegacyTransaction(data: Uint8Array): LegacyTransaction {
	const decoded = decodeRlp(data);
	if (!Array.isArray(decoded) || decoded.length < 9) {
		throw new Error("Invalid legacy transaction");
	}

	return {
		type: "legacy",
		nonce: bytesToBigInt(decoded[0] as Uint8Array),
		gasPrice: bytesToBigInt(decoded[1] as Uint8Array),
		gasLimit: bytesToBigInt(decoded[2] as Uint8Array),
		to:
			decoded[3] && (decoded[3] as Uint8Array).length > 0
				? toHex(decoded[3] as Uint8Array)
				: undefined,
		value: bytesToBigInt(decoded[4] as Uint8Array),
		data: toHex(decoded[5] as Uint8Array),
		v: bytesToBigInt(decoded[6] as Uint8Array),
		r: toHex(decoded[7] as Uint8Array),
		s: toHex(decoded[8] as Uint8Array),
	};
}

/**
 * Parse EIP-1559 transaction from RLP data
 */
function parseEip1559Transaction(data: Uint8Array): Eip1559Transaction {
	const decoded = decodeRlp(data);
	if (!Array.isArray(decoded) || decoded.length < 9) {
		throw new Error("Invalid EIP-1559 transaction");
	}

	return {
		type: "eip1559",
		chainId: bytesToBigInt(decoded[0] as Uint8Array),
		nonce: bytesToBigInt(decoded[1] as Uint8Array),
		maxPriorityFeePerGas: bytesToBigInt(decoded[2] as Uint8Array),
		maxFeePerGas: bytesToBigInt(decoded[3] as Uint8Array),
		gasLimit: bytesToBigInt(decoded[4] as Uint8Array),
		to:
			decoded[5] && (decoded[5] as Uint8Array).length > 0
				? toHex(decoded[5] as Uint8Array)
				: undefined,
		value: bytesToBigInt(decoded[6] as Uint8Array),
		data: toHex(decoded[7] as Uint8Array),
		accessList: decodeAccessList(decoded[8] as RlpDecoded[]),
		v: decoded.length > 9 ? bytesToBigInt(decoded[9] as Uint8Array) : 0n,
		r:
			decoded.length > 10
				? toHex(decoded[10] as Uint8Array)
				: "0x0000000000000000000000000000000000000000000000000000000000000000",
		s:
			decoded.length > 11
				? toHex(decoded[11] as Uint8Array)
				: "0x0000000000000000000000000000000000000000000000000000000000000000",
	};
}

/**
 * Parse EIP-7702 transaction from RLP data
 */
function parseEip7702Transaction(data: Uint8Array): Eip7702Transaction {
	const decoded = decodeRlp(data);
	if (!Array.isArray(decoded) || decoded.length < 10) {
		throw new Error("Invalid EIP-7702 transaction");
	}

	return {
		type: "eip7702",
		chainId: bytesToBigInt(decoded[0] as Uint8Array),
		nonce: bytesToBigInt(decoded[1] as Uint8Array),
		maxPriorityFeePerGas: bytesToBigInt(decoded[2] as Uint8Array),
		maxFeePerGas: bytesToBigInt(decoded[3] as Uint8Array),
		gasLimit: bytesToBigInt(decoded[4] as Uint8Array),
		to:
			decoded[5] && (decoded[5] as Uint8Array).length > 0
				? toHex(decoded[5] as Uint8Array)
				: undefined,
		value: bytesToBigInt(decoded[6] as Uint8Array),
		data: toHex(decoded[7] as Uint8Array),
		accessList: decodeAccessList(decoded[8] as RlpDecoded[]),
		authorizationList: decodeAuthorizationList(decoded[9] as RlpDecoded[]),
		v: decoded.length > 10 ? bytesToBigInt(decoded[10] as Uint8Array) : 0n,
		r:
			decoded.length > 11
				? toHex(decoded[11] as Uint8Array)
				: "0x0000000000000000000000000000000000000000000000000000000000000000",
		s:
			decoded.length > 12
				? toHex(decoded[12] as Uint8Array)
				: "0x0000000000000000000000000000000000000000000000000000000000000000",
	};
}

/**
 * Decode access list from RLP data
 */
function decodeAccessList(data: RlpDecoded[]): AccessList {
	if (!Array.isArray(data)) {
		return [];
	}

	return data.map((item) => {
		if (!Array.isArray(item) || item.length < 2) {
			throw new Error("Invalid access list item");
		}

		return {
			address: toHex(item[0] as Uint8Array),
			storageKeys: (item[1] as RlpDecoded[]).map((key) =>
				toHex(key as Uint8Array),
			),
		};
	});
}

/**
 * Decode authorization list from RLP data
 */
function decodeAuthorizationList(data: RlpDecoded[]): Authorization[] {
	if (!Array.isArray(data)) {
		return [];
	}

	return data.map((item) => {
		if (!Array.isArray(item) || item.length < 6) {
			throw new Error("Invalid authorization item");
		}

		return {
			chainId: bytesToBigInt(item[0] as Uint8Array),
			address: toHex(item[1] as Uint8Array),
			nonce: bytesToBigInt(item[2] as Uint8Array),
			v: bytesToBigInt(item[3] as Uint8Array),
			r: toHex(item[4] as Uint8Array),
			s: toHex(item[5] as Uint8Array),
		};
	});
}

/**
 * Convert bytes to bigint
 */
function bytesToBigInt(bytes: Uint8Array | number): bigint {
	if (typeof bytes === "number") {
		return BigInt(bytes);
	}

	if (bytes.length === 0) {
		return 0n;
	}

	let result = 0n;
	for (let i = 0; i < bytes.length; i++) {
		result = (result << 8n) | BigInt(bytes[i]);
	}
	return result;
}

/**
 * Validate a transaction structure
 */
export function validateTransaction(tx: Transaction): boolean {
	try {
		// Validate address format if present
		if ("to" in tx && tx.to) {
			if (!isValidAddress(tx.to)) {
				return false;
			}
		}

		// Validate nonce is non-negative
		if (tx.nonce < 0n) {
			return false;
		}

		// Validate gas limit
		if (tx.gasLimit < 21000n) {
			return false;
		}

		// Validate value is non-negative
		if (tx.value < 0n) {
			return false;
		}

		// Type-specific validation
		if ("gasPrice" in tx) {
			// Legacy transaction
			if (tx.gasPrice < 0n) {
				return false;
			}
		}

		if ("maxFeePerGas" in tx) {
			// EIP-1559 or EIP-7702
			if (tx.maxFeePerGas < 0n || tx.maxPriorityFeePerGas < 0n) {
				return false;
			}
			if (tx.maxPriorityFeePerGas > tx.maxFeePerGas) {
				return false;
			}
		}

		return true;
	} catch {
		return false;
	}
}

/**
 * Validate Ethereum address format
 */
function isValidAddress(address: string): boolean {
	return /^0x[0-9a-fA-F]{40}$/.test(address);
}

/**
 * Compute the hash of a transaction
 */
export function hashTransaction(tx: Transaction): string {
	let encoded: string;

	if ("gasPrice" in tx) {
		// Legacy transaction
		encoded = serializeLegacy(tx as LegacyTransaction);
	} else if ("authorizationList" in tx) {
		// EIP-7702
		encoded = serializeEip7702(tx as Eip7702Transaction);
	} else {
		// EIP-1559
		encoded = serializeEip1559(tx as Eip1559Transaction);
	}

	return keccak256Hex(encoded);
}

/**
 * Detect transaction type from raw data
 */
export function detectTransactionType(data: string): TransactionType {
	const bytes = fromHex(data);

	if (bytes.length === 0) {
		return "legacy";
	}

	// Check for typed transaction
	if (bytes[0] <= 0x7f) {
		switch (bytes[0]) {
			case 0x02:
				return "eip1559";
			case 0x04:
				return "eip7702";
			default:
				return "legacy";
		}
	}

	return "legacy";
}
