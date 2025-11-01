import type { Address } from "../Address/index.js";
import type { Hash } from "../Hash/index.js";

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

/**
 * Legacy transaction (Type 0)
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

/**
 * EIP-2930 transaction (Type 1)
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

/**
 * EIP-1559 transaction (Type 2)
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

/**
 * EIP-4844 transaction (Type 3)
 */
export type EIP4844 = {
	type: Type.EIP4844;
	chainId: bigint;
	nonce: bigint;
	maxPriorityFeePerGas: bigint;
	maxFeePerGas: bigint;
	gasLimit: bigint;
	to: Address;
	value: bigint;
	data: Uint8Array;
	accessList: AccessList;
	maxFeePerBlobGas: bigint;
	blobVersionedHashes: readonly VersionedHash[];
	yParity: number;
	r: Uint8Array;
	s: Uint8Array;
};

/**
 * EIP-7702 transaction (Type 4)
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

/**
 * Any transaction type
 */
export type Any = Legacy | EIP2930 | EIP1559 | EIP4844 | EIP7702;
