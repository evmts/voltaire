// @ts-nocheck
import { equals as addressEquals } from "../Address/equals.js";
import { Hash } from "../Hash/index.js";
import * as StateRoot from "../StateRoot/index.js";
import * as StorageProof from "../StorageProof/index.js";
import { equals as uintEquals } from "../Uint/equals.js";

/**
 * @typedef {import('./StateProofType.js').StateProofType} StateProofType
 */

/**
 * Compares two StateProofs for equality.
 * All fields must match including all storage proofs.
 *
 * @param {StateProofType} a - First StateProof
 * @param {StateProofType} b - Second StateProof
 * @returns {boolean} - True if equal
 *
 * @example
 * ```typescript
 * const isEqual = StateProof.equals(proof1, proof2);
 * ```
 */
export function equals(a, b) {
	// Check address
	if (!addressEquals(a.address, b.address)) {
		return false;
	}

	// Check balance
	if (!uintEquals(a.balance, b.balance)) {
		return false;
	}

	// Check codeHash
	if (!Hash.equals(a.codeHash, b.codeHash)) {
		return false;
	}

	// Check nonce
	if (!uintEquals(a.nonce, b.nonce)) {
		return false;
	}

	// Check storageHash
	if (!StateRoot.equals(a.storageHash, b.storageHash)) {
		return false;
	}

	// Check accountProof length
	if (a.accountProof.length !== b.accountProof.length) {
		return false;
	}

	// Check each accountProof element
	for (let i = 0; i < a.accountProof.length; i++) {
		const proofA = a.accountProof[i];
		const proofB = b.accountProof[i];

		if (proofA.length !== proofB.length) {
			return false;
		}

		for (let j = 0; j < proofA.length; j++) {
			if (proofA[j] !== proofB[j]) {
				return false;
			}
		}
	}

	// Check storageProof length
	if (a.storageProof.length !== b.storageProof.length) {
		return false;
	}

	// Check each storageProof
	for (let i = 0; i < a.storageProof.length; i++) {
		if (!StorageProof.equals(a.storageProof[i], b.storageProof[i])) {
			return false;
		}
	}

	return true;
}
