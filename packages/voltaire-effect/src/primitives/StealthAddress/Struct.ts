import { StealthAddress } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

type StealthMetaAddress = Uint8Array & { readonly __tag: "StealthMetaAddress" };

const StealthMetaAddressTypeSchema = S.declare<StealthMetaAddress>(
	(u): u is StealthMetaAddress => u instanceof Uint8Array && u.length === 66,
	{ identifier: "StealthMetaAddress" },
);

/**
 * Effect Schema for validating and parsing stealth meta-addresses.
 * A stealth meta-address contains both spending and viewing public keys (66 bytes).
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { StealthMetaAddressSchema } from 'voltaire-effect/primitives/StealthAddress'
 *
 * const parse = S.decodeSync(StealthMetaAddressSchema)
 * const metaAddress = parse(new Uint8Array(66))
 * ```
 *
 * @since 0.0.1
 */
export const StealthMetaAddressSchema: S.Schema<
	StealthMetaAddress,
	Uint8Array
> = S.transformOrFail(S.Uint8ArrayFromSelf, StealthMetaAddressTypeSchema, {
	strict: true,
	decode: (bytes, _options, ast) => {
		try {
			const parsed = StealthAddress.parseMetaAddress(bytes as any);
			return ParseResult.succeed(
				StealthAddress.generateMetaAddress(
					parsed.spendingPubKey,
					parsed.viewingPubKey,
				) as StealthMetaAddress,
			);
		} catch (e) {
			return ParseResult.fail(
				new ParseResult.Type(ast, bytes, (e as Error).message),
			);
		}
	},
	encode: (meta) => ParseResult.succeed(meta as Uint8Array),
}).annotations({ identifier: "StealthMetaAddressSchema" });
