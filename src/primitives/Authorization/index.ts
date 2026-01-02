// Re-export AuthorizationType and BrandedAuthorization (deprecated alias)
export type {
	AuthorizationType,
	BrandedAuthorization,
} from "./AuthorizationType.js";
export * from "./constants.js";
export * from "./errors.js";
export * from "./types.js";

// Crypto dependencies
import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
import { recoverPublicKey } from "../../crypto/Secp256k1/recoverPublicKey.js";
import { sign as secp256k1Sign } from "../../crypto/Secp256k1/sign.js";
import type { AddressType } from "../Address/AddressType.js";
import { FromPublicKey } from "../Address/fromPublicKey.js";
import type { HashType } from "../Hash/HashType.js";
import { encode as rlpEncode } from "../Rlp/encode.js";
import type { AuthorizationType } from "./AuthorizationType.js";

// Create address factory with crypto dependencies
const addressFromPublicKey = FromPublicKey({ keccak256 });

// Import factory functions with proper types
import { Hash as HashFactory } from "./hash.js";
import { Sign as SignFactory } from "./sign.js";
import { Verify as VerifyFactory } from "./verify.js";

// Define factory return types
type HashFn = (unsigned: {
	chainId: bigint;
	address: AddressType;
	nonce: bigint;
}) => HashType;

type SignFn = (
	unsigned: { chainId: bigint; address: AddressType; nonce: bigint },
	privateKey: Uint8Array,
) => AuthorizationType;

type VerifyFn = (auth: AuthorizationType) => AddressType;

// Re-export typed factories (types are flexible for crypto deps)
export const Hash: (deps: {
	keccak256: (data: Uint8Array) => Uint8Array;
	rlpEncode: (data: Uint8Array[]) => Uint8Array;
	// biome-ignore lint/suspicious/noExplicitAny: type coercion required
}) => HashFn = HashFactory as any;

export const Sign: (deps: {
	keccak256: (data: Uint8Array) => Uint8Array;
	rlpEncode: (data: Uint8Array[]) => Uint8Array;
	sign: (
		messageHash: Uint8Array,
		privateKey: Uint8Array,
	) => { r: Uint8Array; s: Uint8Array; v: number };
	recoverPublicKey: (
		signature: { r: Uint8Array; s: Uint8Array; v: number },
		messageHash: Uint8Array,
	) => Uint8Array;
	addressFromPublicKey: (x: bigint, y: bigint) => AddressType;
	// biome-ignore lint/suspicious/noExplicitAny: type coercion required
}) => SignFn = SignFactory as any;

export const Verify: (deps: {
	keccak256: (data: Uint8Array) => Uint8Array;
	rlpEncode: (data: Uint8Array[]) => Uint8Array;
	recoverPublicKey: (
		signature: { r: Uint8Array; s: Uint8Array; v: number },
		messageHash: Uint8Array,
	) => Uint8Array;
	addressFromPublicKey: (x: bigint, y: bigint) => AddressType;
	// biome-ignore lint/suspicious/noExplicitAny: type coercion required
}) => VerifyFn = VerifyFactory as any;

// Import other functions with proper types
import { calculateGasCost as calculateGasCostImpl } from "./calculateGasCost.js";
import {
	MAGIC_BYTE,
	PER_AUTH_BASE_COST,
	PER_EMPTY_ACCOUNT_COST,
	SECP256K1_HALF_N,
	SECP256K1_N,
} from "./constants.js";
import {
	equalsAuth as equalsAuthImpl,
	equals as equalsImpl,
} from "./equals.js";
import { format as formatImpl } from "./format.js";
import { getGasCost as getGasCostImpl } from "./getGasCost.js";
import { isItem as isItemImpl } from "./isItem.js";
import { isUnsigned as isUnsignedImpl } from "./isUnsigned.js";
import { process as processImpl } from "./process.js";
import { processAll as processAllImpl } from "./processAll.js";
import { validate as validateImpl } from "./validate.js";

// Typed function signatures
export const calculateGasCost: (
	authList: AuthorizationType[],
	emptyAccounts: number,
) => bigint = calculateGasCostImpl;

export const equals: (a: AddressType, b: AddressType) => boolean = equalsImpl;

export const equalsAuth: (
	auth1: AuthorizationType,
	auth2: AuthorizationType,
) => boolean = equalsAuthImpl;

export const format: (
	auth:
		| AuthorizationType
		| { chainId: bigint; address: AddressType; nonce: bigint },
) => string = formatImpl;

export const getGasCost: (auth: AuthorizationType, isEmpty: boolean) => bigint =
	getGasCostImpl;

export const isItem: (value: unknown) => boolean = isItemImpl;

export const isUnsigned: (value: unknown) => boolean = isUnsignedImpl;

export const process: (auth: AuthorizationType) => {
	authority: AddressType;
	delegatedAddress: AddressType;
} = processImpl;

export const processAll: (
	authList: AuthorizationType[],
) => { authority: AddressType; delegatedAddress: AddressType }[] =
	processAllImpl;

export const validate: (auth: AuthorizationType) => void = validateImpl;

// Create wrapped functions with auto-injected crypto
const hash: HashFn = Hash({
	// biome-ignore lint/suspicious/noExplicitAny: type coercion required
	keccak256: keccak256 as any,
	rlpEncode,
});
const verify: VerifyFn = Verify({
	// biome-ignore lint/suspicious/noExplicitAny: type coercion required
	keccak256: keccak256 as any,
	rlpEncode,
	// biome-ignore lint/suspicious/noExplicitAny: type coercion required
	recoverPublicKey: recoverPublicKey as any,
	addressFromPublicKey,
});
const sign: SignFn = Sign({
	// biome-ignore lint/suspicious/noExplicitAny: type coercion required
	keccak256: keccak256 as any,
	rlpEncode,
	// biome-ignore lint/suspicious/noExplicitAny: type coercion required
	sign: secp256k1Sign as any,
	// biome-ignore lint/suspicious/noExplicitAny: type coercion required
	recoverPublicKey: recoverPublicKey as any,
	addressFromPublicKey,
});

// Export wrapped functions
export { hash, sign, verify };

// Namespace export
export const Authorization = {
	// Factories
	Hash,
	Verify,
	Sign,
	// Wrapped functions
	isItem,
	isUnsigned,
	validate,
	hash,
	sign,
	verify,
	calculateGasCost,
	getGasCost,
	process,
	processAll,
	format,
	equals,
	equalsAuth,
	// Constants
	MAGIC_BYTE,
	PER_AUTH_BASE_COST,
	PER_EMPTY_ACCOUNT_COST,
	SECP256K1_N,
	SECP256K1_HALF_N,
};

// Re-export WASM functions
export * from "./Authorization.wasm.js";
