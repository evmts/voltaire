import type { SignedData } from "@tevm/voltaire";
import * as S from "effect/Schema";

/**
 * Branded type representing signed data with version information.
 *
 * @since 0.0.1
 */
export type SignedDataType = SignedData.SignedDataType;

/**
 * Version identifier for signed data encoding.
 * - 0x00: Legacy personal_sign
 * - 0x01: EIP-191 structured data
 * - 0x45: EIP-712 typed data
 *
 * @since 0.0.1
 */
export type SignedDataVersion = SignedData.SignedDataVersion;

const SignedDataTypeSchema = S.declare<SignedDataType>(
	(u): u is SignedDataType => u instanceof Uint8Array,
	{ identifier: "SignedData" },
);

/**
 * Effect Schema for validating SignedData types.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { Schema } from 'voltaire-effect/primitives/SignedData'
 *
 * const validate = S.is(Schema)
 * const isValid = validate(someData)
 * ```
 *
 * @since 0.0.1
 */
export const Schema = SignedDataTypeSchema;

/**
 * Effect Schema for SignedData version identifiers.
 * Validates that the version is one of: 0x00, 0x01, or 0x45.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { SignedDataVersionSchema } from 'voltaire-effect/primitives/SignedData'
 *
 * const parse = S.decodeSync(SignedDataVersionSchema)
 * const version = parse(0x45) // EIP-712
 * ```
 *
 * @since 0.0.1
 */
export const SignedDataVersionSchema = S.Union(
	S.Literal(0x00),
	S.Literal(0x01),
	S.Literal(0x45),
).annotations({ identifier: "SignedDataVersion" });
