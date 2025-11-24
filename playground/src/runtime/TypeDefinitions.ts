/**
 * Generate TypeScript type definitions for Voltaire modules
 * These are used by the Monaco Editor LSP for hover, diagnostics, and autocomplete
 */

export function generateTypeDefinitions(): Record<string, string> {
	return {
		"voltaire/primitives/Address": `
// Address primitive - 20-byte Ethereum address
export type AddressType = Uint8Array & { readonly __tag: "Address" };

export interface BaseAddress extends AddressType {
	toHex(): string;
	toLowercase(): string;
	toUppercase(): string;
	toU256(): bigint;
	toAbiEncoded(): Uint8Array;
	toShortHex(startLength?: number, endLength?: number): string;
	isZero(): boolean;
	equals(other: AddressType): boolean;
	toBytes(): Uint8Array;
	clone(): AddressType;
	compare(other: AddressType): number;
	lessThan(other: AddressType): boolean;
	greaterThan(other: AddressType): boolean;
}

export function Address(value: number | bigint | string | Uint8Array): BaseAddress;

export namespace Address {
	export const SIZE: number;
	export function from(value: number | bigint | string | Uint8Array): AddressType;
	export function fromHex(value: string): AddressType;
	export function fromBytes(value: Uint8Array): AddressType;
	export function fromNumber(value: number | bigint): AddressType;
	export function fromBase64(value: string): AddressType;
	export function fromPublicKey(publicKey: Uint8Array): AddressType;
	export function fromPublicKey(x: bigint, y: bigint): AddressType;
	export function fromPrivateKey(value: Uint8Array): AddressType;
	export function fromAbiEncoded(value: Uint8Array): AddressType;
	export function zero(): AddressType;
	export function of(...items: number[]): AddressType;
	export function toHex(address: AddressType): string;
	export function toBytes(address: AddressType): Uint8Array;
	export function toChecksummed(address: AddressType): string;
	export function toLowercase(address: AddressType): string;
	export function toUppercase(address: AddressType): string;
	export function toU256(address: AddressType): bigint;
	export function toAbiEncoded(address: AddressType): Uint8Array;
	export function toShortHex(address: AddressType, startLength?: number, endLength?: number): string;
	export function isZero(address: AddressType): boolean;
	export function equals(a: AddressType, b: AddressType): boolean;
	export function isValid(value: unknown): boolean;
	export function isValidChecksum(value: string): boolean;
	export function is(value: unknown): value is AddressType;
	export function compare(a: AddressType, b: AddressType): number;
	export function lessThan(a: AddressType, b: AddressType): boolean;
	export function greaterThan(a: AddressType, b: AddressType): boolean;
	export function sortAddresses(addresses: AddressType[]): AddressType[];
	export function deduplicateAddresses(addresses: AddressType[]): AddressType[];
	export function clone(address: AddressType): AddressType;
}

export default Address;
`,

		"voltaire/primitives/Hex": `
// Hex primitive - hex string utilities
export type HexString = string & { readonly __brand: "Hex" };

export function from(value: string | Uint8Array | number | bigint | boolean): HexString;
export function fromString(value: string): HexString;
export function fromBytes(value: Uint8Array): HexString;
export function fromNumber(value: number | bigint, size?: number): HexString;
export function fromBigInt(value: bigint, size?: number): HexString;
export function fromBoolean(value: boolean): HexString;
export function toString(hex: HexString): string;
export function toBytes(hex: HexString): Uint8Array;
export function toNumber(hex: HexString): number;
export function toBigInt(hex: HexString): bigint;
export function toBoolean(hex: HexString): boolean;
export function concat(...values: HexString[]): HexString;
export function slice(hex: HexString, start: number, end?: number): HexString;
export function pad(hex: HexString, size: number): HexString;
export function padRight(hex: HexString, size: number): HexString;
export function trim(hex: HexString): HexString;
export function equals(a: HexString, b: HexString): boolean;
export function xor(a: HexString, b: HexString): HexString;
export function isHex(value: unknown): value is HexString;
export function isSized(hex: HexString, size: number): boolean;
export function size(hex: HexString): number;
export function random(size: number): HexString;
export function zero(size: number): HexString;
`,

		"voltaire/primitives/Hash": `
// Hash primitive - 32-byte hash value
export type HashType = Uint8Array & { readonly __tag: "Hash" };

export interface Hash extends HashType {
	toHex(): string;
	equals(other: HashType): boolean;
	isZero(): boolean;
	format(prefixLength?: number, suffixLength?: number): string;
	clone(): HashType;
}

export function Hash(value: string | Uint8Array): Hash;

export namespace Hash {
	export const SIZE: number;
	export const ZERO: HashType;
	export function from(value: string | Uint8Array): HashType;
	export function fromHex(value: string): HashType;
	export function fromBytes(value: Uint8Array): HashType;
	export function toHex(hash: HashType): string;
	export function toBytes(hash: HashType): Uint8Array;
	export function equals(a: HashType, b: HashType): boolean;
	export function isHash(value: unknown): value is HashType;
	export function format(hash: HashType, prefixLength?: number, suffixLength?: number): string;
	export function keccak256(data: Uint8Array): HashType;
	export function keccak256String(data: string): HashType;
	export function keccak256Hex(data: string): HashType;
	export function concat(...hashes: HashType[]): HashType;
	export function merkleRoot(leaves: HashType[]): HashType;
	export function random(): HashType;
	export function clone(hash: HashType): HashType;
}

export default Hash;
`,

		"voltaire/primitives/RLP": `
// RLP (Recursive Length Prefix) encoding
export type RLPInput = Uint8Array | RLPInput[];

export function encode(input: RLPInput): Uint8Array;
export function decode(input: Uint8Array): RLPInput;
`,

		"voltaire/primitives/ABI": `
// ABI encoding/decoding
export interface AbiParameter {
	type: string;
	name?: string;
	components?: AbiParameter[];
	indexed?: boolean;
}

export interface AbiFunction {
	type: 'function';
	name: string;
	inputs: AbiParameter[];
	outputs?: AbiParameter[];
	stateMutability?: string;
}

export interface AbiEvent {
	type: 'event';
	name: string;
	inputs: AbiParameter[];
	anonymous?: boolean;
}

export interface AbiError {
	type: 'error';
	name: string;
	inputs: AbiParameter[];
}

export interface AbiConstructor {
	type: 'constructor';
	inputs: AbiParameter[];
	stateMutability?: string;
}

export type AbiItem = AbiFunction | AbiEvent | AbiError | AbiConstructor;

export function encodeParameters(types: AbiParameter[], values: unknown[]): string;
export function decodeParameters(types: AbiParameter[], data: Uint8Array): unknown[];
export function encodePacked(types: AbiParameter[], values: unknown[]): Uint8Array;

export namespace Function {
	export function getSelector(signature: string | AbiFunction): string;
	export function encodeParams(fn: AbiFunction, values: unknown[]): string;
	export function decodeResult(fn: AbiFunction, data: Uint8Array): unknown[];
}

export namespace Event {
	export function getSelector(signature: string | AbiEvent): string;
	export function encodeTopics(event: AbiEvent, values: Record<string, unknown>): string[];
	export function decodeLog(event: AbiEvent, log: { topics: string[]; data: Uint8Array }): Record<string, unknown>;
}

export namespace Error {
	export function getSelector(signature: string | AbiError): string;
	export function encodeParams(error: AbiError, values?: unknown[]): string;
	export function decodeError(error: AbiError, data: Uint8Array): unknown[];
}

export namespace Constructor {
	export function encodeParams(constructor: AbiConstructor, values: unknown[]): string;
}

export function Abi(items: AbiItem[]): AbiItem[];
export function parseLogs(abi: AbiItem[], logs: Array<{ topics: string[]; data: Uint8Array }>): unknown[];
`,

		"voltaire/crypto/Keccak256": `
// Keccak256 hashing
export function hash(data: Uint8Array): Uint8Array;
export function hashString(data: string): Uint8Array;
export function hashHex(data: string): Uint8Array;
export function from(data: string | Uint8Array): Uint8Array;
`,

		"voltaire/crypto/Secp256k1": `
// secp256k1 elliptic curve cryptography
export interface Signature {
	r: bigint;
	s: bigint;
	v: number;
}

export function generatePrivateKey(): Uint8Array;
export function derivePublicKey(privateKey: Uint8Array): Uint8Array;
export function sign(messageHash: Uint8Array, privateKey: Uint8Array): Signature;
export function verify(messageHash: Uint8Array, signature: Signature, publicKey: Uint8Array): boolean;
export function recover(messageHash: Uint8Array, signature: Signature): Uint8Array;
export function isValidPrivateKey(privateKey: Uint8Array): boolean;
export function isValidPublicKey(publicKey: Uint8Array): boolean;
export function compressPublicKey(publicKey: Uint8Array): Uint8Array;
export function decompressPublicKey(publicKey: Uint8Array): Uint8Array;
export function signatureToBytes(signature: Signature): Uint8Array;
export function signatureFromBytes(bytes: Uint8Array): Signature;
export function signatureToCompact(signature: Signature): Uint8Array;
export function signatureFromCompact(bytes: Uint8Array): Signature;
`,

		"voltaire/crypto/SHA256": `
// SHA256 hashing
export function hash(data: Uint8Array): Uint8Array;
export function hashString(data: string): Uint8Array;
export function hashHex(data: string): Uint8Array;
export function from(data: string | Uint8Array): Uint8Array;
export function doubleHash(data: Uint8Array): Uint8Array;
`,

		"voltaire/crypto/Blake2": `
// Blake2b hashing
export function hash(data: Uint8Array, outputLength?: number): Uint8Array;
export function hashString(data: string, outputLength?: number): Uint8Array;
export function hashHex(data: string, outputLength?: number): Uint8Array;
export function from(data: string | Uint8Array, outputLength?: number): Uint8Array;
`,

		"voltaire/crypto/Ripemd160": `
// RIPEMD-160 hashing
export function hash(data: Uint8Array): Uint8Array;
export function hashString(data: string): Uint8Array;
export function hashHex(data: string): Uint8Array;
export function from(data: string | Uint8Array): Uint8Array;
`,

		"voltaire/crypto/HDWallet": `
// HD Wallet (BIP32) key derivation
export interface ExtendedKey {
	privateKey?: Uint8Array;
	publicKey: Uint8Array;
	chainCode: Uint8Array;
	depth: number;
	index: number;
	parentFingerprint: number;
}

export function generateMasterKey(seed: Uint8Array): ExtendedKey;
export function deriveChild(parent: ExtendedKey, index: number): ExtendedKey;
export function derivePath(master: ExtendedKey, path: string): ExtendedKey;
export function deriveEthereumAddress(key: ExtendedKey): Uint8Array;
export function serializeExtendedKey(key: ExtendedKey, isPrivate: boolean): string;
export function parseExtendedKey(key: string): ExtendedKey;
`,
	};
}
