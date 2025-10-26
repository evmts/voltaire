/**
 * Transaction type definitions for WASM primitives
 * TypeScript declaration file for transaction.js
 */

export interface AccessListItem {
	address: string;
	storageKeys: readonly string[];
}

export type AccessList = readonly AccessListItem[];

export interface BaseTransaction {
	to?: string;
	value: bigint;
	data: string;
	nonce: bigint;
	chainId: bigint;
	gasLimit: bigint;
}

export interface LegacyTransaction extends BaseTransaction {
	gasPrice: bigint;
}

export interface Eip1559Transaction extends BaseTransaction {
	maxFeePerGas: bigint;
	maxPriorityFeePerGas: bigint;
	accessList: AccessList;
	v: bigint;
	r: string;
	s: string;
}

export interface Eip2930Transaction extends BaseTransaction {
	gasPrice: bigint;
	accessList: AccessList;
	v: bigint;
	r: string;
	s: string;
}

export type Transaction = LegacyTransaction | Eip1559Transaction | Eip2930Transaction;
