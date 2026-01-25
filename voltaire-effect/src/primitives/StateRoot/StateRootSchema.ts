/**
 * @fileoverview Effect Schema definitions for Ethereum state roots.
 * Provides validation schemas for state trie root hashes.
 * @module StateRoot/StateRootSchema
 * @since 0.0.1
 */

import { Bytes32, type Bytes32Type } from "@tevm/voltaire/Bytes";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Represents an Ethereum state root hash.
 *
 * @description
 * A StateRoot is a 32-byte Keccak-256 hash that serves as the root of the
 * Merkle Patricia Trie containing all account states. It uniquely identifies
 * the complete state of the Ethereum blockchain at a given point.
 *
 * The state root is included in every block header and changes with every
 * state modification. It enables efficient verification of account states
 * using Merkle proofs.
 *
 * @example
 * ```typescript
 * import { StateRoot } from 'voltaire-effect/primitives'
 *
 * // State root from a block header
 * const root: StateRootType = StateRoot.from('0x...')
 * ```
 *
 * @see {@link https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/} Merkle Patricia Trie
 *
 * @since 0.0.1
 */
export type StateRootType = Bytes32Type & { readonly __tag: "StateRoot" };

const StateRootTypeSchema = S.declare<StateRootType>(
	(u): u is StateRootType => {
		if (!(u instanceof Uint8Array)) return false;
		return u.length === 32;
	},
	{ identifier: "StateRoot" },
);

/**
 * Effect Schema for validating and transforming state root values.
 *
 * @description
 * This schema transforms various input formats into a normalized StateRootType.
 * It accepts hex strings, Uint8Arrays, bigints, and numbers, converting them
 * to the canonical 32-byte representation.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { StateRootSchema } from 'voltaire-effect/primitives/StateRoot'
 *
 * const parse = S.decodeSync(StateRootSchema)
 *
 * // From hex string
 * const root1 = parse('0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421')
 *
 * // From Uint8Array
 * const root2 = parse(new Uint8Array(32))
 *
 * // From bigint
 * const root3 = parse(0n)
 * ```
 *
 * @throws {ParseError} When the input cannot be converted to a valid 32-byte value
 *
 * @see {@link StateRootType} for the output type
 * @see {@link from} for Effect-based creation
 *
 * @since 0.0.1
 */
export const StateRootSchema: S.Schema<
	StateRootType,
	string | Uint8Array | bigint | number
> = S.transformOrFail(
	S.Union(S.String, S.Uint8ArrayFromSelf, S.BigIntFromSelf, S.Number),
	StateRootTypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(
					Bytes32.Bytes32(
						s as string | Uint8Array | bigint | number,
					) as StateRootType,
				);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (b, _options, ast) => {
			try {
				return ParseResult.succeed(b);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, b, (e as Error).message),
				);
			}
		},
	},
).annotations({ identifier: "StateRootSchema" });
