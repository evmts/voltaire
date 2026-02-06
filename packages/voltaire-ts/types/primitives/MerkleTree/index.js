// Export types
// Export errors
export { EmptyTreeError, InvalidProofLengthError, LeafIndexOutOfBoundsError, } from "./errors.js";
// Import crypto dependency
import { hash as keccak256Impl } from "../../crypto/Keccak256/hash.js";
// Import factories
import { From as _FromFactory } from "./from.js";
import { GetProof as _GetProofFactory } from "./getProof.js";
import { Verify as _VerifyFactory } from "./verify.js";
// Export factories for custom crypto injection
export { _FromFactory, _GetProofFactory, _VerifyFactory };
// Create wrappers with injected crypto
export const from = _FromFactory({
    keccak256: keccak256Impl,
});
export const getProof = _GetProofFactory({ keccak256: keccak256Impl });
export const verify = _VerifyFactory({ keccak256: keccak256Impl });
// Namespace export
export const MerkleTree = {
    from,
    getProof,
    verify,
};
