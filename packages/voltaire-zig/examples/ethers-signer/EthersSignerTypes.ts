import type { AddressType, HashType, PrivateKeyType } from "@tevm/voltaire";

/**
 * Block tag for provider queries
 */
export type BlockTag =
	| "latest"
	| "pending"
	| "earliest"
	| "safe"
	| "finalized"
	| bigint
	| number;

/**
 * Access list item for EIP-2930+ transactions
 */
export interface AccessListItem {
	address: string;
	storageKeys: string[];
}

/**
 * Transaction request (unsigned transaction parameters)
 */
export interface TransactionRequest {
	to?: string | null;
	from?: string;
	nonce?: bigint | number;
	gasLimit?: bigint | number;
	gasPrice?: bigint | number;
	maxFeePerGas?: bigint | number;
	maxPriorityFeePerGas?: bigint | number;
	data?: string | Uint8Array;
	value?: bigint | number;
	chainId?: bigint | number;
	type?: number;
	accessList?: AccessListItem[];
}

/**
 * Populated transaction (all fields resolved)
 */
export interface PopulatedTransaction {
	to?: string | null;
	from: string;
	nonce: bigint;
	gasLimit: bigint;
	gasPrice?: bigint;
	maxFeePerGas?: bigint;
	maxPriorityFeePerGas?: bigint;
	data: Uint8Array;
	value: bigint;
	chainId: bigint;
	type: number;
	accessList?: AccessListItem[];
}

/**
 * Transaction response from provider
 */
export interface TransactionResponse {
	hash: string;
	to?: string | null;
	from: string;
	nonce: number;
	gasLimit: bigint;
	gasPrice?: bigint;
	maxFeePerGas?: bigint;
	maxPriorityFeePerGas?: bigint;
	data: string;
	value: bigint;
	chainId: bigint;
	type: number;
	blockNumber?: number | null;
	blockHash?: string | null;
	wait(confirmations?: number): Promise<TransactionReceipt | null>;
}

/**
 * Transaction receipt
 */
export interface TransactionReceipt {
	to?: string | null;
	from: string;
	contractAddress?: string | null;
	transactionIndex: number;
	gasUsed: bigint;
	blockHash: string;
	blockNumber: number;
	status: number;
	logs: Array<{
		address: string;
		topics: string[];
		data: string;
	}>;
}

/**
 * Network information
 */
export interface Network {
	chainId: bigint;
	name?: string;
}

/**
 * Fee data from provider
 */
export interface FeeData {
	maxFeePerGas: bigint | null;
	maxPriorityFeePerGas: bigint | null;
	gasPrice: bigint | null;
}

/**
 * Minimal provider interface required by signer
 */
export interface SignerProvider {
	getTransactionCount(address: string, blockTag?: BlockTag): Promise<number>;
	estimateGas(tx: TransactionRequest): Promise<bigint>;
	call(tx: TransactionRequest): Promise<string>;
	getNetwork(): Promise<Network>;
	getFeeData(): Promise<FeeData>;
	broadcastTransaction(signedTx: string): Promise<TransactionResponse>;
	resolveName?(name: string): Promise<string | null>;
}

/**
 * EIP-712 Domain
 */
export interface TypedDataDomain {
	name?: string;
	version?: string;
	chainId?: bigint | number;
	verifyingContract?: string;
	salt?: string | Uint8Array;
}

/**
 * EIP-712 Type property
 */
export interface TypedDataField {
	name: string;
	type: string;
}

/**
 * EIP-712 Types definition
 */
export type TypedDataTypes = Record<string, TypedDataField[]>;

/**
 * EIP-7702 Authorization
 */
export interface Authorization {
	address: string;
	chainId?: bigint | number;
	nonce?: bigint | number;
}

/**
 * Signed EIP-7702 Authorization
 */
export interface SignedAuthorization {
	address: string;
	chainId: bigint;
	nonce: bigint;
	signature: {
		r: Uint8Array;
		s: Uint8Array;
		v: number;
	};
}

/**
 * Abstract Signer interface (ethers v6 compatible)
 */
export interface Signer {
	/** Connected provider or null */
	readonly provider: SignerProvider | null;

	/** Get the checksummed address */
	getAddress(): Promise<string>;

	/** Connect to a provider */
	connect(provider: SignerProvider): Signer;

	/** Sign a transaction */
	signTransaction(tx: TransactionRequest): Promise<string>;

	/** Sign an EIP-191 personal message */
	signMessage(message: string | Uint8Array): Promise<string>;

	/** Sign EIP-712 typed data */
	signTypedData(
		domain: TypedDataDomain,
		types: TypedDataTypes,
		value: Record<string, unknown>,
	): Promise<string>;

	/** Get nonce (transaction count) */
	getNonce(blockTag?: BlockTag): Promise<number>;

	/** Populate a transaction for eth_call */
	populateCall(tx: TransactionRequest): Promise<PopulatedTransaction>;

	/** Populate a transaction with all required fields */
	populateTransaction(tx: TransactionRequest): Promise<PopulatedTransaction>;

	/** Estimate gas for a transaction */
	estimateGas(tx: TransactionRequest): Promise<bigint>;

	/** Execute eth_call */
	call(tx: TransactionRequest): Promise<string>;

	/** Resolve ENS name */
	resolveName(name: string): Promise<string | null>;

	/** Sign and send a transaction */
	sendTransaction(tx: TransactionRequest): Promise<TransactionResponse>;
}

/**
 * Wallet interface (extends Signer with private key access)
 */
export interface Wallet extends Signer {
	/** The checksummed address */
	readonly address: string;

	/** The private key (hex string with 0x prefix) */
	readonly privateKey: string;

	/** Synchronous message signing */
	signMessageSync(message: string | Uint8Array): string;

	/** EIP-7702 authorization signing */
	authorize(auth: Authorization): Promise<SignedAuthorization>;

	/** Synchronous EIP-7702 authorization signing */
	authorizeSync(auth: Authorization): SignedAuthorization;
}

/**
 * Crypto dependencies for EthersSigner
 */
export interface SignerCrypto {
	keccak256: (data: Uint8Array) => Uint8Array;
	sign: (
		hash: HashType,
		privateKey: PrivateKeyType,
	) => {
		r: Uint8Array;
		s: Uint8Array;
		v: number;
	};
	getPublicKey: (privateKey: Uint8Array) => Uint8Array;
}

/**
 * Options for creating an EthersSigner
 */
export interface EthersSignerOptions {
	/** Private key (hex string or Uint8Array) */
	privateKey: string | Uint8Array;
	/** Optional provider to connect */
	provider?: SignerProvider;
	/** Optional crypto dependencies (defaults to Voltaire crypto) */
	crypto?: SignerCrypto;
}
