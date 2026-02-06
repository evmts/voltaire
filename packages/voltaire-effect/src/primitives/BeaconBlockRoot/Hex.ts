/**
 * @fileoverview BeaconBlockRoot Schema definitions for EIP-4788.
 *
 * EIP-4788 exposes beacon chain block roots in the EVM, enabling smart contracts
 * to access consensus layer state. The beacon block root is a 32-byte hash that
 * represents the state of the beacon chain at a specific slot.
 *
 * This is useful for trustless bridging, staking applications, and any protocol
 * that needs to verify beacon chain state on the execution layer.
 *
 * @see https://eips.ethereum.org/EIPS/eip-4788
 * @module BeaconBlockRootSchema
 * @since 0.0.1
 */
import { BeaconBlockRoot } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as Schema from "effect/Schema";

/** @internal */
type BeaconBlockRootType = BeaconBlockRoot.BeaconBlockRootType;

/** @internal */
const BeaconBlockRootTypeSchema = Schema.declare<BeaconBlockRootType>(
	(u): u is BeaconBlockRootType => {
		if (!(u instanceof Uint8Array)) return false;
		try {
			BeaconBlockRoot.toHex(u as BeaconBlockRootType);
			return true;
		} catch {
			return false;
		}
	},
	{ identifier: "BeaconBlockRoot" },
);

/**
 * Effect Schema for validating and parsing beacon block roots.
 *
 * Decodes hex strings to 32-byte BeaconBlockRootType. The beacon block root
 * is a hash representing the state of the beacon chain at a specific slot.
 *
 * @description
 * The schema validates that:
 * - Input is a valid 64-character hex string (with 0x prefix)
 * - The resulting bytes are exactly 32 bytes
 *
 * @example
 * ```typescript
 * import { BeaconBlockRootSchema } from 'voltaire-effect/primitives/BeaconBlockRoot'
 * import * as Schema from 'effect/Schema'
 *
 * // Parse a beacon block root from hex
 * const root = Schema.decodeSync(BeaconBlockRootSchema)(
 *   '0x1234567890abcdef...' // 66 chars total
 * )
 * ```
 *
 * @throws ParseError - When input is not a valid 32-byte hex string
 * @see from - For creating from hex string or bytes
 * @see toHex - For converting back to hex string
 * @since 0.0.1
 */
export const BeaconBlockRootSchema: Schema.Schema<BeaconBlockRootType, string> =
	Schema.transformOrFail(Schema.String, BeaconBlockRootTypeSchema, {
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(BeaconBlockRoot.from(s));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (h) => ParseResult.succeed(BeaconBlockRoot.toHex(h)),
	}).annotations({ identifier: "BeaconBlockRootSchema" });
