export { EmptyTreeError, InvalidProofLengthError, LeafIndexOutOfBoundsError, } from "./errors.js";
export type { MerkleProofLike, MerkleProofType, MerkleTreeLike, MerkleTreeType, } from "./MerkleTreeType.js";
import type { HashType } from "../Hash/HashType.js";
import { From as _FromFactory } from "./from.js";
import { GetProof as _GetProofFactory } from "./getProof.js";
import type { MerkleProofType, MerkleTreeType } from "./MerkleTreeType.js";
import { Verify as _VerifyFactory } from "./verify.js";
export { _FromFactory, _GetProofFactory, _VerifyFactory };
export declare const from: (leaves: HashType[]) => MerkleTreeType;
export declare const getProof: (leaves: HashType[], leafIndex: number) => MerkleProofType;
export declare const verify: (proof: MerkleProofType, expectedRoot: HashType) => boolean;
export declare const MerkleTree: {
    from: (leaves: HashType[]) => MerkleTreeType;
    getProof: (leaves: HashType[], leafIndex: number) => MerkleProofType;
    verify: (proof: MerkleProofType, expectedRoot: HashType) => boolean;
};
//# sourceMappingURL=index.d.ts.map