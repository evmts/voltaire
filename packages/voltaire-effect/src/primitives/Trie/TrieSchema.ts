import type { Trie } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as Schema from "effect/Schema";

type TrieType = Trie.TrieType;

const TrieTypeSchema = Schema.declare<TrieType>(
	(u): u is TrieType => {
		if (typeof u !== "object" || u === null) return false;
		return "nodes" in u && "root" in u;
	},
	{ identifier: "Trie" },
);

/**
 * Effect Schema for validating Trie structures.
 * Identity transform - validates the trie structure.
 *
 * @since 0.0.1
 */
export const TrieSchema: Schema.Schema<TrieType, TrieType> =
	Schema.transformOrFail(TrieTypeSchema, TrieTypeSchema, {
		strict: true,
		decode: (t, _options, _ast) => ParseResult.succeed(t),
		encode: (t) => ParseResult.succeed(t),
	}).annotations({ identifier: "TrieSchema" });
