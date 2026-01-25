/**
 * @module MerkleTree
 * @description Merkle tree and proof structures for cryptographic verification.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as MerkleTree from 'voltaire-effect/primitives/MerkleTree'
 *
 * function verifyMerkleProof(proof: MerkleTree.MerkleProofType, tree: MerkleTree.MerkleTreeType) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `Schema` | MerkleTree input | MerkleTreeType |
 * | `ProofSchema` | MerkleProof input | MerkleProofType |
 *
 * ## Usage
 *
 * ```typescript
 * import * as MerkleTree from 'voltaire-effect/primitives/MerkleTree'
 * import * as S from 'effect/Schema'
 *
 * const tree = S.decodeSync(MerkleTree.Schema)(input)
 * const proof = S.decodeSync(MerkleTree.ProofSchema)(proofInput)
 * ```
 *
 * @since 0.1.0
 */
export {
	type MerkleProofType,
	type MerkleTreeType,
	ProofSchema,
	Schema,
} from "./MerkleTreeSchema.js";
