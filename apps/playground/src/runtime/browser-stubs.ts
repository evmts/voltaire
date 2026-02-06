/**
 * Browser stubs for Node.js-only modules
 * These modules have native dependencies that can't run in the browser
 */

// Stub for c-kzg (native KZG implementation)
export const loadTrustedSetup = () => {
	throw new Error(
		"c-kzg is not available in browser. Use WASM implementation.",
	);
};
export const freeTrustedSetup = () => {};
export const blobToKzgCommitment = () => {
	throw new Error("c-kzg is not available in browser.");
};
export const computeKzgProof = () => {
	throw new Error("c-kzg is not available in browser.");
};
export const computeBlobKzgProof = () => {
	throw new Error("c-kzg is not available in browser.");
};
export const verifyKzgProof = () => {
	throw new Error("c-kzg is not available in browser.");
};
export const verifyBlobKzgProof = () => {
	throw new Error("c-kzg is not available in browser.");
};
export const verifyBlobKzgProofBatch = () => {
	throw new Error("c-kzg is not available in browser.");
};

// Default export for c-kzg
export default {
	loadTrustedSetup,
	freeTrustedSetup,
	blobToKzgCommitment,
	computeKzgProof,
	computeBlobKzgProof,
	verifyKzgProof,
	verifyBlobKzgProof,
	verifyBlobKzgProofBatch,
};
