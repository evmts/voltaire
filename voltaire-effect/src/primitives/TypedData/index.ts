/**
 * @module TypedData
 * @description Effect Schemas for EIP-712 typed structured data.
 *
 * EIP-712 defines a standard for typed structured data hashing,
 * enabling human-readable signing prompts in wallets.
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `TypedData.Struct` | TypedDataInput | TypedDataOutput |
 *
 * ## Usage
 *
 * ```typescript
 * import * as TypedData from 'voltaire-effect/primitives/TypedData'
 * import * as S from 'effect/Schema'
 *
 * // Decode (parse input)
 * const typedData = S.decodeSync(TypedData.Struct)({
 *   types: {
 *     EIP712Domain: [{ name: 'name', type: 'string' }],
 *     Person: [{ name: 'name', type: 'string' }]
 *   },
 *   primaryType: 'Person',
 *   domain: { name: 'My App' },
 *   message: { name: 'Bob' }
 * })
 *
 * // Encode (format output)
 * const input = S.encodeSync(TypedData.Struct)(typedData)
 * ```
 *
 * @since 0.1.0
 */
export {
	type DomainInput,
	Struct,
	type TypedDataFieldInput,
	type TypedDataInput,
	type TypedDataOutput,
	TypedDataSchema,
} from "./Struct.js";
