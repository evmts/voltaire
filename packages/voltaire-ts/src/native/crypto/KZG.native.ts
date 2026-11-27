/**
 * KZG (EIP-4844) synchronous native implementation using Zig / c-kzg-4844 C ABI.
 * Drop-in 1:1 replacement for pure JS/WASM KZG without WASM overhead.
 */

import { readFileSync } from "node:fs";
import {
	BYTES_PER_BLOB,
	BYTES_PER_COMMITMENT,
	BYTES_PER_FIELD_ELEMENT,
	BYTES_PER_PROOF,
} from "../../crypto/KZG/constants.js";
import { createEmptyBlob } from "../../crypto/KZG/createEmptyBlob.js";
import {
	KzgError,
	KzgNotInitializedError,
} from "../../crypto/KZG/errors.js";
import { generateRandomBlob } from "../../crypto/KZG/generateRandomBlob.js";
import { KZG as KZGJS } from "../../crypto/KZG/index.js";
import { validateBlob } from "../../crypto/KZG/validateBlob.js";
import {
	allocateOutput,
	loadNativeSync,
	NativeErrorCode,
} from "../../native-loader/index.js";

let nativeInitialized = false;

function ensureInitialized(): void {
	if (!nativeInitialized) {
		throw new KzgNotInitializedError();
	}
}

function assertUint8Length(
	value: Uint8Array,
	expected: number,
	label: string,
): void {
	if (!(value instanceof Uint8Array) || value.length !== expected) {
		const actual =
			value instanceof Uint8Array ? value.length : "not Uint8Array";
		throw new KzgError(`${label} must be ${expected} bytes, got ${actual}`, {
			code: -32602,
		});
	}
}

/**
 * Load KZG trusted setup from raw `trusted_setup.txt` bytes in native c-kzg-4844.
 */
export function loadTrustedSetupBytes(bytes: Uint8Array): void {
	if (!(bytes instanceof Uint8Array) || bytes.length === 0) {
		throw new KzgError("Trusted setup bytes must be a non-empty Uint8Array", {
			code: -32602,
			context: { environment: "native" },
		});
	}
	const lib = loadNativeSync();
	const code = lib.kzg_load_trusted_setup_bytes(bytes, bytes.length);
	if (code !== 0) {
		throw new KzgError(
			`Failed to load native KZG trusted setup from bytes (code ${code})`,
			{ code: -32000, context: { environment: "native" } },
		);
	}
	nativeInitialized = true;
}

/**
 * Load KZG trusted setup in native c-kzg-4844 library.
 * Accepts raw `trusted_setup.txt` bytes, a file path on disk, or loads the
 * embedded native trusted setup when omitted.
 */
export function loadTrustedSetup(filePathOrBytes?: string | Uint8Array): void {
	if (filePathOrBytes instanceof Uint8Array) {
		loadTrustedSetupBytes(filePathOrBytes);
		return;
	}
	if (typeof filePathOrBytes === "string") {
		const raw = readFileSync(filePathOrBytes);
		loadTrustedSetupBytes(
			new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength),
		);
		return;
	}
	const lib = loadNativeSync();
	const code = lib.kzg_load_trusted_setup();
	if (code !== 0) {
		throw new KzgError(
			`Failed to load native KZG trusted setup (code ${code})`,
			{ code: -32000, context: { environment: "native" } },
		);
	}
	nativeInitialized = true;
}

/**
 * Free KZG trusted setup resources in native c-kzg-4844 library.
 */
export function freeTrustedSetup(): void {
	if (!nativeInitialized) return;
	const lib = loadNativeSync();
	lib.kzg_free_trusted_setup();
	nativeInitialized = false;
}

/**
 * Check whether native KZG trusted setup has been loaded.
 */
export function isInitialized(): boolean {
	return nativeInitialized;
}

/**
 * Compute 48-byte KZG commitment for a 131072-byte EIP-4844 blob via native FFI.
 */
export function blobToKzgCommitment(blob: Uint8Array): Uint8Array {
	ensureInitialized();
	validateBlob(blob);
	const lib = loadNativeSync();
	const outCommitment = allocateOutput(BYTES_PER_COMMITMENT);
	const code = lib.kzg_blob_to_commitment(blob, outCommitment);
	if (code === NativeErrorCode.KZG_NOT_LOADED) {
		nativeInitialized = false;
		throw new KzgNotInitializedError();
	}
	if (code !== 0) {
		throw new KzgError(`Native KZG blobToCommitment failed (code ${code})`);
	}
	return outCommitment;
}

/**
 * Compute KZG proof and evaluation y at point z for a blob via native FFI.
 */
export function computeKzgProof(
	blob: Uint8Array,
	z: Uint8Array,
): { proof: Uint8Array; y: Uint8Array } {
	ensureInitialized();
	validateBlob(blob);
	assertUint8Length(z, BYTES_PER_FIELD_ELEMENT, "Evaluation point");
	const lib = loadNativeSync();
	const outProof = allocateOutput(BYTES_PER_PROOF);
	const outY = allocateOutput(BYTES_PER_FIELD_ELEMENT);
	const code = lib.kzg_compute_proof(blob, z, outProof, outY);
	if (code === NativeErrorCode.KZG_NOT_LOADED) {
		nativeInitialized = false;
		throw new KzgNotInitializedError();
	}
	if (code !== 0) {
		throw new KzgError(`Native KZG computeProof failed (code ${code})`);
	}
	return { proof: outProof, y: outY };
}

/**
 * Compute blob KZG proof given blob and 48-byte commitment via native FFI.
 */
export function computeBlobKzgProof(
	blob: Uint8Array,
	commitment: Uint8Array,
): Uint8Array {
	ensureInitialized();
	validateBlob(blob);
	assertUint8Length(commitment, BYTES_PER_COMMITMENT, "Commitment");
	const lib = loadNativeSync();
	const outProof = allocateOutput(BYTES_PER_PROOF);
	const code = lib.kzg_compute_blob_proof(blob, commitment, outProof);
	if (code === NativeErrorCode.KZG_NOT_LOADED) {
		nativeInitialized = false;
		throw new KzgNotInitializedError();
	}
	if (code !== 0) {
		throw new KzgError(`Native KZG computeBlobProof failed (code ${code})`);
	}
	return outProof;
}

/**
 * Verify a KZG proof at point z with claimed value y via native FFI.
 */
export function verifyKzgProof(
	commitment: Uint8Array,
	z: Uint8Array,
	y: Uint8Array,
	proof: Uint8Array,
): boolean {
	ensureInitialized();
	assertUint8Length(commitment, BYTES_PER_COMMITMENT, "Commitment");
	assertUint8Length(z, BYTES_PER_FIELD_ELEMENT, "Evaluation point");
	assertUint8Length(y, BYTES_PER_FIELD_ELEMENT, "Evaluation result");
	assertUint8Length(proof, BYTES_PER_PROOF, "Proof");

	const lib = loadNativeSync();
	const code = lib.kzg_verify_proof(commitment, z, y, proof);
	if (code === NativeErrorCode.KZG_NOT_LOADED) {
		nativeInitialized = false;
		throw new KzgNotInitializedError();
	}
	return code === 1;
}

/**
 * Verify a blob KZG proof via native FFI.
 */
export function verifyBlobKzgProof(
	blob: Uint8Array,
	commitment: Uint8Array,
	proof: Uint8Array,
): boolean {
	ensureInitialized();
	validateBlob(blob);
	assertUint8Length(commitment, BYTES_PER_COMMITMENT, "Commitment");
	assertUint8Length(proof, BYTES_PER_PROOF, "Proof");

	const lib = loadNativeSync();
	const code = lib.kzg_verify_blob_proof(blob, commitment, proof);
	if (code === NativeErrorCode.KZG_NOT_LOADED) {
		nativeInitialized = false;
		throw new KzgNotInitializedError();
	}
	if (code < 0) {
		throw new KzgError(`Native KZG verifyBlobProof failed (code ${code})`);
	}
	return code === 1;
}

/**
 * Verify a batch of blob KZG proofs via native FFI.
 */
export function verifyBlobKzgProofBatch(
	blobs: Uint8Array[],
	commitments: Uint8Array[],
	proofs: Uint8Array[],
): boolean {
	ensureInitialized();
	if (blobs.length !== commitments.length || blobs.length !== proofs.length) {
		throw new KzgError(
			`Mismatched batch lengths: blobs=${blobs.length}, commitments=${commitments.length}, proofs=${proofs.length}`,
			{ code: -32602 },
		);
	}
	for (let i = 0; i < blobs.length; i++) {
		const blob = blobs[i];
		const commitment = commitments[i];
		const proof = proofs[i];
		if (!blob || !commitment || !proof) return false;
		if (!verifyBlobKzgProof(blob, commitment, proof)) {
			return false;
		}
	}
	return true;
}

/**
 * Native KZG namespace matching pure JS KZG 1:1.
 */
export function KZG(): never {
	throw new Error(
		"KZG is not a constructor. Use KZG.loadTrustedSetup() and other static methods.",
	);
}

KZG.loadTrustedSetup = loadTrustedSetup;
KZG.loadTrustedSetupBytes = loadTrustedSetupBytes;
KZG.freeTrustedSetup = freeTrustedSetup;
KZG.isInitialized = isInitialized;
KZG.validateBlob = validateBlob;
KZG.createEmptyBlob = createEmptyBlob;
KZG.generateRandomBlob = generateRandomBlob;
KZG.blobToKzgCommitment = blobToKzgCommitment;
KZG.computeKzgProof = computeKzgProof;
KZG.computeBlobKzgProof = computeBlobKzgProof;
KZG.verifyKzgProof = verifyKzgProof;
KZG.verifyBlobKzgProof = verifyBlobKzgProof;
KZG.verifyBlobKzgProofBatch = verifyBlobKzgProofBatch;
KZG.computeCells = KZGJS.computeCells;
KZG.computeCellsAndKzgProofs = KZGJS.computeCellsAndKzgProofs;
KZG.verifyCellKzgProofBatch = KZGJS.verifyCellKzgProofBatch;
KZG.recoverCellsAndKzgProofs = KZGJS.recoverCellsAndKzgProofs;
KZG.Commitment = blobToKzgCommitment;
KZG.Proof = computeKzgProof;
KZG.BlobProof = computeBlobKzgProof;

export { BYTES_PER_BLOB, createEmptyBlob, generateRandomBlob, validateBlob };

const _kzgParityCheck: typeof KZGJS = KZG;
void _kzgParityCheck;
