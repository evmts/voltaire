import type { MerkleTree } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

type MerkleTreeType = MerkleTree.MerkleTreeType;
type MerkleProofType = MerkleTree.MerkleProofType;

const MerkleTreeTypeSchema = S.declare<MerkleTreeType>(
	(u): u is MerkleTreeType => {
		if (typeof u !== "object" || u === null) return false;
		const obj = u as MerkleTreeType;
		return (
			"root" in obj &&
			"leafCount" in obj &&
			"depth" in obj &&
			"leaves" in obj &&
			obj.root instanceof Uint8Array
		);
	},
	{ identifier: "MerkleTree" },
);

const MerkleProofTypeSchema = S.declare<MerkleProofType>(
	(u): u is MerkleProofType => {
		if (typeof u !== "object" || u === null) return false;
		const obj = u as MerkleProofType;
		return (
			"leaf" in obj &&
			"siblings" in obj &&
			"leafIndex" in obj &&
			"treeDepth" in obj &&
			obj.leaf instanceof Uint8Array
		);
	},
	{ identifier: "MerkleProof" },
);

export const Schema: S.Schema<MerkleTreeType, MerkleTreeType> =
	S.transformOrFail(MerkleTreeTypeSchema, MerkleTreeTypeSchema, {
		strict: true,
		decode: (t, _options, _ast) => ParseResult.succeed(t),
		encode: (t) => ParseResult.succeed(t),
	}).annotations({ identifier: "MerkleTreeSchema" });

export const ProofSchema: S.Schema<MerkleProofType, MerkleProofType> =
	S.transformOrFail(MerkleProofTypeSchema, MerkleProofTypeSchema, {
		strict: true,
		decode: (t, _options, _ast) => ParseResult.succeed(t),
		encode: (t) => ParseResult.succeed(t),
	}).annotations({ identifier: "MerkleProofSchema" });

export type { MerkleTreeType, MerkleProofType };
