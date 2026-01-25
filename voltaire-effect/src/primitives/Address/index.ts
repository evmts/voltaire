/**
 * @module Address
 * @description Effect Schemas for Ethereum addresses with EIP-55 checksum support.
 *
 * ## Schemas
 *
 * | Schema | Input | Output | Description |
 * |--------|-------|--------|-------------|
 * | `Address.Hex` | hex string | AddressType | Decodes any hex, encodes to lowercase |
 * | `Address.Checksummed` | checksummed string | AddressType | Validates checksum on decode, requires KeccakService for encode |
 * | `Address.Bytes` | Uint8Array | AddressType | 20-byte array conversion |
 *
 * ## Usage
 *
 * ```typescript
 * import * as Address from 'voltaire-effect/primitives/Address'
 * import * as S from 'effect/Schema'
 *
 * // Decode (parse input)
 * const addr = S.decodeSync(Address.Hex)('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3')
 *
 * // Encode (format output)
 * const hex = S.encodeSync(Address.Hex)(addr)
 * // "0x742d35cc6634c0532925a3b844bc9e7595f251e3"
 *
 * // Checksummed encoding (requires KeccakService)
 * import * as Effect from 'effect/Effect'
 * import { KeccakLive } from 'voltaire-effect/crypto/Keccak256'
 *
 * const program = S.encode(Address.Checksummed)(addr)
 * const checksummed = await Effect.runPromise(program.pipe(Effect.provide(KeccakLive)))
 * // "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"
 * ```
 *
 * ## Pure Functions
 *
 * ```typescript
 * Address.equals(a, b)     // boolean
 * Address.compare(a, b)    // -1 | 0 | 1
 * Address.isZero(addr)     // boolean
 * Address.lessThan(a, b)   // boolean
 * Address.greaterThan(a, b) // boolean
 * Address.isValid(value)   // boolean
 * Address.isValidChecksum(str) // boolean
 * Address.clone(addr)      // AddressType
 * Address.toBytes(addr)    // Uint8Array
 * Address.toU256(addr)     // bigint
 * Address.toShortHex(addr) // string (e.g., "0x742d...51e3")
 * Address.toLowercase(addr) // string
 * Address.toUppercase(addr) // string
 * Address.toAbiEncoded(addr) // Uint8Array (32 bytes)
 * ```
 *
 * @since 0.1.0
 */

// Schemas
export { Hex } from "./Hex.js";
export { Bytes } from "./Bytes.js";

// Pure functions
export { compare } from "./compare.js";
export { isZero } from "./isZero.js";
export { lessThan } from "./lessThan.js";
export { greaterThan } from "./greaterThan.js";
export { isValid } from "./isValid.js";
export { isValidChecksum } from "./isValidChecksum.js";
export { clone } from "./clone.js";
export { toU256 } from "./toU256.js";
export { toShortHex } from "./toShortHex.js";
export { toLowercase } from "./toLowercase.js";
export { toUppercase } from "./toUppercase.js";
export { toAbiEncoded } from "./toAbiEncoded.js";

// Crypto derivation (kept - requires crypto services)

// Re-export AddressType from voltaire
export type { AddressType } from "@tevm/voltaire/Address";
