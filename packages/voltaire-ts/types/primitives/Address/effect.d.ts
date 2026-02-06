import * as Brand from "effect/Brand";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import type { AddressType as BrandedAddress } from "./AddressType.js";
import type { Checksummed } from "./ChecksumAddress.js";
import { type CalculateCreate2AddressErrors, type CalculateCreateAddressErrors, type ChecksumAddressFromErrors, type CryptoOperationError, type FromAbiEncodedErrors, type FromBytesErrors, type FromErrors, type FromHexErrors, type FromNumberErrors, type FromPrivateKeyErrors, type FromPublicKeyErrors, type ToChecksummedErrors } from "./effect-errors.js";
import { Keccak256Service, RlpEncoderService, Secp256k1Service } from "./effect-services.js";
/**
 * Effect Brand for Address - refined brand that validates 20-byte Uint8Array
 */
export type AddressBrand = Uint8Array & Brand.Brand<"Address">;
/**
 * Effect Brand constructor with validation
 */
export declare const AddressBrand: Brand.Brand.Constructor<AddressBrand>;
/**
 * Effect Brand for ChecksumAddress - nominal brand for checksummed string
 */
export type ChecksumAddressBrand = string & Brand.Brand<"ChecksumAddress">;
/**
 * Effect Brand constructor (nominal - validation happens separately via keccak)
 */
export declare const ChecksumAddressBrand: Brand.Brand.Constructor<ChecksumAddressBrand>;
declare const AddressSchema_base: Schema.Class<AddressSchema, {
    value: Schema.refine<Uint8Array<ArrayBufferLike>, Schema.Schema<Uint8Array<ArrayBufferLike>, Uint8Array<ArrayBufferLike>, never>>;
}, Schema.Struct.Encoded<{
    value: Schema.refine<Uint8Array<ArrayBufferLike>, Schema.Schema<Uint8Array<ArrayBufferLike>, Uint8Array<ArrayBufferLike>, never>>;
}>, never, {
    readonly value: Uint8Array<ArrayBufferLike>;
}, {}, {}>;
/**
 * Schema for Address from various input types
 * Uses Effect Brand validation for type safety
 */
export declare class AddressSchema extends AddressSchema_base {
    /**
     * Get the underlying BrandedAddress (internal Voltaire type)
     */
    get address(): BrandedAddress;
    /**
     * Get as Effect branded AddressBrand
     */
    get branded(): AddressBrand;
    /**
     * Create from Effect branded AddressBrand (zero-cost, no validation)
     */
    static fromBranded(brand: AddressBrand): AddressSchema;
    /**
     * Create from universal input (number, bigint, hex string, Uint8Array)
     * @returns Effect that may fail with various input validation errors
     */
    static from(value: number | bigint | string | Uint8Array): Effect.Effect<AddressSchema, FromErrors>;
    /**
     * Create from hex string
     * @returns Effect that may fail with hex format errors
     */
    static fromHex(value: string): Effect.Effect<AddressSchema, FromHexErrors>;
    /**
     * Create from bytes
     * @returns Effect that may fail with length errors
     */
    static fromBytes(value: Uint8Array): Effect.Effect<AddressSchema, FromBytesErrors>;
    /**
     * Create from number or bigint
     * @returns Effect that may fail with value errors
     */
    static fromNumber(value: number | bigint): Effect.Effect<AddressSchema, FromNumberErrors>;
    /**
     * Create from public key coordinates
     * @returns Effect that uses Keccak256Service
     */
    static fromPublicKey(x: bigint, y: bigint): Effect.Effect<AddressSchema, FromPublicKeyErrors, Keccak256Service>;
    /**
     * Create from private key
     * @returns Effect that uses Secp256k1Service and Keccak256Service
     */
    static fromPrivateKey(value: Uint8Array): Effect.Effect<AddressSchema, FromPrivateKeyErrors, Secp256k1Service | Keccak256Service>;
    /**
     * Create from ABI-encoded bytes
     * @returns Effect that may fail with validation errors
     */
    static fromAbiEncoded(value: Uint8Array): Effect.Effect<AddressSchema, FromAbiEncodedErrors>;
    /**
     * Create zero address (safe, no errors)
     */
    static zero(): AddressSchema;
    /**
     * Convert to hex string (safe, no errors)
     */
    toHex(): string;
    /**
     * Convert to checksummed hex string (EIP-55)
     * @returns Effect that uses Keccak256Service
     */
    toChecksummed(): Effect.Effect<Checksummed, ToChecksummedErrors, Keccak256Service>;
    /**
     * Convert to lowercase hex string (safe, no errors)
     */
    toLowercase(): string;
    /**
     * Convert to uppercase hex string (safe, no errors)
     */
    toUppercase(): string;
    /**
     * Convert to U256 bigint (safe, no errors)
     */
    toU256(): bigint;
    /**
     * Convert to ABI-encoded bytes (32 bytes, left-padded) (safe, no errors)
     */
    toAbiEncoded(): Uint8Array;
    /**
     * Convert to short hex (removes leading zeros) (safe, no errors)
     */
    toShortHex(): string;
    /**
     * Check if address is zero (safe, no errors)
     */
    isZero(): boolean;
    /**
     * Compare with another address for equality (safe, no errors)
     */
    equals(other: AddressSchema | BrandedAddress): boolean;
    /**
     * Compare with another address lexicographically (safe, no errors)
     * Returns -1 if this < other, 0 if equal, 1 if this > other
     */
    compare(other: AddressSchema | BrandedAddress): number;
    /**
     * Clone the address (safe, no errors)
     */
    clone(): AddressSchema;
    /**
     * Calculate CREATE address
     * @returns Effect that uses Keccak256Service and RlpEncoderService
     */
    calculateCreateAddress(nonce: bigint): Effect.Effect<AddressSchema, CalculateCreateAddressErrors, Keccak256Service | RlpEncoderService>;
    /**
     * Calculate CREATE2 address
     * @returns Effect that uses Keccak256Service
     */
    calculateCreate2Address(salt: Uint8Array, initCode: Uint8Array): Effect.Effect<AddressSchema, CalculateCreate2AddressErrors, Keccak256Service>;
}
declare const ChecksumAddress_base: Schema.Class<ChecksumAddress, {
    value: Schema.refine<string, Schema.Schema<string, string, never>>;
}, Schema.Struct.Encoded<{
    value: Schema.refine<string, Schema.Schema<string, string, never>>;
}>, never, {
    readonly value: string;
}, {}, {}>;
/**
 * Schema for ChecksumAddress (EIP-55)
 * Validates checksummed hex string
 */
export declare class ChecksumAddress extends ChecksumAddress_base {
    /**
     * Get the underlying Checksummed string (internal Voltaire type)
     */
    get checksummed(): Checksummed;
    /**
     * Get as Effect branded ChecksumAddressBrand
     */
    get branded(): ChecksumAddressBrand;
    /**
     * Create from Effect branded ChecksumAddressBrand (zero-cost, no validation)
     */
    static fromBranded(brand: ChecksumAddressBrand): ChecksumAddress;
    /**
     * Create from universal input (validates checksum)
     * @returns Effect that uses Keccak256Service
     */
    static from(value: number | bigint | string | Uint8Array): Effect.Effect<ChecksumAddress, ChecksumAddressFromErrors, Keccak256Service>;
    /**
     * Validate a string has valid EIP-55 checksum (uses crypto)
     * @returns Effect that uses Keccak256Service
     */
    static isValid(str: string): Effect.Effect<boolean, CryptoOperationError, Keccak256Service>;
    /**
     * Convert to AddressSchema instance
     * @returns Effect that may fail with hex format errors
     */
    toAddress(): Effect.Effect<AddressSchema, FromHexErrors>;
}
/**
 * Schema for validating hex string addresses (with automatic normalization)
 * Note: These schemas need to be used within an Effect context with services provided
 */
export declare const AddressFromHex: Schema.transform<typeof Schema.String, Schema.instanceOf<AddressSchema>>;
/**
 * Schema for validating and creating checksummed addresses
 * Note: These schemas need to be used within an Effect context with services provided
 */
export declare const AddressFromChecksummed: Schema.transform<typeof Schema.String, Schema.instanceOf<ChecksumAddress>>;
/**
 * Schema for universal AddressSchema input (number, bigint, hex, bytes)
 * Note: These schemas need to be used within an Effect context with services provided
 */
export declare const AddressFromUnknown: Schema.transform<Schema.Union<[typeof Schema.Number, typeof Schema.BigIntFromSelf, typeof Schema.String, typeof Schema.Uint8ArrayFromSelf]>, Schema.instanceOf<AddressSchema>>;
export {};
//# sourceMappingURL=effect.d.ts.map