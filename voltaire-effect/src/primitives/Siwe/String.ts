import { type BrandedSiwe, Siwe } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Branded type representing a Sign-In with Ethereum (SIWE) message.
 * Contains all fields required by EIP-4361.
 *
 * @since 0.1.0
 */
export type SiweMessageType = BrandedSiwe.SiweMessageType;

/**
 * Result of validating a SIWE message.
 * Contains success/failure status and any validation errors.
 *
 * @since 0.1.0
 */
export type ValidationResult = BrandedSiwe.ValidationResult;

/**
 * Schema for SIWE message structure validation.
 *
 * @description
 * Validates all required and optional fields of a SIWE message (EIP-4361).
 *
 * @example
 * ```typescript
 * import * as Siwe from 'voltaire-effect/primitives/Siwe'
 * import * as S from 'effect/Schema'
 *
 * const isValid = S.is(Siwe.MessageStruct)({
 *   domain: 'example.com',
 *   address: new Uint8Array(20),
 *   uri: 'https://example.com',
 *   version: '1',
 *   chainId: 1,
 *   nonce: 'abc123',
 *   issuedAt: new Date().toISOString()
 * })
 * ```
 *
 * @since 0.1.0
 */
export const MessageStruct = S.Struct({
	domain: S.String,
	address: S.Uint8ArrayFromSelf,
	uri: S.String,
	version: S.String,
	chainId: S.Number,
	nonce: S.String,
	issuedAt: S.String,
	statement: S.optional(S.String),
	expirationTime: S.optional(S.String),
	notBefore: S.optional(S.String),
	requestId: S.optional(S.String),
	resources: S.optional(S.Array(S.String)),
}).annotations({ identifier: "Siwe.MessageStruct" });

export { MessageStruct as SiweMessageSchema };

/**
 * Schema for SIWE message from string representation.
 *
 * @description
 * Transforms a formatted SIWE string into a validated SiweMessageType.
 * Encodes back to formatted SIWE string.
 *
 * @example Decoding
 * ```typescript
 * import * as Siwe from 'voltaire-effect/primitives/Siwe'
 * import * as S from 'effect/Schema'
 *
 * const message = S.decodeSync(Siwe.String)(`example.com wants you to sign in...`)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const text = S.encodeSync(Siwe.String)(message)
 * ```
 *
 * @since 0.1.0
 */
export const String: S.Schema<SiweMessageType, string> = S.transformOrFail(
	S.String,
	S.Any as S.Schema<SiweMessageType, SiweMessageType>,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(Siwe.parse(s));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (msg) => ParseResult.succeed(Siwe.format(msg)),
	},
).annotations({ identifier: "Siwe.String" });

export { String as Schema };

/**
 * Formats a SIWE message into its string representation.
 *
 * @param message - The SIWE message to format
 * @returns The formatted message string
 * @since 0.1.0
 */
export const format = (message: SiweMessageType): string =>
	Siwe.format(message);

/**
 * Validates a SIWE message for expiration, not-before time, and other constraints.
 *
 * @param message - The SIWE message to validate
 * @param options - Validation options
 * @param options.now - The current time for validation (defaults to now)
 * @returns The validation result
 * @since 0.1.0
 */
export const validate = (
	message: SiweMessageType,
	options?: { now?: Date },
): ValidationResult => Siwe.validate(message, options);

/**
 * Generates a cryptographically secure random nonce for SIWE messages.
 *
 * @param length - The length of the nonce (defaults to 16)
 * @returns The generated nonce
 * @since 0.1.0
 */
export const generateNonce = (length?: number): string =>
	Siwe.generateNonce(length);
