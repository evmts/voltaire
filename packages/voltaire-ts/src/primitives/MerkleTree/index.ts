// Export types

// Export errors
export {
	EmptyTreeError,
	InvalidProofLengthError,
	LeafIndexOutOfBoundsError,
} from "./errors.js";
export type {
	MerkleProofLike,
	MerkleProofType,
	MerkleTreeLike,
	MerkleTreeType,
} from "./MerkleTreeType.js";

// Import crypto dependency
import { hash as keccak256Impl } from "../../crypto/Keccak256/hash.js";
import type { HashType } from "../Hash/HashType.js";
// Import factories
import { From as _FromFactory } from "./from.js";
import { GetProof as _GetProofFactory } from "./getProof.js";
import type { MerkleProofType, MerkleTreeType } from "./MerkleTreeType.js";
import { Verify as _VerifyFactory } from "./verify.js";

// Export factories for custom crypto injection
export { _FromFactory, _GetProofFactory, _VerifyFactory };

// Create wrappers with injected crypto
export const from: (leaves: HashType[]) => MerkleTreeType = _FromFactory({
	keccak256: keccak256Impl,
});

export const getProof: (
	leaves: HashType[],
	leafIndex: number,
) => MerkleProofType = _GetProofFactory({ keccak256: keccak256Impl });

export const verify: (
	proof: MerkleProofType,
	expectedRoot: HashType,
) => boolean = _VerifyFactory({ keccak256: keccak256Impl });

// Namespace export
export const MerkleTree = {
	from,
	getProof,
	verify,
};
