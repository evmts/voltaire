import { Domain } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Type representing an EIP-712 typed data domain.
 * @since 0.0.1
 */
export type DomainType = ReturnType<typeof Domain.from>;

const DomainTypeSchema = S.declare<DomainType>(
	(u): u is DomainType => u !== null && typeof u === "object",
	{ identifier: "Domain" },
);

/**
 * Input type for creating an EIP-712 domain.
 * @since 0.0.1
 */
export type DomainInput = {
	readonly name?: string;
	readonly version?: string;
	readonly chainId?: bigint | number;
	readonly verifyingContract?: Uint8Array | string;
	readonly salt?: Uint8Array | string;
};

/**
 * Effect Schema for EIP-712 domain structs.
 *
 * @description
 * Transforms domain input objects into validated DomainType.
 * Used for EIP-712 typed data signing.
 *
 * @example Decoding
 * ```typescript
 * import * as Domain from 'voltaire-effect/primitives/Domain'
 * import * as S from 'effect/Schema'
 *
 * const domain = S.decodeSync(Domain.Struct)({
 *   name: 'MyApp',
 *   version: '1',
 *   chainId: 1n
 * })
 * ```
 *
 * @example Encoding
 * ```typescript
 * const input = S.encodeSync(Domain.Struct)(domain)
 * ```
 *
 * @since 0.1.0
 */
export const Struct: S.Schema<DomainType, DomainInput> = S.transformOrFail(
	S.Struct({
		name: S.optional(S.String),
		version: S.optional(S.String),
		chainId: S.optional(S.Union(S.BigIntFromSelf, S.Number)),
		verifyingContract: S.optional(S.Union(S.Uint8ArrayFromSelf, S.String)),
		salt: S.optional(S.Union(S.Uint8ArrayFromSelf, S.String)),
	}),
	DomainTypeSchema,
	{
		strict: true,
		decode: (input, _options, ast) => {
			try {
				return ParseResult.succeed(Domain.from(input as any));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, input, (e as Error).message),
				);
			}
		},
		encode: (domain) =>
			ParseResult.succeed({
				name: domain.name,
				version: domain.version,
				chainId: domain.chainId as any,
				verifyingContract: domain.verifyingContract as any,
				salt: domain.salt as any,
			}),
	},
).annotations({ identifier: "Domain.Struct" });

export { Struct as DomainSchema };

/**
 * Computes the EIP-712 domain separator hash.
 *
 * @param domain - The domain to hash
 * @param crypto - Crypto provider with keccak256
 * @returns The domain separator hash (32 bytes)
 * @since 0.1.0
 */
export const toHash = (
	domain: DomainType,
	crypto: { keccak256: (data: Uint8Array) => Uint8Array },
): Uint8Array => Domain.toHash(domain, crypto);

/**
 * Encodes EIP-712 type definitions.
 *
 * @param primaryType - The primary type name
 * @param types - Type definitions
 * @returns Encoded type string
 * @since 0.1.0
 */
export const encodeType = (
	primaryType: string,
	types: Record<
		string,
		readonly { readonly name: string; readonly type: string }[]
	>,
): string => Domain.encodeType(primaryType, types);

/**
 * Computes the hash of an EIP-712 type.
 *
 * @param primaryType - The primary type name
 * @param types - Type definitions
 * @param crypto - Crypto provider with keccak256
 * @returns Type hash (32 bytes)
 * @since 0.1.0
 */
export const hashType = (
	primaryType: string,
	types: Record<
		string,
		readonly { readonly name: string; readonly type: string }[]
	>,
	crypto: { keccak256: (data: Uint8Array) => Uint8Array },
): Uint8Array => Domain.hashType(primaryType, types, crypto);

/**
 * Gets the EIP-712 domain type definition.
 *
 * @param domain - The domain
 * @returns Array of field definitions
 * @since 0.1.0
 */
export const getEIP712DomainType = (
	domain: DomainType,
): Array<{ name: string; type: string }> => Domain.getEIP712DomainType(domain);

/**
 * Gets the fields bitmap for ERC-5267.
 *
 * @param domain - The domain
 * @returns Bitmap bytes
 * @since 0.1.0
 */
export const getFieldsBitmap = (domain: DomainType): Uint8Array =>
	Domain.getFieldsBitmap(domain);

/**
 * Converts domain to ERC-5267 response format.
 *
 * @param domain - The domain
 * @returns ERC-5267 response
 * @since 0.1.0
 */
export const toErc5267Response = (
	domain: DomainType,
): ReturnType<typeof Domain.toErc5267Response> =>
	Domain.toErc5267Response(domain);
