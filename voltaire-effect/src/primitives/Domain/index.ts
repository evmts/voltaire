/**
 * @module Domain
 * @description Effect Schemas for EIP-712 typed data domains.
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `Domain.Struct` | DomainInput object | DomainType |
 *
 * ## Usage
 *
 * ```typescript
 * import * as Domain from 'voltaire-effect/primitives/Domain'
 * import * as S from 'effect/Schema'
 *
 * // Decode (parse input)
 * const domain = S.decodeSync(Domain.Struct)({
 *   name: 'MyApp',
 *   version: '1',
 *   chainId: 1n
 * })
 *
 * // Encode (format output)
 * const input = S.encodeSync(Domain.Struct)(domain)
 * ```
 *
 * ## Pure Functions
 *
 * ```typescript
 * Domain.toHash(domain, { keccak256 })  // Uint8Array (32 bytes)
 * Domain.encodeType(primaryType, types)  // string
 * Domain.hashType(primaryType, types, { keccak256 })  // Uint8Array
 * Domain.getEIP712DomainType(domain)  // Array<{ name, type }>
 * Domain.getFieldsBitmap(domain)  // Uint8Array
 * Domain.toErc5267Response(domain)  // ERC-5267 response
 * ```
 *
 * @since 0.1.0
 */
export {
	type DomainInput,
	DomainSchema,
	type DomainType,
	encodeType,
	getEIP712DomainType,
	getFieldsBitmap,
	hashType,
	Struct,
	toErc5267Response,
	toHash,
} from "./Struct.js";
