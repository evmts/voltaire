/**
 * @module DomainSeparator
 * @description Effect Schemas for EIP-712 domain separator hashes.
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `DomainSeparator.Hex` | hex string | DomainSeparatorType |
 * | `DomainSeparator.Bytes` | Uint8Array | DomainSeparatorType |
 *
 * ## Usage
 *
 * ```typescript
 * import * as DomainSeparator from 'voltaire-effect/primitives/DomainSeparator'
 * import * as S from 'effect/Schema'
 *
 * // Decode (parse input)
 * const separator = S.decodeSync(DomainSeparator.Hex)('0xabcd...')
 *
 * // Encode (format output)
 * const hex = S.encodeSync(DomainSeparator.Hex)(separator)
 * ```
 *
 * ## Pure Functions
 *
 * ```typescript
 * DomainSeparator.equals(a, b)  // boolean
 * ```
 *
 * @since 0.1.0
 */
export {
	Bytes,
	DomainSeparatorFromBytesSchema,
	DomainSeparatorSchema,
	type DomainSeparatorType,
	equals,
	Hex,
} from "./Hex.js";
