/**
 * Viem-compatible Account Types for Voltaire
 *
 * Type definitions matching viem's account interface for drop-in compatibility.
 */

import type { AddressType } from "../../src/primitives/Address/AddressType.js";

/**
 * Hex string type (0x-prefixed)
 */
export type Hex = `0x${string}`;

/**
 * Message formats for signMessage
 */
export type SignableMessage = string | { raw: Hex | Uint8Array };

/**
 * EIP-712 Domain separator
 */
export interface EIP712Domain {
	name?: string;
	version?: string;
	chainId?: bigint;
	verifyingContract?: string;
	salt?: Hex;
}

/**
 * EIP-712 Type property
 */
export interface TypeProperty {
	name: string;
	type: string;
}

/**
 * EIP-712 Typed data definition
 */
export interface TypedDataDefinition<
	TTypes extends Record<string, TypeProperty[]> = Record<
		string,
		TypeProperty[]
	>,
	TPrimaryType extends string = string,
> {
	domain?: EIP712Domain;
	types: TTypes;
	primaryType: TPrimaryType;
	message: Record<string, unknown>;
}

/**
 * Signature components
 */
export interface SignatureComponents {
	r: Hex;
	s: Hex;
	v: bigint;
	yParity: number;
}

/**
 * EIP-7702 Authorization request
 */
export interface AuthorizationRequest {
	address?: string;
	contractAddress?: string;
	chainId: bigint;
	nonce: bigint;
}

/**
 * Signed authorization result
 */
export interface SignedAuthorization extends SignatureComponents {
	address: string;
	chainId: bigint;
	nonce: bigint;
}

/**
 * Transaction serializer function type
 */
export type SerializeTransactionFn<T = unknown> = (
	transaction: T,
	signature?: SignatureComponents,
) => Hex;

/**
 * Nonce manager interface
 */
export interface NonceManager {
	consume(params: { address: string; chainId: bigint }): Promise<bigint>;
	get(params: { address: string; chainId: bigint }): Promise<bigint>;
	increment(params: { address: string; chainId: bigint }): void;
}

/**
 * Custom account source for toAccount
 */
export interface CustomSource {
	address: string;
	nonceManager?: NonceManager;
	sign?: (params: { hash: Hex }) => Promise<Hex>;
	signAuthorization?: (
		params: AuthorizationRequest,
	) => Promise<SignedAuthorization | Hex>;
	signMessage: (params: { message: SignableMessage }) => Promise<Hex>;
	signTransaction: <T>(
		transaction: T,
		options?: { serializer?: SerializeTransactionFn<T> },
	) => Promise<Hex>;
	signTypedData: <T extends Record<string, TypeProperty[]>>(
		params: TypedDataDefinition<T>,
	) => Promise<Hex>;
}

/**
 * JSON-RPC account (no local signing)
 */
export interface JsonRpcAccount<TAddress extends string = string> {
	address: TAddress;
	type: "json-rpc";
}

/**
 * Local account with signing capabilities
 */
export interface LocalAccount<
	TSource extends string = string,
	TAddress extends string = string,
> {
	address: TAddress;
	publicKey: Hex;
	source: TSource;
	type: "local";
	nonceManager?: NonceManager;
	sign: (params: { hash: Hex }) => Promise<Hex>;
	signAuthorization: (
		params: AuthorizationRequest,
	) => Promise<SignedAuthorization>;
	signMessage: (params: { message: SignableMessage }) => Promise<Hex>;
	signTransaction: <T>(
		transaction: T,
		options?: { serializer?: SerializeTransactionFn<T> },
	) => Promise<Hex>;
	signTypedData: <T extends Record<string, TypeProperty[]>>(
		params: TypedDataDefinition<T>,
	) => Promise<Hex>;
}

/**
 * Private key account
 */
export type PrivateKeyAccount = LocalAccount<"privateKey"> & {
	sign: NonNullable<LocalAccount["sign"]>;
	signAuthorization: NonNullable<LocalAccount["signAuthorization"]>;
};

/**
 * HD wallet account
 */
export interface HDKey {
	privateKey: Uint8Array;
	publicKey: Uint8Array;
	chainCode: Uint8Array;
	derive: (path: string) => HDKey;
}

/**
 * HD account options
 */
export type HDOptions =
	| {
			accountIndex?: number;
			addressIndex?: number;
			changeIndex?: number;
			path?: undefined;
	  }
	| {
			accountIndex?: undefined;
			addressIndex?: undefined;
			changeIndex?: undefined;
			path: `m/44'/60'/${string}`;
	  };

/**
 * HD account type
 */
export type HDAccount = LocalAccount<"hd"> & {
	getHdKey: () => HDKey;
	sign: NonNullable<LocalAccount["sign"]>;
};

/**
 * Account union type
 */
export type Account<TAddress extends string = string> =
	| JsonRpcAccount<TAddress>
	| LocalAccount<string, TAddress>;

/**
 * Options for privateKeyToAccount
 */
export interface PrivateKeyToAccountOptions {
	nonceManager?: NonceManager;
}
