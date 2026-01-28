/**
 * @module Address
 * @description Effect Schemas and functions for Ethereum addresses with EIP-55 checksum support.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as Address from 'voltaire-effect/primitives/Address'
 *
 * function transfer(to: Address.AddressType, amount: bigint) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output | Description |
 * |--------|-------|--------|-------------|
 * | `Address.Hex` | hex string | AddressType | Decodes any hex, encodes to lowercase |
 * | `Address.Checksummed` | checksummed string | AddressType | Validates checksum on decode, requires KeccakService for encode |
 * | `Address.Bytes` | Uint8Array | AddressType | 20-byte array conversion |
 *
 * ## Constructors (Effect-wrapped)
 *
 * ```typescript
 * Address.from(value)           // Effect<AddressType, AddressError>
 * Address.fromHex(hex)          // Effect<AddressType, HexError>
 * Address.fromBytes(bytes)      // Effect<AddressType, LengthError>
 * Address.fromNumber(n)         // Effect<AddressType, ValueError>
 * Address.fromBase64(str)       // Effect<AddressType, LengthError>
 * Address.fromAbiEncoded(bytes) // Effect<AddressType, AbiError>
 * Address.fromPublicKey(pk)     // Effect<AddressType, ValueError>
 * Address.fromPrivateKey(sk)    // Effect<AddressType, ValueError>
 * Address.zero()                // AddressType (pure)
 * ```
 *
 * ## Pure Functions
 *
 * ```typescript
 * Address.equals(a, b)          // boolean
 * Address.compare(a, b)         // -1 | 0 | 1
 * Address.isZero(addr)          // boolean
 * Address.lessThan(a, b)        // boolean
 * Address.greaterThan(a, b)     // boolean
 * Address.isValid(value)        // boolean
 * Address.isValidChecksum(str)  // boolean
 * Address.isAddress(value)      // boolean
 * Address.is(value)             // type guard
 * Address.clone(addr)           // AddressType
 * Address.toBytes(addr)         // Uint8Array
 * Address.toHex(addr)           // string
 * Address.toU256(addr)          // Uint256Type
 * Address.toShortHex(addr)      // string
 * Address.toLowercase(addr)     // string
 * Address.toUppercase(addr)     // string
 * Address.toAbiEncoded(addr)    // Uint8Array
 * Address.sortAddresses(arr)    // AddressType[]
 * Address.deduplicateAddresses(arr) // AddressType[]
 * ```
 *
 * ## Effectful Functions
 *
 * ```typescript
 * Address.toChecksummed(addr)   // Effect<string, never, KeccakService>
 * Address.assert(value, opts)   // Effect<void, AssertError, KeccakService>
 * Address.assertBasic(value)    // Effect<void, InvalidAddressError>
 * Address.calculateCreateAddress(addr, nonce) // Effect<AddressType, ValueError>
 * Address.calculateCreate2Address(addr, salt, initCode) // Effect<AddressType, Error>
 * ```
 *
 * @since 0.1.0
 */

// Re-export types from voltaire
export type { AddressType, BrandedAddress } from "@tevm/voltaire/Address";
export { AddressTypeSchema } from "./AddressSchema.js";

// Re-export constants from voltaire
export {
	SIZE,
	HEX_SIZE,
	ZERO_ADDRESS,
	NATIVE_ASSET_ADDRESS,
} from "@tevm/voltaire/Address";

// Re-export errors from voltaire
export {
	InvalidAddressError,
	InvalidAddressLengthError,
	InvalidAbiEncodedPaddingError,
	InvalidChecksumError,
	InvalidHexFormatError,
	InvalidHexStringError,
	InvalidValueError,
	NotImplementedError,
} from "@tevm/voltaire/Address";

// Re-export DI factory functions for advanced use cases
// These accept crypto services as parameters for dependency injection
import { Address as AddressNamespace } from "@tevm/voltaire/functional";
export const Assert = AddressNamespace.Assert;
export const CalculateCreate2Address = AddressNamespace.CalculateCreate2Address;
export const CalculateCreateAddress = AddressNamespace.CalculateCreateAddress;
export const From = AddressNamespace.From;
export const FromPrivateKey = AddressNamespace.FromPrivateKey;
export const FromPublicKey = AddressNamespace.FromPublicKey;
export const IsContract = AddressNamespace.IsContract;
export const IsValid = AddressNamespace.IsValid;
export const IsValidChecksum = AddressNamespace.IsValidChecksum;
export const ToChecksummed = AddressNamespace.ToChecksummed;

// Schemas
export { Bytes } from "./Bytes.js";
export { Checksummed } from "./Checksummed.js";
export { Hex } from "./Hex.js";

// Constructors (Effect-wrapped)
export { from } from "./from.js";
export { fromAbiEncoded } from "./fromAbiEncoded.js";
export { fromBase64 } from "./fromBase64.js";
export { fromBytes } from "./fromBytes.js";
export { fromHex } from "./fromHex.js";
export { fromNumber } from "./fromNumber.js";
export { fromPrivateKey } from "./fromPrivateKey.js";
export { fromPublicKey } from "./fromPublicKey.js";
export { zero } from "./zero.js";

// Pure functions
export { clone } from "./clone.js";
export { compare } from "./compare.js";
export { deduplicateAddresses } from "./deduplicateAddresses.js";
export { equals } from "./equals.js";
export { greaterThan } from "./greaterThan.js";
export { is } from "./is.js";
export { isAddress } from "./isAddress.js";
export { isValid } from "./isValid.js";
export { isValidChecksum } from "./isValidChecksum.js";
export { isZero } from "./isZero.js";
export { lessThan } from "./lessThan.js";
export { sortAddresses } from "./sortAddresses.js";
export { toAbiEncoded } from "./toAbiEncoded.js";
export { toBytes } from "./toBytes.js";
export { toHex } from "./toHex.js";
export { toLowercase } from "./toLowercase.js";
export { toShortHex } from "./toShortHex.js";
export { toU256 } from "./toU256.js";
export { toUppercase } from "./toUppercase.js";

// Effectful functions
export { assert, assertBasic } from "./assert.js";
export { calculateCreate2Address } from "./calculateCreate2Address.js";
export { calculateCreateAddress } from "./calculateCreateAddress.js";
export { toChecksummed } from "./toChecksummed.js";
